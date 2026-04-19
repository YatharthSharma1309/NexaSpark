# NexaSpark — project blueprint, roadmap, and electronics plan

**Single document:** This file replaces `Project.md`, `plan.md`, and `ELECTRONICS_PLAN.md`. Treat it as the **canonical** product and delivery plan. Update it when scope or status changes, and commit with related work.

**Last updated:** 2026-04-19

**Repository note:** The tree may be **documentation-only** at times. Sections that reference `backend/`, `frontend/`, or CI assume code is present or restored (e.g. from Git history). Adjust verification steps if you are planning without a running codebase.

---

## 1. Vision and goals

**NexaSpark** is an e-commerce product: discover products, purchase securely, and share feedback through reviews and ratings. The aim is a trustworthy flow from discovery to delivery tracking.

**Goals**

- Responsive storefront (web first; mobile apps later per electronics plan).
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

Users can browse, search, filter, and sort; authenticate; use cart and checkout; see orders; post verified reviews; basic recommendations. Production deployment and monitoring are part of “done” for a launch-ready MVP.

**Blueprint review (gaps to watch)**

- Admin/inventory and order operations need explicit scope early.
- Taxes, shipping zones, returns — decide per target market.
- Security baseline and tests before treating payments as production-ready.

---

## 2. Reference architecture and roadmap (NexaSpark core)

This section summarizes the **intended** full-stack NexaSpark shape and phased roadmap. It aligns with historical `plan.md` Phase **A–E**.

### 2.1 Typical repository layout (when code exists)

- `backend/` — REST API, models, services, tests  
- `frontend/public/` — static storefront (or future SPA)  
- `.github/workflows/` — CI (e.g. `npm test` on backend)  
- Environment: `backend/.env` from `.env.example`; `README.md` for runbook  

### 2.2 Core capabilities (target)

**Backend:** Auth (signup/login, JWT), products (search, filters, pagination, detail, recommendations), cart, checkout (Stripe-compatible), orders, reviews, health check, validation and centralized errors.

**Frontend:** Listings with filters/sort/pagination, product detail, cart, checkout trigger, orders list, auth in UI.

**Quality:** Tests beyond smoke where feasible; CORS and helmet; rate limiting and real Stripe webhooks before production.

### 2.3 Known MVP limitations (address before serious launch)

No full admin UI; mock or simplified webhooks until verified; no email/password-reset unless built; guest cart may be limited; images often external URLs; logging/monitoring may be minimal until Phase A.

### 2.4 Roadmap phases (core product)

| Phase | Theme | Examples |
|--------|--------|--------|
| **A** — Production readiness | Docker Compose, rate limits, Stripe webhook verification, structured logging, deployment runbook |
| **B** — Admin and inventory | Admin RBAC, product CRUD, stock safety, order lifecycle tools |
| **C** — Trust and engagement | Email flows, wishlist, coupons, richer recommendations and reviews |
| **D** — Scale | Cache, search engine, queues, analytics |
| **E** — Frontend evolution | Optional React/Next, SEO, a11y, design system |

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
| **Part 1** | Web app (browser): storefront, account, cart, checkout | Phases **E-0 → E-2** required for electronics UX; **E-3**, **E-4** next; **E-5** optional |
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
| Current focus | **E-3** (admin/operations) after E-0–E-2 completion for the vertical |
| Last verification | 2026-04-19 (when codebase existed) |
| Blockers | _none / list_ |

### 4.1 Verification (when backend and frontend exist)

- `cd backend && npm test` — all tests green  
- `GET /api/health` — healthy response  
- `GET /api/products/compare?ids=<id1>,<id2>` — 2–4 ids; 400 if invalid count  
- Manual: signup → login → browse → cart → checkout; electronics PLP/PDP/compare as implemented  

---

## 5. Electronics phase checklists

### Phase E-0 — Taxonomy and seeds

| ID | Step | Done |
|----|------|------|
| E-0.1 | Category tree for launch | x |
| E-0.2 | Minimum spec keys per subcategory (Appendix) | x |
| E-0.3 | Seed strategy in decision log | x |
| E-0.4 | Seed data + `npm run seed` / documented path | x |

### Phase E-1 — Model and API

| ID | Step | Done |
|----|------|------|
| E-1.1 | Product fields: `sku`, `condition`, `specs`, warranty-related | x |
| E-1.2 | Validation for create/update (admin or future routes) | x |
| E-1.3 | Catalog filters on whitelisted spec keys | x |
| E-1.4 | `GET /api/products/compare?ids=` (max 4) + matrix | x |
| E-1.5 | Order line items snapshot SKU/specs for disputes | x |

### Phase E-2 — Web UX

| ID | Step | Done |
|----|------|------|
| E-2.1 | PLP spec chips/highlights | x |
| E-2.2 | PLP filters wired to API | x |
| E-2.3 | PDP spec table + SKU/warranty/model | x |
| E-2.4 | Compare 2–4 products (UI) | x |
| E-2.5 | Electronics-oriented copy/theme | x |

**Gate:** E-2 satisfied and cart/checkout still work end-to-end on web before Phase M.

### Phase E-3 — Operations (admin)

| ID | Step | Done |
|----|------|------|
| E-3.1 | Admin RBAC | |
| E-3.2 | Product CRUD + images | |
| E-3.3 | Stock + safe checkout | |
| E-3.4 | Order lifecycle visible to customer | |

### Phase E-4 — Production readiness (aligns with core Phase A)

| ID | Step | Done |
|----|------|------|
| E-4.1 | Docker Compose or host docs | |
| E-4.2 | Rate limiting auth + checkout | |
| E-4.3 | Stripe webhook verification + idempotent updates | |
| E-4.4 | Structured logging + correlation | |

### Phase M — React Native (after E-2 gate)

| ID | Step | Done |
|----|------|------|
| M-0.1 | Expo vs bare | |
| M-0.2 | App bootstrap + API base URLs | |
| M-1.1 | Auth + token storage | |
| M-1.2 | Catalog + PDP parity with API | |
| M-1.3 | Cart + checkout | |
| M-1.4 | Order history | |

### Phase M-2 — Store listing

Play Console and App Store Connect steps: signing, listings, screenshots, privacy/data safety, TestFlight, review, production API config. Treat official store docs as authoritative.

### Phase E-5 — Optional

Staff role, Meilisearch-class search, visual similarity — opt-in only.

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
| 2026-04-19 | §3.3 open decisions closed with MVP defaults (inventory mix, region via env, admin-only, Expo-first, legal URL pattern) |
| 2026-04-19 | Rebrand **NexaSpark**; blueprint file **`NexaSpark.md`** (formerly `ElexMart.md`) |
| 2026-04-19 | Merged three markdown files into one; repo may be docs-only |
| 2026-04-19 | Electronics E-0–E-2 implemented in codebase (historical); tests green when backend present |
| 2026-04-18 | Electronics plan split web/mobile; M-2 checklist added |

---

## 9. Plan-level version history

| Version | Summary |
|---------|---------|
| v0.1 | MVP scaffold: API, storefront, CI, docs |
| v0.2+ | Phase A production hardening |
| v0.3+ | Phase B admin |
| Later | Phases C–E and mobile |

---

*End of document.*
