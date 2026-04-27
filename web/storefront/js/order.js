import { formatInr, escHtml } from './catalog.js';
import { isCartApiAvailable } from './cart.js';
import { syncCartBadge } from './nav.js';

const root = document.getElementById('order-root');
const params = new URLSearchParams(window.location.search);
const id = params.get('id')?.trim() || '';

function lineRow(line) {
  if (!line?.product) return '';
  const p = line.product;
  const t = p.title ? escHtml(p.title) : line.id;
  return `<li class="order-line">${t} — ${line.qty} × ${formatInr(p.price)} = <strong>${formatInr(
    p.price * line.qty
  )}</strong></li>`;
}

async function run() {
  syncCartBadge();
  if (!root) return;
  if (!id) {
    root.innerHTML =
      '<p role="alert" class="order-panel order-panel--muted">Missing order id. <a href="products.html">Continue shopping</a></p>';
    return;
  }
  if (!(await isCartApiAvailable())) {
    root.innerHTML = `<div class="order-panel order-panel--muted" role="status">
      <p>Open this page from the same <code>npm run dev</code> session to load your receipt.</p>
      <p class="order-panel__actions"><a href="index.html">Home</a> · <a href="cart.html">Cart</a></p></div>`;
    return;
  }
  let data;
  try {
    const r = await fetch(`api/orders/${encodeURIComponent(id)}`);
    if (r.status === 404) {
      root.innerHTML =
        '<p role="alert" class="order-panel order-panel--muted">Order not found, or you are not allowed to view it. <a href="products.html">Shop</a></p>';
      return;
    }
    if (!r.ok) throw new Error();
    data = await r.json();
  } catch {
    root.innerHTML =
      '<p role="alert" class="order-panel order-panel--muted">Could not load order. <a href="cart.html">Back to cart</a></p>';
    return;
  }
  document.title = `Order ${String(data.orderId)} — NexaSpark`;
  const when = data.at
    ? `<p class="order-meta muted">Placed ${escHtml(String(data.at))} (server time, demo)</p>`
    : '';
  const items = Array.isArray(data.items) ? data.items : [];
  root.innerHTML = `
    <div class="order-success" role="status">
      <p class="order-success__eyebrow">Thank you</p>
      <p class="order-success__lead">We received your <strong>demo</strong> order (no payment).</p>
    </div>
    <div class="order-panel order-panel--detail">
      <p class="order-id-row"><span class="muted">Order ID</span><br /><code class="order-code">${escHtml(String(data.orderId))}</code></p>
      <p class="order-total-row"><span class="muted">Total</span> <strong class="order-total">${formatInr(data.totalInr)}</strong></p>
      ${when}
    </div>
    <div class="order-items-block">
      <h2 class="order-items-heading">Items</h2>
      <ul class="order-lines">${items.map(lineRow).join('')}</ul>
    </div>
    <p class="order-next"><a class="btn-primary order-cta" href="products.html">Continue shopping</a></p>
  `;
}

run();
