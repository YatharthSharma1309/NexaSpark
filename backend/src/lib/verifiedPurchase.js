import Order from '../models/Order.js';

/** Order statuses that count as a completed-enough purchase for review verification. */
const VERIFIED_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];

/**
 * @param {import('mongoose').Types.ObjectId} userId
 * @param {string} productId
 */
export async function userHasVerifiedPurchase(userId, productId) {
  const n = await Order.countDocuments({
    user: userId,
    status: { $in: VERIFIED_STATUSES },
    'lines.product': productId,
  });
  return n > 0;
}
