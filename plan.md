# ShopSphere - Project Plan

This document captures the current state of the **ShopSphere** e-commerce project and the planned roadmap for upcoming work. It complements `Project.md` (the original blueprint) and `README.md` (setup/usage), but focuses specifically on planning, status tracking, and forward direction.

Repository: https://github.com/YatharthSharma1309/shopsphere

---

## 1. Project Snapshot

- Project name: **ShopSphere**
- Type: Full-stack e-commerce MVP
- Stack: Node.js + Express, MongoDB (Mongoose), HTML/CSS/JavaScript, JWT auth, Stripe-compatible payment service
- Repository structure:
  - `backend/` - REST API and business logic
  - `frontend/public/` - storefront UI (HTML/CSS/JS)
  - `.github/workflows/` - CI configuration
  - `Project.md`, `README.md`, `plan.md` - documentation

---

## 2. Current Situation (What Is Already Built)

The MVP scaffold is complete and pushed to GitHub. The system already covers the core e-commerce flow end to end at a baseline level.

### 2.1 Backend (Implemented)

- **Application bootstrap**
  - `backend/src/server.js` - server entry point.
  - `backend/src/app.js` - Express app with helmet, CORS, JSON parsing, morgan logging, route mounting, 404 handler, and centralized error handler.
  - `backend/src/config/env.js` - environment loader with safe defaults.
  - `backend/src/config/db.js` - MongoDB connection setup using Mongoose.

- **Data models**
  - `User` - hashed passwords (bcrypt) and role (customer/admin).
  - `Product` - price, stock, category, brand, rating, review count, featured flag, and a text index for search.
  - `Cart` - per-user cart with line items.
  - `Order` - totals, payment metadata, and order status lifecycle.
  - `Review` - rating and comment, unique per user/product.

- **Authentication and account**
  - Signup/login with input validation (`express-validator`).
  - JWT token issuance (`backend/src/utils/token.js`).
  - `protect` middleware for guarding private routes.
  - `GET /api/auth/me` and `GET /api/auth/history` for profile and purchase history.

- **Catalog and discovery**
  - `GET /api/products` with search, filter (category, brand, price range, rating), sorting (newest, price asc/desc, rating desc), and pagination.
  - `GET /api/products/:id` with product details, recent reviews, and recommendations.
  - Recommendation logic in `backend/src/services/recommendationService.js` (related category + featured fallback).

- **Cart**
  - Get cart, add item, update quantity, remove item.
  - Stock validation on add/update.

- **Checkout and orders**
  - `POST /api/orders/checkout` builds totals (subtotal, tax, shipping, total), creates Stripe payment intent (mocked locally if no key), persists order, decrements stock, clears cart.
  - `POST /api/orders/payment-status` updates payment status (mock webhook for local testing).
  - `GET /api/orders` and `GET /api/orders/:id` for order list and detail.

- **Reviews and ratings**
  - `POST /api/reviews/:productId` for verified buyers only.
  - Aggregate product rating and review count recalculated on each submission.

- **Quality and security baseline**
  - Helmet for HTTP security headers.
  - CORS restricted via `CLIENT_URL` env var.
  - Centralized error middleware.
  - Input validation middleware (`backend/src/middleware/validateRequest.js`).
  - Async wrapper to avoid try/catch noise (`backend/src/middleware/asyncHandler.js`).

- **Tests**
  - `backend/tests/health.test.js` - smoke test for `/api/health`.
  - `backend/tests/auth.validation.test.js` - rejects invalid signup payload.

- **Seed data**
  - `backend/src/seed/data.js` and `backend/src/seed/seedProducts.js` - sample products to populate the catalog.

### 2.2 Frontend (Implemented)

- `frontend/public/index.html` - storefront page with header, sidebar (search/filters and auth forms), product grid, cart panel, and orders panel.
- `frontend/public/styles.css` - responsive styling with grid layout for product cards.
- `frontend/public/app.js` - vanilla JS controller that:
  - fetches products with filters/sort/pagination,
  - manages auth (signup/login/logout) using `localStorage`,
  - displays product details and recommendations,
  - handles cart actions (add/remove),
  - triggers checkout and lists orders.

### 2.3 Tooling and CI

- `.github/workflows/ci.yml` - runs `npm ci` and `npm test` on push/PR for the backend.
- `.gitignore` - excludes `node_modules`, env files, build artifacts, and editor noise.
- `backend/.env.example` - documents all required environment variables.
- `README.md` - setup, run, and API reference.

### 2.4 Status Summary

| Area | Status |
| --- | --- |
| Project structure & config | Done |
| Data models | Done |
| Catalog & discovery APIs | Done |
| Authentication & account | Done |
| Cart & checkout & orders | Done |
| Reviews & ratings | Done |
| Recommendations (basic) | Done |
| Frontend storefront (basic) | Done |
| CI baseline | Done |
| Tests (smoke + validation) | Done |
| Production deployment | Pending |
| Admin & inventory tooling | Pending |
| Real Stripe webhooks | Pending |

---

## 3. Known Limitations

These are intentional MVP shortcuts that should be addressed before going live:

- **No admin interface** for managing products, stock, or orders.
- **No real Stripe webhook signature verification** - the payment status endpoint is a mock for local testing.
- **No password reset / email verification** flows.
- **No order status transitions beyond basic states** - no shipping/tracking integrations.
- **No persistent guest cart** - cart requires login.
- **No image upload pipeline** - product images use external URLs.
- **No structured logging or APM** - only `morgan` request logs and console errors.
- **No production deployment** configuration (Dockerfile, IaC, hosting target).
- **Limited automated test coverage** - only smoke + one validation test.

---

## 4. Future Plans (Roadmap)

The roadmap is grouped into phased iterations. Each phase has a clear theme, expected outcomes, and rationale.

