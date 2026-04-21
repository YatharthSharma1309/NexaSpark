import { byId, formatInr, discountPct, escAttr, escHtml } from './catalog.js';
import { addToCart, toggleWishlist, isWishlisted } from './cart.js';
import { syncCartBadge } from './nav.js';

const root = document.getElementById('pdp-root');
const params = new URLSearchParams(window.location.search);
const id = params.get('id')?.trim() || '';

function render() {
  if (!root || !id) {
    if (root) {
      root.innerHTML =
        '<p role="alert">Missing product id. <a href="products.html">Browse products</a></p>';
    }
    return;
  }
  const p = byId(id);
  if (!p) {
    root.innerHTML = '<p role="alert">Product not found. <a href="products.html">Back to products</a></p>';
    return;
  }
  const off = discountPct(p.mrp, p.price);
  document.title = `${p.title} — NexaSpark`;
  const heroImg = p.image
    ? `<div class="pdp-photo"><img src="${p.image}" alt="${escAttr(p.title)}" width="600" height="600" loading="eager" decoding="async" /></div>`
    : '<div class="pdp-photo" aria-hidden="true"></div>';
  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="products.html">Products</a> / <span>${escHtml(p.title)}</span></nav>
    <div class="pdp-layout">
      <div class="pdp-gallery">${heroImg}</div>
      <div class="pdp-buy">
        <h1>${escHtml(p.title)}</h1>
        <p class="pdp-rating">★ ${p.rating} · ${p.reviews} ratings</p>
        <p class="pdp-price">
          <span class="price">${formatInr(p.price)}</span>
          ${off ? `<span class="strike">${formatInr(p.mrp)}</span> <span class="pct">${off}% off</span>` : ''}
        </p>
        <p class="muted seller-line">Sold by <strong>${escHtml(p.seller)}</strong></p>
        <div class="trust-row">
          <span class="trust-chip">Easy returns</span>
          <span class="trust-chip">Secure pay</span>
          <span class="trust-chip">GST invoice</span>
        </div>
        <div class="buy-row">
          <label class="qty-label">Qty <input type="number" id="qty-input" min="1" value="1" class="input-narrow" aria-label="Quantity" /></label>
          <button type="button" class="btn-primary" id="add-cart-action">Add to cart</button>
          <button type="button" class="btn-secondary" id="wish-action" aria-pressed="${isWishlisted(p.id)}">${isWishlisted(p.id) ? '♥ Saved' : 'Wishlist'}</button>
        </div>
        <p class="pdp-desc">${escHtml(p.desc)}</p>
      </div>
    </div>
    <section class="card reviews-card">
      <h2>Ratings & reviews</h2>
      <p class="muted">Connect your review API here — verified purchase badges, photos, etc.</p>
    </section>
  `;

  const qtyInput = document.getElementById('qty-input');
  document.getElementById('add-cart-action')?.addEventListener('click', () => {
    const q = Math.max(1, Number(qtyInput?.value) || 1);
    addToCart(p.id, q);
    syncCartBadge();
    const b = document.getElementById('add-cart-action');
    if (b) {
      const t = b.textContent;
      b.textContent = 'Added ✓';
      setTimeout(() => {
        b.textContent = t || 'Add to cart';
      }, 1200);
    }
  });
  document.getElementById('wish-action')?.addEventListener('click', () => {
    const on = toggleWishlist(p.id);
    const b = document.getElementById('wish-action');
    if (b) {
      b.textContent = on ? '♥ Saved' : 'Wishlist';
      b.setAttribute('aria-pressed', String(on));
    }
  });
}

render();
syncCartBadge();
