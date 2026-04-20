# NexaSpark — project blueprint, roadmap, and electronics plan

**Single document:** This file replaces `Project.md`, `plan.md`, and `ELECTRONICS_PLAN.md`. Treat it as the **canonical** product and delivery plan. Update it when scope or status changes, and commit with related work.

**Last updated:** 2026-04-20

**Repository note:** **`backend/`** ships the NexaSpark REST API (auth JWT + roles, catalog, cart, orders, reviews, compare, taxonomy, admin, Stripe Checkout + webhook, coupons, analytics hooks, taxonomy cache, text search, rate limits, structured request logs). **`frontend/public/`** is the static storefront + admin console. **`mobile/`** is the **Expo** Phase **M** client (same JSON API). **`docker-compose.yml`** runs **MongoDB + API**. CI: **`.github/workflows/ci.yml`**; dependency PRs: **`.github/dependabot.yml`**. Remote: **`https://github.com/YatharthSharma1309/NexaSpark`**. **Part 2 (React Native)** — `mobile/`: **feature-complete for in-repo Phase M** (auth, catalog, PDP with wishlist/reviews/recommendations, wishlist screen, cart, stub + Stripe, orders). **Phase M-2** (store accounts, EAS/release builds, listings) is **operator-run** — see §5 **M-2 checklist** (`mobile/eas.json` stub for EAS).

---

## 1. Vision and goals

**NexaSpark** is an e-commerce product: discover products, purchase securely, and share feedback through reviews and ratings. The aim is a trustworthy flow from discovery to delivery tracking.

**Goals**

- Responsive **web** storefront and **Expo** mobile app (same API).
- Fast discovery: search, filters, sort, structured specs where relevant.
- Cart and checkout with secure payments.
- Accounts with order history; verified-buyer reviews and recommendations.

**Target journey (summary)**

Browse → search/filter → product detail → cart → auth → checkout → track order → review → see recommendations.

**Suggested stack (baseline)**

| Layer | Choice |
|--------|--------|
| Web UI | HTML/CSS/JS first; optional later migration to React/Next |
| API | Node.js + Express |
| Data | MongoDB (Mongoose) |
| Auth | JWT |
| Payments | Stripe (test → production) |
| Mobile (Part 2) | React Native, same JSON API as web |

**MVP definition (product)**

Users can browse, search, filter, and sort; authenticate; use cart and checkout (with optional **coupon** validated server-side); see orders; post verified reviews; recommendations (incl. co-purchase signals). Production deployment and monitoring are part of “done” for a launch-ready MVP.

**Blueprint review (gaps to watch)**

- Admin UI is minimal but **RBAC + CRUD + orders/coupons/analytics** exist — extend UI only if ops need it.
- Taxes, shipping zones, returns — decide per target market.
- Security: enable **Dependabot** (repo), review PRs, and run tests before production payments.

---

## 2. Reference architecture and roadmap (NexaSpark core)

This section summarizes the **intended** full-stack NexaSpark shape and phased roadmap. It aligns with historical `plan.md` Phase **A–E**.

### 2.1 Typical repository layout (when code exists)

- `backend/` — REST API, models, services, tests  
- `frontend/public/` — static storefront (or future SPA)  
- `mobile/` — Expo (React Native) app  
- `.github/workflows/` — CI: backend tests + mobile `typecheck`; **Dependabot** for npm (backend, mobile) + Actions  
- Environment: `backend/.env` from `.env.example`; `README.md` for runbook  

### 2.2 Core capabilities (target)

**Backend:** Auth (signup/login, JWT), products (search — MongoDB `$text` with regex fallback, filters, pagination, detail, recommendations including co-purchase signals), cart, checkout (stub + Stripe), orders (line snapshots, optional `couponCode`), coupons (validate/redeem), wishlist, reviews (verified-buyer), compare, taxonomy (short-TTL cache), admin (products, orders, coupons, revenue summary), order notifications (`notifyOrderConfirmed` — log or SMTP), health check, validation and centralized errors.

