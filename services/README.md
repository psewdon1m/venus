# services/ — Микросервисы backend Venus

**Последнее обновление:** 2025-12-01
**Статус:** v0.1.2-alpha - полная безопасность, S3 интеграция и admin инструменты

---

## Назначение папки

Папка `services/` содержит все backend микросервисы проекта Venus. Каждый сервис — это независимое Node.js приложение с Express/Fastify, отвечающее за определенную бизнес-домен:

- **API Gateway** — единая точка входа и маршрутизация
- **Auth Service** — аутентификация и авторизация
- **Project Service** — управление проектами-портфолио
- **Persona Service** — управление публичными персонами
- **Media Service** — обработка и хранение медиафайлов
- **AI-CV Service** — генерация резюме через OpenAI

---

## Архитектура микросервисов

### Общая структура каждого сервиса

```
service-name/
├── src/
│   ├── index.ts          # Точка входа, Express app
│   ├── middleware/       # Express middleware
│   ├── routes/           # API маршруты
│   └── utils/            # Вспомогательные функции
├── Dockerfile            # Production образ
├── Dockerfile.dev        # Development образ
├── package.json          # Зависимости и скрипты
├── tsconfig.json         # TypeScript конфигурация
└── README.md             # Документация сервиса
```

### Принципы построения

#### 1. Domain-Driven Design
- Каждый сервис отвечает за один bounded context
- Четкие границы ответственности
- Независимое развертывание

#### 2. API First
- RESTful API с OpenAPI спецификацией
- Type-safe contracts через shared types
- Versioned endpoints (future)

#### 3. Infrastructure as Code
- Docker для containerization
- Environment-based configuration
- Health checks для monitoring

---

## Сервисы детально

### 1. API Gateway (`api-gateway/`)

**Порт:** 4000  
**Назначение:** Единая точка входа для всех клиентских запросов

#### Функциональность
- **Маршрутизация** — проксирование запросов к соответствующим сервисам
- **Аутентификация** — JWT токены и middleware
- **Rate Limiting** — защита от abuse (100 req/min per user)
- **CORS** — cross-origin resource sharing
- **Logging** — centralized request logging

#### API Routes
```
/api/auth/*     → auth-service:4001
/api/projects/*  → project-service:4002
/api/personas/*  → persona-service:4003
/api/media/*     → media-service:4004
/api/cv/*        → ai-cv-service:4005
```

### 2. Auth Service (`auth-service/`)

**Порт:** 4001  
**Назначение:** Управление пользователями и сессиями

#### Функциональность
- **Регистрация/Вход** — email/password аутентификация
- **JWT Tokens** — access (15min) + refresh (7 дней) токены
- **Password Security** — bcrypt hashing, complexity requirements
- **Session Management** — Redis для refresh tokens
- **Account Lockout** — защита от brute force

#### API Endpoints
```
POST /auth/register     # Регистрация
POST /auth/login        # Вход
POST /auth/refresh      # Обновление токена
POST /auth/logout       # Выход
GET  /auth/me          # Информация о пользователе
```

### 3. Project Service (`project-service/`)

**Порт:** 4002  
**Назначение:** CRUD операции с проектами-портфолио

#### Функциональность
- **Project Management** — создание, редактирование, удаление проектов
- **Placeholder System** — модульная структура контента
- **Publishing Workflow** — draft → published состояния
- **Ownership Checks** — доступ только к своим проектам

#### Ключевые сущности
- **Project** — основной контейнер
- **Placeholder** — модульный блок контента
- **PersonaProject** — связь проектов с персонами

### 4. Persona Service (`persona-service/`)

**Порт:** 4003  
**Назначение:** Управление публичными персонами автора

#### Функциональность
- **Persona CRUD** — создание и настройка персон
- **Profile Management** — display name, manifest, avatar
- **Privacy Settings** — public/unlisted/private
- **Project Assignment** — связь проектов с персонами

#### Особенности
- **Slug-based URLs** — человекочитаемые URL для публичных страниц
- **Multiple Personas** — один аккаунт может иметь несколько персон

### 5. Media Service (`media-service/`)

**Порт:** 4004  
**Назначение:** Обработка и хранение медиафайлов

#### Функциональность
- **File Upload** — multipart/form-data обработка
- **Image Processing** — Sharp для resize, optimization, format conversion
- **Storage** — Cloudflare R2/S3 для надежного хранения
- **CDN Delivery** — fast content delivery

#### Поддерживаемые форматы
- **Images:** JPEG, PNG, WebP, AVIF (до 10MB)
- **Videos:** MP4, WebM (до 100MB)
- **Documents:** PDF (до 20MB)

### 6. AI-CV Service (`ai-cv-service/`)

**Порт:** 4005  
**Назначение:** Генерация профессиональных резюме через AI

#### Функциональность
- **Data Aggregation** — сбор данных из account, personas, projects
- **AI Processing** — OpenAI GPT-4 для генерации текста
- **PDF Generation** — Puppeteer/React-PDF для создания документов
- **Storage & Delivery** — S3 storage с expiring URLs

#### Процесс генерации
1. Сбор портфолио данных
2. AI анализ и структурирование
3. PDF рендеринг с шаблонами
4. Upload в S3 с 7-дневным сроком

---

## Общие паттерны

### 1. Express Application Structure

```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/health', healthRoutes)
app.use('/api', apiRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-name' })
})

app.listen(PORT, () => {
  console.log(`Service listening on port ${PORT}`)
})
```

### 2. Error Handling

```typescript
// middleware/errorHandler.ts
import { ErrorRequestHandler } from 'express'

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err)

  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: 'ValidationError',
      message: err.message
    })
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: 'Something went wrong'
  })
}
```

