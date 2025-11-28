# Auth Service

Authentication and authorization microservice for Venus Platform.

## Responsibilities

- User registration and login
- JWT token generation and validation
- Password hashing and verification
- Session management
- Account security (lockouts, rate limiting)

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Health
- `GET /health` - Service health check

## Environment Variables

See [`.env.example`](../../.env.example) for configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT signing
- `SESSION_SECRET` - Secret for session encryption
- `BCRYPT_ROUNDS` - Password hashing cost (default: 12)

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
docker build -t venus/auth-service .

# Run container
docker run -p 4001:4001 --env-file .env venus/auth-service
```

## Architecture

```
Client Request
    ↓
Auth Service (Express)
    ├─→ POST /auth/register → Create Account → Hash Password → Save to DB
    ├─→ POST /auth/login → Verify Password → Generate JWT → Create Session
    ├─→ POST /auth/refresh → Validate Refresh Token → Generate New Access Token
    └─→ POST /auth/logout → Invalidate Session → Clear Tokens
         ↓
    PostgreSQL (Accounts, Sessions)
    Redis (Session Cache)
```

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens (15 min expiry)
- Refresh tokens stored in Redis (7 day expiry)
- Account lockout after 5 failed attempts
- Rate limiting: 10 req/min per IP for auth endpoints

## Status

**Current:** Initialization complete, endpoints stubbed
**Next:** Implement registration and login logic (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
