import { api, addToCart, getToken, getWishlist, toggleWishlistProduct, API_BASE } from './api.js';
import { applyLegalFooterLinks } from './legalLinks.js';

const statusEl = document.getElementById('product-status');
const root = document.getElementById('product-root');
const reviewsList = document.getElementById('reviews-list');
const reviewForm = document.getElementById('review-form');
const reviewRating = document.getElementById('review-rating');
const reviewTitle = document.getElementById('review-title');
const reviewBody = document.getElementById('review-body');
const reviewSubmit = document.getElementById('review-submit');
const qtyInput = document.getElementById('qty-input');
const addBtn = document.getElementById('add-to-cart');
const wishBtn = document.getElementById('wishlist-toggle');

async function syncWishlistButton() {
  const id = getProductId();
  if (!wishBtn || !id) return;
  if (!getToken()) {
    wishBtn.textContent = 'Wishlist';
    return;
  }
  try {
    const d = await getWishlist();
    const on = d.wishlist.items.some((i) => i.productId === id);
    wishBtn.textContent = on ? 'Saved' : 'Wishlist';
  } catch {
    wishBtn.textContent = 'Wishlist';
  }
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

function getProductId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

/**
 * @param {Record<string, string[]>} specKeysBySubcategory
 * @param {string} [subcategory]
 * @param {Record<string, unknown>} specs
 */
function specRowsHtml(specKeysBySubcategory, subcategory, specs) {
  const order = subcategory && specKeysBySubcategory[subcategory]
    ? specKeysBySubcategory[subcategory]
    : Object.keys(specs || {});
  const rows = [];
  for (const key of order) {
    if (!specs || specs[key] == null) continue;
    rows.push(
      `<tr><th scope="row">${key}</th><td>${String(specs[key])}</td></tr>`
    );
  }
  for (const key of Object.keys(specs || {})) {
    if (order.includes(key)) continue;
    rows.push(`<tr><th scope="row">${key}</th><td>${String(specs[key])}</td></tr>`);
  }
  return rows.length ? `<table class="spec-table">${rows.join('')}</table>` : '';
}

async function load() {
  const id = getProductId();
  if (!id || !root) {
    setStatus('Missing product id in URL.', true);
    return;
  }

  setStatus('Loading…');
  try {
    const [tax, prod, revs] = await Promise.all([
      api('/api/taxonomy'),
      api(`/api/products/${encodeURIComponent(id)}`),
      api(`/api/products/${encodeURIComponent(id)}/reviews`),
    ]);

    const specKeysBySubcategory = /** @type {Record<string, string[]>} */ (
      /** @type {{ specKeysBySubcategory: Record<string, string[]> }} */ (tax).specKeysBySubcategory
    );
    const p = /** @type {{ product: any }} */ (prod).product;
    const reviews = /** @type {{ reviews: any[] }} */ (revs).reviews;

    root.innerHTML = `
      <header class="pdp-header">
        <p class="muted"><a href="/">← Back to shop</a></p>
        <span class="badge">${String(p.condition).replace('_', ' ')}</span>
        ${p.subcategory ? `<span class="muted">${p.subcategory}</span>` : ''}
        <h1>${p.title}</h1>
        <p class="pdp-sku">SKU ${p.sku}${p.modelName ? ` · Model ${p.modelName}` : ''}</p>
        <p class="pdp-price">${p.currency} ${p.price.toLocaleString()}</p>
        ${p.warrantyMonths != null ? `<p class="muted">Warranty: ${p.warrantyMonths} months</p>` : ''}
        <p>${p.description || ''}</p>
      </header>
      <section class="card pdp-specs">
        <h2>Specifications</h2>
        ${specRowsHtml(specKeysBySubcategory, p.subcategory, p.specs || {})}
      </section>
    `;

    if (reviewsList) {
      reviewsList.innerHTML = reviews.length
        ? reviews
            .map(
              (r) =>
                `<article class="review"><header><strong>${r.rating}★</strong> ${r.title || ''} ${
                  r.verifiedPurchase ? '<span class="badge">Verified purchase</span>' : ''
                } <span class="muted">${r.user?.name || r.user?.email || ''}</span></header><p>${r.body || ''}</p></article>`
            )
            .join('')
        : '<p class="muted">No reviews yet.</p>';
    }

    if (reviewForm) {
      reviewForm.hidden = !getToken();
    }

    await syncWishlistButton();
    setStatus('');
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Failed to load product', true);
  }
}

wishBtn?.addEventListener('click', async () => {
  const id = getProductId();
  if (!id) return;
  if (!getToken()) {
    setStatus('Sign in to use the wishlist.', true);
    return;
  }
  try {
    await toggleWishlistProduct(id);
    await syncWishlistButton();
    setStatus('Wishlist updated.');
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Wishlist failed', true);
  }
});

addBtn?.addEventListener('click', async () => {
  const id = getProductId();
  if (!id) return;
  if (!getToken()) {
    setStatus('Sign in on the home page to use the cart.', true);
    return;
  }
  const qty = Math.max(1, Number(qtyInput?.value) || 1);
  try {
    await addToCart(id, qty);
    setStatus(`Added ${qty} to cart.`);
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Cart error', true);
  }
});

reviewSubmit?.addEventListener('click', async () => {
  const id = getProductId();
  if (!id) return;
  const rating = Number(reviewRating?.value);
  const title = reviewTitle?.value.trim() || '';
  const body = reviewBody?.value.trim() || '';
  try {
    await api(`/api/products/${encodeURIComponent(id)}/reviews`, {
      method: 'POST',
      json: { rating, title, body },
    });
    reviewTitle && (reviewTitle.value = '');
    reviewBody && (reviewBody.value = '');
    setStatus('Review posted.');
    await load();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Review failed', true);
  }
});

document.getElementById('health-check-pdp')?.addEventListener('click', async () => {
  const out = document.getElementById('health-output-pdp');
  if (!out) return;
  out.hidden = false;
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    out.textContent = JSON.stringify(await res.json(), null, 2);
  } catch (e) {
    out.textContent = e instanceof Error ? e.message : 'Failed';
  }
});

applyLegalFooterLinks();
load();
