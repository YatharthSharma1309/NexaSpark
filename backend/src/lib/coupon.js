import { AppError } from './errors.js';
import Coupon from '../models/Coupon.js';

/**
 * @param {string} rawCode
 * @param {number} subtotal
 * @param {string} currency
 * @returns {Promise<{ discount: number; code: string }>}
 */
export async function validateCouponForCheckout(rawCode, subtotal, currency) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) {
    throw new AppError(400, 'INVALID_COUPON', 'Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code });
  if (!coupon || !coupon.active) {
    throw new AppError(400, 'INVALID_COUPON', 'Invalid or inactive coupon');
  }

  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new AppError(400, 'INVALID_COUPON', 'Coupon has expired');
  }

  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    throw new AppError(400, 'INVALID_COUPON', 'Coupon usage limit reached');
  }

  if (subtotal < coupon.minSubtotal) {
    throw new AppError(
      400,
      'INVALID_COUPON',
      `Minimum subtotal ${coupon.minSubtotal} ${currency} required for this coupon`
    );
  }

  if (coupon.discountType === 'fixed') {
    if (coupon.currency !== currency) {
      throw new AppError(400, 'INVALID_COUPON', 'Coupon currency does not match cart');
    }
    const discount = Math.min(coupon.value, subtotal);
    return { discount, code: coupon.code };
  }

  const pct = Math.min(100, Math.max(0, coupon.value));
  const discount = Math.min(subtotal, Math.round((subtotal * pct) / 100));
  return { discount, code: coupon.code };
}

/**
 * @param {string} code
 */
export async function redeemCoupon(code) {
  if (!code) return;
  await Coupon.updateOne({ code: code.toUpperCase() }, { $inc: { redemptionCount: 1 } });
}
