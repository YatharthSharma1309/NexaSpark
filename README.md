# NexaSpark — storefront (India, INR)

Lean **static** marketplace UI: home, PLP with filters/sort, PDP, cart (`localStorage`). The old AWS Retail Demo Store tree was removed.

## Layout (web first, mobile second)

| Path | Purpose |
|------|---------|
| `web/storefront/` | HTML, `css/style.css`, `js/` — **primary** surface |
| `mobile/` | Reserved for a future app; see `mobile/README.md` |
| `tests/` | Smoke tests (`npm test`) |

## Run (web)

**Static only** (no `/api` — the storefront uses bundled `catalog.js` data):

```bash
npm run serve:web
```

Open http://127.0.0.1:8080 (use a local server — ES modules need `http`, not `file://`).

**Dev server** — catalog and **guest cart** over HTTP on one port (default 3000):

- `GET` / `PUT /api/cart` — in-memory cart per `nexaspark_sid` cookie; client syncs with `localStorage` when the cart page loads and after changes (see `cart.js`).
- `POST /api/orders` — demo order from JSON body `{ items: [{ id, qty }] }` (no payment); clears the server cart and appends the order to `server/data/orders.json` (gitignored, max 500 rows).
- `GET /api/orders/:orderId` — only for the same `nexaspark_sid` that placed the order. Use `order.html?id=...` after checkout.

```bash
npm run dev
```

Open http://127.0.0.1:3000 — `catalogApi.js` loads the catalog from the API with fallback to `catalog.js` if `/api` is missing. `npm run serve:web` has no API; the cart stays browser-only.

## Test

```bash
npm test
```

## Cursor agents

Project rules under `.cursor/rules/` define two roles only: **code tester** and **full-stack developer**. Remove any extra ad-hoc agent rule files you add locally so the team stays limited to those two.

## Next

- `server/data/products.json` is the API seed. After changing `web/storefront/js/catalog.js`, run `npm run sync:catalog` to refresh the JSON (until a DB is the source of truth).
- Persist guest carts in Redis/DB; add login and merge cart on the server.
- Replace `POST /api/orders` with paid checkout (Stripe, Razorpay, webhooks, idempotency).

## License

`LICENSE` may be from upstream; new storefront files are yours to license.
