# Gold Rush - Precious Metals Price Tracker

Gold Rush is a Dockerized full-stack app for public precious metal prices (Home) and an authenticated dashboard for managing personal holdings + valuation.

## Stack

- Backend: Symfony 7.4, Doctrine ORM + Migrations, Lexik JWT, Nelmio CORS
- Frontend: React 18 + Vite + Axios + React Router
- Infra: Docker Compose (`db`, `backend`, `frontend`, `nginx`, `cron`)
- Data source: Alpha Vantage `GOLD_SILVER_SPOT`

## Architecture

- The frontend talks to the API via relative `/api` (`frontend/src/services/api.js`).
- Nginx routes `/` to Vite (`frontend:5173`) and `/api` to Symfony via PHP-FPM (`backend:9000`).
- Important: Nginx must forward the JWT header to PHP-FPM (`docker/nginx/default.conf` includes `fastcgi_param HTTP_AUTHORIZATION $http_authorization;`).
- JWT is stored in `localStorage`; Axios adds `Authorization: Bearer <token>` and clears token + redirects on `401`.
- Price snapshots are stored in MySQL in `metal_price_snapshot` (`backend/src/Entity/MetalPriceSnapshot.php`).
- Holdings are stored per-user in grams (source of truth) in `user_metal_holding` (`backend/src/Entity/UserMetalHolding.php`), ounces are derived (troy oz).

## Quick Start

1. Create a root `.env` with DB creds + port mappings (do not commit secrets). Required keys:

```dotenv
MYSQL_ROOT_PASSWORD=...
MYSQL_DATABASE=gold_rush
MYSQL_USER=gold_rush_user
MYSQL_PASSWORD=gold_rush_pass

BACKEND_PORT=8080
FRONTEND_PORT=3001
DB_PORT=3307
```

2. Build and start containers:

```bash
docker compose up -d --build
docker compose ps
```

3. One-time backend setup:

```bash
docker exec -it gold_rush_backend php bin/console lexik:jwt:generate-keypair
docker exec -it gold_rush_backend php bin/console doctrine:migrations:migrate
```

## Access

- Full app (via Nginx): http://localhost:8080
- Frontend dev server (direct): http://localhost:3001
- API base: http://localhost:8080/api
- MySQL from host OS: `localhost:3307`

## Precious Metals Data Workflow

Fetch and store snapshots from Alpha Vantage:

```bash
docker exec -it gold_rush_backend php bin/console app:metals:current-prices --symbols=XAU,XAG
```

Notes:

- Provider returns USD spot-style data; `--currency` is effectively forced to USD.
- Snapshots are deduplicated by provider + symbol + currency + provider timestamp.

## Holdings + Valuation

- Dashboard route: `/dashboard` (requires JWT).
- UI: `frontend/src/pages/PrivateDashboard.jsx`
- API:
	- `GET /api/holdings`
	- `PUT /api/holdings/{symbol}` with `{ "grams": "10.00" }` and/or `{ "ounces": "1.00" }`

## API Endpoints

Public:

- `POST /api/register`
- `POST /api/login`
- `GET /api/metals/latest`
- `GET /api/metals/history?symbol=XAU&limit=30` (limit capped at 500)

Protected (JWT required):

- `GET /api/me`
- `GET /api/holdings`
- `PUT /api/holdings/{symbol}`

`POST /api/token/refresh` is marked public in `backend/config/packages/security.yaml`, but may require additional wiring to work end-to-end.

## Cron

- The cron container runs `app:metals:current-prices` hourly (see `docker/cron/crontab`).
- Logs are appended to `/var/log/cron.log` inside the cron container.

## Testing (Functional)

Run PHPUnit functional tests inside the backend container:

```bash
docker exec -w /var/www/backend gold_rush_backend php bin/phpunit
```

Test DB:

- Uses MySQL with a dedicated database `gold_rush_test`.
- `docker/mysql/init.sql` creates/grants it on first DB volume init; for existing volumes you may need to create/grant it manually.

## Useful Commands

```bash
# Backend shell
docker exec -it gold_rush_backend bash

# Show backend routes
docker exec -it gold_rush_backend php bin/console debug:router

# Tail logs
docker compose logs -f backend nginx cron
```

## Troubleshooting

- If authenticated API calls return `401` unexpectedly, verify Nginx forwards `Authorization` (see `docker/nginx/default.conf`).
- DB client connections from host OS should use `localhost:3307` (not 3306).
- If no metals appear, run the fetch command and check Alpha Vantage rate limits.