# NexaSpark — storefront (India, INR)

Lean **static** marketplace UI: home, PLP with filters/sort, PDP, cart (`localStorage`). The old AWS Retail Demo Store tree was removed.

## Layout (web first, mobile second)

| Path | Purpose |
|------|---------|
| `web/storefront/` | HTML, `css/style.css`, `js/` — **primary** surface |
| `mobile/` | Reserved for a future app; see `mobile/README.md` |
| `tests/` | Smoke tests (`npm test`) |

## Run (web)

### Full stack (recommended)

```bash
npm run dev
```

**Base URL:** http://127.0.0.1:3000/ (override with `PORT=4000` on Unix or `set PORT=4000` on Windows).

Same origin serves static HTML/CSS/JS and `/api/*`, so `catalogApi.js` hits the live product list, `cart.js` can sync the guest cart cookie, and checkout can `POST /api/orders`.

**Static only** (no `/api` — the storefront falls back to bundled `catalog.js`; cart stays browser-only):

```bash
npm run serve:web
```

Open http://127.0.0.1:8080 (use a local server — ES modules need `http`, not `file://`).

### Dev server APIs (port 3000 by default)

- `GET` / `PUT /api/cart` — in-memory cart per `nexaspark_sid` cookie; client syncs with `localStorage` when the cart page loads and after changes (see `cart.js`).
- `POST /api/orders` — demo order from JSON body `{ items: [{ id, qty }] }` (no payment); clears the server cart and appends the order to `server/data/orders.json` (gitignored, max 500 rows).
- `GET /api/orders/mine` — recent demo orders for the current `nexaspark_sid` (used by `account.html`).
- `GET /api/orders/:orderId` — only for the same `nexaspark_sid` that placed the order. Use `order.html?id=...` after checkout.

`catalogApi.js` loads from `/api/products` when present, else from `catalog.js`.

## Test

```bash
npm test
```

Runs file smoke checks plus a short **live dev-server** smoke (starts `server/index.mjs` on port **3099**, hits `/api/health`, main HTML routes, and the first local product image). Override with `NEXASPARK_TEST_PORT` if needed.

### Manual smoke (after `npm run dev` on port 3000)

1. Home: http://127.0.0.1:3000/
2. PLP: http://127.0.0.1:3000/products.html
3. PDP: http://127.0.0.1:3000/product.html?id=p1
4. Cart: add from PDP, open http://127.0.0.1:3000/cart.html
5. Order demo: click checkout on cart → should land on `order.html?id=NS-...` when API is up (otherwise an alert explains static-only mode)

### Catalog vs API seed

After editing `web/storefront/js/catalog.js`, run:

```bash
npm run sync:catalog
```

so `server/data/products.json` matches (source of truth for the API until you add a database).

## Intentional non-goals (demo scope)

- **No real payments** — `POST /api/orders` creates a demo order only (see server comment).
- **No accounts** — guest session is a long-lived `nexaspark_sid` cookie; `account.html` lists demo orders for that cookie only.
- **Cart persistence** — server cart is in-memory (see `server/cartState.mjs`); restarting the process clears it (localStorage still holds the client cart).
- **Production hardening** — add rate limits, auth, PCI-compliant checkout, and durable cart/order storage before going live.

## Cursor agents

Project rules under `.cursor/rules/` define two roles only: **code tester** and **full-stack developer**. Remove any extra ad-hoc agent rule files you add locally so the team stays limited to those two.

## Next

- Persist guest carts in Redis/DB; add login and merge cart on the server.
- Replace `POST /api/orders` with paid checkout (Stripe, Razorpay, webhooks, idempotency).

## License

`LICENSE` may be from upstream; new storefront files are yours to license.
