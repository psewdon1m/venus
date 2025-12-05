# Этапы разработки платформы Venus

Документ описывает полный жизненный цикл проекта Venus и расширяет манифест ([`docs/manifest.md`](docs/manifest.md)) практическими шагами. Каждый этап включает технические особенности, точки контроля и артефакты, чтобы команда могла двигаться предсказуемо и без потерь контекста.

---

## Этап 0. Подготовка инфраструктуры

### 0.1. Выбор хостинга и базовая инфраструктура

**Цель:** определить хостинг-провайдеров и подготовить базовую инфраструктуру.

#### Задачи

1. **Выбор cloud-провайдеров.**
    - **Compute:**
      - Production: AWS ECS/EKS, Google Cloud Run, или DigitalOcean Kubernetes
      - Stage: Railway, Render, или Fly.io для быстрого деплоя
    - **Database:**
      - PostgreSQL: AWS RDS, Supabase, или Railway Postgres
      - Redis: Redis Cloud, AWS ElastiCache
    - **Object Storage:**
      - Cloudflare R2 (no egress fees)
      - AWS S3 с CloudFront CDN
      - Backblaze B2

2. **Регистрация доменов.**
    - Основной домен: `venus.app` (или аналогичный)
    - Поддомены: `api.venus.app`, `cdn.venus.app`, `admin.venus.app`
    - DNS через Cloudflare для защиты и производительности

3. **SSL/TLS сертификаты.**
    - Let's Encrypt через Certbot или AWS Certificate Manager
    - Автоматическое обновление сертификатов

4. **Secrets management.**
    - HashiCorp Vault в Docker для self-hosted
    - AWS Secrets Manager для облачных развертываний
    - Структура секретов:
      ```
      /venus/
        /database/
          postgres_url
          redis_url
        /auth/
          jwt_secret
          session_secret
        /media/
          s3_access_key
          s3_secret_key
        /ai/
          openai_api_key
      ```

#### Артефакты
- [`infrastructure/cloud-setup.md`](../infrastructure/cloud-setup.md) — выбор провайдеров и конфигурация
- [`infrastructure/domains.md`](../infrastructure/domains.md) — DNS записи и настройка
- [`.env.example`](../.env.example) — шаблон переменных окружения

#### Контрольные вопросы
- Выбраны ли провайдеры для всех компонентов?
- Зарегистрированы ли домены и настроен ли DNS?
- Настроен ли secrets manager?

---

### 0.2. Docker и Docker Compose каркас

**Цель:** создать базовую структуру проекта с Docker Compose.

#### Задачи

1. **Структура директорий.**
    ```
    venus/
    ├── frontend/              # Next.js приложение
    ├── services/
    │   ├── api-gateway/      # Express API Gateway
    │   ├── auth-service/     # Аутентификация и авторизация
    │   ├── project-service/  # Управление проектами
    │   ├── persona-service/  # Управление персонами
    │   ├── media-service/    # Обработка медиа
    │   └── ai-cv-service/    # AI генерация CV
    ├── shared/
    │   ├── types/            # TypeScript типы
    │   ├── utils/            # Общие утилиты
    │   └── config/           # Общие конфигурации
    ├── infrastructure/
    │   ├── postgres/         # DB миграции и seeds
    │   ├── redis/            # Redis конфигурация
    │   └── monitoring/       # Grafana, Prometheus
    ├── tests/                # E2E и integration тесты
    └── docker-compose.yml
    ```

2. **Docker Compose файл.**
    - Базовый `docker-compose.yml` с networking
    - `docker-compose.dev.yml` для локальной разработки
    - `docker-compose.prod.yml` для production

3. **Makefile автоматизация.**
    ```makefile
    dev:           # Запуск в dev режиме
    build:         # Сборка всех образов
    up:            # Запуск всех сервисов
    down:          # Остановка
    logs:          # Просмотр логов
    test:          # Запуск тестов
    migrate:       # Запуск миграций БД
    seed:          # Заполнение тестовыми данными
    ```

