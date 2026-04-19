import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/errors.js';
import { parseObjectId } from '../../lib/validation.js';
import { requireDb } from '../../middleware/requireDb.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import Order from '../../models/Order.js';

const router = Router();

const STATUSES = new Set([
  'awaiting_payment',
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

router.use(requireDb, requireAuth, requireAdmin);

function orderAdminPublic(order) {
  const o = order.toObject ? order.toObject() : order;
  const discount = o.discountAmount || 0;
  const sub =
    o.subtotalAmount != null ? o.subtotalAmount : o.totalAmount + discount;
  return {
    id: o._id.toString(),
    userId: o.user.toString(),
    status: o.status,
    subtotalAmount: sub,
    discountAmount: discount,
    couponCode: o.couponCode || '',
    totalAmount: o.totalAmount,
    currency: o.currency,
    stripeCheckoutSessionId: o.stripeCheckoutSessionId || null,
    lines: o.lines,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(500);
    res.json({ orders: orders.map(orderAdminPublic) });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'order id');
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    if (!STATUSES.has(status)) {
      throw new AppError(400, 'INVALID_STATUS', 'Invalid order status');
    }
    const order = await Order.findById(id);
    if (!order) {
      throw new AppError(404, 'NOT_FOUND', 'Order not found');
    }
    order.status = status;
    await order.save();
    res.json({ order: orderAdminPublic(order) });
  })
);

export default router;
