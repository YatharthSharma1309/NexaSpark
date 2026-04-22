import express from 'express';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

app.use(express.static(storefront, { index: 'index.html', extensions: ['html'] }));

app.listen(port, () => {
  console.log(`NexaSpark dev server: http://127.0.0.1:${port}/  (api at /api/products)`);
});
