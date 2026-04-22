import { formatInr, escHtml } from './catalog.js';
import { isCartApiAvailable } from './cart.js';
import { syncCartBadge } from './nav.js';

const root = document.getElementById('account-orders');

function row(o) {
  const id = escHtml(String(o.orderId));
  const when = o.at ? escHtml(String(o.at)) : '—';
  const n = o.lineCount != null ? escHtml(String(o.lineCount)) : '—';
  return `<li class="account-order-row">
    <div>
      <a class="account-order-id" href="order.html?id=${encodeURIComponent(o.orderId)}">Order <code class="order-code order-code--inline">${id}</code></a>
      <p class="muted account-order-meta">${when} · ${n} line(s) · ${formatInr(o.totalInr)}</p>
    </div>
  </li>`;
}

async function run() {
  syncCartBadge();
  if (!root) return;
  if (!(await isCartApiAvailable())) {
    root.innerHTML = `<p class="account-static muted" role="status">
      Run the app with <code>npm run dev</code> to see orders placed in this session. 
      <code>npm run serve:web</code> has no order API.
    </p>`;
    return;
  }
  let data;
  try {
    const r = await fetch('/api/orders/mine', { cache: 'no-store' });
    if (!r.ok) throw new Error();
    data = await r.json();
  } catch {
    root.innerHTML = '<p class="muted" role="alert">Could not load orders. Try again later.</p>';
    return;
  }
  const orders = Array.isArray(data?.orders) ? data.orders : [];
  if (orders.length === 0) {
    root.innerHTML =
      '<p class="muted">No orders yet. <a href="products.html">Start shopping</a> — then check out to create a demo order.</p>';
    return;
  }
  root.innerHTML = `<ol class="account-order-list">${orders.map(row).join('')}</ol>`;
}

run();
