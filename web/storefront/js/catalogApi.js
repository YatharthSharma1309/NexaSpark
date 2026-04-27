/**
 * Product catalog access — fetches from api/products when available, falls back to catalog.js
 * (static `serve:web` on port 8080 has no /api). Run `npm run dev` for API + static on one port.
 *
 * Caches the resolved product list for the page lifetime and uses an O(1) id map for lookups.
 */
import { PRODUCTS, formatInr, discountPct, escAttr, escHtml } from './catalog.js';

export { formatInr, discountPct, escAttr, escHtml };

/** @type {Map<string, object>} */
let idToProduct = new Map(PRODUCTS.map((p) => [p.id, p]));
let cachedList = null;
let listInflight = null;
const jsonHeaders = { Accept: 'application/json' };

/** @param {object} p */
function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return p;
  const image = p.image == null ? p.image : String(p.image).trim().replace(/\\/g, '/');
  return image === p.image ? p : { ...p, image };
}

/**
 * Resolve id against the current id map (bundled and/or API data).
 * @param {string | null | undefined} id
 */
export function byId(id) {
  if (id == null || id === '') return undefined;
  const key = String(id).trim().toLowerCase();
  return idToProduct.get(key);
}

/** Full product list (cached for the current page after first call). */
export async function getProducts() {
  if (cachedList) return cachedList;
  if (listInflight) return listInflight;
  listInflight = (async () => {
    try {
      const r = await fetch('api/products', { headers: jsonHeaders, cache: 'default' });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data) && data.length) {
          const rows = data.map(normalizeProduct);
          idToProduct = new Map(rows.map((p) => [p.id, p]));
          cachedList = rows;
          return rows;
        }
      }
    } catch {
      /* no /api (e.g. serve-only) or network error */
    }
    cachedList = [...PRODUCTS];
    idToProduct = new Map(PRODUCTS.map((p) => [p.id, p]));
    return cachedList;
  })();
  try {
    return await listInflight;
  } finally {
    listInflight = null;
  }
}

export async function getProductById(id) {
  if (id == null || id === '') return undefined;
  const key = String(id).trim().toLowerCase();
  if (idToProduct.has(key)) return idToProduct.get(key);
  await getProducts();
  if (idToProduct.has(key)) return idToProduct.get(key);
  try {
    const r = await fetch(`api/products/${encodeURIComponent(key)}`, { headers: jsonHeaders });
    if (r.status === 404) return undefined;
    if (r.ok) {
      const p = normalizeProduct(await r.json());
      if (p && p.id) idToProduct.set(p.id, p);
      return p;
    }
  } catch {
    /* fall back */
  }
  return idToProduct.get(key);
}
