import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireDb } from '../../middleware/requireDb.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import Order from '../../models/Order.js';

const router = Router();
router.use(requireDb, requireAuth, requireAdmin);

const REVENUE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [byCurrency, topSkus, statusCounts] = await Promise.all([
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        {
          $group: {
            _id: '$currency',
            orderCount: { $sum: 1 },
            revenue: { $sum: '$totalAmount' },
            discountTotal: { $sum: { $ifNull: ['$discountAmount', 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$lines' },
        {
          $group: {
            _id: '$lines.sku',
            units: { $sum: '$lines.quantity' },
            revenue: { $sum: { $multiply: ['$lines.price', '$lines.quantity'] } },
          },
        },
        { $sort: { units: -1 } },
        { $limit: 15 },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    res.json({
      revenueByCurrency: byCurrency.map((r) => ({
        currency: r._id,
        orderCount: r.orderCount,
        revenue: r.revenue,
        discountTotal: r.discountTotal,
      })),
      topSkus: topSkus.map((r) => ({
        sku: r._id,
        units: r.units,
        revenue: r.revenue,
      })),
      ordersByStatus: statusCounts.map((r) => ({ status: r._id, count: r.count })),
    });
  })
);

export default router;
