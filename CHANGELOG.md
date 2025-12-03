# Changelog

All notable changes to the Venus project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Complete project placeholder system implementation
- Media Service implementation
- AI-CV Service implementation
- CI/CD pipeline setup
- Multiple personas support (КТ2)

## [0.1.3-alpha] - 2025-12-03

### Added
- **Frontend Dockerfile & health endpoint** - Multi-stage Next.js Dockerfile plus `/api/health` route for uptime probes
- **Secret generation tooling** - `scripts/generate-secrets.js` for JWT/session/database credentials
- **Staging environment template** - Updated `config/environments/.env.staging.example` with ready-to-use values

### Changed
- **Scripts documentation:** Expanded `scripts/README.md` with security and admin workflow guidance


## [0.1.2-alpha] - 2025-12-01

### Added
- **Complete Zod Validation Coverage**
  - Zod schemas implemented for all public endpoints across all services
  - Type-safe validation middleware with automatic error responses
  - Centralized validation logic in persona-service, media-service, and api-gateway

- **Full Admin RBAC Implementation**
  - Real admin role checking in downstream services (not just gateway)
  - `requireAdmin` middleware in auth-service, persona-service, and media-service
  - Admin-only endpoints for user management, content moderation, and file administration

- **S3/R2 Storage Integration**
  - Complete Cloudflare R2/S3 integration for media uploads
  - Unique filename generation with timestamp + random ID
  - Real S3 upload with proper error handling and CDN URL generation
  - Environment configuration for production storage

- **Admin Tools & Testing Infrastructure**
  - Default admin user creation script (`scripts/create-admin.js`)
  - Admin credentials: admin@venus.app / admin123!@#
  - Comprehensive admin endpoints for system management

### Changed
- **Project Status:** All security and storage infrastructure completed
- **Documentation:** Updated services/README.md with new security features and S3 integration
- **Testing Readiness:** Full admin testing capabilities implemented

## [0.1.1-alpha] - 2025-11-28

### Fixed
- **API Gateway proxy body forwarding issue** - POST/PUT requests to persona-service now work correctly
  - Implemented proper body forwarding in `proxyToService` function using native Node.js HTTP
  - Added explicit Content-Type and Content-Length headers for JSON payloads
  - Auth service proxy updated with `onProxyReq` callback for body forwarding
- **Frontend API integration** - Replaced mock data with real API calls
  - Dashboard now loads projects and personas from backend services
  - Auth forms use real authentication endpoints
  - Removed mock UI components and data

### Changed
- **Project Status:** КТ1 fully stable, ready for КТ2 development
- **API Gateway:** All proxy routes now handle request bodies correctly
- **Frontend:** Complete API integration with error handling and loading states

### Added
- **Security Enhancements:**
  - Zod validation schemas implemented across all services (persona-service, media-service, api-gateway)
  - Real admin RBAC with role-based middleware in downstream services
  - HTTP-only cookies for refresh tokens with secure settings
  - Magic bytes validation for file uploads
- **Media Storage:**
  - S3/R2 integration for file uploads with Cloudflare CDN
  - Unique filename generation and metadata storage
  - CDN URL generation for uploaded files
- **Admin Tools:**
  - Default admin user creation script (`scripts/create-admin.js`)
  - Admin role management endpoints
  - Admin-only file and persona management

## [0.1.0-alpha] - 2025-11-22

### Added
- **КТ1: Минимальный MVP завершен** 
  - Полный flow: регистрация → создание персоны → проекты с плейсхолдерами → публичная страница
  - Регистрация и аутентификация с JWT токенами
  - Создание персон с уникальными slugs
  - CRUD операции для проектов с плейсхолдерной системой
  - Публичные страницы персон с Next.js SSG
  - Базовая Lighthouse оптимизация (готово для score >90)

- **Database Integration**
  - Все сервисы подключены к SQLite (Prisma)
  - Полная схема данных с миграциями
  - Account, Persona, Project, MediaFile, CVGeneration модели
  - Relations и indexes для производительности

- **API Gateway Implementation**
  - Микросервисная маршрутизация
  - JWT аутентификация middleware
  - Rate limiting и CORS
  - Health checks для всех сервисов

