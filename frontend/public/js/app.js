import {
  api,
  addToCart,
  clearToken,
  getCompareIds,
  getToken,
  getUser,
  getWishlist,
  setToken,
  setUser,
  toggleCompareId,
  toggleWishlistProduct,
  API_BASE,
} from './api.js';
import { applyLegalFooterLinks } from './legalLinks.js';

const grid = document.getElementById('product-grid');
const statusEl = document.getElementById('store-status');
const searchInput = document.getElementById('filter-q');
const subcatSelect = document.getElementById('filter-subcategory');
const conditionSelect = document.getElementById('filter-condition');
const sortSelect = document.getElementById('filter-sort');
const applyBtn = document.getElementById('filter-apply');
const compareBtn = document.getElementById('compare-open');
const compareModal = document.getElementById('compare-modal');
const compareBody = document.getElementById('compare-body');
const compareClose = document.getElementById('compare-close');
const cartCountEl = document.getElementById('cart-count');
const cartSection = document.getElementById('cart-section');
const cartLines = document.getElementById('cart-lines');
const checkoutBtn = document.getElementById('checkout-btn');
const stripePayBtn = document.getElementById('stripe-pay');
const navAdmin = document.getElementById('nav-admin');
const authPanel = document.getElementById('auth-panel');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authName = document.getElementById('auth-name');
const loginBtn = document.getElementById('auth-login');
const signupBtn = document.getElementById('auth-signup');
const logoutBtn = document.getElementById('auth-logout');
const authUserLabel = document.getElementById('auth-user-label');
const healthBtn = document.getElementById('health-check');
const healthOut = document.getElementById('health-output');
const wishlistCountEl = document.getElementById('wishlist-count');
const cartCouponInput = document.getElementById('cart-coupon');
const couponApplyBtn = document.getElementById('coupon-apply');
const couponHintEl = document.getElementById('coupon-hint');

const COUPON_SESSION_KEY = 'nexaspark_coupon_code';

function getCouponCode() {
  return (sessionStorage.getItem(COUPON_SESSION_KEY) || '').trim().toUpperCase();
}

function setCouponSession(code) {
  const c = (code || '').trim().toUpperCase();
  if (c) sessionStorage.setItem(COUPON_SESSION_KEY, c);
  else sessionStorage.removeItem(COUPON_SESSION_KEY);
}

function syncCouponUi() {
  const applied = getCouponCode();
  if (cartCouponInput) cartCouponInput.value = applied;
  if (couponHintEl) {
    couponHintEl.textContent = applied
      ? `Applied at checkout: ${applied} (discount is validated on the server).`
      : 'Optional — demo seed includes SAVE10 (10% off) when stock allows.';
  }
}

/** @type {Set<string>} */
let wishlistIdSet = new Set();

async function refreshWishlistIdSet() {
  if (!getToken()) {
    wishlistIdSet = new Set();
    return;
  }
  try {
    const data = await getWishlist();
    wishlistIdSet = new Set(data.wishlist.items.map((i) => i.productId));
  } catch {
    wishlistIdSet = new Set();
  }
}

async function refreshWishlistCount() {
  if (!wishlistCountEl) return;
  if (!getToken()) {
    wishlistCountEl.textContent = '';
    wishlistCountEl.hidden = true;
    return;
  }
  try {
    const data = await getWishlist();
    const n = data.wishlist.items.length;
    if (n) {
      wishlistCountEl.textContent = String(n);
      wishlistCountEl.hidden = false;
    } else {
      wishlistCountEl.textContent = '';
      wishlistCountEl.hidden = true;
    }
  } catch {
    wishlistCountEl.textContent = '';
    wishlistCountEl.hidden = true;
  }
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

function currentQuery() {
  const q = new URLSearchParams();
  const term = searchInput?.value.trim();
  if (term) q.set('q', term);
  const sub = subcatSelect?.value;
  if (sub) q.set('subcategory', sub);
  const cond = conditionSelect?.value;
  if (cond) q.set('condition', cond);
  const sort = sortSelect?.value;
  if (sort) q.set('sort', sort);
  return q.toString();
}

function specChips(specs) {
  if (!specs || typeof specs !== 'object') return '';
  return Object.entries(specs)
    .slice(0, 4)
    .map(([k, v]) => `<span class="chip">${k}: ${String(v)}</span>`)
    .join('');
}

function renderProducts(products) {
  if (!grid) return;
  grid.innerHTML = '';
  const compareSet = new Set(getCompareIds());
  for (const p of products) {
    const el = document.createElement('article');
    el.className = 'product-card';
    el.innerHTML = `
      <div class="product-card__meta">
        <span class="badge">${p.condition.replace('_', ' ')}</span>
        ${p.subcategory ? `<span class="muted">${p.subcategory}</span>` : ''}
      </div>
      <h2 class="product-card__title"><a href="/product.html?id=${encodeURIComponent(p.id)}">${p.title}</a></h2>
      <p class="product-card__sku">SKU ${p.sku}</p>
      <p class="product-card__price">${p.currency} ${p.price.toLocaleString()}</p>
      <div class="product-card__chips">${specChips(p.specs)}</div>
      <div class="product-card__actions">
        <button type="button" class="btn-secondary" data-compare="${p.id}">${compareSet.has(p.id) ? 'Remove compare' : 'Compare'}</button>
        <button type="button" class="btn-secondary" data-wish="${p.id}">${wishlistIdSet.has(p.id) ? 'Saved' : 'Wishlist'}</button>
        <button type="button" data-add="${p.id}">Add to cart</button>
      </div>
    `;
    grid.appendChild(el);
  }

  grid.querySelectorAll('[data-add]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-add');
      if (!id) return;
      if (!getToken()) {
        setStatus('Sign in to use the cart.', true);
        authPanel?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      try {
        await addToCart(id, 1);
        setStatus('Added to cart.');
        await refreshCart();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Cart error', true);
      }
    });
  });

  grid.querySelectorAll('[data-compare]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-compare');
      if (!id) return;
      const next = toggleCompareId(id);
      btn.textContent = next.includes(id) ? 'Remove compare' : 'Compare';
      updateCompareButton();
    });
  });

  grid.querySelectorAll('[data-wish]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-wish');
      if (!id) return;
      if (!getToken()) {
        setStatus('Sign in to use the wishlist.', true);
        authPanel?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      try {
        await toggleWishlistProduct(id);
        await refreshWishlistIdSet();
        btn.textContent = wishlistIdSet.has(id) ? 'Saved' : 'Wishlist';
        await refreshWishlistCount();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Wishlist error', true);
      }
    });
  });
}

