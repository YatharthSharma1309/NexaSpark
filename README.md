# NexaSpark

Electronics-focused ecommerce (see [NexaSpark.md](./NexaSpark.md) for product scope and roadmap).

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** locally or a connection string (optional for health checks; required once data models are in use)

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | REST API (Express, Mongoose) |
| `frontend/public/` | Static storefront (HTML/CSS/JS) |
| `.github/workflows/` | CI |

## Quick start

### 1. Backend API

```bash
cd backend
cp .env.example .env
```

Edit `.env`: set `JWT_SECRET`, and `MONGODB_URI` if you run MongoDB.

```bash
npm install
npm run dev
```

- API base: `http://127.0.0.1:4000` (unless `PORT` is set)  
- Health: `GET /api/health`

```bash
npm test
```

### 2. Frontend (static)

Serve `frontend/public` with any static file server, for example:

```bash
npx --yes serve frontend/public -p 8080
```

Open `http://127.0.0.1:8080`. The home page can call the API health endpoint; ensure `CLIENT_ORIGIN` in `backend/.env` matches your frontend origin (default example uses port `8080`).

## Environment variables

Copy from `backend/.env.example`. Key variables:

- `PORT` — API port  
- `MONGODB_URI` — MongoDB connection string (omit only for quick API-only checks)  
- `CLIENT_ORIGIN` — CORS origin for the browser UI  
- `DEFAULT_COUNTRY`, `DEFAULT_CURRENCY`, `LOCALE` — regional defaults per [NexaSpark.md](./NexaSpark.md)

## CI

GitHub Actions runs `npm ci` and `npm test` in `backend/` on push and pull requests to `main` / `master`.
