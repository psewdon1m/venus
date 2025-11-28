# frontend/ — Next.js веб-приложение Venus

**Последнее обновление:** 2025-11-27  
**Статус:** Базовая структура создана, готово к разработке

---

## Назначение папки

Папка `frontend/` содержит клиентское веб-приложение Venus, построенное на Next.js 14. Это основное пользовательское интерфейс для:

- **Публичных портфолио** — просмотр персон и проектов
- **Админ-панель** — управление контентом
- **Аутентификация** — регистрация и вход пользователей
- **AI-CV генерация** — создание резюме через интерфейс

---

## Архитектура приложения

### Next.js 14 App Router

```
frontend/
├── app/                    # App Router страницы
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Главная страница
│   ├── [slug]/            # Динамические маршруты (персоны)
│   │   └── page.tsx
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── AuthForm.tsx       # Форма аутентификации
│   ├── Dashboard.tsx      # Панель управления
│   └── LoadingSpinner.tsx # Компонент загрузки
├── contexts/              # React Context
│   └── AuthContext.tsx    # Контекст аутентификации
├── lib/                   # Утилиты и конфигурации
│   └── api.ts             # API клиент
├── public/                # Статические файлы
│   ├── next.svg
│   ├── vercel.svg
│   └── *.svg              # Иконки и изображения
├── eslint.config.mjs      # ESLint конфигурация
├── next.config.ts         # Next.js конфигурация
├── package.json           # Зависимости
├── postcss.config.mjs     # PostCSS конфигурация
└── tsconfig.json          # TypeScript конфигурация
```

---

## Основные компоненты

### 1. App Router (`app/`)

#### Страницы
- **`/`** — Главная страница (landing)
- **`/[slug]`** — Публичная страница персоны
- **`/[slug]/[project]`** — Страница проекта (future)
- **`/auth`** — Аутентификация (future)
- **`/dashboard`** — Админ-панель (future)

#### Layout
```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

### 2. Компоненты (`components/`)

#### UI Компоненты
- **AuthForm** — формы входа/регистрации
- **Dashboard** — панель управления контентом
- **LoadingSpinner** — индикатор загрузки

#### Плэйсхолдеры (future)
- **CoverPlaceholder** — обложка проекта
- **MetaPlaceholder** — мета-информация
- **ProcessPlaceholder** — процесс работы
- **GalleryPlaceholder** — галерея результатов

### 3. Context и State Management

#### AuthContext
```tsx
// contexts/AuthContext.tsx
interface AuthContextType {
  user: Account | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}
```

### 4. API Client (`lib/api.ts`)

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL

export const api = {
  auth: {
    login: (data: LoginInput) => post('/auth/login', data),
    register: (data: RegisterInput) => post('/auth/register', data),
  },
  projects: {
    list: (personaId: string) => get(`/projects?persona=${personaId}`),
    create: (data: CreateProjectInput) => post('/projects', data),
  },
  personas: {
    get: (slug: string) => get(`/personas/${slug}`),
  }
}
```

---

## Технологический стек

### Core Technologies
- **Next.js 14** — React framework с App Router
- **TypeScript** — типобезопасность
- **Tailwind CSS** — utility-first CSS
- **React Hook Form + Zod** — формы и валидация

### Development Tools
- **ESLint** — линтинг кода
- **Prettier** — форматирование
- **PostCSS** — CSS processing

---

## Маршрутизация и страницы

### Публичные страницы
- **Landing** (`/`) — призыв к действию, примеры портфолио
- **Persona** (`/[slug]`) — публичная страница персоны с проектами
- **Project** (`/[slug]/[project]`) — детальная страница проекта

### Аутентифицированные страницы
- **Dashboard** (`/dashboard`) — управление контентом
- **Settings** (`/settings`) — настройки аккаунта
- **Editor** (`/editor/[project]`) — редактор проектов

---

## Стилизация

### Tailwind CSS
```tsx
// Пример использования
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold text-gray-900 mb-8">
      Venus Portfolio
    </h1>
  </div>
</div>
```

### Design System
- **Colors** — blue/indigo gradient theme
- **Typography** — clean, modern fonts
- **Spacing** — consistent 4px grid
- **Components** — reusable UI patterns

---

## API интеграция

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_CDN_URL=http://localhost:4000/cdn
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### API Calls
```tsx
// В компонентах
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export default function PersonaPage({ params }: { params: { slug: string } }) {
  const [persona, setPersona] = useState(null)

  useEffect(() => {
    api.personas.get(params.slug).then(setPersona)
  }, [params.slug])

  return <div>{/* render persona */}</div>
}
```

---

## Сборка и развертывание

### Development
```bash
# Установка зависимостей
pnpm install

# Локальная разработка
pnpm dev

# Сборка для production
pnpm build

# Production запуск
pnpm start
```

### Docker
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## SEO и производительность

### Next.js оптимизации
- **SSR/SSG** — server-side rendering для SEO
- **Image optimization** — автоматическая оптимизация изображений
- **Code splitting** — автоматическое разделение кода
- **Font optimization** — оптимизация загрузки шрифтов

### SEO features
- **Meta tags** — динамические title, description
- **Open Graph** — социальные сети
- **Schema.org** — структурированные данные
- **Sitemap** — автоматическая генерация

---

## Тестирование

### Unit тесты
```bash
# Jest + Testing Library
pnpm test
```

### E2E тесты
```bash
# Playwright
pnpm test:e2e
```

### Компоненты для тестирования
- Form компоненты
- API интеграции
- Routing логика

---

## Безопасность

### Client-side security
- **XSS protection** — sanitization всех inputs
- **CSRF protection** — через API tokens
- **Secure cookies** — httpOnly, secure flags

### Authentication flow
```tsx
// Защищенные маршруты
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedPage() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <redirect to="/auth" />

  return <Dashboard />
}
```

---

## Связанные документы

- [Технологический стек](../.docs/stack.md#frontend) — Next.js и React
- [API спецификация](../.docs/api_usage.md) — интеграция с backend
- [UI/UX гайдлайн](../.docs/manifest.md) — дизайн-система

---

**Последнее обновление этого файла:** 2025-11-27
