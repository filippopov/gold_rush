# Gold Rush - Precious Metals Price Tracker

Gold Rush is a Dockerized full-stack app for authenticated precious metal price tracking.
It combines a Symfony API, React dashboard, MySQL persistence, and an Nginx reverse proxy.

## Stack

- Backend: Symfony 7.4, Doctrine ORM, Lexik JWT, Gesdinet refresh token, Nelmio CORS
- Frontend: React 18 + Vite + Axios + React Router
- Infra: Docker Compose (`db`, `backend`, `frontend`, `nginx`, `cron`)
- Data source: Alpha Vantage `GOLD_SILVER_SPOT`

## Architecture

- `frontend` talks to API via relative `/api` base URL (`frontend/src/services/api.js`)
- Nginx routes `/` to Vite (`frontend:5173`) and `/api` to Symfony (`backend:9000`)
- Backend stores JWT in responses; frontend stores token in `localStorage`
- Axios interceptor adds `Authorization: Bearer <token>` and auto-logs out on `401`
- Price snapshots are persisted in MySQL via `MetalPriceSnapshot` entity

## Quick Start

1. Ensure `.env` exists at project root (this repo already includes one).
2. Build and start containers:

```bash
docker-compose up -d --build
docker-compose ps
```

3. One-time backend setup:

```bash
docker exec -it gold_rush_backend php bin/console lexik:jwt:generate-keypair
docker exec -it gold_rush_backend php bin/console doctrine:migrations:migrate
```

## Access

- Full app: http://localhost:8080
- Frontend dev server (direct): http://localhost:3001
- API base: http://localhost:8080/api
- MySQL host access: `localhost:3307`

## Precious Metals Data Workflow

Fetch and store snapshots from Alpha Vantage:

```bash
docker exec -it gold_rush_backend php bin/console app:metals:current-prices --symbols=XAU,XAG
```

Optional flags:

- `--api-key=...` override env key
- `--symbols=XAU,XAG,XPT`
- `--currency=USD` (currently enforced to USD by provider behavior)

The command deduplicates snapshots by provider/symbol/currency/provider timestamp.

## API Endpoints

Public:

- `POST /api/register`
- `POST /api/login`
- `POST /api/token/refresh`

Protected (JWT required):

- `GET /api/me`
- `GET /api/metals/latest`
- `GET /api/metals/history?symbol=XAU&limit=30` (limit capped at 500)

## Frontend Notes

- Dashboard is in `frontend/src/pages/Dashboard.jsx`
- Metals history selector supports `30/60/120` points
- Auto-refresh runs every 60 seconds and supports manual refresh

## Useful Commands

```bash
# Backend shell
docker exec -it gold_rush_backend bash

# Frontend build check
docker exec gold_rush_frontend npm run build

# Show backend routes
docker exec -it gold_rush_backend php bin/console debug:router

# Tail logs
docker-compose logs -f backend
```

## Troubleshooting

- DB client connection should use `localhost:3307` (not 3306)
- If migrations fail, verify DB is healthy: `docker-compose ps`
- If API calls fail with 401, clear frontend token and login again
- If no metals appear, run the fetch command first and check API quota/rate limit