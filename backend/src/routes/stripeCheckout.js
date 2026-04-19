import { Router } from 'express';
import Stripe from 'stripe';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { buildOrderSnapshotFromCart } from '../lib/cartOrder.js';
import { toStripeMinorUnits } from '../lib/money.js';
import { validateCouponForCheckout } from '../lib/coupon.js';
import Order from '../models/Order.js';
import { requireDb } from '../middleware/requireDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkoutLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.post(
  '/checkout-session',
  requireDb,
  requireAuth,
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const key = process.env.STRIPE_SECRET_KEY;
    const clientOrigin = process.env.CLIENT_ORIGIN;
    if (!key) {
      throw new AppError(501, 'STRIPE_NOT_CONFIGURED', 'Stripe is not configured on this server');
    }
    if (!clientOrigin) {
      throw new AppError(500, 'CONFIG_ERROR', 'CLIENT_ORIGIN is required for Stripe checkout');
    }
    const stripe = new Stripe(key);
    const { lines, total: subtotal, currency } = await buildOrderSnapshotFromCart(req.user._id);

    let discount = 0;
    let couponCode = '';
    const rawCoupon = typeof req.body?.couponCode === 'string' ? req.body.couponCode.trim() : '';
    if (rawCoupon) {
      const applied = await validateCouponForCheckout(rawCoupon, subtotal, currency);
      discount = applied.discount;
      couponCode = applied.code;
    }
    const payableTotal = Math.max(0, subtotal - discount);

    const order = await Order.create({
      user: req.user._id,
      lines,
      subtotalAmount: subtotal,
      discountAmount: discount,
      couponCode,
      totalAmount: payableTotal,
      currency,
      status: 'awaiting_payment',
    });

    try {
      const origin = clientOrigin.replace(/\/$/, '');
      const useAppReturn = req.body?.checkoutReturn === 'app';

      let success_url;
      let cancel_url;
      if (useAppReturn) {
        success_url =
          process.env.STRIPE_APP_SUCCESS_URL ||
          'nexaspark://checkout/success?session_id={CHECKOUT_SESSION_ID}';
        cancel_url = process.env.STRIPE_APP_CANCEL_URL || 'nexaspark://checkout/cancel';
        if (!success_url.includes('{CHECKOUT_SESSION_ID}')) {
          throw new AppError(
            500,
            'CONFIG_ERROR',
            'STRIPE_APP_SUCCESS_URL must include the literal {CHECKOUT_SESSION_ID}'
          );
        }
      } else {
        success_url = `${origin}/orders.html?session_id={CHECKOUT_SESSION_ID}`;
        cancel_url = `${origin}/`;
      }

      /** @type {import('stripe').Stripe.Checkout.SessionCreateParams} */
      const sessionParams = {
        mode: 'payment',
        success_url,
        cancel_url,
        metadata: {
          orderId: order._id.toString(),
          couponCode: couponCode || '',
          discount: String(discount),
        },
        line_items: lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: toStripeMinorUnits(l.price, currency),
            product_data: {
              name: l.title.slice(0, 120),
              metadata: { sku: String(l.sku).slice(0, 40) },
            },
          },
        })),
      };

      if (discount > 0) {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: toStripeMinorUnits(discount, currency),
          currency: currency.toLowerCase(),
          duration: 'once',
          name: `NexaSpark ${couponCode}`,
        });
        sessionParams.discounts = [{ coupon: stripeCoupon.id }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      order.stripeCheckoutSessionId = session.id;
      await order.save();
      res.json({ url: session.url });
    } catch (err) {
      await Order.deleteOne({ _id: order._id });
      const message = err instanceof Error ? err.message : 'Stripe error';
      throw new AppError(502, 'STRIPE_ERROR', message);
    }
  })
);

export default router;