4. **Pre-commit hooks.**
    - Linting (ESLint, Prettier)
    - Type checking (TypeScript)
    - Commit message validation

#### Артефакты
- [`docker-compose.yml`](../docker-compose.yml) — основная конфигурация
- [`docker-compose.dev.yml`](../docker-compose.dev.yml) — dev overrides
- [`Makefile`](../Makefile) — автоматизация команд
- `.pre-commit-config.yaml` — pre-commit hooks

#### Контрольные вопросы
- Docker Compose структура создана и валидируется?
- Make команды работают корректно?
- Pre-commit hooks установлены?

---

## Этап 1. Технический стек и ядро

### 1.1. Выбор технологического стека

**Цель:** определить конкретные технологии для каждого компонента системы.

**Технологический стек проекта:** См. [`docs/stack.md`](stack.md)

**Краткий обзор:**
- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Node.js + Express/Fastify + Prisma/Drizzle
- Database: PostgreSQL + Redis
- Media: Sharp + S3/R2 + CDN
- AI: OpenAI API
- Monitoring: Prometheus + Grafana + Sentry

**Готовые решения:** См. [`docs/stack.md`](stack.md) раздел "Ready-to-Use Solutions" для интеграции вместо написания с нуля.

#### Артефакты
- [`docs/stack.md`](stack.md) — полное описание технологий
- `package.json` в каждом сервисе с зависимостями

---

### 1.2. База данных и схема данных

**Цель:** спроектировать и реализовать схему базы данных.

#### Основные таблицы

```sql
-- Аккаунты
accounts (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Персоны
personas (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts,
  slug VARCHAR UNIQUE,
  display_name VARCHAR,
  manifest TEXT,
  settings JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Проекты
projects (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts,
  title VARCHAR,
  slug VARCHAR,
  type VARCHAR, -- album, main-project
  content JSONB, -- плейсхолдеры и контент
  status VARCHAR, -- draft, published
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  published_at TIMESTAMP
)

-- Связь проектов с персонами
persona_projects (
  id UUID PRIMARY KEY,
  persona_id UUID REFERENCES personas,
  project_id UUID REFERENCES projects,
  display_order INTEGER,
  is_visible BOOLEAN,
  UNIQUE(persona_id, project_id)
)

-- Медиа файлы
media_files (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts,
  filename VARCHAR,
  storage_path VARCHAR,
  mime_type VARCHAR,
  size_bytes BIGINT,
  metadata JSONB, -- dimensions, duration, etc.
  created_at TIMESTAMP
)

-- CV генерации
cv_generations (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts,
  persona_id UUID REFERENCES personas,
  content JSONB,
  pdf_url VARCHAR,
  created_at TIMESTAMP
)
```

#### Миграции
- Использовать Prisma Migrate или Drizzle Kit
- Версионирование миграций
- Rollback стратегия

#### Артефакты
- [`infrastructure/postgres/schema.sql`](../infrastructure/postgres/schema.sql) — SQL схема
- [`infrastructure/postgres/migrations/`](../infrastructure/postgres/migrations/) — миграции
- [`infrastructure/postgres/seeds/`](../infrastructure/postgres/seeds/) — тестовые данные

---

### 1.3. API Gateway и authentication

**Цель:** реализовать единую точку входа для всех API и систему аутентификации.

#### API Gateway

1. **Маршрутизация.**
    ```
    /api/auth/*      → auth-service
    /api/projects/*  → project-service
    /api/personas/*  → persona-service
    /api/media/*     → media-service
    /api/cv/*        → ai-cv-service
    ```

2. **Middleware.**
    - Rate limiting (по IP и по user)
    - CORS configuration
    - Request logging
    - Auth token validation
    - Request/Response transformation

