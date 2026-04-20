import { api, getToken, getUser } from './api.js';
import { applyLegalFooterLinks } from './legalLinks.js';

const statusEl = document.getElementById('admin-status');
const productsBody = document.querySelector('#products-table tbody');
const ordersBody = document.querySelector('#orders-table tbody');
const couponsBody = document.querySelector('#coupons-table tbody');
const analyticsOut = document.getElementById('analytics-out');

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

function ensureAdmin() {
  if (!getToken() || getUser()?.role !== 'admin') {
    setStatus('Sign in on the home page with an admin account, then return here.', true);
    return false;
  }
  return true;
}

async function loadProducts() {
  if (!productsBody) return;
  const data = /** @type {{ products: any[] }} */ (await api('/api/admin/products'));
  productsBody.innerHTML = data.products
    .map((p) => {
      const id = p._id || p.id;
      return `<tr>
        <td>${p.sku}</td>
        <td>${p.title}</td>
        <td>${p.stockQuantity}</td>
        <td><button type="button" class="btn-secondary" data-del="${id}">Delete</button></td>
      </tr>`;
    })
    .join('');

  productsBody.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-del');
      if (!id || !confirm('Delete this product?')) return;
      try {
        await api(`/api/admin/products/${id}`, { method: 'DELETE' });
        setStatus('Product deleted.');
        await loadProducts();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Delete failed', true);
      }
    });
  });
}

async function loadOrders() {
  if (!ordersBody) return;
  const data = /** @type {{ orders: any[] }} */ (await api('/api/admin/orders'));
  const statuses = [
    'awaiting_payment',
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  ordersBody.innerHTML = data.orders
    .map((o) => {
      const opts = statuses
        .map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`)
        .join('');
      return `<tr>
        <td><code>${String(o.id).slice(-10)}</code></td>
        <td><code>${String(o.userId).slice(-10)}</code></td>
        <td>${o.currency} ${o.totalAmount}</td>
        <td><span class="status-pill">${o.status}</span></td>
        <td>
          <select data-order="${o.id}" aria-label="Status">${opts}</select>
          <button type="button" class="btn-secondary" data-save="${o.id}">Save</button>
        </td>
      </tr>`;
    })
    .join('');

  ordersBody.querySelectorAll('[data-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-save');
      const sel = ordersBody.querySelector(`select[data-order="${id}"]`);
      const status = sel?.value;
      if (!id || !status) return;
      try {
        await api(`/api/admin/orders/${id}`, { method: 'PATCH', json: { status } });
        setStatus('Order updated.');
        await loadOrders();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Update failed', true);
      }
    });
  });
}

async function loadCoupons() {
  if (!couponsBody) return;
  const data = /** @type {{ coupons: any[] }} */ (await api('/api/admin/coupons'));
  couponsBody.innerHTML = data.coupons
    .map((c) => {
      const id = c._id || c.id;
      const disc =
        c.discountType === 'percent' ? `${c.value}%` : `${c.currency || ''} ${c.value}`.trim();
      return `<tr>
        <td><code>${c.code}</code></td>
        <td>${disc}</td>
        <td>${c.active ? 'yes' : 'no'}</td>
        <td>
          <button type="button" class="btn-secondary" data-toggle-coupon="${id}" data-next-active="${c.active ? 'false' : 'true'}">
            ${c.active ? 'Deactivate' : 'Activate'}
          </button>
        </td>
      </tr>`;
    })
    .join('');

  couponsBody.querySelectorAll('[data-toggle-coupon]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-toggle-coupon');
      const next = btn.getAttribute('data-next-active') === 'true';
      if (!id) return;
      try {
        await api(`/api/admin/coupons/${id}`, { method: 'PATCH', json: { active: next } });
        setStatus('Coupon updated.');
        await loadCoupons();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Coupon update failed', true);
      }
    });
  });
}

async function loadAnalytics() {
  if (!analyticsOut) return;
  analyticsOut.textContent = 'Loading…';
  try {
    const data = await api('/api/admin/analytics/summary');
    analyticsOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    analyticsOut.textContent = e instanceof Error ? e.message : 'Failed to load analytics';
  }
}

document.getElementById('c-create')?.addEventListener('click', async () => {
  if (!ensureAdmin()) return;
  const code = /** @type {HTMLInputElement} */ (document.getElementById('c-code')).value.trim();
  const discountType = /** @type {HTMLSelectElement} */ (document.getElementById('c-type')).value;
  const value = Number(/** @type {HTMLInputElement} */ (document.getElementById('c-value')).value);
  const label = /** @type {HTMLInputElement} */ (document.getElementById('c-label')).value.trim();
  if (!code) {
    setStatus('Coupon code is required.', true);
    return;
  }
  try {
    await api('/api/admin/coupons', {
      method: 'POST',
      json: { code, discountType, value, label: label || undefined },
    });
    setStatus('Coupon created.');
    await loadCoupons();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Create coupon failed', true);
  }
});

document.getElementById('analytics-refresh')?.addEventListener('click', () => {
  loadAnalytics();
});

document.getElementById('p-create')?.addEventListener('click', async () => {
  if (!ensureAdmin()) return;
  const sku = /** @type {HTMLInputElement} */ (document.getElementById('p-sku')).value.trim();
  const title = /** @type {HTMLInputElement} */ (document.getElementById('p-title')).value.trim();
  const price = Number(/** @type {HTMLInputElement} */ (document.getElementById('p-price')).value);
  const stockQuantity = Number(/** @type {HTMLInputElement} */ (document.getElementById('p-stock')).value);
  const condition = /** @type {HTMLSelectElement} */ (document.getElementById('p-condition')).value;
  const subcategory = /** @type {HTMLInputElement} */ (document.getElementById('p-sub')).value.trim();
  let specs = {};
  try {
    specs = JSON.parse(/** @type {HTMLTextAreaElement} */ (document.getElementById('p-specs')).value || '{}');
  } catch {
    setStatus('Specs must be valid JSON object.', true);
    return;
  }
  try {
    await api('/api/admin/products', {
      method: 'POST',
      json: { sku, title, price, stockQuantity, condition, subcategory, specs },
    });
    setStatus('Product created.');
    await loadProducts();
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Create failed', true);
  }
});

(async function init() {
  applyLegalFooterLinks();
  if (!ensureAdmin()) return;
  try {
    await loadProducts();
    await loadOrders();
    await loadCoupons();
    await loadAnalytics();
    setStatus('Loaded admin data.');
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Failed to load admin data', true);
  }
})();