**Frontend:** Listings with filters/sort/pagination, product detail, cart (incl. coupon field for checkout), checkout trigger, orders list, auth in UI, minimal admin console, baseline SEO/a11y on static pages.

**Mobile (`mobile/`):** Expo client — auth, catalog, **wishlist** (screen + PDP toggle), PDP **reviews** (read + post) + **recommendations**, cart, stub checkout, **Stripe** (app or web return URLs), orders; **store IDs** in `app.json` (`com.nexaspark.mobile`); CI typecheck in `.github/workflows/ci.yml`.

**Quality:** Tests beyond smoke where feasible; CORS and helmet; rate limiting and real Stripe webhooks before production.

### 2.3 Known MVP limitations (address before serious launch)

Admin UI is **minimal** (static `admin.html`); **Stripe** requires real keys + verified webhooks for production money movement; no email/password-reset unless built; guest cart is **not** implemented (auth required for cart); images are typically external URLs; observability is **request JSON logs + `X-Request-Id`** rather than a full APM stack.

### 2.4 Roadmap phases (core product)

| Phase | Theme | Examples |
|--------|--------|--------|
| **A** — Production readiness | Docker Compose, rate limits, Stripe webhook verification, structured logging, deployment runbook |
| **B** — Admin and inventory | Admin RBAC, product CRUD, stock safety, order lifecycle tools |
| **C** — Trust and engagement | Email flows, wishlist, coupons, richer recommendations and reviews |
| **D** — Scale | Cache, search engine, queues, analytics |
| **E** — Frontend evolution | Optional React/Next, SEO, a11y, design system |

**Implementation status (snapshot):** **A** and **B** are **complete**. Electronics **E-0–E-4** are **complete** (see §5). **C** and **D** are **complete for the thin-slice scope** defined in **§5.6** (not full marketing automation, queues, or Meilisearch). **E** React/Next migration remains **optional** (E-5); static **SEO + a11y baseline** is **done** (E-2.6). **Phase M** (**M-0.1–M-1.5**) is **complete in repo**; **M-2** is **outside the codebase** (store console work — §5).

**Next-sprint style priorities (when implementing Phase A)**

1. Containerized local stack + Mongo  
2. Rate limits on auth and checkout  
3. Verified Stripe webhooks + idempotent order updates  
4. Structured logging + request IDs  
5. More API integration tests  
6. Deployment documentation  

### 2.5 Risks (short)

Payment correctness (never trust client amounts; verify webhooks). Stock (atomic updates / reservations). Security (audit, Dependabot). Scope (finish phases in thin slices).

---

## 3. Electronics vertical — strategy (web + app stores)

Large marketplaces (e.g. Amazon, Flipkart, Myntra) inform **patterns**, not a clone: search, faceted PLP, spec-rich PDP, compare, trust content. **Do not** assume scale, Prime-like programs, COD, or regional compliance until decided.

### 3.1 Two-part delivery

| Part | Deliverable | Notes |
|------|-------------|--------|
| **Part 1** | Web app (browser): storefront, account, cart, checkout | Phases **E-0 → E-4** **done** in tree; **E-5** optional (e.g. Meilisearch-class search) |
| **Part 2** | **React Native** apps for **Google Play** and **Apple App Store** | Same REST API as web. Phases **M**, **M-2**. Start after **E-2 web gate** unless reprioritized |

**Shared platform:** One backend (Express + MongoDB + Stripe pattern). HTTPS, JSON, JWT. Avoid divergent business rules per client unless logged in the decision log.

### 3.2 Confirmed decisions

| Topic | Decision |
|--------|-----------|
| Customer-facing brand | **NexaSpark** |
| Progress tracking | This document (`NexaSpark.md`), git-tracked |
| Split | Part 1 web first; Part 2 React Native for Play + App Store |
| Mobile stack | React Native + JSON/REST |
| Compare UX (web) | **Modal** (not a dedicated `/compare` route for MVP) |

