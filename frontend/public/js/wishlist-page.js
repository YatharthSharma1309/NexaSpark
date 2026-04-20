import { getToken, setWishlistProductIds, getWishlist } from './api.js';
import { applyLegalFooterLinks } from './legalLinks.js';

const root = document.getElementById('wishlist-root');
const statusEl = document.getElementById('wishlist-status');

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

async function load() {
  if (!root) return;
  if (!getToken()) {
    root.removeAttribute('aria-busy');
    root.innerHTML =
      '<p class="muted">Sign in from the <a href="/">home page</a> to see your wishlist.</p>';
    return;
  }
  root.innerHTML = '<p class="muted">Loading wishlist…</p>';
  root.setAttribute('aria-busy', 'true');
  setStatus('');
  try {
    const data = await getWishlist();
    const items = data.wishlist.items;
    root.removeAttribute('aria-busy');
    if (!items.length) {
      root.innerHTML = '<p class="muted">Your wishlist is empty.</p>';
      setStatus('');
      return;
    }
    root.innerHTML = items
      .map((row) => {
        const p = row.product;
        if (!p) {
          return `<article class="product-card"><p class="muted">Unavailable product</p></article>`;
        }
        return `<article class="product-card">
          <h2 class="product-card__title"><a href="/product.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h2>
          <p class="product-card__sku">SKU ${p.sku}</p>
          <p class="product-card__price">${p.currency} ${p.price.toLocaleString()}</p>
          <button type="button" class="btn-secondary" data-remove="${row.productId}">Remove</button>
        </article>`;
      })
      .join('');

    root.querySelectorAll('[data-remove]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-remove');
        if (!id) return;
        const current = await getWishlist();
        const next = current.wishlist.items.map((i) => i.productId).filter((x) => x !== id);
        await setWishlistProductIds(next);
        setStatus('Removed.');
        await load();
      });
    });
    setStatus('');
  } catch (e) {
    root.removeAttribute('aria-busy');
    const msg = e instanceof Error ? e.message : 'Failed to load wishlist';
    setStatus(msg, true);
    root.innerHTML = `<p role="alert">${msg}</p><p><button type="button" class="btn-secondary" id="wishlist-retry">Retry</button></p>`;
    document.getElementById('wishlist-retry')?.addEventListener('click', () => load());
  }
}

applyLegalFooterLinks();
load();
