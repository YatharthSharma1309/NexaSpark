import { api, getToken } from './api.js';

const root = document.getElementById('orders-root');
const statusEl = document.getElementById('orders-status');

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.toggle('is-error', Boolean(isError));
}

async function load() {
  if (!root) return;
  if (!getToken()) {
    root.innerHTML =
      '<p class="muted">Sign in from the <a href="/">home page</a> to see your orders.</p>';
    return;
  }
  setStatus('Loading…');
  try {
    const data = /** @type {{ orders: any[] }} */ (await api('/api/orders'));
    const orders = data.orders;
    root.innerHTML = orders.length
      ? orders
          .map((o) => {
            const lines = o.lines
              .map(
                (l) =>
                  `<li>${l.title} × ${l.quantity} — ${o.currency} ${(l.price * l.quantity).toLocaleString()}</li>`
              )
              .join('');
            return `<article class="card order-card"><h2>Order ${o.id.slice(-8)}</h2><p class="muted"><span class="status-pill">${o.status}</span> · ${o.currency} ${o.totalAmount.toLocaleString()}</p><ul class="order-lines">${lines}</ul></article>`;
          })
          .join('')
      : '<p class="muted">No orders yet.</p>';
    setStatus('');
  } catch (e) {
    setStatus(e instanceof Error ? e.message : 'Failed to load orders', true);
  }
}

load();
