import Stripe from 'stripe';
import { AppError } from '../lib/errors.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import ProcessedStripeEvent from '../models/ProcessedStripeEvent.js';
import Product from '../models/Product.js';
import { decrementStockForCartLines } from '../lib/cartOrder.js';
import { redeemCoupon } from '../lib/coupon.js';
import { notifyOrderConfirmed } from '../lib/notify.js';
import User from '../models/User.js';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) {
    res.status(503).json({ error: 'Stripe webhook not configured' });
    return;
  }

  const stripe = new Stripe(key);
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string') {
    res.status(400).send('Missing stripe-signature');
    return;
  }

  let event;
  try {
    const buf = req.body;
    if (!Buffer.isBuffer(buf)) {
      res.status(400).send('Invalid body');
      return;
    }
    event = stripe.webhooks.constructEvent(buf, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid payload';
    res.status(400).send(`Webhook Error: ${msg}`);
    return;
  }

  try {
    await ProcessedStripeEvent.create({ eventId: event.id, type: event.type });
  } catch (err) {
    if (err?.code === 11000) {
      res.json({ received: true, duplicate: true });
      return;
    }
    throw err;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(JSON.stringify({ stripeEvent: event.id, err: err instanceof Error ? err.message : err }));
    res.status(500).json({ error: 'Handler failed' });
    return;
  }

  res.json({ received: true });
}

/**
 * @param {import('stripe').Stripe.Checkout.Session} session
 */
async function handleCheckoutCompleted(session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    throw new AppError(400, 'WEBHOOK_METADATA', 'Missing orderId on session');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return;
  }
  if (order.status !== 'awaiting_payment') {
    return;
  }

  const linesForStock = order.lines.map((l) => ({
    product: l.product,
    quantity: l.quantity,
  }));

  let decremented = [];
  try {
    decremented = await decrementStockForCartLines(linesForStock);
    order.status = 'paid';
    if (typeof session.payment_intent === 'string') {
      order.stripePaymentIntentId = session.payment_intent;
    }
    await order.save();

    if (order.couponCode) {
      await redeemCoupon(order.couponCode);
    }

    const buyer = await User.findById(order.user);
    if (buyer) {
      notifyOrderConfirmed(buyer, order).catch(() => {});
    }

    const cart = await Cart.findOne({ user: order.user });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
  } catch (err) {
    for (const line of decremented) {
      await Product.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
    }
    throw err;
  }
}

/**
 * @param {Stripe.Checkout.Session} session
 */
async function handleCheckoutExpired(session) {
  const id = session.id;
  if (!id) return;
  await Order.findOneAndUpdate(
    { stripeCheckoutSessionId: id, status: 'awaiting_payment' },
    { $set: { status: 'cancelled' } }
  );
}
