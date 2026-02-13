# Gold Rush – Copilot Instructions

## Big Picture
- Multi-container app orchestrated by `docker-compose.yml`: `db` (MySQL), `backend` (Symfony API), `frontend` (Vite), `nginx` (reverse proxy), `cron`.
- Nginx routes `/` to React and `/api` to Symfony (`docker/nginx/default.conf`).
- Frontend always calls relative `/api` (`frontend/src/services/api.js`) and relies on JWT in `localStorage`.
- Backend is API-first: JSON controllers in `backend/src/Controller`, Doctrine entities/repositories in `backend/src/Entity` and `backend/src/Repository`.

## Auth and API Boundaries
- Public endpoints: `/api/register`, `/api/login`, `/api/token/refresh`.
- All other `/api/*` require JWT (`backend/config/packages/security.yaml`).
- Frontend request interceptor adds bearer token; response interceptor clears token and redirects to `/login` on `401`.
- Keep controllers thin; put query logic in repositories and shared logic in services/commands.

## Precious Metals Flow
- Fetch command: `app:metals:current-prices` in `backend/src/Command/FetchPreciousMetalsPricesCommand.php`.
- Source API: Alpha Vantage `GOLD_SILVER_SPOT`; current implementation effectively supports USD spot data.
- Persistence entity: `MetalPriceSnapshot` with dedupe by provider/symbol/currency/provider timestamp.
- Read endpoints: `GET /api/metals/latest` and `GET /api/metals/history?symbol=XAU&limit=30` (`backend/src/Controller/MetalsController.php`).
- Dashboard uses latest + history data with symbol and point selectors (`frontend/src/pages/Dashboard.jsx`, `frontend/src/services/metals.js`).

## High-Value Workflows
- Start stack: `docker-compose up -d --build`
- Backend shell: `docker exec -it gold_rush_backend bash`
- Generate JWT keys once: `php bin/console lexik:jwt:generate-keypair`
- Run migrations: `php bin/console doctrine:migrations:migrate`
- Verify frontend build: `docker exec gold_rush_frontend npm run build`
- Check routes: `php bin/console debug:router`

## Conventions Specific to This Repo
- Prefer Symfony attributes for routes and Doctrine mapping in PHP code.
- Keep API responses consistent JSON payloads (`error`, `items`, `count`, etc.).
- Do not hardcode absolute backend URLs in frontend; keep `/api` base path for nginx proxy compatibility.
- Respect containerized ports from root `.env` (`BACKEND_PORT=8080`, `FRONTEND_PORT=3001`, `DB_PORT=3307`).
- For DB client connections from host OS, use `localhost:3307` (not container-internal `3306`).

## When Updating Features
- If backend schema changes: update entity + migration together and document command usage.
- If auth behavior changes: update both `security.yaml` and frontend interceptor behavior.
- If metals payload shape changes: update backend serializer and frontend `metals.js`/`Dashboard.jsx` together.
<parameter name="filePath">c:\xampp\htdocs\gold_rush\.github\copilot-instructions.md