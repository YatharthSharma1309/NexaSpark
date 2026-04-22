import { formatInr, escAttr, escHtml } from './catalog.js';
import { byId } from './catalogApi.js';
import {
  getCart,
  setCart,
  setLineQty,
  isCartApiAvailable,
  pushCartToServer,
  scheduleServerCartSync,
  syncCartOnPageLoad,
} from './cart.js';
import { syncCartBadge } from './nav.js';

const root = document.getElementById('cart-root');
const subEl = document.getElementById('cart-subtotal');
const checkoutBtn = document.getElementById('checkout-btn');

function render() {
  syncCartBadge();
  const cart = getCart();
  if (!root) return;
  if (!cart.items.length) {
    root.innerHTML =
      '<p class="muted">Your cart is empty. <a href="products.html">Browse products</a></p>';
    if (subEl) subEl.textContent = formatInr(0);
    if (checkoutBtn) checkoutBtn.disabled = true;
    return;
  }
  let sub = 0;
  const lines = cart.items
    .map((line) => {
      const p = byId(line.id);
      if (!p) return '';
      sub += p.price * line.qty;
      const thumb = p.image
        ? `<img class="cart-line__thumb" src="${p.image}" alt="" width="64" height="64" loading="lazy" decoding="async" />`
        : '';
      return `<div class="cart-line" data-id="${escAttr(p.id)}">
        <div class="cart-line__info">
          ${thumb}
          <div class="cart-line__meta">
          <strong>${escHtml(p.title)}</strong>
          <p class="muted">${formatInr(p.price)} × ${line.qty}</p>
          </div>
        </div>
        <div class="cart-line__qty">
          <label>Qty <input type="number" class="qty-input" min="1" value="${line.qty}" data-id="${escAttr(p.id)}" aria-label="Quantity for ${escAttr(p.title)}" /></label>
          <button type="button" class="btn-link remove-btn" data-id="${escAttr(p.id)}">Remove</button>
        </div>
        <div class="cart-line__sum">${formatInr(p.price * line.qty)}</div>
      </div>`;
    })
    .join('');
  root.innerHTML = lines;
  if (subEl) subEl.textContent = formatInr(sub);
  if (checkoutBtn) checkoutBtn.disabled = false;

  root.querySelectorAll('.qty-input').forEach((inp) => {
    inp.addEventListener('change', () => {
      const id = inp.getAttribute('data-id');
      const q = Math.max(1, Number(inp.value) || 1);
      if (id) setLineQty(id, q);
      scheduleServerCartSync();
      render();
    });
  });
  root.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) setLineQty(id, 0);
      scheduleServerCartSync();
      render();
    });
  });
}

checkoutBtn?.addEventListener('click', async () => {
  const cart = getCart();
  if (!cart.items.length) return;
  if (await isCartApiAvailable()) {
    try {
      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cart),
      });
      if (r.ok) {
        const data = await r.json();
        setCart({ items: [] });
        await pushCartToServer();
        syncCartBadge();
        window.location.assign(
          `order.html?id=${encodeURIComponent(String(data.orderId))}`,
        );
        return;
      }
    } catch {
      /* fall through */
    }
  }
  window.alert(
    'Demo only — run `npm run dev` to post a demo order, or connect Stripe, Razorpay, or your order API for production.',
  );
});

syncCartOnPageLoad()
  .then(() => {
    render();
  })
  .catch(() => {
    render();
  });