### 3.3 Resolved for MVP (defaults — revise before production launch)

These unblock implementation; replace with market-specific choices when you pick a launch country.

| Topic | MVP resolution |
|--------|----------------|
| **Inventory** | Catalog supports **`new`**, **`refurbished`**, and **`open_box`** (`condition` on products). Merchants can list any mix; marketing copy can emphasize new-only SKUs without schema changes. |
| **Target region** | **Configurable at deploy time:** use env (e.g. `DEFAULT_COUNTRY`, `DEFAULT_CURRENCY`, optional `LOCALE`). Default example in `.env.example`: **IN** / **INR** / `en-IN`. Plugs, voltage, returns, and tax lines stay **TBD in copy** until a single launch market is chosen. |
| **Roles (fulfillment)** | **Admin-only** for MVP (one admin role, order/product management). A separate **staff** role is optional (Phase E-5). |
| **Expo vs bare React Native** | **Expo by default** when Phase M starts; revisit only if a dependency requires a bare workflow. |
| **Legal / policy URLs** | Web serves placeholder routes **`/privacy`** and **`/terms`**; production uses real URLs via env (`PRIVACY_POLICY_URL`, `TERMS_OF_SERVICE_URL`) in footer and store listings. |
| **App store accounts** | **Google Play** and **Apple App Store** developer accounts and listings are handled in Phase **M-2**; not required for web MVP. |

### 3.4 Still open before production (non-blocking for local dev)

- Final launch **country** and registered **business entity** for payments and tax.
- Exact **returns** and **warranty** policy text per jurisdiction.
- **COD** or region-specific payment methods if required (out of scope unless added explicitly).

---

## 4. Electronics progress dashboard

| Field | Value |
|--------|--------|
| Current focus | **Launch hardening** — HTTPS deploy, real Stripe + webhooks, monitoring, market copy; **M-2** when you open store accounts |
| Last verification | **2026-04-19** — `cd backend && npm test` green; `cd mobile && npm run typecheck` green (matches CI); Docker Compose present |
| Blockers | _none_ |

### 4.0 Foundation status (cross-cutting)

| Item | Status |
|------|--------|
| Repo layout (`backend/`, `frontend/public/`, `mobile/`, CI, Dependabot, `README`, `.env.example`, `docker-compose.yml`) | **Done** |
| GitHub remote + `main` pushed | **Done** (verify on your clone) |
| Core MVP API (§2.2: auth, products, cart, orders, reviews, recommendations, compare, wishlist) | **Done** |
| Phase **C** themes (thin slice — §5.6) | **Done** (in-repo scope; not full ESP / password-reset) |
| Phase **D** themes (thin slice — §5.6) | **Done** (in-repo scope; no separate search cluster) |
| Core Phase **A** (Docker Compose, rate limits, Stripe webhook verification, structured logs, runbook) | **Done** (see README; production tuning still on you) |
| Core Phase **B** (admin RBAC, inventory CRUD, order tools) | **Done** (folded into electronics **E-3** + `/api/admin`) |
| Electronics **E-0 → E-2** (vertical catalog + UX) | **Done** |
| Electronics **E-3** (admin + lifecycle) | **Done** |
| Electronics **E-4** (prod alignment) | **Done** (Stripe optional; webhook idempotency via `ProcessedStripeEvent`) |
| Electronics **M** (React Native) | **Done (M-0–M-1.5 in repo)** — see §5; **M-2** operator checklist only |

### 4.1 Verification (when backend and frontend exist)

- `cd backend && npm test` — all tests green  
- `cd mobile && npm run typecheck` — TypeScript clean (same as CI)  
- `GET /api/health` — healthy response  
- `GET /api/products/compare?ids=<id1>,<id2>` — 2–4 ids; 400 if invalid count  
- `GET /api/admin/analytics/summary`, `GET/POST /api/admin/coupons` — admin auth  
- Manual: signup → login → browse → cart → optional coupon → stub or Stripe checkout; PLP/PDP/compare; admin coupons + analytics  
- Mobile: wishlist, PDP reviews + recommendations, orders, Stripe (app or web return)  