async function loadTaxonomy() {
  const data = /** @type {{ specKeysBySubcategory: Record<string, string[]> }} */ (await api('/api/taxonomy'));
  if (!subcatSelect) return;
  const keys = Object.keys(data.specKeysBySubcategory).sort();
  subcatSelect.innerHTML = '<option value="">All subcategories</option>';
  for (const k of keys) {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    subcatSelect.appendChild(opt);
  }
}

async function loadProducts() {
  setStatus('Loading products…');
  await refreshWishlistIdSet();
  try {
    const qs = currentQuery();
    const data = /** @type {{ products: unknown[]; total?: number }} */ (
      await api(`/api/products${qs ? `?${qs}` : ''}`)
    );
    renderProducts(/** @type {any[]} */ (data.products));
    const total = typeof data.total === 'number' ? data.total : data.products.length;
    setStatus(`Showing ${data.products.length} of ${total}`);
    await refreshWishlistCount();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Failed to load products', true);
  }
}

function updateCompareButton() {
  const n = getCompareIds().length;
  if (compareBtn) {
    compareBtn.textContent = n ? `Compare (${n})` : 'Compare';
    compareBtn.disabled = n < 2;
  }
}

function collectSpecKeys(products) {
  const keys = new Set();
  for (const p of products) {
    keys.add('sku');
    keys.add('title');
    keys.add('price');
    keys.add('condition');
    keys.add('modelName');
    if (p.specs && typeof p.specs === 'object') {
      for (const k of Object.keys(p.specs)) keys.add(k);
    }
  }
  return [...keys];
}

async function openCompare() {
  const ids = getCompareIds();
  if (ids.length < 2) return;
  if (!compareModal || !compareBody) return;
  compareModal.hidden = false;
  compareBody.innerHTML = 'Loading…';
  try {
    const data = /** @type {{ products: any[] }} */ (
      await api(`/api/products/compare?ids=${encodeURIComponent(ids.join(','))}`)
    );
    const products = data.products;
    const keys = collectSpecKeys(products);
    const head = `<tr><th>Spec</th>${products.map((p) => `<th>${p.title}</th>`).join('')}</tr>`;
    const rows = keys
      .map((key) => {
        const cells = products.map((p) => {
          let val = '';
          if (key === 'title') val = p.title;
          else if (key === 'sku') val = p.sku;
          else if (key === 'price') val = `${p.currency} ${p.price}`;
          else if (key === 'condition') val = p.condition;
          else if (key === 'modelName') val = p.modelName || '—';
          else val = p.specs && p.specs[key] != null ? String(p.specs[key]) : '—';
          return `<td>${val}</td>`;
        });
        return `<tr><th scope="row">${key}</th>${cells.join('')}</tr>`;
      })
      .join('');
    compareBody.innerHTML = `<table class="compare-table">${head}${rows}</table>`;
  } catch (e) {
    compareBody.textContent = e instanceof Error ? e.message : 'Compare failed';
  }
}

