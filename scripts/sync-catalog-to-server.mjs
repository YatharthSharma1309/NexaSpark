/**
 * Regenerates server/data/products.json from web/storefront/js/catalog.js
 * (single source of truth for product rows until a DB is introduced).
 */
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../web/storefront/js/catalog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'server', 'data', 'products.json');

const json = `${JSON.stringify(PRODUCTS, null, 2)}\n`;
await writeFile(out, json, 'utf8');
console.log(`Wrote ${PRODUCTS.length} products to server/data/products.json`);
