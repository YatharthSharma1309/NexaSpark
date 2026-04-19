import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { parseObjectId } from '../lib/validation.js';
import { requireDb } from '../middleware/requireDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import Product from '../models/Product.js';
import Wishlist from '../models/Wishlist.js';

const router = Router();

router.use(requireDb, requireAuth);

function wishlistPublic(wishlist, productsById) {
  const items = (wishlist.items || []).map((row) => {
    const p = productsById.get(row.product.toString());
    return {
      productId: row.product.toString(),
      product: p
        ? {
            id: p._id.toString(),
            sku: p.sku,
            title: p.title,
            price: p.price,
            currency: p.currency,
            images: p.images || [],
          }
        : null,
    };
  });
  return {
    id: wishlist._id.toString(),
    items,
    updatedAt: wishlist.updatedAt,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }
    const ids = wishlist.items.map((i) => i.product);
    const products = await Product.find({ _id: { $in: ids } });
    const map = new Map(products.map((p) => [p._id.toString(), p]));
    res.json({ wishlist: wishlistPublic(wishlist, map) });
  })
);

router.put(
  '/',
  asyncHandler(async (req, res) => {
    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems)) {
      throw new AppError(400, 'INVALID_WISHLIST', 'Body must include items array');
    }

    const seen = new Set();
    const normalized = [];
    for (const row of rawItems) {
      if (!row || typeof row !== 'object') {
        throw new AppError(400, 'INVALID_WISHLIST', 'Each item must be an object');
      }
      const productId = parseObjectId(String(row.productId ?? row.product ?? ''), 'productId');
      if (seen.has(productId)) continue;
      seen.add(productId);
      normalized.push({ product: new mongoose.Types.ObjectId(productId) });
    }

    const productIds = normalized.map((n) => n.product);
    if (productIds.length) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        throw new AppError(400, 'INVALID_WISHLIST', 'One or more products do not exist');
      }
    }

    const wishlist = await Wishlist.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: normalized }, $setOnInsert: { user: req.user._id } },
      { new: true, upsert: true }
    );

    const products = await Product.find({ _id: { $in: wishlist.items.map((i) => i.product) } });
    const map = new Map(products.map((p) => [p._id.toString(), p]));
    res.json({ wishlist: wishlistPublic(wishlist, map) });
  })
);

export default router;
