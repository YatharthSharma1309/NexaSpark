import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.NEXASPARK_TEST_PORT) || 3099;

async function waitForHealth(maxMs = 15_000) {
  const deadline = Date.now() + maxMs;
  for (;;) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/api/health`, { cache: 'no-store' });
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() > deadline) throw new Error(`server did not become healthy on port ${port}`);
    await new Promise((r) => setTimeout(r, 150));
  }
}

test('dev server: API health, key HTML, catalog JSON, first product image', async () => {
  const proc = spawn(process.execPath, ['server/index.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const errBuf = [];
  proc.stderr?.on('data', (c) => errBuf.push(c));
  try {
    await waitForHealth();
    const h = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(h.status, 200);
    const hj = await h.json();
    assert.equal(hj.ok, true);
    assert.ok(Number(hj.products) >= 1);

    for (const path of ['/', '/products.html', '/product.html?id=p1', '/cart.html', '/order.html']) {
      const r = await fetch(`http://127.0.0.1:${port}${path}`);
      assert.equal(r.status, 200, path);
    }

    const pr = await fetch(`http://127.0.0.1:${port}/api/products`);
    assert.equal(pr.status, 200);
    const data = await pr.json();
    assert.ok(Array.isArray(data) && data.length);
    const origin = `http://127.0.0.1:${port}`;
    for (const p of data) {
      assert.ok(p?.image, `${p?.id || '?'} missing image`);
      const img = String(p.image).trim();
      if (/^https?:\/\//i.test(img)) continue;
      const rel = img.replace(/^\/+/, '');
      const url = new URL(rel, `${origin}/`).href;
      const ir = await fetch(url);
      assert.equal(ir.status, 200, `${p.id} image ${url}`);
      const ct = ir.headers.get('content-type') || '';
      assert.ok(ct.includes('image'), `${p.id} content-type: ${ct}`);
    }
  } finally {
    proc.kill();
    await new Promise((r) => setTimeout(r, 400));
    if (proc.exitCode === null) proc.kill('SIGKILL');
  }
});