3. **API Versioning.**
    - URL-based: `/api/v1/projects`
    - Header-based опционально

#### Authentication Service

1. **Методы аутентификации.**
    - Email/Password (bcrypt hashing)
    - OAuth providers (опционально): Google, GitHub
    - Magic links (passwordless) опционально

2. **Session management.**
    - JWT access tokens (short-lived, 15 min)
    - Refresh tokens (long-lived, 7 days) в Redis
    - Session revocation support

3. **Authorization.**
    - RBAC (Role-Based Access Control):
      - User: CRUD своих ресурсов
      - Admin: CRUD всех ресурсов
    - Resource ownership checks на каждом запросе
    - API rate limiting per user

4. **Security.**
    - Password requirements: min 12 chars, complexity
    - Account lockout после 5 неудачных попыток
    - 2FA опционально (TOTP)

#### Артефакты
- `services/api-gateway/` — реализация gateway
- `services/auth-service/` — реализация auth
- [`docs/api-reference.md`](api-reference.md) — API документация
- OpenAPI/Swagger specs

---

## Этап 2. Медиа-подсистема

### 2.1. Хранение и управление медиа

**Цель:** реализовать efficient систему загрузки, хранения и доставки медиа-контента.

#### Задачи

1. **Upload flow.**
    ```
    Frontend → API Gateway → Media Service
                                ↓
                           Validation
                                ↓
                      Processing (resize, optimize)
                                ↓
                         Upload to S3/R2
                                ↓
                      Save metadata to DB
                                ↓
                       Return CDN URLs
    ```

2. **Поддерживаемые форматы.**
    - **Images:** JPEG, PNG, WebP, AVIF, SVG
    - **Videos:** MP4, WebM (опционально)
    - **Documents:** PDF (для uploaded CV/portfolio)
    - **Max sizes:**
      - Images: 10MB
      - Videos: 100MB
      - Documents: 20MB

3. **Image processing.**
    - Автоматический resize:
      - Thumbnail: 400x400
      - Medium: 1200x800
      - Large: 2400x1600
      - Original: сохраняется
    - Format conversion: оригинал → WebP + AVIF для modern browsers
    - Compression: quality 85% для баланса размер/качество
    - EXIF data removal для privacy

4. **Video processing (опционально).**
    - Thumbnail extraction (первый кадр)
    - Format conversion: MP4 H.264 для совместимости
    - Компрессия для web delivery

5. **Storage strategy.**
    - **Hot storage:** S3/R2 Standard для активных файлов
    - **Cold storage:** S3 Glacier для старых/неиспользуемых (future)
    - **Path structure:** `/{account_id}/{year}/{month}/{filename}`
    - **CDN:** Cloudflare CDN для fast delivery

6. **Квоты и лимиты.**
    - Free tier: 1GB storage, 5GB bandwidth/month
    - Pro tier: 10GB storage, 50GB bandwidth/month
    - Team tier: 50GB storage, 250GB bandwidth/month

#### Артефакты
- `services/media-service/` — реализация медиа-сервиса
- [`docs/media-management.md`](media-management.md) — документация
- [`docs/storage-quotas.md`](storage-quotas.md) — квоты и тарифы

#### Контрольные вопросы
- Uploads работают для всех supported форматов?
- Processing pipeline корректно обрабатывает все типы?
- CDN правильно кэширует контент?
- Квоты отслеживаются и enforced?

---

## Этап 3. Безопасность и приватность

### 3.1. Безопасность на уровне приложения

**Цель:** реализовать базовые security practices без чрезмерного усложнения.

#### Задачи

1. **Input validation.**
    - Все входные данные валидируются через Zod schemas
    - SQL injection защита через ORM (Prisma)
    - XSS защита через sanitization в формах
    - File upload validation (content-type, magic bytes)

2. **Authentication security.**
    - Bcrypt для password hashing (cost factor 12)
    - JWT с коротким TTL (15 минут)
    - Refresh token rotation
    - Secure cookie settings: httpOnly, secure, sameSite=strict

