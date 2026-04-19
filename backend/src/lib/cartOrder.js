import { AppError } from './errors.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Build order lines from the user's cart (validates stock; does not mutate inventory).
 * @param {import('mongoose').Types.ObjectId} userId
 */
export async function buildOrderSnapshotFromCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart || !cart.items.length) {
    throw new AppError(400, 'EMPTY_CART', 'Cart is empty');
  }

  const productIds = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: productIds } });
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const lines = [];
  let total = 0;
  const currencySet = new Set();

  for (const line of cart.items) {
    const p = byId.get(line.product.toString());
    if (!p) {
      throw new AppError(400, 'INVALID_CART', 'Cart references a missing product');
    }
    if (line.quantity > p.stockQuantity) {
      throw new AppError(400, 'INSUFFICIENT_STOCK', `Insufficient stock for ${p.sku}`);
    }
    const lineTotal = p.price * line.quantity;
    total += lineTotal;
    currencySet.add(p.currency);

    const specs =
      p.specs && typeof p.specs === 'object' && !Array.isArray(p.specs) ? { ...p.specs } : {};

    lines.push({
      product: p._id,
      sku: p.sku,
      title: p.title,
      price: p.price,
      quantity: line.quantity,
      modelName: p.modelName || '',
      specsSnapshot: specs,
    });
  }

  if (currencySet.size > 1) {
    throw new AppError(400, 'MULTI_CURRENCY', 'Cart cannot mix currencies');
  }
  const currency = currencySet.size === 1 ? [...currencySet][0] : process.env.DEFAULT_CURRENCY || 'INR';

  return { cart, lines, total, currency };
}

/**
 * Decrement inventory for each cart line (atomic per line).
 * @param {{ product: unknown; quantity: number }[]} cartItems
 */
export async function decrementStockForCartLines(cartItems) {
  const decremented = [];
  try {
    for (const line of cartItems) {
      const r = await Product.updateOne(
        { _id: line.product, stockQuantity: { $gte: line.quantity } },
        { $inc: { stockQuantity: -line.quantity } }
      );
      if (r.modifiedCount !== 1) {
        throw new AppError(409, 'STOCK_CHANGED', 'Stock changed while placing order; refresh cart');
      }
      decremented.push(line);
    }
    return decremented;
  } catch (err) {
    for (const line of decremented) {
      await Product.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
    }
    throw err;
  }
}
