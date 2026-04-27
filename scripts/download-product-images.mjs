/**
 * Downloads catalog product JPEGs into web/storefront/images/products/{id}.jpg
 * from Pexels IDs in product-image-sources.mjs (not from remote URLs in catalog.js).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PEXELS_PHOTO_ID_BY_PRODUCT, pexelsPhotoJpegUrl } from './product-image-sources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'web', 'storefront', 'images', 'products');

await mkdir(outDir, { recursive: true });

const ids = Object.keys(PEXELS_PHOTO_ID_BY_PRODUCT).sort();
for (const productId of ids) {
  const photoId = PEXELS_PHOTO_ID_BY_PRODUCT[productId];
  const url = pexelsPhotoJpegUrl(photoId);
  const res = await fetch(url, { headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`${productId}: GET ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(outDir, `${productId}.jpg`), buf);
  console.log(`wrote ${productId}.jpg (${buf.length} bytes) ← Pexels ${photoId}`);
}
