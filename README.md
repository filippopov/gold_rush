# Gold Rush - Precious Metals Price Tracker

A modern web application for tracking precious metals prices, built with a multi-container Docker architecture featuring a Symfony backend API and React frontend.

## Features

- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Real-time Price Tracking**: Monitor precious metals prices (planned feature)
- **Responsive UI**: Modern React interface with Vite for fast development
- **Docker Containerization**: Complete development environment with Docker Compose
- **API-First Design**: RESTful API with comprehensive documentation
- **Database Integration**: MySQL with Doctrine ORM for data persistence

## Architecture

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

## Prerequisites

- Docker and Docker Compose
- Git
- (Optional) Node.js 20+ and PHP 8.3+ for local development

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gold_rush
   ```

2. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the Application**
   ```bash
   # Build and start all services
   docker-compose up -d --build

   # Check service status
   docker-compose ps
   ```

4. **Initial Setup**
   ```bash
   # Generate JWT keys (one-time setup)
   docker exec -it gold_rush_backend php bin/console lexik:jwt:generate-keypair

   # Run database migrations
   docker exec -it gold_rush_backend php bin/console doctrine:migrations:migrate
   ```

## Development

### Accessing the Application
- **Full Stack**: http://localhost:8080
- **Frontend Dev Server**: http://localhost:3001
- **API Base URL**: http://localhost:8080/api

### Development Workflows

#### Backend Development
```bash
# Access backend container
docker exec -it gold_rush_backend bash

# Create new entities/controllers
php bin/console make:entity
php bin/console make:controller
```

#### Frontend Development
The frontend uses hot reload via volume mounts. Changes are reflected immediately.

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

## Project Structure

```
gold_rush/
├── backend/                 # Symfony API application
│   ├── config/             # Configuration files
│   ├── src/                # Source code
│   │   ├── Controller/     # API controllers
│   │   ├── Entity/         # Doctrine entities
│   │   └── Repository/     # Doctrine repositories
│   ├── templates/          # Twig templates
│   └── migrations/         # Database migrations
├── frontend/               # React application
│   ├── src/
│   │   ├── pages/          # React pages
│   │   └── services/       # API service layer
│   └── public/             # Static assets
├── docker/                 # Docker configurations
│   ├── backend/            # Backend container config
│   ├── frontend/           # Frontend container config
│   ├── nginx/              # Nginx reverse proxy
│   └── mysql/              # Database initialization
└── docker-compose.yml      # Service orchestration
```

## API Documentation

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User login (returns JWT)
- `POST /api/token/refresh` - Refresh JWT token

### Protected Endpoints
- `GET /api/me` - Get current user information

### Response Format
All API responses are in JSON format.

## Configuration

### Environment Variables
Configure the following in your `.env` file:
- Database: `MYSQL_*` variables
- Ports: `BACKEND_PORT`, `FRONTEND_PORT`, `DB_PORT`
- App: `APP_ENV`, `APP_SECRET`

### Container Configuration
- **Naming**: `gold_rush_{service}` (e.g., `gold_rush_backend`)
- **Ports**: 8080 (nginx), 3001 (frontend dev), 3307 (MySQL)
- **Networks**: `gold_rush_net` bridge network
- **Volumes**: `./backend` and `./frontend` bind-mounted for live development

## Development Guidelines

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
- **Database changes**: Run migrations after schema updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure everything works
5. Submit a pull request

## License

This project is licensed under the MIT License.