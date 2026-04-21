import { PRODUCTS, formatInr } from './catalog.js';
import { getCart, setLineQty, cartCount } from './cart.js';
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
      const p = PRODUCTS.find((x) => x.id === line.id);
      if (!p) return '';
      sub += p.price * line.qty;
      const thumb = p.image
        ? `<img class="cart-line__thumb" src="${p.image}" alt="" width="64" height="64" loading="lazy" decoding="async" />`
        : '';
      return `<div class="cart-line" data-id="${p.id}">
        <div class="cart-line__info">
          ${thumb}
          <div class="cart-line__meta">
          <strong>${p.title}</strong>
          <p class="muted">${formatInr(p.price)} × ${line.qty}</p>
          </div>
        </div>
        <div class="cart-line__qty">
          <label>Qty <input type="number" class="qty-input" min="1" value="${line.qty}" data-id="${p.id}" aria-label="Quantity for ${p.title}" /></label>
          <button type="button" class="btn-link remove-btn" data-id="${p.id}">Remove</button>
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
      render();
    });
  });
  root.querySelectorAll('.remove-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      if (id) setLineQty(id, 0);
      render();
    });
  });
}

checkoutBtn?.addEventListener('click', () => {
  window.alert(
    'Demo only — connect Stripe, Razorpay, or your order API here before taking real payments.'
  );
});

render();