- **Persona Service Enhancement**
  - Полный CRUD для персон
  - Slug generation и uniqueness validation
  - Database integration с Prisma
  - Authentication middleware

- **Project Service Enhancement**
  - CRUD операции с database persistence
  - Placeholder system foundation
  - Type validation и error handling

- **Frontend Implementation**
  - Next.js 15 с App Router
  - Auth context и protected routes
  - Dashboard с API integration для проектов и персон
  - Public persona pages (`/[slug]`)
  - Responsive design с Tailwind CSS

### Changed
- **Project Status:** КТ1 завершен, готов к КТ2 (множественные персоны)
- **Architecture:** Полная микросервисная система с database
- **Development:** Hot-reload работает для всех сервисов
- Updated `docs/project_passport.md` with КТ1 completion status

### Fixed
- Auth service теперь использует database вместо in-memory storage
- API responses унифицированы с success/error format
- TypeScript strict mode включен для всех сервисов

### Technical Details
- **Database:** SQLite + Prisma (production-ready for PostgreSQL)
- **Authentication:** JWT access/refresh tokens, bcrypt hashing
- **API:** RESTful с consistent response format
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Services:** 6 микросервисов с Docker Compose
- **Testing:** Manual testing completed for КТ1 criteria

### Known Issues
- Lighthouse score optimization pending final measurements

---

## [0.0.2-alpha] - 2025-11-21

### Added
- **Auth Service implementation** (4001 port)
  - User registration with password validation
  - JWT authentication (access + refresh tokens)
  - Password hashing with bcrypt
  - Account security (lockouts, rate limiting)
  - Session management with Redis
  - Complete API endpoints: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
  - Health check endpoint with database connectivity

- **Project Service implementation** (4002 port)
  - Complete CRUD operations for projects
  - In-memory storage for development
  - Project validation and error handling
  - Pagination support
  - TypeScript types integration
  - Health check endpoint

- **Shared Types package** (`shared/types/`)
  - Complete TypeScript definitions (13 files, ~500 lines)
  - API request/response types
  - Entity models (Account, Project, Persona, etc.)
  - Common enums and utilities
  - Centralized type safety across services

- **Database Schema** (`infrastructure/postgres/schema.prisma`)
  - Complete Prisma schema (7 models, 500+ lines)
  - Account, Project, Persona, Placeholder, Media, CV models
  - Proper relationships and indexes
  - Ready for migration generation

- **Service Infrastructure**
  - Base structure for all 6 microservices
  - TypeScript configuration for each service
  - Docker configuration (Dockerfile + Dockerfile.dev)
  - Comprehensive README documentation for each service
  - Health check patterns implemented

- **Development Environment**
  - Environment variables configuration (`.env`)
  - pnpm workspace setup
  - Hot-reload development servers
  - Logging and error handling

### Changed
- Updated `docs/project_passport.md` with current status
- Project status: "Готов к разработке" (Ready for development)
- Completed Stage 1 (Technical stack and core)

### Technical Details
- **Auth Service:** Express + JWT + bcrypt + Redis sessions
- **Project Service:** Express + in-memory CRUD + validation
- **Type Safety:** 100% TypeScript with shared types
- **Architecture:** Microservices ready for database integration
- **Testing:** Health checks verified for both services

## [0.0.1-alpha] - 2025-11-21

### Added
- Project initialization and repository setup
- Complete project documentation (9 documents, ~6050 lines)
  - `README.md`: Project overview and documentation reading order
  - `docs/manifest.md`: Philosophy, architecture, and entities (702 lines)
  - `docs/codex.md`: Core rules and coding standards (715 lines)
  - `docs/git_managment.md`: Git workflow and versioning (1029 lines)
  - `docs/stack.md`: Technology stack and ready-to-use solutions (650 lines)
  - `docs/stages.md`: Detailed development stages (1110 lines)
  - `docs/directory_tree.md`: Project structure (265 lines)
  - `docs/traceability-matrix.md`: Requirements traceability (552 lines)
  - `docs/ci-cd-pipeline.md`: CI/CD processes (1117 lines)
  - `docs/project_passport.md`: Current project status (327 lines)
