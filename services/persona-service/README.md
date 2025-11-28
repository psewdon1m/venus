# Persona Service

Persona management microservice for Venus Platform.

## Responsibilities

- Persona CRUD operations
- Persona profile management
- Placeholder management within personas
- Persona sharing and public visibility
- Persona analytics and statistics

## API Endpoints

### Personas
- `GET /personas` - List user's personas
- `POST /personas` - Create new persona
- `GET /personas/:id` - Get persona details
- `PUT /personas/:id` - Update persona
- `DELETE /personas/:id` - Delete persona
- `POST /personas/:id/publish` - Make persona public

### Placeholders
- `GET /personas/:id/placeholders` - List persona placeholders
- `POST /personas/:id/placeholders` - Add placeholder to persona
- `PUT /personas/:id/placeholders/:placeholderId` - Update placeholder
- `DELETE /personas/:id/placeholders/:placeholderId` - Remove placeholder
- `POST /personas/:id/placeholders/reorder` - Reorder placeholders

### Public
- `GET /public/:slug` - Get public persona by slug

### Health
- `GET /health` - Service health check

## Environment Variables

See [`.env.example`](../../.env.example) for configuration options.

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT validation
- `REDIS_URL` - Redis connection string (optional, for caching)

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
docker build -t venus/persona-service .

# Run container
docker run -p 4003:4003 --env-file .env venus/persona-service
```

## Architecture

```
Client Request
    ↓
Persona Service (Express)
    ├─→ GET /personas → Query Personas → Return List
    ├─→ POST /personas → Validate Data → Create Persona → Save to DB
    ├─→ GET /personas/:id → Find Persona → Return Details + Placeholders
    ├─→ PUT /personas/:id → Validate Data → Update Persona → Save to DB
    ├─→ POST /personas/:id/placeholders → Create Placeholder → Link to Persona
    └─→ GET /public/:slug → Find Public Persona → Return Public View
         ↓
    PostgreSQL (Personas, Placeholders, Projects)
    Redis (Cache)
```

## Features

- Persona templates and categories
- Drag-and-drop placeholder ordering
- Public persona URLs with custom slugs
- Persona analytics (views, engagement)
- Social sharing integration
- SEO optimization for public personas

## Status

**Current:** Initialization complete, endpoints stubbed
**Next:** Implement persona CRUD operations (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
