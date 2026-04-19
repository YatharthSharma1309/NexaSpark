/**
 * Electronics taxonomy and spec keys (NexaSpark.md §6).
 * Keep catalog `Product.subcategory` and `Product.specs` aligned with this module.
 */

export const TOP_CATEGORY = 'Electronics';

/** @type {Record<string, string[]>} */
export const SPEC_KEYS_BY_SUBCATEGORY = {
  Laptops: ['cpu', 'ramGb', 'storageGb', 'screenInches', 'os'],
  Smartphones: ['storageGb', 'ramGb', 'screenInches', 'batteryMah', 'os'],
  Audio: ['connectivity', 'batteryHours', 'noiseCancelling'],
  Wearables: ['connectivity', 'batteryDays', 'waterResistance'],
};

/** Category tree: one top-level node for the MVP vertical. */
export const CATEGORY_TREE = {
  [TOP_CATEGORY]: Object.keys(SPEC_KEYS_BY_SUBCATEGORY),
};

/** All spec keys allowed on products (for catalog filters / validation). */
export const ALL_SPEC_KEYS = new Set(
  Object.values(SPEC_KEYS_BY_SUBCATEGORY).flatMap((keys) => keys)
);

export function listSubcategories() {
  return Object.keys(SPEC_KEYS_BY_SUBCATEGORY);
}

/**
 * @param {string} subcategory
 * @returns {string[] | null}
 */
export function specKeysForSubcategory(subcategory) {
  const keys = SPEC_KEYS_BY_SUBCATEGORY[subcategory];
  return keys ? [...keys] : null;
}

/**
 * @param {string} subcategory
 * @param {unknown} specs
 * @returns {{ ok: true } | { ok: false, code: string, message?: string, unknownKeys?: string[] }}
 */
export function validateSpecsShape(subcategory, specs) {
  if (!subcategory || typeof subcategory !== 'string') {
    return { ok: false, code: 'INVALID_SUBCATEGORY', message: 'Subcategory is required' };
  }
  if (!SPEC_KEYS_BY_SUBCATEGORY[subcategory]) {
    return { ok: false, code: 'UNKNOWN_SUBCATEGORY', message: `Unknown subcategory: ${subcategory}` };
  }
  if (specs == null) {
    return { ok: true };
  }
  if (typeof specs !== 'object' || Array.isArray(specs)) {
    return { ok: false, code: 'INVALID_SPECS', message: 'specs must be a plain object' };
  }
  const allowed = new Set(SPEC_KEYS_BY_SUBCATEGORY[subcategory]);
  const unknownKeys = Object.keys(specs).filter((k) => !allowed.has(k));
  if (unknownKeys.length) {
    return { ok: false, code: 'UNKNOWN_SPEC_KEYS', unknownKeys };
  }
  return { ok: true };
}
