import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, 'data', 'orders.json');

const MAX_ORDERS = 500;

/**
 * @param {object} record
 * @param {string} record.orderId
 * @param {string} [record.guestId]
 */
export function appendOrder(record) {
  mkdirSync(dirname(path), { recursive: true });
  let all = [];
  try {
    all = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code !== 'ENOENT') throw e;
  }
  if (!Array.isArray(all)) all = [];
  all.push({ ...record, at: new Date().toISOString() });
  if (all.length > MAX_ORDERS) all = all.slice(-MAX_ORDERS);
  writeFileSync(path, JSON.stringify(all, null, 2) + '\n', 'utf8');
}

/**
 * @param {string} orderId
 * @returns {object | null}
 */
export function getOrderById(orderId) {
  try {
    const all = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(all)) return null;
    return all.find((o) => o.orderId === orderId) || null;
  } catch (e) {
    if (/** @type {NodeJS.ErrnoException} */ (e).code === 'ENOENT') return null;
    throw e;
  }
}