### 3. Authentication Middleware

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}
```

### 4. Database Operations

```typescript
// routes/projects.ts
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth'

const prisma = new PrismaClient()

router.get('/projects', authenticate, async (req, res) => {
  const projects = await prisma.project.findMany({
    where: { accountId: req.user.id }
  })
  res.json(projects)
})
```

---

## Разработка и тестирование

### Локальный запуск
```bash
# Все сервисы
make dev

# Конкретный сервис
cd services/auth-service
npm run dev

# С health checks
curl http://localhost:4001/health
```

### Docker Development
```bash
# Сборка всех сервисов
make build

# Запуск в Docker
make up

# Просмотр логов
make logs-service SERVICE=auth-service
```

### Тестирование
```bash
# Unit тесты
cd services/auth-service
npm test

# Integration тесты
npm run test:integration

# E2E тесты (с запущенными сервисами)
npm run test:e2e
```

---

## Мониторинг и Observability

### Health Checks
Каждый сервис предоставляет `/health` endpoint:
```json
{
  "status": "ok",
  "service": "auth-service",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

### Logging
- **Structured JSON logs** для всех сервисов
- **Correlation IDs** для трассировки запросов
- **Error tracking** через Sentry
- **Centralized logging** через Loki

### Metrics
- **Response times** для каждого endpoint
- **Error rates** по типам ошибок
- **Database query performance**
- **Resource usage** (CPU, memory)

---

## Безопасность

### API Security
- **Input validation** через Zod schemas
- **SQL injection protection** через Prisma ORM
- **XSS protection** через input sanitization
- **Rate limiting** на уровне API Gateway

### Authentication & Authorization
- **JWT tokens** с коротким TTL
- **Refresh token rotation**
- **Password hashing** с bcrypt
- **Account lockout** после неудачных попыток

### Data Protection
- **Encryption at rest** для sensitive data
- **HTTPS everywhere** в production
- **Secure headers** (helmet.js)
- **CORS configuration**

### Новые возможности безопасности (v0.1.1-alpha)

#### Zod Validation
- **Type-safe validation** для всех API endpoints
- **Centralized schemas** в каждом сервисе
- **Automatic error responses** с деталями валидации

```typescript
// Пример схемы в persona-service
const createPersonaSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(100),
    manifest: z.string().optional(),
    slug: z.string().optional(),
  }),
});

// Использование в routes
router.post('/', authenticateToken, validate(createPersonaSchema), handler);
```

#### Admin RBAC
- **Role-based middleware** `requireAdmin` в каждом сервисе
- **JWT role extraction** из токенов
- **Admin-only endpoints** для управления пользователями и контентом

```typescript
// Admin middleware
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Использование
router.get('/admin/accounts', requireAdmin, listAccountsHandler);
```

#### HTTP-Only Cookies
- **Secure refresh tokens** в httpOnly cookies
- **Automatic rotation** при refresh
- **CSRF protection** через SameSite cookies

```typescript
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

#### File Upload Security
- **Magic bytes validation** через file-type library
- **MIME type verification** на сервере
- **Size limits** и type restrictions

### S3/R2 Storage Integration

#### Media Service Updates
- **Cloudflare R2/S3** для надежного хранения файлов
- **Unique filename generation** с timestamp + random ID
- **CDN URL generation** для fast delivery
- **Metadata storage** в PostgreSQL с S3 keys

```typescript
// Upload flow
const key = `uploads/${userId}/${timestamp}-${randomId}.${extension}`;
await s3Client.send(new PutObjectCommand({
  Bucket: BUCKET_NAME,
  Key: key,
  Body: fileBuffer,
  ContentType: mimeType,
}));

const cdnUrl = `${process.env.CDN_BASE_URL}/${key}`;
```

#### Environment Variables
```bash
# S3/R2 Configuration
S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
S3_BUCKET_NAME=venus-media
AWS_ACCESS_KEY_ID=<r2-access-key>
AWS_SECRET_ACCESS_KEY=<r2-secret-key>
CDN_BASE_URL=https://cdn.venus.app
```

### Admin Tools

#### Default Admin User
```bash
# Создание admin пользователя для тестирования
node scripts/create-admin.js

# Credentials:
# Email: admin@venus.app
# Password: admin123!@#
```

#### Admin Endpoints
```bash
# Управление пользователями
GET  /api/admin/auth/accounts          # Список всех пользователей
POST /api/admin/auth/accounts/:id/role # Изменение роли пользователя

# Управление контентом
GET  /api/admin/personas               # Список всех персон
DELETE /api/admin/personas/:id         # Удаление любой персоны

GET  /api/admin/media/files            # Список всех файлов
DELETE /api/admin/media/files/:id      # Удаление любого файла
```

---

## Развертывание

### Environment Variables
```bash
# Общие для всех сервисов
NODE_ENV=production
LOG_LEVEL=info
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Сервис-специфичные
JWT_SECRET=<generated>
SERVICE_PORT=4001
```

### Docker Production
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./
EXPOSE 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1
CMD ["npm", "start"]
```

### Scaling Considerations
- **Horizontal scaling** — stateless сервисы
- **Database connection pooling**
- **Redis clustering** для sessions
- **Load balancing** через API Gateway

---

## Связанные документы

- [Архитектура микросервисов](../.docs/manifest.md) — общая архитектура
- [API спецификация](../.docs/api_usage.md) — endpoints и contracts
- [Технологический стек](../.docs/stack.md#backend) — Node.js и Express
- [CI/CD pipeline](../.docs/ci-cd_pipeline.md) — автоматизация deployment

---

**Последнее обновление этого файла:** 2025-12-01 (v0.1.2-alpha)