# Technology Stack — Технологический стек проекта

Документ описывает технологии, используемые в проекте, и готовые решения, которые можно интегрировать для ускорения разработки.

---

## Содержание

1. [Core Technologies](#core-technologies)
2. [Ready-to-Use Solutions](#ready-to-use-solutions)
3. [Integration Guidelines](#integration-guidelines)

---

## Core Technologies

### Frontend

**Next.js 14+**
- React-фреймворк с Server-Side Rendering (SSR) и Static Site Generation (SSG)
- App Router для modern routing
- Built-in image optimization и performance tools
- [Документация](https://nextjs.org/docs)

**TypeScript**
- Statically typed JavaScript для type-safety
- Strict mode для максимальной безопасности типов
- [Документация](https://www.typescriptlang.org/docs/)

**Tailwind CSS**
- Utility-first CSS framework
- Быстрая разработка с готовыми классами
- Customizable design system
- [Документация](https://tailwindcss.com/docs)

**React Hook Form + Zod**
- Performant форм-менеджмент
- Runtime validation через Zod schemas
- Type-safe форм-обработка
- [React Hook Form](https://react-hook-form.com/) | [Zod](https://zod.dev/)

---

### Backend

**Node.js 20 LTS**
- JavaScript runtime для backend
- LTS версия для стабильности и long-term support
- [Документация](https://nodejs.org/docs/latest-v20.x/api/)

**Express.js / Fastify**
- Web framework для API и микросервисов
- Express: mature экосистема, богатый middleware
- Fastify: performance-focused альтернатива
- [Express](https://expressjs.com/) | [Fastify](https://fastify.dev/)

**Prisma / Drizzle ORM**
- Type-safe database toolkit
- Auto-generated TypeScript types
- Migration management
- [Prisma](https://www.prisma.io/docs) | [Drizzle](https://orm.drizzle.team/)

---

### Database & Cache

**PostgreSQL 16+**
- Relational database с advanced features
- JSONB для flexible schemas
- Full-text search
- Row Level Security для multi-tenancy
- [Документация](https://www.postgresql.org/docs/16/)

**Redis 7+**
- In-memory cache и session storage
- Pub/Sub для real-time features
- Rate limiting support
- [Документация](https://redis.io/docs/)

---

### Storage & CDN

**Cloudflare R2 / AWS S3**
- Object storage для медиа-файлов
- R2: S3-compatible без egress fees
- S3: mature ecosystem
- [R2](https://developers.cloudflare.com/r2/) | [S3](https://docs.aws.amazon.com/s3/)

**Cloudflare CDN**
- Global content delivery network
- Automatic caching и optimization
- DDoS protection
- [Документация](https://developers.cloudflare.com/cache/)

**Sharp**
- High-performance Node.js image processing
- Resize, crop, format conversion
- WebP/AVIF generation
- [Документация](https://sharp.pixelplumbing.com/)

---

### AI/ML

**OpenAI API**
- GPT-4 для CV generation
- Text embeddings для semantic search
- [Документация](https://platform.openai.com/docs)

**Альтернативы:**
- Anthropic Claude
- Local LLaMA models (для self-hosted)

---

### DevOps & Monitoring

**Docker + Docker Compose**
- Containerization платформы
- Orchestration через Compose
- [Docker](https://docs.docker.com/) | [Compose](https://docs.docker.com/compose/)

**Prometheus + Grafana**
- Metrics collection (Prometheus)
- Visualization и alerting (Grafana)
- [Prometheus](https://prometheus.io/docs/) | [Grafana](https://grafana.com/docs/)

**Loki + Promtail**
- Centralized logging
- Log aggregation и search
- [Документация](https://grafana.com/docs/loki/latest/)

**Sentry**
- Error tracking и monitoring
- Real-time alerts
- Performance monitoring
- [Документация](https://docs.sentry.io/)

---

## Ready-to-Use Solutions

Готовые решения, которые можно интегрировать в проект для делегирования функций вместо написания с нуля.

### 1. Authentication & Authorization

**Supabase Auth**
- Complete auth solution из коробки
- Email/password, OAuth providers, magic links
- Row Level Security integration
- **Delegate:** User registration, login, session management
- [Документация](https://supabase.com/docs/guides/auth)

**Clerk**
- Drop-in authentication для React/Next.js
- Beautiful pre-built UI components
- Multi-tenancy support
- **Delegate:** Весь auth flow + user management UI
- [Документация](https://clerk.com/docs)

**Auth0**
- Enterprise-grade authentication
- Customizable login flows
- Advanced security features
- **Delegate:** Auth infrastructure, 2FA, SSO
- [Документация](https://auth0.com/docs)

---

### 2. Media Processing & CDN

**Cloudinary**
- Full-featured media management platform
- Automatic optimization и transformations
- Global CDN delivery
- **Delegate:** Image/video processing, storage, delivery
- [Документация](https://cloudinary.com/documentation)

**imgix**
- Real-time image processing через URL parameters
- Advanced optimization
- Global CDN
- **Delegate:** Dynamic image transformations
- [Документация](https://docs.imgix.com/)

**Uploadcare**
- File uploading и processing service
- Widget для UI
- CDN delivery
- **Delegate:** File upload flow + processing
- [Документация](https://uploadcare.com/docs/)

---

### 3. Database & Backend-as-a-Service

**Supabase**
- Open-source Firebase alternative
- PostgreSQL + real-time subscriptions
- Auto-generated REST API
- Storage, auth, functions
- **Delegate:** Database + auth + storage + API generation
- [Документация](https://supabase.com/docs)

**Hasura**
- Instant GraphQL API поверх PostgreSQL
- Real-time subscriptions
- Authorization из коробки
- **Delegate:** API layer generation
- [Документация](https://hasura.io/docs/latest/index/)

**PocketBase**
- Single-file Go backend
- SQLite database
- Built-in auth, file storage, real-time
- **Delegate:** Complete backend для MVPs
- [Документация](https://pocketbase.io/docs/)

---

### 4. CMS & Content Management

**Sanity.io**
- Structured content platform
- Customizable schemas
- Real-time collaboration
- **Delegate:** Content management для project descriptions
- [Документация](https://www.sanity.io/docs)

**Payload CMS**
- Open-source headless CMS
- TypeScript-first
- Self-hosted
- **Delegate:** Admin panel для контента
- [Документация](https://payloadcms.com/docs)

**Strapi**
- Open-source headless CMS
- Auto-generated admin panel
- REST + GraphQL APIs
- **Delegate:** Content management + admin UI
- [Документация](https://docs.strapi.io/)

---

### 5. Search

**Algolia**
- Hosted search service
- Instant search experience
- Typo tolerance, faceting
- **Delegate:** Site-wide search функциональность
- [Документация](https://www.algolia.com/doc/)

**Meilisearch**
- Open-source search engine
- Self-hosted
- Fast и easy to setup
- **Delegate:** Full-text search для проектов/персон
- [Документация](https://www.meilisearch.com/docs)

**TypeSense**
- Open-source search engine
- Typo tolerance из коробки
- Self-hosted или cloud
- **Delegate:** Search infrastructure
- [Документация](https://typesense.org/docs/)

---

### 6. Email & Notifications

**Resend**
- Modern email API для developers
- React Email integration
- Transactional emails
- **Delegate:** Email delivery (verification, notifications)
- [Документация](https://resend.com/docs)

**SendGrid / Mailgun**
- Mature email platforms
- High deliverability rates
- Template management
- **Delegate:** Email infrastructure
- [SendGrid](https://docs.sendgrid.com/) | [Mailgun](https://documentation.mailgun.com/)

---

### 7. Analytics & Monitoring

**Plausible Analytics**
- Privacy-friendly web analytics
- Open-source, self-hosted опция
- Simple dashboard
- **Delegate:** User analytics без GDPR проблем
- [Документация](https://plausible.io/docs)

**PostHog**
- Open-source product analytics
- Feature flags, A/B testing
- Session replay
- **Delegate:** Product analytics + experimentation
- [Документация](https://posthog.com/docs)

**Vercel Analytics**
- Built-in для Next.js на Vercel
- Real User Monitoring
- Core Web Vitals tracking
- **Delegate:** Performance monitoring
- [Документация](https://vercel.com/docs/analytics)

---

### 8. PDF Generation

**Puppeteer**
- Headless Chrome для PDF rendering
- HTML/CSS → PDF
- Full control над рендерингом
- **Delegate:** CV PDF generation
- [Документация](https://pptr.dev/)

**React-PDF**
- React компоненты для PDF creation
- Declarative PDF structure
- Lightweight альтернатива Puppeteer
- **Delegate:** PDF template rendering
- [Документация](https://react-pdf.org/)

**PDFKit**
- Low-level PDF generation library
- Fine-grained control
- Streaming generation
- **Delegate:** Программный PDF creation
- [Документация](https://pdfkit.org/)

---

### 9. Form Handling & Validation

**tRPC**
- End-to-end typesafe APIs
- No code generation
- Automatic type inference
- **Delegate:** Type-safe API layer между frontend/backend
- [Документация](https://trpc.io/docs)

**Zod**
- TypeScript-first schema validation
- Runtime type checking
- Parse, validate, transform data
- **Delegate:** Input validation на всех уровнях
- [Документация](https://zod.dev/)

---

### 10. Deployment & Hosting

**Vercel**
- Оптимизировано для Next.js
- Automatic deployments от git
- Global edge network
- **Delegate:** Frontend hosting + edge functions
- [Документация](https://vercel.com/docs)

**Railway**
- Simple deployment для fullstack apps
- PostgreSQL, Redis из коробки
- Git-based deploys
- **Delegate:** Complete infrastructure для MVP
- [Документация](https://docs.railway.app/)

**Render**
- Alternative Heroku
- Static sites, web services, databases
- Auto-scaling
- **Delegate:** Backend hosting + databases
- [Документация](https://render.com/docs)

**Fly.io**
- Deploy близко к users (global regions)
- PostgreSQL, Redis support
- Docker-native
- **Delegate:** Geo-distributed deployments
- [Документация](https://fly.io/docs/)

---

### 11. Real-time Features

**Pusher**
- Hosted WebSocket infrastructure
- Присутствие, каналы, события
- Client libraries для всех платформ
- **Delegate:** Real-time collaboration features
- [Документация](https://pusher.com/docs)

**Ably**
- Real-time messaging platform
- Pub/sub, presence, history
- Global edge network
- **Delegate:** Real-time updates в portfolio
- [Документация](https://ably.com/docs)

**Socket.io**
- Open-source WebSocket library
- Self-hosted
- Automatic fallbacks
- **Delegate:** Custom real-time features
- [Документация](https://socket.io/docs/)

---

### 12. Secrets Management

**HashiCorp Vault**
- Industry-standard secrets management
- Encryption, access control
- Self-hosted или cloud
- **Delegate:** Secrets storage + rotation
- [Документация](https://developer.hashicorp.com/vault/docs)

**Doppler**
- Modern secrets management
- Git-like workflow для secrets
- Multi-environment support
- **Delegate:** Environment variables управление
- [Документация](https://docs.doppler.com/)

**AWS Secrets Manager**
- Managed secrets service
- Automatic rotation
- IAM integration
- **Delegate:** Cloud-native secrets
- [Документация](https://docs.aws.amazon.com/secretsmanager/)

---

### 13. Testing

**Playwright**
- End-to-end testing framework
- Multi-browser support
- Auto-wait, screenshots, videos
- **Delegate:** E2E testing infrastructure
- [Документация](https://playwright.dev/docs/intro)

**k6**
- Load testing tool
- JavaScript DSL для tests
- CI/CD integration
- **Delegate:** Performance testing
- [Документация](https://k6.io/docs/)

**Jest + Testing Library**
- Unit testing framework
- React component testing
- Coverage reporting
- **Delegate:** Unit/integration tests
- [Jest](https://jestjs.io/docs/getting-started) | [Testing Library](https://testing-library.com/docs/)

---

### 14. Internationalization (i18n)

**next-intl**
- i18n library для Next.js App Router
- Type-safe translations
- Server Components support
- **Delegate:** Multi-language infrastructure
- [Документация](https://next-intl-docs.vercel.app/)

**react-i18next**
- Mature i18n solution
- Plugins ecosystem
- Framework-agnostic
- **Delegate:** Translation management
- [Документация](https://react.i18next.com/)

---

### 15. Component Libraries

**shadcn/ui**
- Re-usable React components
- Customizable, copy-paste подход
- Built на Radix UI + Tailwind
- **Delegate:** UI component foundation
- [Документация](https://ui.shadcn.com/docs)

**Radix UI**
- Unstyled, accessible components
- WAI-ARIA compliant
- Headless для полной кастомизации
- **Delegate:** Accessibility foundation
- [Документация](https://www.radix-ui.com/docs/primitives/overview/introduction)

**Headless UI**
- Unstyled components от Tailwind team
- Fully accessible
- Tight Tailwind integration
- **Delegate:** Accessible UI primitives
- [Документация](https://headlessui.com/)

---

## Integration Guidelines

### Когда использовать готовые решения

**✅ Используйте когда:**
- Функциональность commodity (auth, email, search)
- Time-to-market критичен
- Нет специфических требований
- Решение well-maintained и popular
- Cost-effective для вашего scale

**❌ Пишите сами когда:**
- Требования уникальные для проекта
- Нужен полный control над логикой
- Vendor lock-in неприемлем
- Готовое решение overkill для задачи
- Learning opportunity важнее скорости

---

### Критерии выбора решения

**Оценивайте:**

1. **Maturity:**
   - Production-ready?
   - Active maintenance?
   - Community size?

2. **Documentation:**
   - Comprehensive?
   - Up-to-date?
   - Good examples?

3. **Licensing:**
   - Compatible с вашей лицензией?
   - Open-source или proprietary?
   - Pricing model?

4. **Integration complexity:**
   - How hard to integrate?
   - Breaking changes frequency?
   - Migration path существует?

5. **Performance:**
   - Latency impact?
   - Scalability?
   - Resource usage?

6. **Security:**
   - Security track record?
   - Update frequency?
   - Compliance certifications?

---

### Decision Matrix Template

Для принятия решения используйте следующую матрицу:

| Критерий | Build | Solution A | Solution B | Solution C |
|----------|-------|------------|------------|------------|
| **Time to implement** | 4 weeks | 1 week | 2 weeks | 1 week |
| **Monthly cost** | $0 | $50 | $0 (OS) | $100 |
| **Maintenance burden** | High | Low | Medium | Low |
| **Customization** | Full | Limited | High | Medium |
| **Vendor lock-in risk** | None | High | None | Medium |
| **Learning curve** | 2 weeks | 1 day | 1 week | 2 days |
| **ИТОГО Score** | ... | ... | ... | ... |

---

### Не изобретайте велосипед

**Commodity functions (используйте готовые):**
- ✅ Authentication (Clerk, Supabase Auth, Auth0)
- ✅ Email delivery (Resend, SendGrid)
- ✅ Media processing (Cloudinary, imgix)
- ✅ Search (Algolia, Meilisearch)
- ✅ Analytics (Plausible, PostHog)
- ✅ Monitoring (Sentry, Grafana Cloud)
- ✅ CDN (Cloudflare, AWS CloudFront)

**Core business logic (пишите сами):**
- ❌ Placeholder system (уникальная фича)
- ❌ Multi-persona architecture (core differentiator)
- ❌ Album структура (ключевая ценность)
- ❌ AI-CV prompts и логика (competitive advantage)

---


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