---

## 5. Electronics phase checklists

### Phase E-0 — Taxonomy and seeds

| ID | Step | Done |
|----|------|------|
| E-0.1 | Category tree for launch | **Yes** — `GET /api/taxonomy` + `backend/src/constants/taxonomy.js` |
| E-0.2 | Minimum spec keys per subcategory (Appendix) | **Yes** |
| E-0.3 | Seed strategy in decision log | **Yes** — electronics-focused demo SKUs |
| E-0.4 | Seed data + `npm run seed` / documented path | **Yes** — optional `SEED_ADMIN_*` |

### Phase E-1 — Model and API

| ID | Step | Done |
|----|------|------|
| E-1.1 | Product fields: `sku`, `condition`, `specs`, warranty-related | **Yes** |
| E-1.2 | Validation for create/update (admin or future routes) | **Yes** — admin routes + taxonomy spec validation |
| E-1.3 | Catalog filters on whitelisted spec keys | **Yes** — `specKey` + `specValue` |
| E-1.4 | `GET /api/products/compare?ids=` (max 4) + matrix | **Yes** |
| E-1.5 | Order line items snapshot SKU/specs for disputes | **Yes** |

### Phase E-2 — Web UX

| ID | Step | Done |
|----|------|------|
| E-2.1 | PLP spec chips/highlights | **Yes** |
| E-2.2 | PLP filters wired to API | **Yes** |
| E-2.3 | PDP spec table + SKU/warranty/model | **Yes** |
| E-2.4 | Compare 2–4 products (UI) | **Yes** — modal |
| E-2.5 | Electronics-oriented copy/theme | **Yes** — NexaSpark styling + storefront copy |
| E-2.6 | Baseline SEO + a11y (meta description, skip link, focus-visible) | **Yes** — public HTML pages |

**Gate:** E-2 satisfied and cart/checkout still work end-to-end on web before Phase M.

### Phase E-3 — Operations (admin)

| ID | Step | Done |
|----|------|------|
| E-3.1 | Admin RBAC | **Yes** — `User.role`, JWT claim, `/api/admin/*` |
| E-3.2 | Product CRUD + images | **Yes** (images via URL array; CRUD in API + `admin.html`) |
| E-3.3 | Stock + safe checkout | **Yes** — atomic stock decrement; Stripe defers decrement until webhook |
| E-3.4 | Order lifecycle visible to customer | **Yes** — statuses on orders + admin PATCH |
| E-3.5 | Coupons + revenue summary (admin) | **Yes** — `/api/admin/coupons`, `/api/admin/analytics/summary` + `admin.html` |

### Phase E-4 — Production readiness (aligns with core Phase A)

| ID | Step | Done |
|----|------|------|
| E-4.1 | Docker Compose or host docs | **Yes** — `docker-compose.yml` + README |
| E-4.2 | Rate limiting auth + checkout | **Yes** — `express-rate-limit` (skipped in `NODE_ENV=test`) |
| E-4.3 | Stripe webhook verification + idempotent updates | **Yes** — raw body route + `ProcessedStripeEvent` |
| E-4.4 | Structured logging + correlation | **Yes** — JSON lines + `X-Request-Id` |

### Phase M — React Native (after E-2 gate)