3. **Authorization.**
    - RBAC (Role-Based Access Control):
      - User: CRUD своих ресурсов
      - Admin: CRUD всех ресурсов
    - Resource ownership checks на каждом запросе
    - API rate limiting per user

4. **Data privacy.**
    - GDPR compliance:
      - Data export endpoint
      - Account deletion endpoint
      - Privacy policy и terms of service
    - Email не показывается публично
    - Analytics opt-out опция

5. **API security.**
    - CORS правильно настроен
    - HTTPS everywhere (force redirect)
    - Security headers:
      ```
      Content-Security-Policy
      X-Frame-Options: DENY
      X-Content-Type-Options: nosniff
      Referrer-Policy: strict-origin-when-cross-origin
      ```
    - Rate limiting: 100 req/min per IP, 200 req/min per user

6. **Dependency security.**
    - Регулярные `npm audit`
    - Dependabot для автоматических updates
    - Snyk scanning в CI/CD

#### Артефакты
- [`docs/security-practices.md`](security-practices.md) — security guidelines
- [`docs/privacy-policy.md`](privacy-policy.md) — privacy policy
- `.github/workflows/security-scan.yml` — автоматическое сканирование

#### Контрольные вопросы
- Все endpoints защищены authentication/authorization?
- Secrets не хранятся в git?
- Security headers настроены?
- GDPR compliance реализован?

---

## Этап 4. Core Features Implementation

### 4.1. Проекты и альбомы

**Цель:** реализовать систему проектов-альбомов с плейсхолдерами.

#### Задачи

1. **Placeholder system.**
    - JSON структура для хранения в БД:
      ```json
      {
        "placeholders": [
          {
            "id": "uuid",
            "type": "cover",
            "order": 1,
            "content": {
              "image": "media_file_id",
              "title": "Project Title",
              "subtitle": "Brief description"
            }
          }
        ]
      }
      ```

2. **Placeholder types.**
    - Cover (обложка)
    - Meta (мета-информация)
    - Context (контекст и задачи)
    - Role (роль автора)
    - Process (процесс)
    - Gallery (галерея результатов)
    - Technical (технический блок)
    - Results (результаты и влияние)
    - Credits (команда)

3. **CRUD operations.**
    - Create project
    - Read project (draft/published)
    - Update project
    - Delete project
    - Reorder placeholders (drag-and-drop)
    - Enable/disable placeholders
    - Duplicate placeholders

4. **Project publishing.**
    - Draft → Published flow
    - URL slugs generation (unique)
    - Preview mode для drafts
    - Version history (опционально future feature)

#### Артефакты
- `services/project-service/` — реализация
- [`docs/placeholder-system.md`](placeholder-system.md) — документация
- Frontend компоненты для каждого placeholder type

---

### 4.2. Персоны и публичные страницы

**Цель:** реализовать систему персон и их публичных страниц.

#### Задачи

1. **Persona management.**
    - CRUD операции для персон
    - Slug generation (unique per account)
    - Profile settings:
      - Display name
      - Bio/manifest
      - Avatar
      - Contact method (email, form, messenger link)
    - Privacy settings:
      - Public/unlisted/private

2. **Project assignment.**
    - Assign project to one or multiple personas
    - Set visibility per persona
    - Set display order per persona
    - Bulk operations

3. **Main-project.**
    - Special project type "main-project"
    - References to other projects (не дублирует)
    - Featured sections:
      - Selected works
      - Brief descriptions
      - Links to full projects

4. **Public page rendering.**
    - SSG с ISR (Incremental Static Regeneration)
    - SEO meta tags
    - Schema.org markup
    - Grid layout с lazy loading

#### Артефакты
- `services/persona-service/` — реализация
- Frontend pages: `/[persona-slug]`
- [`docs/persona-system.md`](persona-system.md) — документация

