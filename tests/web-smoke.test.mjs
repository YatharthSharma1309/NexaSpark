import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const web = join(root, "web", "storefront");

const required = [
  "index.html",
  "products.html",
  "product.html",
  "cart.html",
  "order.html",
  "404.html",
  "css/style.css",
  "js/catalog.js",
  "js/catalogApi.js",
  "js/nav.js",
  "js/cart.js",
  "js/order.js",
];

test("web storefront: required files exist", () => {
  for (const rel of required) {
    const p = join(web, rel);
    assert.ok(existsSync(p), `missing ${rel}`);
  }
});

test("web storefront: index references NexaSpark and stylesheet", () => {
  const html = readFileSync(join(web, "index.html"), "utf8");
  assert.match(html, /NexaSpark/);
  assert.match(html, /css\/style\.css/);
  assert.match(html, /js\/home\.js/);
});

test("web storefront: key pages load their module scripts", () => {
  const products = readFileSync(join(web, "products.html"), "utf8");
  const product = readFileSync(join(web, "product.html"), "utf8");
  const cart = readFileSync(join(web, "cart.html"), "utf8");
  assert.match(products, /js\/plp\.js/);
  assert.match(product, /js\/pdp\.js/);
  assert.match(cart, /js\/cart-page\.js/);
});

test("mobile: README exists (secondary track)", () => {
  assert.ok(existsSync(join(root, "mobile", "README.md")));
});

test("api: product seed JSON exists and is a non-empty array", () => {
  const p = join(root, "server", "data", "products.json");
  assert.ok(existsSync(p), "missing server/data/products.json");
  const data = JSON.parse(readFileSync(p, "utf8"));
  assert.ok(Array.isArray(data), "products.json must be an array");
  assert.ok(data.length > 0, "products.json must be non-empty");
  assert.equal(typeof data[0].id, "string");
});
