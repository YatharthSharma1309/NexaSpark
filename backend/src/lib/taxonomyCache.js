import { CATEGORY_TREE, SPEC_KEYS_BY_SUBCATEGORY, TOP_CATEGORY } from '../constants/taxonomy.js';

const TTL_MS = 60_000;
let cached = /** @type {{ at: number; body: object } | null} */ (null);

export function getTaxonomyPayload() {
  return {
    topCategory: TOP_CATEGORY,
    categoryTree: CATEGORY_TREE,
    specKeysBySubcategory: SPEC_KEYS_BY_SUBCATEGORY,
  };
}

export function getCachedTaxonomyResponse() {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return { ...cached.body, _cached: true };
  }
  const body = getTaxonomyPayload();
  cached = { at: now, body };
  return { ...body, _cached: false };
}