---

### 4.3. AI-CV генерация

**Цель:** реализовать автоматическую генерацию CV из портфолио.

#### Задачи

1. **Data aggregation.**
    - Собрать данные из account, personas, projects
    - Создать structured data object для AI

2. **AI processing.**
    - OpenAI GPT-4 или Claude 2
    - Professional CV generation prompt
    - Fallback на template-based если AI недоступен

3. **PDF generation.**
    - Puppeteer или React-PDF
    - Multiple CV templates
    - Customization options

4. **Storage и delivery.**
    - PDF storage в S3/R2
    - Expiring URLs (7 days)
    - Re-generation по запросу
    - History последних 5 CVs

#### Артефакты
- `services/ai-cv-service/` — реализация
- PDF templates
- [`docs/ai-cv-guide.md`](ai-cv-guide.md) — документация

---

## Этап 5. SEO и Performance

### 5.1. SEO оптимизация

**Цель:** обеспечить максимальную видимость в поисковых системах.

#### Задачи

1. **URL structure.**
    - Persona pages: `/@{persona-slug}`
    - Project pages: `/@{persona-slug}/project/{project-slug}`
    - Clean URLs, no query parameters
    - Canonical URLs для всех страниц

2. **Meta tags.**
    - Dynamic title, description для каждой страницы
    - Open Graph tags для social sharing
    - Twitter Card tags

3. **Structured data.**
    - Schema.org Person для persona pages
    - Schema.org CreativeWork для project pages
    - Breadcrumbs schema

4. **Sitemap.**
    - Dynamic sitemap generation
    - Submit to Google Search Console
    - `robots.txt` configuration

5. **Performance для SEO.**
    - Core Web Vitals optimization
    - Image optimization (Next.js Image)
    - Font optimization (next/font)
    - Code splitting

#### Артефакты
- SEO middleware в Next.js
- `public/sitemap.xml` generation
- `public/robots.txt`
- Google Analytics / Plausible integration

---

### 5.2. Performance оптимизация

**Цель:** обеспечить быструю загрузку и отзывчивость.

#### Задачи

1. **Frontend optimization.**
    - Next.js App Router с Server Components
    - Code splitting на route level
    - Dynamic imports для heavy components
    - Suspense boundaries для loading states

2. **Image optimization.**
    - Next.js Image component
    - Lazy loading
    - WebP/AVIF formats с fallback
    - Responsive images (srcset)

3. **Caching strategy.**
    - CDN caching для static assets (1 year)
    - API response caching в Redis
    - Browser caching headers
    - ISR для динамических страниц (revalidate: 60s)

4. **Database optimization.**
    - Indexes на frequently queried columns
    - Connection pooling
    - Query optimization (N+1 prevention)

5. **Monitoring.**
    - Real User Monitoring
    - Lighthouse CI в GitHub Actions
    - Performance budgets

#### Артефакты
- Performance monitoring dashboards
- Lighthouse CI configuration
- [`docs/performance-guide.md`](performance-guide.md)

---

## Этап 6. Internationalization

### 6.1. Multi-language support

**Цель:** добавить поддержку нескольких языков интерфейса.

#### Задачи

1. **i18n setup.**
    - Next.js i18n routing
    - next-intl или react-i18next
    - Supported languages: English, Russian
    - Language detection: URL prefix, Accept-Language

2. **Translation files.**
    ```
    locales/
    ├── en/
    │   ├── common.json
    │   ├── projects.json
    │   └── cv.json
    └── ru/
        ├── common.json
        ├── projects.json
        └── cv.json
    ```

3. **Content localization.**
    - UI strings: fully translated
    - User-generated content: language-agnostic
    - Date/time formatting per locale
    - Number formatting per locale

4. **SEO для i18n.**
    - hreflang tags
    - Separate sitemaps per language
    - Language-specific meta tags

