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
  "404.html",
  "css/style.css",
  "js/catalog.js",
  "js/nav.js",
  "js/cart.js",
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
});

test("mobile: README exists (secondary track)", () => {
  assert.ok(existsSync(join(root, "mobile", "README.md")));
});
