# Project Service

Project management microservice for Venus Platform.

## Responsibilities

- Project CRUD operations
- Project metadata management
- Project status tracking
- Project analytics and statistics
- Project sharing and collaboration

## API Endpoints

### Projects
- `GET /projects` - List user's projects
- `POST /projects` - Create new project
- `GET /projects/:id` - Get project details
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `POST /projects/:id/share` - Share project with user

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
docker build -t venus/project-service .

# Run container
docker run -p 4002:4002 --env-file .env venus/project-service
```

## Architecture

```
Client Request
    ↓
Project Service (Express)
    ├─→ GET /projects → Query Projects → Return List
    ├─→ POST /projects → Validate Data → Create Project → Save to DB
    ├─→ GET /projects/:id → Find Project → Return Details
    ├─→ PUT /projects/:id → Validate Data → Update Project → Save to DB
    └─→ DELETE /projects/:id → Check Permissions → Delete Project
         ↓
    PostgreSQL (Projects, ProjectShares)
    Redis (Cache)
```

## Features

- Project templates and categories
- Project status workflow (draft, published, archived)
- Project analytics (views, likes, shares)
- Collaboration features (shared editing)
- Project export/import functionality

## Status

**Current:** Initialization complete, endpoints stubbed
**Next:** Implement project CRUD operations (Этап 1.3)

## Related

- Database schema: [`../../infrastructure/postgres/schema.prisma`](../../infrastructure/postgres/schema.prisma)
- Shared types: [`../../shared/types`](../../shared/types)
- Documentation: [`../../docs/stages.md`](../../docs/stages.md) section 1.3