- Infrastructure setup
  - `.gitignore`: Comprehensive ignore patterns (89 lines)
  - `.env.example`: Environment variables template (239 lines)
  - `package.json`: Monorepo configuration with pnpm
  - `pnpm-workspace.yaml`: Workspace configuration
  - `docker-compose.yml`: Base Docker configuration (297 lines)
  - `docker-compose.dev.yml`: Development overrides (177 lines)
  - `Makefile`: Command automation (261 lines)
- Directory structure according to architecture specification
  - `frontend/`: Next.js application directory
  - `services/`: Microservices (api-gateway, auth, project, persona, media, ai-cv)
  - `shared/`: Shared packages (types, utils, config)
  - `infrastructure/`: Infrastructure configs (postgres, redis, monitoring)
  - `tests/`: Test suites (e2e, integration, performance)
  - `scripts/`: Utility scripts (setup, deploy, db)
  - `secrets/`: Secure storage for credentials
  - `config/`: Configuration files
  - `tools/`: Development tools
- PostgreSQL initialization script (`infrastructure/postgres/init.sql`)
- Secrets directory with security documentation

### Infrastructure
- **Docker Compose configuration** with service orchestration
  - Base: `docker-compose.yml` (297 lines)
  - Development: `docker-compose.dev.yml` (177 lines) with hot-reload
  - Production: `docker-compose.prod.yml` (169 lines) with replicas and monitoring
- **Network segmentation:** frontend_net, backend_net, data_net
- **Volume management** for persistent data (postgres, redis)
- **Health checks** for all services
- **Development tools** support (pgAdmin, Redis Commander, Mailhog)
- **Production infrastructure:**
  - VPS Server: 31.172.78.81 (Netherlands)
  - Domains: tgcall.us + 3 subdomains (api, cdn, admin)
  - SSL/TLS: Let's Encrypt certificates
  - CDN: Cloudflare proxy enabled
  - DNS: Cloudflare managed

### Documentation
- Comprehensive architecture specification
- 132 requirements fully documented and traced
- 4 milestone checkpoints defined (КТ1-4)
- Git workflow and commit conventions
- CI/CD pipeline specification
- Security practices and guidelines

### Development Experience
- Makefile with 30+ commands for common operations
- Pre-commit hooks configuration
- ESLint and Prettier setup
- TypeScript strict mode configuration
- Hot-reload support for development

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Secrets excluded from git via `.gitignore`
- Environment variables template without sensitive data
- Security documentation in `secrets/README.md`
- Planned: Bcrypt password hashing
- Planned: JWT token authentication
- Planned: Rate limiting and DDoS protection

---

## Release Notes Format

Each release should include:
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security-related changes

---

## Version Numbering

Venus follows Semantic Versioning:
- **MAJOR** version: Incompatible API changes
- **MINOR** version: Backward-compatible functionality
- **PATCH** version: Backward-compatible bug fixes
- **Pre-release tags**: alpha, beta, rc (e.g., v0.1.0-alpha.1)

---

## Links

- [Repository](https://github.com/your-org/venus)
- [Documentation](docs/)
- [Issues](https://github.com/your-org/venus/issues)
- [Releases](https://github.com/your-org/venus/releases)

[Unreleased]: https://github.com/your-org/venus/compare/v0.1.3-alpha...HEAD
[0.1.3-alpha]: https://github.com/your-org/venus/releases/tag/v0.1.3-alpha
[0.1.2-alpha]: https://github.com/your-org/venus/compare/v0.1.2-alpha...v0.1.3-alpha
[0.1.1-alpha]: https://github.com/your-org/venus/compare/v0.1.1-alpha...v0.1.2-alpha
[0.1.0-alpha]: https://github.com/your-org/venus/compare/v0.1.0-alpha...v0.1.1-alpha
[0.0.2-alpha]: https://github.com/your-org/venus/releases/tag/v0.0.2-alpha
[0.0.1-alpha]: https://github.com/your-org/venus/releases/tag/v0.0.1-alpha
