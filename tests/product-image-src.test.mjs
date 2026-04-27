import assert from 'node:assert/strict';
import test from 'node:test';
import { productImageSrc, pexelsCatalogImageUrl } from '../web/storefront/js/catalog.js';

test('productImageSrc: document-relative paths (root and subpath deploys)', () => {
  assert.equal(productImageSrc('images/products/p1.jpg'), 'images/products/p1.jpg');
  assert.equal(productImageSrc('/images/products/p2.jpg'), 'images/products/p2.jpg');
});

test('productImageSrc: remote and data URLs unchanged', () => {
  assert.equal(productImageSrc('https://example.com/x.jpg'), 'https://example.com/x.jpg');
  assert.equal(productImageSrc('data:image/png;base64,xx'), 'data:image/png;base64,xx');
});

test('pexelsCatalogImageUrl: stable CDN path for p1', () => {
  assert.match(
    pexelsCatalogImageUrl('p1'),
    /^https:\/\/images\.pexels\.com\/photos\/9890196\/pexels-photo-9890196\.jpeg\?/,
  );
  assert.equal(pexelsCatalogImageUrl(''), '');
});
