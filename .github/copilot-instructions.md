# Gold Rush – Copilot Instructions

## Big Picture
- Multi-container app orchestrated by `docker-compose.yml`: `db` (MySQL), `backend` (Symfony API via PHP-FPM), `frontend` (React + Vite), `nginx` (reverse proxy), `cron`.
- Nginx routes `/` to the Vite dev server and `/api` to Symfony’s front controller, and **must forward** the JWT header (`docker/nginx/default.conf` includes `fastcgi_param HTTP_AUTHORIZATION $http_authorization;`).
- Frontend always calls relative `/api` via Axios (`frontend/src/services/api.js`) and stores the JWT in `localStorage`.
- Backend is API-first: JSON controllers in `backend/src/Controller`, Doctrine entities/repositories in `backend/src/Entity` and `backend/src/Repository`.

## Auth & API Boundaries
- Public endpoints:
	- `POST /api/register`, `POST /api/login`
	- Metals read endpoints are public: `GET /api/metals/latest`, `GET /api/metals/history`
	- `POST /api/token/refresh` is marked public in `security.yaml`, but don’t assume it works unless the refresh-token bundle is actually wired.
- All other `/api/*` require JWT (`backend/config/packages/security.yaml`), e.g. `GET /api/me` and `/api/holdings/*`.
- Frontend interceptor adds `Authorization: Bearer <token>` and clears token + redirects to `/login` on `401`.
- Keep API responses consistent JSON payloads (`error`, `items`, `count`, etc.).

## Precious Metals Flow
- Fetch command: `app:metals:current-prices` (`backend/src/Command/FetchPreciousMetalsPricesCommand.php`).
- Provider: Alpha Vantage `GOLD_SILVER_SPOT` (USD spot-style data).
- Persistence: `MetalPriceSnapshot` with dedupe by provider/symbol/currency/provider timestamp.
- Read endpoints implemented in `backend/src/Controller/MetalsController.php` using `backend/src/Repository/MetalPriceSnapshotRepository.php`.

## Holdings (Current Amounts)
- Entity: `UserMetalHolding` (`backend/src/Entity/UserMetalHolding.php`) stores **grams** as the source of truth (DECIMAL string).
- Ounces are derived using troy ounces via `backend/src/Service/MetalUnitConverter.php`.
- API:
	- `GET /api/holdings`
	- `PUT /api/holdings/{symbol}` accepts `grams` and/or `ounces` and normalizes to grams.

## High-Value Workflows
- Start stack: `docker compose up -d --build`
- Backend shell: `docker exec -it gold_rush_backend bash`
- Run migrations: `docker exec -it gold_rush_backend php bin/console doctrine:migrations:migrate`
- Verify frontend build: `docker exec gold_rush_frontend npm run build`
- Check routes: `docker exec -it gold_rush_backend php bin/console debug:router`

## Cron
- Hourly fetch runs in `docker/cron/crontab` and appends to `/var/log/cron.log` inside the cron container.

## Testing (Functional)
- PHPUnit functional tests live in `backend/tests/Functional` and run via `WebTestCase`.
- Run tests in the backend container: `docker exec -w /var/www/backend gold_rush_backend php bin/phpunit`.
- Tests use a dedicated MySQL DB named `gold_rush_test` (created/granted in `docker/mysql/init.sql`). Note: MySQL init scripts only run on first DB volume creation; for existing volumes, create/grant the test DB manually.

## Repo Conventions
- Prefer Symfony attributes for routes and Doctrine mapping.
- Keep controllers thin; put query logic in repositories and shared logic in services/commands.
- Do not hardcode absolute backend URLs in frontend; keep `/api` for nginx proxy compatibility.
- Respect containerized ports from the root `.env` (`BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT`). For DB connections from the host OS, use `localhost:3307`.
<parameter name="filePath">c:\xampp\htdocs\gold_rush\.github\copilot-instructions.md