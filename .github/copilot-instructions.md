# Gold Rush - Precious Metals Price Tracker

## Architecture Overview

This is a multi-container Docker application with JWT-authenticated API and React frontend for tracking precious metals prices.

### Service Architecture
- **db**: MySQL 8.0 with health checks and persistent volumes
- **backend**: Symfony 7.4 API with Doctrine ORM, JWT authentication, and CORS
- **frontend**: React 18 + Vite with React Router and Axios
- **nginx**: Reverse proxy routing `/` → frontend:5173, `/api` → backend PHP-FPM
- **cron**: Scheduled tasks container (price fetching TBD)

### Key Integration Points
- Frontend communicates with backend via `/api` prefix (nginx-proxied)
- JWT tokens stored in `localStorage`, auto-attached via Axios interceptors
- 401 responses trigger automatic logout and redirect to `/login`
- Database health checks ensure services start in correct order

## Development Workflows

### Full Environment Setup
```bash
# Build and start all services
docker-compose up -d --build

# Check service status
docker-compose ps

# View logs
docker-compose logs [service]
```

### Backend Development
```bash
# Run inside backend container
docker exec -it gold_rush_backend bash

# Generate JWT keys (one-time setup)
php bin/console lexik:jwt:generate-keypair

# Run database migrations
php bin/console doctrine:migrations:migrate

# Create new entities/controllers
php bin/console make:entity
php bin/console make:controller
```

### Frontend Development
```bash
# Frontend runs on port 3001 (mapped to container port 5173)
# Access at http://localhost:3001 for direct development
# Or through nginx at http://localhost:8080 for full stack
```

### API Testing
```bash
# Test API endpoints
curl http://localhost:8080/api

# Register user
curl -X POST http://localhost:8080/api/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Login (returns JWT token)
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Access protected endpoint
curl http://localhost:8080/api/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Project Conventions

### Container Configuration
- **Naming**: `gold_rush_{service}` (e.g., `gold_rush_backend`)
- **Ports**: 8080 (nginx), 3001 (frontend dev), 3307 (MySQL)
- **Networks**: `gold_rush_net` bridge network for inter-service communication
- **Volumes**: `./backend` and `./frontend` bind-mounted for live development

### Environment Variables
All configuration via `.env` file:
- Database: `MYSQL_*` variables
- Ports: `BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT`
- App: `APP_ENV`, `APP_SECRET`

### API Design
- **Base URL**: `/api` (handled by nginx)
- **Authentication**: JWT Bearer tokens in `Authorization` header
- **Public endpoints**: `/api/register`, `/api/login`, `/api/token/refresh`
- **Protected endpoints**: All other `/api/*` require authentication
- **Response format**: JSON throughout

### Security Configuration
- **Firewalls**: Separate `login` and `api` firewalls in `security.yaml`
- **CORS**: Configured in `nelmio_cors.yaml` for frontend origin
- **Password hashing**: Symfony auto hasher
- **User provider**: Doctrine entity provider on `email` field

### Database Schema
- **User entity**: Email, password hash, roles array, created timestamp
- **Migrations**: All schema changes via Doctrine migrations
- **Connection**: Via `DATABASE_URL` environment variable

## Key Files & Directories

### Configuration
- `docker-compose.yml`: Service definitions and dependencies
- `.env`: Environment variables (database, ports, secrets)
- `backend/config/packages/security.yaml`: JWT firewall configuration
- `backend/config/packages/lexik_jwt_authentication.yaml`: JWT settings
- `docker/nginx/default.conf`: Reverse proxy routing rules

### Application Code
- `backend/src/Entity/User.php`: User entity with security interfaces
- `backend/src/Controller/`: API controllers (RegistrationController, MeController)
- `frontend/src/services/api.js`: Axios client with JWT interceptors
- `frontend/src/pages/`: Auth pages (Login, Register, Dashboard)

### Docker Setup
- `docker/backend/Dockerfile`: PHP 8.3-FPM with extensions
- `docker/frontend/Dockerfile`: Node 20 with Vite
- `docker/cron/Dockerfile`: Cron container for scheduled tasks

## Common Patterns

### Adding New API Endpoints
1. Create controller in `backend/src/Controller/`
2. Add route with `#[Route('/api/...')]` attribute
3. Use dependency injection for services
4. Return JSON responses via `JsonResponse`

### Frontend API Calls
```javascript
import api from '../services/api';

// GET request (token auto-attached)
const response = await api.get('/me');

// POST request
const data = await api.post('/register', {email, password});
```

### Database Operations
```php
// In controller or service
$user = $entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
$entityManager->persist($newEntity);
$entityManager->flush();
```

## Troubleshooting

### Container Issues
- **Port conflicts**: Check if XAMPP or other services use ports 8080, 3307
- **Build failures**: Clear volumes with `docker-compose down -v`
- **Service dependencies**: Ensure database is healthy before starting backend

### API Issues
- **CORS errors**: Check `nelmio_cors.yaml` configuration
- **JWT errors**: Verify token format and expiration
- **Database connection**: Check `DATABASE_URL` in backend environment

### Development Issues
- **File permissions**: Ensure proper ownership in bind-mounted volumes
- **Hot reload**: Frontend changes should reflect immediately via volume mounts
- **Database changes**: Run migrations after schema updates</content>
<parameter name="filePath">c:\xampp\htdocs\gold_rush\.github\copilot-instructions.md