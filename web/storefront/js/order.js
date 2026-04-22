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
  return `<li>${t} — ${line.qty} × ${formatInr(p.price)} = <strong>${formatInr(
    p.price * line.qty
  )}</strong></li>`;
}

async function run() {
  syncCartBadge();
  if (!root) return;
  if (!id) {
    root.innerHTML =
      '<p role="alert" class="muted">Missing order id. <a href="products.html">Continue shopping</a></p>';
    return;
  }
  if (!(await isCartApiAvailable())) {
    root.innerHTML = `<p class="muted" role="status">Open this page from the same <code>npm run dev</code> session, or the order is not available.</p>
      <p><a href="index.html">Home</a> · <a href="cart.html">Cart</a></p>`;
    return;
  }
  let data;
  try {
    const r = await fetch(`/api/orders/${encodeURIComponent(id)}`);
    if (r.status === 404) {
      root.innerHTML =
        '<p role="alert" class="muted">Order not found, or you are not allowed to view it. <a href="products.html">Shop</a></p>';
      return;
    }
    if (!r.ok) throw new Error();
    data = await r.json();
  } catch {
    root.innerHTML =
      '<p role="alert" class="muted">Could not load order. <a href="cart.html">Back to cart</a></p>';
    return;
  }
  document.title = `Order ${String(data.orderId)} — NexaSpark`;
  const when = data.at
    ? `<p class="muted">Placed ${escHtml(String(data.at))} (server time, demo)</p>`
    : '';
  const items = Array.isArray(data.items) ? data.items : [];
  root.innerHTML = `
    <p class="pdp-rating" role="status">Thanks — we received your <strong>demo</strong> order (no payment).</p>
    <p><strong>Order</strong> <code>${escHtml(String(data.orderId))}</code></p>
    <p><strong>Total</strong> ${formatInr(data.totalInr)}</p>
    ${when}
    <h2>Items</h2>
    <ul class="order-lines">${items.map(lineRow).join('')}</ul>
    <p><a class="btn-primary" href="products.html" style="display:inline-block;margin-top:1rem;text-decoration:none">Continue shopping</a></p>
  `;
}

run();
