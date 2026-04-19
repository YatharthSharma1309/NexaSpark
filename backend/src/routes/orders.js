import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { buildOrderSnapshotFromCart, decrementStockForCartLines } from '../lib/cartOrder.js';
import { parseObjectId } from '../lib/validation.js';
import { requireDb } from '../middleware/requireDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { checkoutLimiter } from '../middleware/rateLimits.js';
import { validateCouponForCheckout, redeemCoupon } from '../lib/coupon.js';
import { notifyOrderConfirmed } from '../lib/notify.js';
import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = Router();

router.use(requireDb, requireAuth);

function orderPublic(order) {
  const o = order.toObject ? order.toObject() : order;
  const discount = o.discountAmount || 0;
  const sub = o.subtotalAmount != null ? o.subtotalAmount : o.totalAmount + discount;
  return {
    id: o._id.toString(),
    status: o.status,
    subtotalAmount: sub,
    discountAmount: discount,
    couponCode: o.couponCode || '',
    totalAmount: o.totalAmount,
    currency: o.currency,
    lines: o.lines.map((l) => ({
      productId: l.product ? l.product.toString() : null,
      sku: l.sku,
      title: l.title,
      price: l.price,
      quantity: l.quantity,
      modelName: l.modelName,
      specsSnapshot: l.specsSnapshot || {},
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

router.post(
  '/',
  checkoutLimiter,
  asyncHandler(async (req, res) => {
    const { cart, lines, total: subtotal, currency } = await buildOrderSnapshotFromCart(req.user._id);

    let discount = 0;
    let couponCode = '';
    const rawCoupon = typeof req.body?.couponCode === 'string' ? req.body.couponCode.trim() : '';
    if (rawCoupon) {
      const applied = await validateCouponForCheckout(rawCoupon, subtotal, currency);
      discount = applied.discount;
      couponCode = applied.code;
    }
    const total = Math.max(0, subtotal - discount);

    let decremented = [];
    try {
      decremented = await decrementStockForCartLines(cart.items);
      const order = await Order.create({
        user: req.user._id,
        lines,
        subtotalAmount: subtotal,
        discountAmount: discount,
        couponCode,
        totalAmount: total,
        currency,
        status: 'paid',
      });
      cart.items = [];
      await cart.save();
      if (couponCode) {
        await redeemCoupon(couponCode);
      }
      notifyOrderConfirmed(req.user, order).catch(() => {});
      res.status(201).json({ order: orderPublic(order) });
    } catch (err) {
      for (const line of decremented) {
        await Product.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
      }
      throw err;
    }
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders: orders.map(orderPublic) });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'order id');
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }
    res.json({ order: orderPublic(order) });
  })
);

export default router;
