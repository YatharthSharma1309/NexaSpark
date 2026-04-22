/**
 * Product catalog access — fetches from /api when available, falls back to catalog.js
 * (static `serve:web` on port 8080 has no /api). Run `npm run dev` for API + static on one port.
 */
import { PRODUCTS, byId as byIdFromCatalog, formatInr, discountPct, escAttr, escHtml } from './catalog.js';

export { formatInr, discountPct, escAttr, escHtml };

/** In-memory list from last successful GET /api/products (so byId() matches the PLP). */
let apiList = null;

/**
 * Resolve id against API list (if any) or bundled demo catalog.
 * @param {string | null | undefined} id
 */
export function byId(id) {
  if (id == null || id === '') return undefined;
  const key = String(id).trim().toLowerCase();
  if (apiList) {
    const p = apiList.find((x) => x.id === key);
    if (p) return p;
  }
  return byIdFromCatalog(id);
}

const jsonHeaders = { Accept: 'application/json' };

/** Full product list */
export async function getProducts() {
  try {
    const r = await fetch('/api/products', { headers: jsonHeaders });
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data) && data.length) {
        apiList = data;
        return data;
      }
    }
  } catch {
    /* no /api (e.g. serve-only) or network error */
  }
  apiList = null;
  return Promise.resolve([...PRODUCTS]);
}

export async function getProductById(id) {
  if (id == null || id === '') return Promise.resolve(undefined);
  const key = String(id).trim().toLowerCase();
  try {
    const r = await fetch(`/api/products/${encodeURIComponent(key)}`, { headers: jsonHeaders });
    if (r.status === 404) return undefined;
    if (r.ok) {
      const p = await r.json();
      return p;
    }
  } catch {
    /* fall back */
  }
  return Promise.resolve(byIdFromCatalog(id));
}
