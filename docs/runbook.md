# NexaSpark — operations runbook

Use this as an operator checklist. It is **not** legal or tax advice.

## 1. Production API

1. Run the Node API on a host that supports **Node 18+**, **HTTPS**, and a **public** URL for `POST /api/webhooks/stripe`.
2. Set **`MONGODB_URI`** (Atlas or self-hosted with TLS).
3. Set **`JWT_SECRET`** to a long random value (unique per environment).
4. Set **`CLIENT_ORIGIN`** to the **exact** browser origin of the static storefront (scheme + host + port if any), e.g. `https://yatharthsharma1309.github.io` or your custom domain.
5. Optional storefront vars exposed at `GET /api/public/config`: **`PRIVACY_POLICY_URL`**, **`TERMS_OF_SERVICE_URL`**, **`SUPPORT_URL`**, **`SUPPORT_EMAIL`**, **`DEFAULT_*`**, **`LOCALE`**.

## 2. Static storefront (GitHub Pages)

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. Optional **Actions variables**: `PUBLIC_API_BASE_URL` (HTTPS API origin), `PAGES_BASE_PREFIX` (`/` for root site; leave unset for `/<repo>/`).
3. After deploy, confirm the site loads assets and API calls succeed (check browser network tab and CORS).

## 3. Stripe

1. Use **test** keys until checkout and webhooks are verified end-to-end.
2. Configure Stripe Dashboard webhook to **`https://<api-host>/api/webhooks/stripe`** with **`STRIPE_WEBHOOK_SECRET`** from the CLI or dashboard.
3. Only then consider **live** keys; document who approved go-live.

## 4. Email (order notifications)

1. Set **`SMTP_*`** in `backend/.env` (see `.env.example`).
2. Without SMTP, confirmations remain **structured logs** only.

## 5. MongoDB backups

1. **Atlas:** enable **cloud backup** and test a **restore** to a staging cluster yearly (or per your policy).
2. **Self-hosted:** schedule `mongodump` (or volume snapshots) and store off-site; run a **restore drill** on a non-production host.
3. Keep a one-page note: **who** restores, **where** backups live, **RPO/RTO** targets.

## 6. Incident debugging

1. Read API logs (JSON lines); correlate with **`X-Request-Id`** from the client response header.
2. Reproduce with **Stripe test** mode and the same cart/order flow.
