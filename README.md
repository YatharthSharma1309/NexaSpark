# Ecommerce Website (MVP)

This repository contains a full-stack e-commerce MVP implementation aligned with the roadmap in `Project.md`.

## Tech Stack
- Frontend: HTML/CSS/JavaScript (`frontend/public`)
- Backend: Node.js + Express (`backend/src`)
- Database: MongoDB (Mongoose models)
- Auth: JWT bearer tokens
- Payments: Stripe-compatible payment intent service with local mock fallback

## Features Implemented
- Product catalog APIs with search, filter, sort, and pagination.
- Product detail endpoint with recent reviews and recommendations.
- Authentication: sign up, log in, profile endpoint, purchase history.
- Cart management: add/update/remove/list cart items with stock checks.
- Checkout flow: order creation, totals, payment intent, stock deduction.
- Orders: list orders and order detail.
- Reviews: verified-buyer rating/comment submission with aggregate product ratings.
- Security middleware: helmet, CORS, request validation, centralized error handling.
- CI test workflow and baseline automated test.

## Project Structure
- `backend/src/config`: environment and database setup.
- `backend/src/models`: core data models (`User`, `Product`, `Cart`, `Order`, `Review`).
- `backend/src/controllers`: API handlers.
- `backend/src/routes`: API route wiring.
- `backend/src/services`: payment and recommendation logic.
- `backend/tests`: API tests.
- `frontend/public`: storefront UI.

## Setup
1. Install backend dependencies:
   - `cd backend`
   - `npm install`
2. Create environment file:
   - Copy `backend/.env.example` to `backend/.env`
   - Fill `MONGODB_URI`, `JWT_SECRET`, and optional `STRIPE_SECRET_KEY`
3. Seed sample products:
   - `npm run seed`
4. Start backend:
   - `npm run dev`
5. Serve frontend:
   - Open `frontend/public/index.html` in a local static server (for example VS Code Live Server).

## API Endpoints
- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/auth/history`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/cart`
- `POST /api/cart/items`
- `PATCH /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `POST /api/orders/checkout`
- `POST /api/orders/payment-status`
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/reviews/:productId`

## Deployment Notes
- Add production environment variables in your host platform.
- Restrict CORS origin via `CLIENT_URL`.
- Use managed MongoDB and secure network rules.
- Replace mock payment fallback with live Stripe keys in production.
- Extend CI with lint and integration tests before release.