### Phase A - Production Readiness
Goal: make the MVP deployable, observable, and secure for real users.

- **Containerization**
  - Add `Dockerfile` for backend and a `docker-compose.yml` that includes MongoDB.
  - Why: one-command local startup and consistent prod parity.
- **Environment hardening**
  - Enforce required env vars on boot.
  - Add rate limiting (e.g., `express-rate-limit`) on auth + checkout routes.
  - Add CSRF protection if cookie-based auth is introduced later.
  - Why: protect against brute force, abuse, and misconfiguration.
- **Real Stripe webhook integration**
  - Verify Stripe signature, listen to `payment_intent.succeeded` and `payment_intent.payment_failed`.
  - Update order state idempotently.
  - Why: payment correctness is non-negotiable.
- **Observability**
  - Add structured logger (e.g., `pino`) with request IDs.
  - Add error tracking integration (e.g., Sentry).
  - Add uptime/metrics endpoint beyond `/api/health`.
  - Why: faster incident response and root-cause diagnosis.
- **Deployment**
  - Pick host (Render/Heroku/AWS) and document deployment runbook.
  - Add CD step in CI to deploy `main` after tests pass.
  - Why: reduce friction and risk of releases.

### Phase B - Admin and Inventory
Goal: enable real merchants to operate the store without touching the database.

- **Admin auth + RBAC**
  - Promote `role: admin` users; gate admin routes via middleware.
- **Product CRUD APIs**
  - Create/update/delete products with image upload (e.g., S3/Cloudinary).
- **Inventory controls**
  - Stock adjustments, low-stock alerts, oversell prevention via reservation on checkout.
- **Order operations**
  - Update order status (processing, shipped, delivered, cancelled), refund flow.
- **Admin UI**
  - Minimal admin dashboard (separate page or extended SPA later).
- Why: this turns the project from an MVP into something operable.

### Phase C - Trust, Engagement, and Conversion
Goal: increase user trust and conversion rate.

- **Email + password reset**
  - Transactional emails for signup confirmation, order confirmation, password reset.
- **Wishlist and recently viewed products**
- **Promotions/coupons engine**
  - Percentage and fixed-amount discounts with usage limits.
- **Smarter recommendations**
  - Move from rules-based to behavior-based (co-purchase, recently viewed weighting).
- **Reviews enhancements**
  - Helpful votes, photo reviews, response from admin.
- Why: classic levers for retention and average order value.

### Phase D - Scale and Optimization
Goal: stay performant as catalog and traffic grow.

- **Caching**
  - Redis for hot product reads, session/cart, and rate limiting.
- **Search upgrade**
  - Move from Mongo text search to a search engine (MeiliSearch/Elastic) for better relevance and facets.
- **Background jobs**
  - Queue (BullMQ) for emails, recommendation refresh, image processing.
- **Analytics**
  - Funnel analytics, conversion tracking, A/B testing infrastructure.
- **Performance**
  - DB index audit, query profiling, CDN for static assets.

### Phase E - Frontend Evolution (Optional)
Goal: upgrade the storefront to match modern UX expectations.

- Migrate `frontend/public` to a React/Next.js app with:
  - Server-rendered product pages for SEO.
  - Image optimization, skeleton loaders, accessibility audit (WCAG AA).
  - Component library and design tokens.
- Reasoning: keep the current vanilla UI as a fallback while adding a richer SPA experience.

---

## 5. Suggested Next Iteration (Concrete Next Sprint)

If continuing immediately, the recommended next sprint focuses on Phase A items with the highest leverage:

1. **Add Dockerfile + docker-compose** for backend + MongoDB.
2. **Add rate limiting** on `/api/auth/login`, `/api/auth/signup`, and `/api/orders/checkout`.
3. **Verify Stripe webhook signatures** and replace the mock webhook endpoint.
4. **Introduce structured logging** with `pino` and request IDs.
5. **Add at least 5 more API integration tests** (login success, cart add/remove, checkout happy path).
6. **Document deployment** to a chosen host with environment variables and migration plan.

Acceptance criteria:
- `docker compose up` runs the full stack locally with seeded products.
- All new endpoints have tests.
- CI is green and includes the new tests.
- Webhook flow updates order/payment status reliably.

---

## 6. Risks and Mitigations

- **Payment correctness drift** -> always verify webhook signatures, store payment provider IDs, never trust client-supplied amounts.
- **Stock oversell** -> use atomic decrement and consider reservations during checkout.
- **Security regressions** -> add lint rules, dependency audit in CI (`npm audit --production`), and Dependabot.
- **Scope creep** -> lock each phase to a small, testable set of features before opening the next.
- **Operational blind spots** -> ship logging/monitoring before launch, not after.

---

## 7. Definition of Done (Per Phase)

A phase is considered done when:
- All listed features are implemented and merged to `main`.
- Each feature has at least one automated test.
- Documentation (`README.md` and this `plan.md`) reflects the new state.
- CI is green on `main`.
- For Phases A and B, the change is also deployed to the chosen environment.

---

## 8. Documentation Map

- `Project.md` - original product blueprint and review.
- `README.md` - install, run, and API reference.
- `plan.md` (this file) - current state, roadmap, and next sprint.
- `.github/workflows/ci.yml` - automated test pipeline.
- `backend/.env.example` - required environment variables.

---

## 9. Change Log (Plan-Level)

- **v0.1 (Initial commit)** - MVP backend, storefront UI, CI, and docs scaffolded and pushed to GitHub.
- **v0.2 (Planned)** - Production readiness (Phase A items above).
- **v0.3 (Planned)** - Admin/inventory tooling (Phase B).
- **v0.4+ (Planned)** - Engagement, scale, and frontend upgrades (Phases C-E).