| ID | Step | Done |
|----|------|------|
| M-0.1 | Expo vs bare | **Yes** — Expo in `mobile/` |
| M-0.2 | App bootstrap + API base URLs | **Yes** — `EXPO_PUBLIC_API_BASE`, shared `src/lib/api.ts`, React Navigation shell |
| M-1.1 | Auth + token storage | **Yes** — login/signup + `expo-secure-store` session |
| M-1.2 | Catalog + PDP parity with API | **Yes** — product list/search, detail, add to cart |
| M-1.3 | Cart + checkout | **Yes** — stub `POST /api/orders` + **Stripe** session: **app** return (`nexaspark://…`, `openAuthSessionAsync`) or **web** return (`CLIENT_ORIGIN/orders.html`; LAN on device) |
| M-1.4 | Order history | **Yes** — `GET /api/orders` list screen |
| M-1.5 | Wishlist + trust on PDP | **Yes** — wishlist screen + toggle; reviews (list + post); co-purchase recommendations |

### Phase M-2 — Store listing (operator checklist; not automated in repo)

Official Play / App Store docs are authoritative. Use this as a **tracking list** only.

| Step | Notes |
|------|--------|
| Apple Developer Program + App Store Connect app record | Paid membership; bundle ID must match release (`com.nexaspark.mobile` template in `mobile/app.json`) |
| Google Play Console + app | Create app; package name matches `mobile/app.json` `android.package` |
| Signing & release builds | EAS Build (`eas build` — profiles in `mobile/eas.json`) or local `expo prebuild` + native toolchain; upload AAB/IPA |
| Icons, screenshots, short/long description | Store listings per platform guidelines |
| Privacy policy & data safety | URLs and forms; align with real `PRIVACY_POLICY_URL` / API behavior |
| Production API | HTTPS, `EXPO_PUBLIC_API_BASE`, CORS / `CLIENT_ORIGIN`, Stripe live keys + webhooks |
| Internal / closed testing | TestFlight, Play internal track before production rollout |

**Repo deliverable for M-2:** identifiers in `app.json`, documented env patterns — **not** store submissions.

### Phase E-5 — Optional (explicitly out of repo MVP)

Staff role, Meilisearch-class search, visual similarity — **not implemented**; add only if product requires.

### Phase C–D — Trust, engagement, scale (thin slices in repo)

_Map to core roadmap **C** and **D** without implying full marketing suites, job runners, or Elasticsearch-class infra._

| Theme | Delivered (code) | Explicitly not in scope (yet) |
|--------|------------------|-------------------------------|
| **C — Trust / engagement** | Coupons (`Coupon` model, admin API + UI, storefront field, Stripe + stub); `notifyOrderConfirmed` (JSON log or SMTP); co-purchase–based recommendations; wishlist; verified-buyer reviews | Drip campaigns, password reset email, rich template library |
| **D — Scale / insight** | MongoDB text index + `$text` search (regex fallback); taxonomy response cache (~60s TTL); `GET /api/admin/analytics/summary` (revenue by currency, top SKUs, status counts) | Message queues, separate search service, streaming analytics |

---

## 6. Appendix — Electronics category and spec keys

**Top-level category:** `Electronics`.

| Subcategory | Spec keys (`Product.specs`) |
|-------------|-----------------------------|
| Laptops | `cpu`, `ramGb`, `storageGb`, `screenInches`, `os` |
| Smartphones | `storageGb`, `ramGb`, `screenInches`, `batteryMah`, `os` |
| Audio | `connectivity`, `batteryHours`, `noiseCancelling` |
| Wearables | `connectivity`, `batteryDays`, `waterResistance` |

**Also:** `sku`, `modelName`, `condition` (`new` | `refurbished` | `open_box`), `warrantyMonths`, `subcategory`. When code exists, keep taxonomy aligned with the taxonomy module under `backend/src/constants/` (or equivalent).

---

## 7. Decision log

