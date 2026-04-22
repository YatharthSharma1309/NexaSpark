import { randomBytes } from 'node:crypto';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getServerCart, setServerCart } from './cartState.mjs';
import { guestSession } from './middleware/guestSession.mjs';
import { appendOrder, getOrderById } from './ordersStore.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const storefront = join(root, 'web', 'storefront');
const dataPath = join(__dirname, 'data', 'products.json');

const products = JSON.parse(await readFile(dataPath, 'utf8'));
if (!Array.isArray(products) || !products.length) {
  throw new Error('server/data/products.json must be a non-empty array');
}

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable('x-powered-by');

app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, products: products.length });
});

app.get('/api/products', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const id = String(req.params.id || '')
    .trim()
    .toLowerCase();
  const p = products.find((x) => x.id === id);
  if (!p) {
    res.set('Content-Type', 'application/json; charset=utf-8');
    return res.status(404).json({ error: 'not_found' });
  }
  res.set('Cache-Control', 'public, max-age=60');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json(p);
});

const cartJson = express.json({ limit: '32kb' });

/**
 * @param {unknown} body
 * @param {typeof products} catalog
 * @returns {{ items: { id: string, qty: number }[] }}
 */
function normalizeCartBody(body, catalog) {
  if (!body || !Array.isArray(body.items)) return { items: [] };
  const seen = new Map();
  for (const line of body.items) {
    const id = String(line.id || '')
      .trim()
      .toLowerCase();
    if (!id) continue;
    if (!catalog.some((x) => x.id === id)) continue;
    let q = Math.floor(Number(line.qty));
    if (q < 1) q = 1;
    if (q > 99) q = 99;
    seen.set(id, q);
  }
  return { items: [...seen].map(([id, qty]) => ({ id, qty })) };
}

/**
 * @param { { id: string, qty: number }[] } items
 * @param {typeof products} catalog
 */
function expandLineItems(items, catalog) {
  return items
    .map((line) => {
      const product = catalog.find((x) => x.id === line.id);
      if (!product) return null;
      return { id: line.id, qty: line.qty, product };
    })
    .filter((x) => x != null);
}

app.get('/api/cart', guestSession, (req, res) => {
  const sid = /** @type {string} */ (req.guestId);
  let { items } = getServerCart(sid);
  const validIds = new Set(products.map((p) => p.id));
  const pruned = items.filter((l) => validIds.has(l.id));
  if (pruned.length !== items.length) {
    setServerCart(sid, pruned);
    items = pruned;
  }
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json({ items: expandLineItems(items, products) });
});

app.put('/api/cart', guestSession, cartJson, (req, res) => {
  const sid = /** @type {string} */ (req.guestId);
  const norm = normalizeCartBody(req.body, products);
  setServerCart(sid, norm.items);
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json({ items: expandLineItems(norm.items, products) });
});

app.get('/api/orders/:orderId', guestSession, (req, res) => {
  const orderId = String(req.params.orderId || '').trim();
  const o = getOrderById(orderId);
  if (!o) {
    return res.status(404).json({ error: 'not_found' });
  }
  if (o.guestId && o.guestId !== req.guestId) {
    return res.status(404).json({ error: 'not_found' });
  }
  const rest = { ...o };
  if ('guestId' in rest) delete rest.guestId;
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.json(rest);
});

/** Demo order — no payment; replace with Checkout Sessions / Razorpay, etc. */
app.post('/api/orders', guestSession, cartJson, (req, res) => {
  const sid = /** @type {string} */ (req.guestId);
  const norm = normalizeCartBody(req.body, products);
  if (norm.items.length === 0) {
    return res.status(400).json({ error: 'empty_cart' });
  }
  const lines = expandLineItems(norm.items, products);
  let totalInr = 0;
  for (const line of lines) {
    if (line) totalInr += line.product.price * line.qty;
  }
  const orderId = `NS-${Date.now()}-${randomBytes(3).toString('hex')}`;
  setServerCart(sid, []);
  const record = { orderId, totalInr, items: lines, demo: true, guestId: sid };
  try {
    appendOrder(record);
  } catch (e) {
    console.error('appendOrder', e);
    return res.status(500).json({ error: 'persist_failed' });
  }
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'application/json; charset=utf-8');
  res.status(201).json({ orderId, totalInr, items: lines, demo: true });
});

app.use(express.static(storefront, { index: 'index.html', extensions: ['html'] }));

app.listen(port, () => {
  console.log(
    `NexaSpark dev server: http://127.0.0.1:${port}/  (api: /api/products, /api/cart, /api/orders)`,
  );
});
