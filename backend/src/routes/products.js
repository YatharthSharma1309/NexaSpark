import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../lib/asyncHandler.js';
import { AppError } from '../lib/errors.js';
import { escapeRegex, parseObjectId } from '../lib/validation.js';
import { requireDb } from '../middleware/requireDb.js';
import { requireAuth } from '../middleware/requireAuth.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import { ALL_SPEC_KEYS } from '../constants/taxonomy.js';
import { userHasVerifiedPurchase } from '../lib/verifiedPurchase.js';
import { recommendationsForProduct } from '../lib/coPurchase.js';

const router = Router();

const CONDITIONS = new Set(['new', 'refurbished', 'open_box']);

function productPublic(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id.toString(),
    sku: o.sku,
    title: o.title,
    description: o.description,
    price: o.price,
    currency: o.currency,
    condition: o.condition,
    category: o.category,
    subcategory: o.subcategory,
    modelName: o.modelName,
    warrantyMonths: o.warrantyMonths,
    specs: o.specs && typeof o.specs === 'object' ? o.specs : {},
    stockQuantity: o.stockQuantity,
    images: o.images || [],
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

router.get(
  '/compare',
  requireDb,
  asyncHandler(async (req, res) => {
    const raw = req.query.ids;
    if (typeof raw !== 'string' || !raw.trim()) {
      throw new AppError(400, 'INVALID_COMPARE', 'Query parameter ids is required (comma-separated)');
    }
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length < 2 || ids.length > 4) {
      throw new AppError(400, 'INVALID_COMPARE', 'Provide between 2 and 4 product ids');
    }
    for (const id of ids) {
      parseObjectId(id, 'product id');
    }
    const products = await Product.find({ _id: { $in: ids } });
    if (products.length !== ids.length) {
      throw new AppError(404, 'NOT_FOUND', 'One or more products were not found');
    }
    const byId = new Map(products.map((p) => [p._id.toString(), p]));
    const ordered = ids.map((id) => productPublic(byId.get(id)));
    res.json({ products: ordered });
  })
);

router.get(
  '/',
  requireDb,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    if (typeof req.query.category === 'string' && req.query.category.trim()) {
      filter.category = req.query.category.trim();
    }
    if (typeof req.query.subcategory === 'string' && req.query.subcategory.trim()) {
      filter.subcategory = req.query.subcategory.trim();
    }
    if (typeof req.query.condition === 'string' && req.query.condition.trim()) {
      const c = req.query.condition.trim();
      if (!CONDITIONS.has(c)) {
        throw new AppError(400, 'INVALID_FILTER', 'Invalid condition filter');
      }
      filter.condition = c;
    }

    const minPrice = req.query.minPrice != null ? Number(req.query.minPrice) : undefined;
    const maxPrice = req.query.maxPrice != null ? Number(req.query.maxPrice) : undefined;
    if (minPrice !== undefined && !Number.isFinite(minPrice)) {
      throw new AppError(400, 'INVALID_FILTER', 'minPrice must be a number');
    }
    if (maxPrice !== undefined && !Number.isFinite(maxPrice)) {
      throw new AppError(400, 'INVALID_FILTER', 'maxPrice must be a number');
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    const specKey = typeof req.query.specKey === 'string' ? req.query.specKey.trim() : '';
    const specValueRaw =
      typeof req.query.specValue === 'string' ? req.query.specValue.trim() : '';
    if (specKey || specValueRaw) {
      if (!specKey || !specValueRaw) {
        throw new AppError(400, 'INVALID_FILTER', 'specKey and specValue must be used together');
      }
      if (!ALL_SPEC_KEYS.has(specKey)) {
        throw new AppError(400, 'INVALID_FILTER', 'Unknown specKey');
      }
      const num = Number(specValueRaw);
      if (Number.isFinite(num) && String(num) === specValueRaw) {
        filter[`specs.${specKey}`] = num;
      } else if (specValueRaw === 'true' || specValueRaw === 'false') {
        filter[`specs.${specKey}`] = specValueRaw === 'true';
      } else {
        filter[`specs.${specKey}`] = specValueRaw;
      }
    }

    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    let useTextScore = false;
    if (q) {
      if (q.length >= 2) {
        const textFilter = { ...filter, $text: { $search: q } };
        const textCount = await Product.countDocuments(textFilter);
        if (textCount > 0) {
          filter.$text = { $search: q };
          useTextScore = true;
        } else {
          const safe = escapeRegex(q);
          filter.$or = [
            { title: new RegExp(safe, 'i') },
            { sku: new RegExp(safe, 'i') },
            { description: new RegExp(safe, 'i') },
          ];
        }
      } else {
        const safe = escapeRegex(q);
        filter.$or = [
          { title: new RegExp(safe, 'i') },
          { sku: new RegExp(safe, 'i') },
          { description: new RegExp(safe, 'i') },
        ];
      }
    }

    let sort = { createdAt: -1 };
    const sortParam = typeof req.query.sort === 'string' ? req.query.sort : '';
    if (sortParam === 'price_asc') sort = { price: 1 };
    else if (sortParam === 'price_desc') sort = { price: -1 };
    else if (sortParam === 'newest') sort = { createdAt: -1 };
    else if (useTextScore) sort = { score: { $meta: 'textScore' } };

    let listQuery = Product.find(filter);
    if (useTextScore) {
      listQuery = listQuery.select({ score: { $meta: 'textScore' } });
    }

    const [total, items] = await Promise.all([
      Product.countDocuments(filter),
      listQuery.sort(sort).skip(skip).limit(limit),
    ]);

    res.json({
      page,
      limit,
      total,
      products: items.map(productPublic),
    });
  })
);