_Newest first._

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-19 | **Repo automation:** Dependabot (npm backend/mobile + GitHub Actions); `mobile/eas.json` for EAS; `npm run typecheck`; README/NexaSpark copy aligned with shipped mobile features | Post–v1.0 hygiene |
| 2026-04-19 | **In-repo plan closure:** Phase **M-1.5** (mobile wishlist, reviews, recommendations), **M-2** framed as operator checklist; **C/D** marked done for §5.6 scope; CI **mobile** job; `app.json` bundle IDs | E-5 & full M-2 remain optional / external |
| 2026-04-19 | **Stripe mobile return:** `POST /api/stripe/checkout-session` accepts `checkoutReturn: "app"` → default `nexaspark://checkout/success?session_id={CHECKOUT_SESSION_ID}` (override `STRIPE_APP_*` in `.env`); cart uses `openAuthSessionAsync` + `Linking.createURL` | Avoids LAN static site for native builds; Expo Go may still use web return |
| 2026-04-19 | **Phase M scaffold:** `mobile/` Expo TypeScript app; **`EXPO_PUBLIC_API_BASE`** for device API reachability | Same API as web; screens TBD |
| 2026-04-19 | **Mobile Stripe (browser):** `expo-web-browser` + phone-reachable `CLIENT_ORIGIN` for web success path | Supplemented by app-scheme return above |
| 2026-04-19 | **Phase M (app screens):** Expo app — React Navigation, auth (SecureStore), catalog/search, PDP + cart, stub checkout + coupon, orders list | Extended with Stripe browser checkout |
| 2026-04-19 | **Plan refresh:** §2.2/§2.4/§3.1/§4.0/§4.1 and new **§5.6** document Phase **C–D thin slices** vs deferred work; Part 1 marked **E-0–E-4 done** | Blueprint matches shipped code |
| 2026-04-19 | **Thin slices — Phase C/D:** coupons + order emails (log or SMTP), co-purchase recommendations, Mongo text search + taxonomy TTL cache, admin analytics summary | Engagement and observability without a separate search cluster |
| 2026-04-19 | **Phase E (partial):** storefront meta description + skip link + `:focus-visible` on public pages | SEO/a11y baseline on static HTML |
| 2026-04-19 | **Web MVP (E-0–E-4) marked complete** in §5; **Phase M** … after scaffold | **Superseded** — Phase M in-repo complete (v1.0) |
| 2026-04-19 | **Stub checkout** (`POST /api/orders`) marks orders **paid** immediately; **Stripe** uses `awaiting_payment` until webhook | Preserve a zero-Stripe local demo while keeping production-shaped payment state |
| 2026-04-19 | GitHub repo **`YatharthSharma1309/NexaSpark`**; blueprint tracks phased delivery in §4–5 | Single remote + single plan file |
| 2026-04-19 | Resolve §3.3 MVP defaults: all three **condition** values; deploy-time region/currency; admin-only; Expo-first for M; modal compare; env-based legal URLs | Unblock implementation while keeping production legal/tax choices explicit later |
| 2026-04-19 | Rebrand **Elex Mart** → **NexaSpark**; canonical blueprint **`NexaSpark.md`** | Branding |
| 2026-04-19 | Consolidate `Project.md`, `plan.md`, `ELECTRONICS_PLAN.md` into `NexaSpark.md` | Single source of truth; easier maintenance |
| 2026-04-19 | Order lines snapshot `sku`, `modelName`, `specsSnapshot` at checkout | Disputes and support |
| 2026-04-19 | Compare on web via modal + compare API | Ship quickly on static web |
| 2026-04-19 | Electronics seed strategy: electronics-focused catalog | Clearer demo |
| 2026-04-18 | Part 1 web; Part 2 React Native for stores | Standard marketplace pattern |
| 2026-04-18 | Track electronics progress in dedicated plan file | Now superseded by this doc |

---

## 8. Session log

_Newest first._

