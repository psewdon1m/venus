# API Gateway Service

Central API gateway and routing microservice for Venus Platform.

## Responsibilities

- Request routing to appropriate microservices
- Authentication middleware (JWT validation)
- Rate limiting and request throttling
- Request/response logging and monitoring
- CORS configuration
- API versioning

## API Endpoints

### Gateway Routes
- `GET /health` - Gateway health check
- `POST /auth/*` - Proxy to Auth Service
- `GET|POST|PUT|DELETE /api/projects/*` - Proxy to Project Service
- `GET|POST|PUT|DELETE /api/personas/*` - Proxy to Persona Service
- `GET|POST|PUT|DELETE /api/media/*` - Proxy to Media Service
- `GET|POST|PUT|DELETE /api/cv/*` - Proxy to AI-CV Service

### Health
- `GET /health` - Service health check

## Environment Variables

See [`.env.example`](../../.env.example) for configuration options.

**Required:**
- `AUTH_SERVICE_URL` - Auth service URL
- `PROJECT_SERVICE_URL` - Project service URL
- `PERSONA_SERVICE_URL` - Persona service URL
- `MEDIA_SERVICE_URL` - Media service URL
- `AI_CV_SERVICE_URL` - AI-CV service URL
- `JWT_SECRET` - Secret for JWT validation
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Docker

```bash
# Build image
docker build -t venus/api-gateway .

# Run container
docker run -p 4000:4000 --env-file .env venus/api-gateway
```

## Architecture

```
Client Request
    ↓
API Gateway (Express + http-proxy)
    ├─→ /auth/* → Auth Service
    ├─→ /api/projects/* → Project Service
    ├─→ /api/personas/* → Persona Service
    ├─→ /api/media/* → Media Service
    └─→ /api/cv/* → AI-CV Service
         ↓
    Microservices (Individual Services)
```

## Security

- JWT token validation for protected routes
- Rate limiting: 100 req/15min per IP
- Request size limits (10MB)
- CORS configured for frontend origins
- Request logging with sensitive data masking

## Status

**Current:** Initialization complete, routing stubbed
**Next:** Implement authentication middleware and routing logic (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
