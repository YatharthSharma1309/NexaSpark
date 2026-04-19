import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { parseObjectId } from '../lib/validation.js';
import { requireDb } from '../middleware/requireDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = Router();

router.use(requireDb, requireAuth);

function cartPublic(cart, productsById) {
  const items = (cart.items || []).map((line) => {
    const p = productsById.get(line.product.toString());
    return {
      productId: line.product.toString(),
      quantity: line.quantity,
      product: p
        ? {
            id: p._id.toString(),
            sku: p.sku,
            title: p.title,
            price: p.price,
            currency: p.currency,
            stockQuantity: p.stockQuantity,
            images: p.images || [],
          }
        : null,
    };
  });
  return {
    id: cart._id.toString(),
    items,
    updatedAt: cart.updatedAt,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    const ids = cart.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } });
    const map = new Map(products.map((p) => [p._id.toString(), p]));
    res.json({ cart: cartPublic(cart, map) });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems)) {
      throw new AppError(400, 'INVALID_CART', 'Body must include items array');
    }

    const normalized = [];
    const seen = new Set();
    for (const row of rawItems) {
      if (!row || typeof row !== 'object') {
        throw new AppError(400, 'INVALID_CART', 'Each item must be an object');
      }
      const productId = parseObjectId(String(row.productId ?? row.product ?? ''), 'productId');
      const qty = Number(row.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        throw new AppError(400, 'INVALID_CART', 'Each item needs integer quantity >= 1');
      }
      if (seen.has(productId)) {
        throw new AppError(400, 'INVALID_CART', 'Duplicate product in cart');
      }
      seen.add(productId);
      normalized.push({ product: new mongoose.Types.ObjectId(productId), quantity: qty });
    }

    const productIds = normalized.map((n) => n.product);
    const products = await Product.find({ _id: { $in: productIds } });
    if (products.length !== productIds.length) {
      throw new AppError(400, 'INVALID_CART', 'One or more products do not exist');
    }

    for (const line of normalized) {
      const p = products.find((x) => x._id.equals(line.product));
      if (p && line.quantity > p.stockQuantity) {
        throw new AppError(400, 'INSUFFICIENT_STOCK', `Insufficient stock for ${p.sku}`);
      }
    }

    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: normalized }, $setOnInsert: { user: req.user._id } },
      { new: true, upsert: true }
    );

    const map = new Map(products.map((p) => [p._id.toString(), p]));
    res.json({ cart: cartPublic(cart, map) });
  })
);

export default router;