| Date | Notes |
|------|--------|
| 2026-04-19 | **v1.0.2:** `credentials.json` in `mobile/.gitignore`; §4.0/§4.1 + README local verify commands (`npm run typecheck`). |
| 2026-04-19 | **v1.0.1 hygiene:** Dependabot, `mobile/eas.json`, mobile `typecheck` script, CI uses `npm run typecheck`, README + blueprint alignment. |
| 2026-04-19 | **Plan v1.0 (in-repo):** mobile wishlist screen + PDP wishlist/reviews/recs; CI `mobile` job; `com.nexaspark.mobile` in `app.json`; **NexaSpark.md** M-2 checklist + status refresh (includes prior Stripe app-return work). |
| 2026-04-19 | **Plan:** `NexaSpark.md` §5.6 + dashboard rows for Phase C/D status; verification bullets for admin analytics/coupons. |
| 2026-04-19 | **Phase C/D (API + UI):** coupons (`SAVE10` seed), stub + Stripe `couponCode`, admin coupons CRUD-ish UI, `notifyOrderConfirmed` (SMTP optional), co-purchase recommendations, text search + taxonomy cache, admin analytics JSON + admin panel block; storefront cart coupon field. |
| 2026-04-19 | **Phase E (a11y/SEO):** `<meta name="description">`, skip-to-main, focus-visible rings on interactive controls across public HTML. |
| 2026-04-19 | **Phase M:** Expo app generated under `mobile/`; README + `.env.example` for API base. |
| 2026-04-19 | **Phase C (partial):** server-side **verified purchase** on reviews; **wishlist** API + `wishlist.html` + PLP/PDP controls. |
| 2026-04-19 | **Web MVP completion pass:** admin API + `admin.html`, order lifecycle, Stripe Checkout + idempotent webhooks, rate limits, request logs, Docker Compose, spec filters, README/runbook updates; §4/§5 marked **done** through E-4. |
| 2026-04-19 | §4 dashboard + E-0–E-2 checklists updated: foundation/scaffold **done**; next **core MVP API** then **E-0**; GitHub **NexaSpark** |
| 2026-04-19 | §3.3 open decisions closed with MVP defaults (inventory mix, region via env, admin-only, Expo-first, legal URL pattern) |
| 2026-04-19 | Rebrand **NexaSpark**; blueprint file **`NexaSpark.md`** (formerly `ElexMart.md`) |
| 2026-04-19 | Merged three markdown files into one; repo may be docs-only |
| 2026-04-19 | Scaffold: backend health + tests + CI; frontend static shell; prior full electronics stack superseded by reset—see §4.0 |
| 2026-04-18 | Electronics plan split web/mobile; M-2 checklist added |

---

## 9. Plan-level version history

| Version | Summary |
|---------|---------|
| v0.1 | MVP scaffold: API, storefront, CI, docs |
| v0.2 | Phase A/E-4: Docker, rate limits, Stripe webhooks, structured logs |
| v0.3 | Phase B/E-3: Admin RBAC, product CRUD, order lifecycle |
| v0.4 | Web MVP (E-0–E-2 + storefront/admin UI) marked complete in §5 |
| v0.5 | Coupons, notifications (log/SMTP), search/cache/recommendations/analytics (thin); admin + storefront wiring; Expo scaffold; a11y/SEO pass on static pages |
| v0.6 | Plan doc: §2.2/§2.4/§3.1/§4 refreshed; **§5.6** Phase C–D thin-slice matrix vs deferred scope |
| v0.7 | Mobile: Phase M core flows (auth, catalog, PDP, stub checkout, orders); Stripe-in-app still open |
| v0.8 | Mobile: Stripe Checkout via `expo-web-browser`; backend `.env.example` + README guidance for LAN `CLIENT_ORIGIN` on device |
| v0.9 | Stripe `checkoutReturn=app` + `nexaspark://` defaults; `expo-linking`; cart UI for app vs web return |
| v1.0 | **In-repo roadmap complete:** M-1.5 mobile parity; M-2 operator checklist; C/D thin slices “done”; CI mobile typecheck; store bundle IDs |
| v1.0.1 | Dependabot; `eas.json`; mobile `typecheck` script; doc/CI consistency pass |
| v1.0.2 | EAS credential ignore; dashboard + README verification commands aligned with CI |
| Beyond repo | Execute **M-2** in Play / App Store consoles; optional **E-5** (Meilisearch, staff role) if needed |

---

*End of document.*
