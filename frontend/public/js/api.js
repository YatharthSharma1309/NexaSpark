/**
 * Backend origin — must match `CLIENT_ORIGIN` CORS in `backend/.env`.
 * GitHub Pages deploy can set `window.__NEXASPARK_API_BASE__` before modules load.
 */
const DEFAULT_API = 'http://127.0.0.1:4000';
export const API_BASE =
  (typeof window !== 'undefined' && window.__NEXASPARK_API_BASE__) || DEFAULT_API;

const TOKEN_KEY = 'nexaspark_token';
const USER_KEY = 'nexaspark_user';

/** @typedef {{ id: string; email: string; name?: string; role?: string }} UserProfile */

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** @param {UserProfile | null} user */
export function setUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** @returns {UserProfile | null} */
export function getUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * @param {string} path
 * @param {RequestInit & { json?: unknown }} [options]
 */
export async function api(path, options = {}) {
  const headers = new Headers(options.headers);
  if (options.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const body =
    options.json !== undefined ? JSON.stringify(options.json) : options.body;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  const text = await res.text();
  /** @type {unknown} */
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data && 'error' in data && data.error && typeof data.error === 'object'
        ? /** @type {{ error: { message?: string } }} */ (data).error.message
        : null;
    throw new Error(msg || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * @param {string} productId
 * @param {number} [qty]
 */
/**
 * @returns {Promise<{ wishlist: { items: { productId: string }[] } }>}
 */
export async function getWishlist() {
  return /** @type {Promise<{ wishlist: { items: { productId: string }[] } }>} */ (api('/api/wishlist'));
}

/**
 * @param {string[]} productIds
 */
export async function setWishlistProductIds(productIds) {
  return api('/api/wishlist', {
    method: 'PUT',
    json: { items: productIds.map((productId) => ({ productId })) },
  });
}

/**
 * @param {string} productId
 */
export async function toggleWishlistProduct(productId) {
  const data = await getWishlist();
  const ids = data.wishlist.items.map((i) => i.productId);
  const set = new Set(ids);
  if (set.has(productId)) set.delete(productId);
  else set.add(productId);
  return setWishlistProductIds([...set]);
}

export async function addToCart(productId, qty = 1) {
  const current = /** @type {{ cart: { items: { productId: string; quantity: number }[] } } }} */ (
    await api('/api/cart')
  );
  const map = new Map();
  for (const row of current.cart.items) {
    map.set(row.productId, row.quantity);
  }
  map.set(productId, (map.get(productId) || 0) + qty);
  const items = [...map.entries()].map(([id, quantity]) => ({ productId: id, quantity }));
  return /** @type {typeof current} */ (api('/api/cart', { method: 'PUT', json: { items } }));
}

const COMPARE_KEY = 'nexaspark_compare_ids';

/** @returns {string[]} */
export function getCompareIds() {
  try {
    const raw = sessionStorage.getItem(COMPARE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** @param {string[]} ids */
export function setCompareIds(ids) {
  sessionStorage.setItem(COMPARE_KEY, JSON.stringify(ids.slice(0, 4)));
}

/** @param {string} productId */
export function toggleCompareId(productId) {
  const cur = getCompareIds();
  const i = cur.indexOf(productId);
  if (i >= 0) {
    cur.splice(i, 1);
  } else if (cur.length < 4) {
    cur.push(productId);
  }
  setCompareIds(cur);
  return cur;
}
