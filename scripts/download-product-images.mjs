/**
 * Downloads remote `image` URLs from catalog.js into web/storefront/images/products/{id}.jpg
 * Skips entries that already use relative paths (images/products/...).
 * To refresh assets: temporarily set an `image` to an https URL in catalog.js, run this script, then restore the local path.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../web/storefront/js/catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'web', 'storefront', 'images', 'products');

await mkdir(outDir, { recursive: true });

for (const p of PRODUCTS) {
  const url = String(p.image || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    console.warn(`skip ${p.id}: local or empty (${url || 'empty'})`);
    continue;
  }
  const res = await fetch(url, { headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`${p.id}: GET ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const dest = join(outDir, `${p.id}.jpg`);
  await writeFile(dest, buf);
  console.log(`wrote ${p.id}.jpg (${buf.length} bytes)`);
}
