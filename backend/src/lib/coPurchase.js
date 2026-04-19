import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

const PAID_LIKE = ['paid', 'processing', 'shipped', 'delivered'];

/**
 * Products frequently bought with the given product (from order line items).
 * @param {string} productId
 * @param {number} limit
 */
export async function coPurchaseProductIds(productId, limit = 8) {
  const pid = new mongoose.Types.ObjectId(productId);
  const agg = await Order.aggregate([
    {
      $match: {
        status: { $in: PAID_LIKE },
        'lines.product': pid,
      },
    },
    { $unwind: '$lines' },
    { $match: { 'lines.product': { $ne: pid } } },
    {
      $group: {
        _id: '$lines.product',
        score: { $sum: '$lines.quantity' },
      },
    },
    { $sort: { score: -1 } },
    { $limit: limit },
  ]);
  return agg.map((r) => r._id.toString());
}

/**
 * @param {string} productId
 * @param {(id: import('mongoose').Document) => unknown} productPublic
 */
export async function recommendationsForProduct(productId, productPublic) {
  const coIds = await coPurchaseProductIds(productId, 12);
  if (coIds.length) {
    const products = await Product.find({ _id: { $in: coIds } });
    const byId = new Map(products.map((p) => [p._id.toString(), p]));
    const ordered = coIds.map((id) => byId.get(id)).filter(Boolean);
    return ordered.map(productPublic);
  }

  const base = await Product.findById(productId).select('subcategory');
  if (!base) return [];
  const filter = { _id: { $ne: new mongoose.Types.ObjectId(productId) } };
  if (base.subcategory) filter.subcategory = base.subcategory;
  const items = await Product.find(filter).sort({ createdAt: -1 }).limit(8);
  return items.map(productPublic);
}