router.get(
  '/:id/recommendations',
  requireDb,
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'product id');
    const exists = await Product.findById(id).select('_id');
    if (!exists) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
    const products = await recommendationsForProduct(id, productPublic);
    res.json({ products });
  })
);

router.get(
  '/:id/reviews',
  requireDb,
  asyncHandler(async (req, res) => {
    const productId = parseObjectId(req.params.id, 'product id');
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({
      reviews: reviews.map((r) => {
        const u = r.user;
        return {
          id: r._id.toString(),
          rating: r.rating,
          title: r.title,
          body: r.body,
          verifiedPurchase: r.verifiedPurchase,
          createdAt: r.createdAt,
          user: u
            ? { id: u._id.toString(), name: u.name, email: u.email }
            : { id: null, name: '', email: '' },
        };
      }),
    });
  })
);

router.post(
  '/:id/reviews',
  requireDb,
  requireAuth,
  asyncHandler(async (req, res) => {
    const productId = parseObjectId(req.params.id, 'product id');
    const product = await Product.findById(productId).select('_id');
    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }

    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError(400, 'INVALID_REVIEW', 'Rating must be an integer from 1 to 5');
    }
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, 200) : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim().slice(0, 4000) : '';
    const verifiedPurchase = await userHasVerifiedPurchase(req.user._id, productId);

    try {
      const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating,
        title,
        body,
        verifiedPurchase,
      });
      await review.populate('user', 'name email');
      const u = review.user;
      res.status(201).json({
        review: {
          id: review._id.toString(),
          rating: review.rating,
          title: review.title,
          body: review.body,
          verifiedPurchase: review.verifiedPurchase,
          createdAt: review.createdAt,
          user: { id: u._id.toString(), name: u.name, email: u.email },
        },
      });
    } catch (e) {
      if (e?.code === 11000) {
        throw new AppError(409, 'REVIEW_EXISTS', 'You already reviewed this product');
      }
      throw e;
    }
  })
);

router.get(
  '/:id',
  requireDb,
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'product id');
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
    res.json({ product: productPublic(product) });
  })
);

export default router;