#### Артефакты
- `locales/` директория с переводами
- i18n configuration
- [`docs/i18n-guide.md`](i18n-guide.md)

---

## Этап 7. Development и Deployment

### 7.1. Development workflow

**Цель:** настроить эффективный workflow для разработки.

#### Задачи

1. **Local development.**
    - Hot reload для всех сервисов
    - Dev database с seed data
    - Mock data generators
    - Environment: `NODE_ENV=development`

2. **Code quality.**
    - ESLint configuration
    - Prettier configuration
    - TypeScript strict mode
    - Husky pre-commit hooks

3. **Testing strategy.**
    - Unit tests: Jest + Testing Library
    - Integration tests: Supertest для API
    - E2E tests: Playwright для critical flows
    - Test coverage target: >80%

4. **Documentation.**
    - Code comments для сложной логики
    - README в каждом сервисе
    - API documentation (Swagger/OpenAPI)
    - Architecture Decision Records (ADR)

#### Артефакты
- Testing configuration
- ESLint/Prettier configs
- [`docs/developer-guide.md`](developer-guide.md)
- [`docs/testing-guide.md`](testing-guide.md)

---

### 7.2. CI/CD Pipeline

**Цель:** автоматизировать тестирование и развертывание.

#### Stages

```yaml
stages:
   - lint             # Code quality
   - test             # Unit + Integration tests
   - build            # Docker images build
   - security-scan    # Dependency vulnerabilities
   - deploy-stage   # Auto deploy to stage
   - e2e-test         # E2E tests on stage
   - deploy-prod      # Manual deploy to production
```

#### Tools
- **CI/CD Platform:** GitHub Actions или GitLab CI
- **Image Registry:** Docker Hub, GitHub Container Registry, или AWS ECR
- **Deployment:** Railway / Render для simple deploys, AWS ECS / Google Cloud Run для production, Kubernetes для масштабирования

#### Артефакты
- `.github/workflows/` — CI/CD workflows
- `Dockerfile` в каждом сервисе
- [`docs/ci-cd-pipeline.md`](ci-cd-pipeline.md) — детальная документация
- [`docs/deployment-guide.md`](deployment-guide.md) — руководство по деплою

---

### 7.3. Monitoring и Observability

**Цель:** обеспечить видимость состояния системы.

#### Задачи

1. **Logging.**
    - Structured logging (JSON format)
    - Log levels: error, warn, info, debug
    - Correlation IDs для трассировки запросов
    - Centralized logging: Loki + Grafana, или CloudWatch Logs, или Datadog

2. **Metrics.**
    - Application metrics: request rate, latency, error rate, database query times, media processing times
    - Business metrics: new user signups, projects created, CV generations
    - Infrastructure metrics: CPU, Memory usage, Disk I/O
    - Tools: Prometheus + Grafana

3. **Error tracking.**
    - Sentry для exception tracking
    - Alerts на critical errors
    - Error rate thresholds

4. **Health checks.**
    - `/health` endpoint на каждом сервисе
    - Database connectivity check
    - Redis connectivity check
    - S3/R2 connectivity check

5. **Dashboards.**
    - System overview dashboard
    - Service-specific dashboards
    - Business metrics dashboard

#### Артефакты
- `infrastructure/monitoring/` — Grafana dashboards
- Health check endpoints
- [`docs/monitoring-guide.md`](monitoring-guide.md)

---

## Этап 8. API и расширяемость

### 8.1. Public API

**Цель:** предоставить API для внешних интеграций.

#### Задачи

1. **API endpoints (read-only initially).**
    - Get persona by slug
    - Get persona projects
    - Get project by slug
    - List public personas

2. **API authentication.**
    - API keys для external access
    - Rate limiting: 100 req/hour для free tier

3. **API documentation.**
    - Swagger/OpenAPI spec
    - Interactive API explorer
    - Code examples (JavaScript, Python, cURL)

