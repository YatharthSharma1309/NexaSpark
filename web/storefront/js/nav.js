import { cartCount } from './cart.js';

/** Keep header cart badge in sync (call after cart changes). */
export function syncCartBadge() {
  const el = document.getElementById('cart-count');
  if (!el) return;
  const n = cartCount();
  el.textContent = n ? String(n) : '';
  el.hidden = !n;
  el.setAttribute('aria-label', n ? `${n} items in cart` : 'Cart empty');
}
