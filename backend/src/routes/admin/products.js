import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { AppError } from '../../lib/errors.js';
import { parseObjectId } from '../../lib/validation.js';
import { requireDb } from '../../middleware/requireDb.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireAdmin } from '../../middleware/requireAdmin.js';
import Product from '../../models/Product.js';
import {
  TOP_CATEGORY,
  validateSpecsShape,
} from '../../constants/taxonomy.js';

const router = Router();
const CONDITIONS = new Set(['new', 'refurbished', 'open_box']);

router.use(requireDb, requireAuth, requireAdmin);

function parsePayload(body, { partial } = { partial: false }) {
  const out = {};
  if (!partial || body.sku !== undefined) {
    if (typeof body.sku !== 'string' || !body.sku.trim()) {
      throw new AppError(400, 'INVALID_PRODUCT', 'sku is required');
    }
    out.sku = body.sku.trim();
  }
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      throw new AppError(400, 'INVALID_PRODUCT', 'title is required');
    }
    out.title = body.title.trim();
  }
  if (body.description !== undefined) {
    out.description = typeof body.description === 'string' ? body.description : '';
  }
  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new AppError(400, 'INVALID_PRODUCT', 'price must be a non-negative number');
    }
    out.price = price;
  }
  if (body.currency !== undefined) {
    out.currency = String(body.currency).trim().toUpperCase().slice(0, 8);
  }
  if (!partial || body.condition !== undefined) {
    const c = typeof body.condition === 'string' ? body.condition.trim() : '';
    if (!CONDITIONS.has(c)) {
      throw new AppError(400, 'INVALID_PRODUCT', 'Invalid condition');
    }
    out.condition = c;
  }
  if (body.category !== undefined) {
    out.category = String(body.category).trim() || TOP_CATEGORY;
  }
  if (!partial || body.subcategory !== undefined) {
    const s = typeof body.subcategory === 'string' ? body.subcategory.trim() : '';
    if (!s) {
      throw new AppError(400, 'INVALID_PRODUCT', 'subcategory is required');
    }
    out.subcategory = s;
  }
  if (body.modelName !== undefined) {
    out.modelName = typeof body.modelName === 'string' ? body.modelName.trim() : '';
  }
  if (body.warrantyMonths !== undefined) {
    const w = Number(body.warrantyMonths);
    out.warrantyMonths = Number.isFinite(w) && w >= 0 ? w : 0;
  }
  if (body.specs !== undefined) {
    if (body.specs !== null && (typeof body.specs !== 'object' || Array.isArray(body.specs))) {
      throw new AppError(400, 'INVALID_PRODUCT', 'specs must be an object');
    }
    out.specs = body.specs && typeof body.specs === 'object' ? body.specs : {};
  }
  if (!partial || body.stockQuantity !== undefined) {
    const st = Number(body.stockQuantity);
    if (!Number.isFinite(st) || st < 0 || !Number.isInteger(st)) {
      throw new AppError(400, 'INVALID_PRODUCT', 'stockQuantity must be a non-negative integer');
    }
    out.stockQuantity = st;
  }
  if (body.images !== undefined) {
    out.images = Array.isArray(body.images) ? body.images.filter((x) => typeof x === 'string') : [];
  }
  return out;
}

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await Product.find().sort({ updatedAt: -1 }).limit(500);
    res.json({ products: items });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = parsePayload(req.body, { partial: false });
    const category = payload.category || TOP_CATEGORY;
    const check = validateSpecsShape(payload.subcategory, payload.specs || {});
    if (!check.ok) {
      throw new AppError(400, check.code || 'INVALID_SPECS', check.message || 'Invalid specs');
    }
    const product = await Product.create({
      ...payload,
      category,
      description: payload.description ?? '',
      currency: payload.currency || process.env.DEFAULT_CURRENCY || 'INR',
      modelName: payload.modelName ?? '',
      warrantyMonths: payload.warrantyMonths ?? 0,
      specs: payload.specs || {},
      images: payload.images || [],
    });
    res.status(201).json({ product });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'product id');
    const payload = parsePayload(req.body, { partial: true });
    const existing = await Product.findById(id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
    const merged = {
      subcategory: payload.subcategory ?? existing.subcategory,
      specs: payload.specs !== undefined ? payload.specs : existing.specs,
    };
    const check = validateSpecsShape(merged.subcategory, merged.specs || {});
    if (!check.ok) {
      throw new AppError(400, check.code || 'INVALID_SPECS', check.message || 'Invalid specs');
    }
    Object.assign(existing, payload);
    await existing.save();
    res.json({ product: existing });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseObjectId(req.params.id, 'product id');
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      throw new AppError(404, 'NOT_FOUND', 'Product not found');
    }
    res.status(204).send();
  })
);

export default router;