4. **Webhooks (future).**
    - Project published event
    - Persona updated event
    - CV generated event

#### Артефакты
- API documentation site
- OpenAPI spec file
- [`docs/api-reference.md`](api-reference.md)

---

## Контрольные точки (Milestones)

### КТ1: Минимальный MVP
**Состояние:** Аккаунт → Одна персона → Проекты-альбомы → Публичная страница

**Что работает:**
- Регистрация и логин
- Создание одной персоны
- CRUD проектов с базовыми плейсхолдерами
- Публичная страница персоны с сеткой проектов
- Базовое SEO

**Критерии приёмки:**
- [ ] Пользователь может зарегистрироваться
- [ ] Пользователь может создать персону
- [ ] Пользователь может создать проект с 3+ плейсхолдерами
- [ ] Публичная страница доступна по URL
- [ ] Lighthouse score > 90

---

### КТ2: Множественные персоны
**Состояние:** Несколько персон + main-проекты

**Что работает:**
- Создание multiple персон
- Main-проект для каждой персоны
- Assignment проектов к разным персонам
- Независимые публичные страницы

**Критерии приёмки:**
- [ ] Пользователь может создать 3+ персоны
- [ ] Каждая персона имеет свой main-проект
- [ ] Проект может быть виден в разных персонах
- [ ] Порядок проектов независим в каждой персоне

---

### КТ3: Редактор альбомов
**Состояние:** Полнофункциональный редактор с недеструктивностью

**Что работает:**
- Drag-and-drop для reordering плейсхолдеров
- Enable/disable плейсхолдеров
- Duplicate плейсхолдеров
- Preview mode
- Auto-save

**Критерии приёмки:**
- [ ] Все типы плейсхолдеров работают
- [ ] Reordering сохраняется корректно
- [ ] Preview соответствует published
- [ ] История изменений (опционально)

---

### КТ4: AI-CV
**Состояние:** Автоматическая генерация резюме

**Что работает:**
- AI анализ портфолио
- Генерация structured CV
- PDF generation с темами
- Download и sharing

**Критерии приёмки:**
- [ ] AI корректно извлекает данные
- [ ] CV содержит все релевантные секции
- [ ] PDF генерируется за <10 секунд
- [ ] Пользователь может скачать PDF

---

## Порядок применения документа

1. Следовать этапам последовательно, начиная с этапа 0.
2. Для каждого этапа выполнять все задачи и проверять контрольные вопросы.
3. Фиксировать прогресс в [`./CHANGELOG.md`](project_passport.md).
4. Регулярно обновлять [`docs/traceability-matrix.md`](traceability-matrix.md).
5. Контрольные точки (КТ1-4) использовать как milestones для релизов.

## Related Documentation

- [`docs/git_managment.md`](git_managment.md) — Git workflow и releases
- [`infrastructure/cloud/secrets-management.md`](infrastructure/cloud/secrets-management.md) — Secrets handling
- [`infrastructure/cloud/domains.md`](infrastructure/cloud/domains.md) — DNS и SSL setup
- [`docs/stack.md`](stack.md) — Technology stack
- [`docs/manifest.md`](manifest.md) — философия и архитектура проекта
- [`docs/codex.md`](codex.md) — корневые правила проекта
- [`docs/stages.md`](stages.md) — этапы разработки
- [`docs/traceability-matrix.md`](traceability-matrix.md) — трассировка требований
- [`docs/directory_tree.md`](directory_tree.md) — структура проекта
- [`docs/project_passport.md`](project_passport.md) — текущее состояние проекта
- [`docs/versions.md`](versions.md) — история версий
- [`docs/api_usage.md`](api_usage.md) — примеры использования API
- [`docs/cloud_setup.md`](cloud_setup.md) — инфраструктура и домены
- [`docs/secrets_management.md`](secrets_management.md) — управление секретами
- [`docs/constitution.md`](constitution.md) — конституция проекта
