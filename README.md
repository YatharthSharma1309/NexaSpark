# NexaSpark

Electronics-focused ecommerce (canonical blueprint: [NexaSpark.md](./NexaSpark.md)).

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** locally, Docker Compose, or Atlas (connection string)

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | REST API (Express, Mongoose) |
| `frontend/public/` | Static storefront + admin console |
| `mobile/` | Expo (React Native) app — same JSON API as web |
| `docker-compose.yml` | MongoDB + API containers |
| `.github/workflows/` | CI — backend tests + **mobile** `typecheck` |
| `.github/dependabot.yml` | Weekly npm updates (`backend/`, `mobile/`); monthly Actions |

## Quick start (local Node)

### 1. Backend API

```bash
cd backend
cp .env.example .env
```

Edit `.env`: set `JWT_SECRET`, `MONGODB_URI`, and `CLIENT_ORIGIN` (must match the static site origin, e.g. `http://127.0.0.1:8080`). Optional: `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` for an admin account when seeding.

```bash
npm install
npm run dev
```

- API base: `http://127.0.0.1:4000` (unless `PORT` is set)  
- Health: `GET /api/health`  
- Taxonomy: `GET /api/taxonomy`  
- Wishlist (auth): `GET /api/wishlist`, `PUT /api/wishlist` with `{ "items": [{ "productId": "..." }] }`

```bash
npm test
```

### 2. Seed demo data (optional)

With MongoDB running:

```bash
cd backend
npm run seed
```

### 3. Frontend (static)

```bash
npx --yes serve frontend/public -p 8080
```

Open `http://127.0.0.1:8080`. The **Admin** link appears when signed in as an admin. Admin console: `http://127.0.0.1:8080/admin.html`.

## Docker Compose

From the repo root (set a strong `JWT_SECRET` in your environment or an `.env` file read by Compose):

```bash
docker compose up --build
```

API listens on **4000**, MongoDB on **27017**. Point `CLIENT_ORIGIN` at wherever you host the static UI.

## Stripe (test or live)

1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `backend/.env`.  
2. Expose `POST /api/webhooks/stripe` publicly (Stripe CLI `listen` or your reverse proxy). The route uses the **raw** body for signature verification.  
3. In the storefront, use **Pay with Stripe** after signing in. Checkout creates an `awaiting_payment` order; the webhook marks it **paid**, decrements stock, and clears the cart. Optional **coupon** on carts is sent as `couponCode` (validated server-side). **Mobile** can request `checkoutReturn: "app"` so success/cancel use **`nexaspark://`** URLs (see `backend/.env.example` and `mobile/app.json` `scheme`); otherwise the session uses **`CLIENT_ORIGIN`** (use a LAN-reachable static origin on a real device, not only `127.0.0.1`).  
4. **Stub checkout** (`Complete order (stub)`) remains for demos without Stripe and marks orders **paid** immediately.

## Operations

- **Request correlation:** every response includes `X-Request-Id`; the API logs one JSON line per request (method, path, status, duration).  
- **Rate limits:** authentication and checkout endpoints are limited in production mode (`express-rate-limit`; disabled when `NODE_ENV=test`).  
- **Admin API:** `GET/POST /api/admin/products`, `PUT/DELETE /api/admin/products/:id`, `GET /api/admin/orders`, `PATCH /api/admin/orders/:id`, `GET/POST /api/admin/coupons`, `PATCH /api/admin/coupons/:id`, `GET /api/admin/analytics/summary` — requires `User.role === 'admin'` (bootstrap via seed env vars).
- **Order emails:** configure SMTP in `.env` (see `.env.example`); without it, confirmations are logged as JSON only.

## Environment variables

Copy from `backend/.env.example`. Important keys:

- `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`  
- `DEFAULT_COUNTRY`, `DEFAULT_CURRENCY`, `LOCALE`  
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (optional); optional **`STRIPE_APP_SUCCESS_URL`** / **`STRIPE_APP_CANCEL_URL`** when overriding native return URLs  
- `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (optional seed)  
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional — order notifications)

## Mobile (Expo scaffold)

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_BASE` when you need a device or emulator to reach your machine (see `mobile/README.md`). The app includes auth, catalog, cart, **stub checkout**, **Stripe** (**return to app** via `nexaspark://` or **web success page** via `CLIENT_ORIGIN`), and orders.

## CI

GitHub Actions runs **`backend`**: `npm ci` and `npm test` (`NODE_ENV=test`), and **`mobile`**: `npm ci` and **`npm run typecheck`**, on push and pull requests to `main` / `master`. **Dependabot** opens weekly PRs for `backend/` and `mobile/` npm dependencies (see `.github/dependabot.yml`).

**Verify locally (same as CI):**

```bash
cd backend && npm test
cd ../mobile && npm run typecheck
```
