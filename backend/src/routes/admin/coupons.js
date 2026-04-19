import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/errors.js';
import { parseObjectId } from '../../lib/validation.js';
import { requireDb } from '../../middleware/requireDb.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import Coupon from '../../models/Coupon.js';

const router = Router();
router.use(requireDb, requireAuth, requireAdmin);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const coupons = await Coupon.find().sort({ code: 1 }).limit(200);
    res.json({ coupons });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    if (!code) {
      throw new AppError(400, 'INVALID_COUPON', 'code is required');
    }
    const discountType = req.body?.discountType;
    if (discountType !== 'percent' && discountType !== 'fixed') {
      throw new AppError(400, 'INVALID_COUPON', 'discountType must be percent or fixed');
    }
    const value = Number(req.body?.value);
    if (!Number.isFinite(value) || value < 0) {
      throw new AppError(400, 'INVALID_COUPON', 'value must be a non-negative number');
    }
    if (discountType === 'percent' && value > 100) {
      throw new AppError(400, 'INVALID_COUPON', 'percent cannot exceed 100');
    }
    const coupon = await Coupon.create({
      code,
      label: typeof req.body?.label === 'string' ? req.body.label.trim().slice(0, 120) : '',
      discountType,
      value,
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : undefined,
      active: req.body?.active !== false,
      expiresAt: req.body?.expiresAt ? new Date(req.body.expiresAt) : null,
      maxRedemptions:
        req.body?.maxRedemptions != null ? Number(req.body.maxRedemptions) : null,
      minSubtotal: req.body?.minSubtotal != null ? Number(req.body.minSubtotal) : 0,
    });
    res.status(201).json({ coupon });
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'coupon id');
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new AppError(404, 'NOT_FOUND', 'Coupon not found');
    }
    if (typeof req.body?.active === 'boolean') coupon.active = req.body.active;
    if (typeof req.body?.label === 'string') coupon.label = req.body.label.trim().slice(0, 120);
    await coupon.save();
    res.json({ coupon });
  })
);

export default router;
