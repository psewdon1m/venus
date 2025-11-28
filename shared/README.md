# shared/ — Общие компоненты проекта Venus

**Последнее обновление:** 2025-11-27  
**Статус:** Активная разработка

---

## Назначение папки

Папка `shared/` содержит общий код, типы и утилиты, которые используются во всех частях проекта Venus. Это обеспечивает:

- **Type Safety** — централизованные TypeScript определения
- **Code Reusability** — общие утилиты и компоненты
- **Consistency** — единые интерфейсы и схемы данных
- **Maintainability** — изменения в одном месте отражаются везде

---

## Структура папки

```
shared/
├── types/                 # TypeScript типы и схемы
│   ├── src/
│   │   ├── index.ts       # Экспорт всех типов
│   │   ├── prisma.ts      # Prisma клиент и типы
│   │   ├── api/           # API типы (requests/responses/errors)
│   │   ├── common/        # Общие типы (enums, utils)
│   │   └── entities/      # Сущности БД (Account, Project, etc.)
│   ├── schema.prisma      # Prisma схема базы данных
│   ├── migrations/        # Миграции БД
│   ├── package.json       # Зависимости типов
│   └── tsconfig.json      # TypeScript конфигурация
├── utils/                 # Общие утилиты
└── infrastructure/        # Общая инфраструктура
    ├── postgres/          # PostgreSQL конфигурация
    └── redis/             # Redis конфигурация
```

---

## Основные компоненты

### 1. Types (`shared/types/`)

#### Entities
- **Account** — пользовательские аккаунты
- **Persona** — публичные личности автора
- **Project** — проекты-портфолио
- **MediaFile** — загруженные медиафайлы
- **CVGeneration** — сгенерированные резюме

#### API Types
- **Request/Response** интерфейсы для всех API endpoints
- **Error** типы для обработки ошибок
- **Validation** схемы через Zod

#### Common Types
- **Enums** — ProjectStatus, ProjectType, PlaceholderType
- **Utility Types** — AccountWithoutPassword, etc.

### 2. Database Schema (`schema.prisma`)

```prisma
model Account {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  personas     Persona[]
  projects     Project[]
  // ...
}
```

**Особенности:**
- SQLite для development (dev.db)
- PostgreSQL для production
- Автоматическая генерация TypeScript типов
- Row Level Security для multi-tenancy

### 3. Infrastructure

#### PostgreSQL
- **init.sql** — инициализация базы данных
- **schema.prisma** — определение схемы
- **migrations/** — история изменений схемы

#### Redis
- Конфигурация для кеширования сессий
- Pub/Sub для real-time features

---

## Использование в проекте

### Импорт типов
```typescript
// В сервисах
import { Account, CreateProjectInput } from '@venus/types';

// Валидация
import { z } from 'zod';
const projectSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['album', 'main-project'])
});
```

### Работа с базой данных
```typescript
// Инициализация Prisma клиента
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Типобезопасные запросы
const projects = await prisma.project.findMany({
  where: { accountId: userId },
  include: { personaProjects: true }
});
```

### Миграции
```bash
# Генерация миграции
npx prisma migrate dev --name add-user-avatar

# Применение в production
npx prisma migrate deploy
```

---

## Правила работы

### Добавление новых типов
1. Создайте интерфейс в соответствующем файле `entities/`
2. Экспортируйте в `index.ts`
3. Обновите Prisma schema если нужно
4. Создайте миграцию для изменений БД

### Модификация существующих типов
1. Убедитесь в backward compatibility
2. Обновите все места использования
3. Создайте миграцию если меняется схема БД
4. Протестируйте изменения

### Code Review
- Проверяйте типобезопасность
- Убедитесь в корректности импортов
- Проверьте влияние на другие сервисы

---

## Зависимости и сборка

### Package.json
```json
{
  "name": "@venus/types",
  "version": "0.0.1-alpha",
  "main": "dist/index.js",
  "types": "dist/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "migrate": "prisma migrate dev",
    "generate": "prisma generate"
  }
}
```

### Сборка
```bash
# Сборка типов
cd shared/types && npm run build

# Генерация Prisma клиента
npm run generate
```

---

## Тестирование

### Unit тесты
```bash
cd shared/types
npm test
```

### Integration тесты
- Тестирование Prisma клиента
- Валидация схем данных
- Проверка миграций

---

## Безопасность

### Доступ к данным
- Все запросы фильтруются по `accountId`
- Row Level Security в PostgreSQL
- API endpoints проверяют ownership

### Secrets
- Database credentials через environment variables
- Никогда не коммитить реальные значения

---

## Связанные документы

- [Документация типов](../.docs/stack.md#core-technologies) — в технологическом стеке
- [Схема БД](../infrastructure/postgres/schema.prisma) — детальная схема
- [API спецификация](../.docs/api_usage.md) — использование типов в API

---

**Последнее обновление этого файла:** 2025-11-27