async function refreshCart() {
  if (!getToken()) {
    if (cartCountEl) {
      cartCountEl.textContent = '';
      cartCountEl.hidden = true;
    }
    if (cartLines) cartLines.innerHTML = '<p class="muted">Sign in to view your cart.</p>';
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (stripePayBtn) stripePayBtn.disabled = true;
    syncCouponUi();
    return;
  }
  try {
    const data = /** @type {{ cart: { items: any[] } }} */ (await api('/api/cart'));
    const items = data.cart.items;
    const n = items.reduce((s, i) => s + i.quantity, 0);
    if (cartCountEl) {
      if (n) {
        cartCountEl.textContent = String(n);
        cartCountEl.hidden = false;
      } else {
        cartCountEl.textContent = '';
        cartCountEl.hidden = true;
      }
    }
    if (cartLines) {
      cartLines.innerHTML = items.length
        ? items
            .map(
              (i) =>
                `<div class="cart-line"><span>${i.product?.title || i.productId}</span><span>×${i.quantity}</span><span>${i.product ? i.product.currency + ' ' + (i.product.price * i.quantity).toLocaleString() : ''}</span></div>`
            )
            .join('')
        : '<p class="muted">Your cart is empty.</p>';
    }
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
    if (stripePayBtn) stripePayBtn.disabled = items.length === 0;
    syncCouponUi();
  } catch {
    if (cartCountEl) cartCountEl.textContent = '';
  }
}

function refreshAuthUi() {
  const token = getToken();
  const profile = getUser();
  if (authUserLabel) {
    authUserLabel.textContent = profile
      ? `${profile.email} (${profile.role || 'customer'})`
      : 'Guest';
  }
  if (navAdmin) navAdmin.hidden = !profile || profile.role !== 'admin';
  if (logoutBtn) logoutBtn.hidden = !token;
  if (loginBtn) loginBtn.hidden = Boolean(token);
  if (signupBtn) signupBtn.hidden = Boolean(token);
  if (authEmail) authEmail.disabled = Boolean(token);
  if (authPassword) authPassword.disabled = Boolean(token);
  if (authName) authName.disabled = Boolean(token);
}

applyBtn?.addEventListener('click', () => {
  loadProducts();
});

compareBtn?.addEventListener('click', () => {
  openCompare();
});

compareClose?.addEventListener('click', () => {
  if (compareModal) compareModal.hidden = true;
});

compareModal?.addEventListener('click', (ev) => {
  if (ev.target === compareModal) compareModal.hidden = true;
});

loginBtn?.addEventListener('click', async () => {
  try {
    const email = authEmail?.value.trim();
    const password = authPassword?.value || '';
    const data = /** @type {{ token: string; user: { id: string; email: string; name?: string; role?: string } }} */ (
      await api('/api/auth/login', { method: 'POST', json: { email, password } })
    );
    setToken(data.token);
    setUser(data.user);
    refreshAuthUi();
    setStatus('Signed in.');
    await refreshCart();
    await refreshWishlistCount();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Login failed', true);
  }
});

signupBtn?.addEventListener('click', async () => {
  try {
    const email = authEmail?.value.trim();
    const password = authPassword?.value || '';
    const name = authName?.value.trim() || '';
    const data = /** @type {{ token: string; user: { id: string; email: string; name?: string; role?: string } }} */ (
      await api('/api/auth/signup', { method: 'POST', json: { email, password, name } })
    );
    setToken(data.token);
    setUser(data.user);
    refreshAuthUi();
    setStatus('Account created. You are signed in.');
    await refreshCart();
    await refreshWishlistCount();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Signup failed', true);
  }
});

logoutBtn?.addEventListener('click', () => {
  clearToken();
  refreshAuthUi();
  refreshCart();
  refreshWishlistCount();
  setStatus('Signed out.');
});

couponApplyBtn?.addEventListener('click', () => {
  const raw = cartCouponInput?.value || '';
  setCouponSession(raw);
  syncCouponUi();
  setStatus(getCouponCode() ? `Coupon saved: ${getCouponCode()}` : 'Coupon cleared.');
});

checkoutBtn?.addEventListener('click', async () => {
  try {
    const couponCode = getCouponCode();
    await api('/api/orders', { method: 'POST', json: couponCode ? { couponCode } : {} });
    setStatus('Order completed (stub checkout — marked paid).');
    await refreshCart();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Checkout failed', true);
  }
});

stripePayBtn?.addEventListener('click', async () => {
  if (!getToken()) {
    setStatus('Sign in to pay with Stripe.', true);
    return;
  }
  try {
    const couponCode = getCouponCode();
    const data = /** @type {{ url?: string }} */ (
      await api('/api/stripe/checkout-session', {
        method: 'POST',
        json: couponCode ? { couponCode } : {},
      })
    );
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setStatus('Stripe did not return a checkout URL.', true);
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Stripe checkout failed', true);
  }
});

healthBtn?.addEventListener('click', async () => {
  if (!healthOut) return;
  healthOut.hidden = false;
  healthOut.textContent = 'Loading…';
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    healthOut.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    healthOut.textContent =
      err instanceof Error ? err.message : 'Request failed. Is the API running?';
  }
});

cartSection?.querySelector('[data-scroll-auth]')?.addEventListener('click', () => {
  authPanel?.scrollIntoView({ behavior: 'smooth' });
});

(async function init() {
  applyLegalFooterLinks();
  syncCouponUi();
  updateCompareButton();
  refreshAuthUi();
  await loadTaxonomy();
  await loadProducts();
  await refreshCart();
})();
