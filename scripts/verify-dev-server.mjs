/**
 * Hit the running NexaSpark dev server and assert key routes, API shape, and assets.
 * Usage: npm run dev   (in another shell), then: node scripts/verify-dev-server.mjs
 * Or:    NEXASPARK_VERIFY_URL=http://127.0.0.1:3000 node scripts/verify-dev-server.mjs
 */
import assert from 'node:assert/strict';

const base = (process.env.NEXASPARK_VERIFY_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

async function get(path, init) {
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const r = await fetch(url, { cache: 'no-store', ...init });
  return { r, url };
}

function ok(name, pass, detail = '') {
  const status = pass ? 'OK' : 'FAIL';
  console.log(`[${status}] ${name}${detail ? `: ${detail}` : ''}`);
  assert.ok(pass, name);
}

console.log(`Verifying ${base}\n`);

const health = await get('/api/health');
ok('GET /api/health', health.r.status === 200);
const healthJson = await health.r.json();
ok('health.ok', healthJson.ok === true);
ok('health.products count', Number(healthJson.products) >= 1);

const list = await get('/api/products');
ok('GET /api/products', list.r.status === 200);
const products = await list.r.json();
ok('products is array', Array.isArray(products));
ok('products length 12', products.length === 12);

for (const p of products) {
  ok(`product ${p.id} has title`, typeof p.title === 'string' && p.title.length > 0);
  ok(
    `product ${p.id} image`,
    typeof p.image === 'string' && p.image.length > 0,
    p.image?.slice?.(0, 96),
  );
}

for (const p of products) {
  const img = String(p.image || '').trim();
  let imgRes;
  if (/^https?:\/\//i.test(img)) {
    imgRes = await fetch(img, { cache: 'no-store', signal: AbortSignal.timeout(20_000) });
  } else {
    const rel = img.replace(/^\/+/, '');
    imgRes = await fetch(`${base}/${rel}`, { cache: 'no-store' });
  }
  const ict = imgRes.headers.get('content-type') || '';
  ok(
    `image loads ${p.id}`,
    imgRes.status === 200 && ict.includes('image'),
    `${imgRes.status} ${ict.slice(0, 40)}`,
  );
}

for (const id of products.map((p) => p.id)) {
  const one = await get(`/api/products/${id}`);
  ok(`GET /api/products/${id}`, one.r.status === 200, one.url);
  const row = await one.r.json();
  ok(`product ${id} id match`, row.id === id);
}

const htmlPaths = [
  '/',
  '/index.html',
  '/products.html',
  '/product.html?id=p1',
  '/product.html?id=p12',
  '/cart.html',
  '/order.html',
  '/account.html',
  '/about.html',
  '/contact.html',
  '/help.html',
  '/privacy.html',
  '/terms.html',
  '/shipping-returns.html',
  '/404.html',
];

for (const path of htmlPaths) {
  const { r, url } = await get(path);
  ok(`GET ${path}`, r.status === 200, url);
  const ct = r.headers.get('content-type') || '';
  ok(`content-type HTML ${path}`, ct.includes('text/html'), ct);
}

const p1jpg = await get('/images/products/p1.jpg');
ok('GET /images/products/p1.jpg', p1jpg.r.status === 200);
const imgCt = p1jpg.r.headers.get('content-type') || '';
ok('p1.jpg content-type', imgCt.includes('image'), imgCt);

const cartGet = await get('/api/cart');
ok('GET /api/cart', cartGet.r.status === 200);
const cartJson = await cartGet.r.json();
ok('cart.items array', Array.isArray(cartJson.items));

console.log('\nAll checks passed.');
