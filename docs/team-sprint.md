# NexaSpark — team sprint plan (Team lead)

**Sprint:** 2026-04-20  
**Goal:** Keep `main` releasable, close gaps on trust/ops, and queue the next shippable slices without duplicating business logic across web/mobile/API.

How to use this file: **Team lead** updates priorities; role owners tick work when done. Stakeholder-only items are listed at the bottom.

---

## Priority order (Team lead)

1. **Money path + CI green** — no regressions on Stripe test flows or webhooks when touching checkout/orders.  
2. **Deploy path** — GitHub Pages storefront stays consistent with API CORS (`CLIENT_ORIGIN`, optional `PUBLIC_API_BASE_URL`).  
3. **Trust and clarity** — legal placeholders, support path, and honest MVP limits (see `NexaSpark.md`).  
4. **Performance and debt** — indexes, caching, then “nice to have” UX.

---

## Frontend — tasks

| Status | Task |
|--------|------|
| [x] | Public config + legal footer wiring (`legalLinks.js`, `/api/public/config`). |
| [x] | Deploy-time API base via `window.__NEXASPARK_API_BASE__` (GitHub Actions prep). |
| [x] | Branded **404** page for static hosting (`404.html`). |
| [x] | Loading / empty / error + **Retry** on orders, wishlist, product detail. |
| [ ] | A11y pass: focus order on modals, form labels, contrast on primary actions. |
| [ ] | Optional: product listing SEO (`<title>` / meta per route) when/if build step is introduced. |

---

## Backend — tasks

| Status | Task |
|--------|------|
| [x] | `GET /api/public/config` for non-secret storefront defaults. |
| [ ] | Hosted API URL + `CLIENT_ORIGIN` matching Pages URL (see [`runbook.md`](./runbook.md)). |
| [ ] | Stripe live keys + webhook endpoint hardening review before real charges. |
| [ ] | SMTP for real order emails when launching (optional `notify` path already exists). |

---

## Tester — tasks

| Status | Task |
|--------|------|
| [x] | CI: `backend` integration + smoke; `mobile` typecheck. |
| [ ] | Before each release tag: run Stripe **test** checkout + webhook path on staging. |
| [ ] | Add Playwright or scripted smoke for storefront critical path (post-MVP if manual suffices short-term). |

---

## Market analyst — tasks

| Status | Task |
|--------|------|
| [ ] | Define launch KPIs (conversion, AOV, refund rate) and baseline. |
| [ ] | Human review of privacy/terms copy; set `PRIVACY_POLICY_URL` / `TERMS_OF_SERVICE_URL`. |
| [x] | Support link in footer via `SUPPORT_URL` / `SUPPORT_EMAIL` (`GET /api/public/config`). |
| [ ] | Returns policy + human-reviewed legal copy before positioning as “production ready.” |

---

## ML / systems — tasks

| Status | Task |
|--------|------|
| [x] | GitHub Pages deploy job after CI success on `main` / `master`. |
| [x] | MongoDB backup + restore drill documented ([`runbook.md`](./runbook.md) §5). |
| [ ] | Recommendations/search: measure before adding ML; keep co-purchase rules until data supports more. |

---

## Needs input from stakeholder (stop and ask)

These **cannot** be decided by the virtual team alone:

- **Jurisdiction:** tax, shipping regions, returns policy content.  
- **Production URLs:** canonical API hostname, custom domain for Pages vs `*.github.io`.  
- **Stripe:** when to switch from test to live keys and who approves go-live.  
- **Support:** public email or ticket path for customers.

Until these are answered, work continues on **technical** readiness (tests, docs, UX polish) without claiming legal or financial “done.”

---

## Handoff note

PRs should use `.github/pull_request_template.md`. Merge to `main` only when CI is green; Pages deploy runs automatically after successful `backend` + `mobile` jobs on push to `main` / `master`.
