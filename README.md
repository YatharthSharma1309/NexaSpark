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

**Dev server** — read-only `GET /api/products` and `GET /api/products/:id` plus the same static UI on one port (default 3000):

```bash
npm run dev
```

Open http://127.0.0.1:3000 — `catalogApi.js` loads the catalog from the API with fallback to `catalog.js` if `/api` is missing.

## Test

```bash
npm test
```

## Cursor agents

Project rules under `.cursor/rules/` define two roles only: **code tester** and **full-stack developer**. Remove any extra ad-hoc agent rule files you add locally so the team stays limited to those two.

## Next

- `server/data/products.json` is the API seed. After changing `web/storefront/js/catalog.js`, run `npm run sync:catalog` to refresh the JSON (until a DB is the source of truth).
- Replace demo checkout alert in `cart-page.js` with real payments (Stripe, Razorpay, etc.).

## License

`LICENSE` may be from upstream; new storefront files are yours to license.
