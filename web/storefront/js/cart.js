const KEY = 'nexaspark_storefront_cart';
const WISH_KEY = 'nexaspark_storefront_wishlist';
const LEGACY_CART = 'shopsample_cart';
const LEGACY_WISH = 'shopsample_wishlist';

function migrateLegacy() {
  try {
    const oldC = localStorage.getItem(LEGACY_CART);
    if (oldC && !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, oldC);
      localStorage.removeItem(LEGACY_CART);
    }
    const oldW = localStorage.getItem(LEGACY_WISH);
    if (oldW && !localStorage.getItem(WISH_KEY)) {
      localStorage.setItem(WISH_KEY, oldW);
      localStorage.removeItem(LEGACY_WISH);
    }
  } catch {
    /* ignore */
  }
}

migrateLegacy();

/** @returns {{ items: { id: string; qty: number }[] }} */
export function getCart() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { items: [] };
    const data = JSON.parse(raw);
    return { items: Array.isArray(data.items) ? data.items : [] };
  } catch {
    return { items: [] };
  }
}

export function setCart(cart) {
  localStorage.setItem(KEY, JSON.stringify(cart));
}

export function addToCart(id, qty = 1) {
  const cart = getCart();
  const line = cart.items.find((i) => i.id === id);
  if (line) line.qty += qty;
  else cart.items.push({ id, qty: qty });
  setCart(cart);
}

export function setLineQty(id, qty) {
  const cart = getCart();
  const line = cart.items.find((i) => i.id === id);
  if (!line) return;
  if (qty <= 0) cart.items = cart.items.filter((i) => i.id !== id);
  else line.qty = qty;
  setCart(cart);
}

export function cartCount() {
  return getCart().items.reduce((s, i) => s + i.qty, 0);
}

export function getWishlist() {
  try {
    const raw = localStorage.getItem(WISH_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function toggleWishlist(id) {
  let w = getWishlist();
  if (w.includes(id)) w = w.filter((x) => x !== id);
  else w.push(id);
  localStorage.setItem(WISH_KEY, JSON.stringify(w));
  return w.includes(id);
}

export function isWishlisted(id) {
  return getWishlist().includes(id);
}
