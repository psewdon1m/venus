# Venus Platform API - Руководство по использованию

**Базовый URL:** 
`https://api.venus.app` (production) 
`http://localhost:4000` (development)

**Формат данных:** JSON
**Аутентификация:** JWT Bearer Token

---

## Содержание

1. [Общий обзор](#общий-обзор)
2. [Аутентификация](#аутентификация)
3. [Базовые принципы](#базовые-принципы)
4. [API Endpoints](#api-endpoints)
5. [Обработка ошибок](#обработка-ошибок)
6. [Rate Limiting](#rate-limiting)
7. [Примеры использования](#примеры-использования)

---

## Общий обзор

Venus API построен на микросервисной архитектуре с единым API Gateway. Все запросы проходят через `/api/*` endpoints.

### Архитектура

```

Frontend → API Gateway → Microservices

                     ↓

            Auth Service (4001)

            Project Service (4002)

            Persona Service (4003)

            Media Service (4004)

            AI-CV Service (4005)

```

### Технологии

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL + Redis
- **Authentication:** JWT
- **Validation:** Zod schemas

---

## Аутентификация

Venus использует JWT (JSON Web Tokens) для аутентификации.

---

### Получение токена

**Регистрация:**

```bash

POST /api/auth/register

Content-Type: application/json

  

{

  "email": "user@example.com",

  "password": "SecurePass123!",

  "confirmPassword": "SecurePass123!"

}

```

**Ответ:**

```json

{

  "success": true,

  "data": {

    "user": {

      "id": "uuid",

      "email": "user@example.com",

      "createdAt": "2025-01-01T00:00:00.000Z",

      "updatedAt": "2025-01-01T00:00:00.000Z"

    },

    "message": "Account created successfully"

  }

}

```

**Вход в систему:**

```bash

POST /api/auth/login

Content-Type: application/json

  

{

  "email": "user@example.com",

  "password": "SecurePass123!"

}

```

**Ответ:**

```json

{

  "success": true,

  "data": {

    "accessToken": "eyJhbGciOiJIUzI1NiIs...",

    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",

    "user": {

      "id": "uuid",

      "email": "user@example.com"

    },

    "expiresIn": 900

  }

}

```

### Использование токена

Все защищенные endpoints требуют `Authorization` header:

```bash

Authorization: Bearer YOUR_ACCESS_TOKEN

```

**Пример curl:**

```bash

curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \

     -H "Content-Type: application/json" \

     https://api.venus.app/api/projects

```

### Обновление токена

Access токены истекают через 15 минут. Используйте refresh токен:

```bash

POST /api/auth/refresh

Content-Type: application/json

  

{

  "refreshToken": "your_refresh_token_here"

}

```

**Ответ:**

```json

{

  "success": true,

  "data": {

    "accessToken": "new_access_token",

    "expiresIn": 900

  }

}

```


## Базовые принципы

### Формат ответов

Все API ответы следуют единому формату:

**Успешный ответ:**

```json

{

  "success": true,

  "data": {

    // Данные ответа

  },

  "meta": {

    // Метаданные (пагинация, timestamp)

  }

}

```

**Ошибка:**

```json

{

  "success": false,

  "error": {

    "code": "ERROR_CODE",

    "message": "Человекопонятное сообщение",

    "details": {

      // Дополнительная информация

    }

  }

}

```

### HTTP Status Codes

- `200` - Успешный запрос
- `201` - Ресурс создан
- `400` - Ошибка валидации
- `401` - Не авторизован
- `403` - Доступ запрещен
- `404` - Ресурс не найден
- `409` - Конфликт (дубликат)
- `422` - Ошибка бизнес-логики
- `429` - Превышен лимит запросов
- `500` - Внутренняя ошибка сервера

### Пагинация

Для списков используется курсорная пагинация:

```bash

GET /api/projects?page=1&limit=20

```

**Ответ с пагинацией:**

```json

{

  "success": true,

  "data": {

    "projects": [...],

    "meta": {

      "page": 1,

      "limit": 20,

      "total": 150,

      "totalPages": 8

    }

  }

}

```

### Валидация данных

API использует строгую валидацию входных данных:

- **Email:** Валидный email формат
- **Пароли:** Минимум 12 символов, uppercase/lowercase/numbers/special chars
- **UUID:** Валидный UUIDv4 формат
- **Строки:** Максимальная длина, допустимые символы

  
## API Endpoints

### Аутентификация (публичные)

| Метод | Endpoint | Описание |

|-------|----------|----------|

| POST | `/api/auth/register` | Регистрация нового пользователя |

| POST | `/api/auth/login` | Вход в систему |

| POST | `/api/auth/refresh` | Обновление access токена |

| POST | `/api/auth/logout` | Выход из системы |

---

### Проекты (защищенные)

| Метод | Endpoint | Описание |

|-------|----------|----------|

| GET | `/api/projects` | Получить список проектов пользователя |

| POST | `/api/projects` | Создать новый проект |

| GET | `/api/projects/:id` | Получить детали проекта |

| PUT | `/api/projects/:id` | Обновить проект |

| DELETE | `/api/projects/:id` | Удалить проект |

---

###  Персоны (защищенные)

| Метод | Endpoint | Описание |

|-------|----------|----------|

| GET | `/api/personas` | Получить персоны пользователя |

| POST | `/api/personas` | Создать новую персону |

| GET | `/api/personas/:id` | Получить детали персоны |

| PUT | `/api/personas/:id` | Обновить персону |

| DELETE | `/api/personas/:id` | Удалить персону |

---

### Публичный доступ к персонам

| Метод | Endpoint | Описание |

|-------|----------|----------|

| GET | `/api/public/personas` | Список публичных персон |

| GET | `/api/public/personas/:slug` | Публичная страница персоны |

---

### Медиа (защищенные)

| Метод | Endpoint | Описание |

|-------|----------|----------|

| POST | `/api/media/upload` | Загрузить файл |

| GET | `/api/media` | Получить медиа файлы пользователя |

| GET | `/api/media/:id` | Получить детали медиа файла |

| DELETE | `/api/media/:id` | Удалить медиа файл |

---

### AI CV (защищенные)

| Метод | Endpoint | Описание |

|-------|----------|----------|

| POST | `/api/cv/generate` | Сгенерировать CV |

| GET | `/api/cv/history` | История генераций CV |

| GET | `/api/cv/:id/download` | Скачать сгенерированный CV |

---

### Мониторинг

| Метод | Endpoint | Описание |

|-------|----------|----------|

| GET | `/health` | Health check API Gateway |

| GET | `/api/health` | Общий health check |


## Обработка ошибок

### Типы ошибок

| Код ошибки | HTTP Status | Описание |

|------------|-------------|----------|

| `VALIDATION_ERROR` | 400 | Ошибка валидации входных данных |

| `INVALID_CREDENTIALS` | 401 | Неверный email или пароль |

| `INVALID_TOKEN` | 401 | Недействительный JWT токен |

| `MISSING_TOKEN` | 401 | Отсутствует токен авторизации |

| `NOT_FOUND` | 404 | Ресурс не найден |

| `EMAIL_EXISTS` | 409 | Email уже зарегистрирован |

| `SLUG_EXISTS` | 409 | Slug уже используется |

| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |

---

### Пример ошибки валидации

```json

{

  "success": false,

  "error": {

    "code": "VALIDATION_ERROR",

    "message": "Invalid input data",

    "details": [

      {

        "field": "email",

        "message": "Invalid email format"

      },

      {

        "field": "password",

        "message": "Password must be at least 12 characters"

      }

    ]

  }

}

```

### Обработка ошибок в коде

```javascript

// JavaScript

try {

  const response = await fetch('/api/projects', {

    headers: {

      'Authorization': `Bearer ${token}`,

      'Content-Type': 'application/json'

    }

  });

  

  const data = await response.json();

  

  if (!data.success) {

    console.error('API Error:', data.error.code, data.error.message);

    // Handle specific error codes

    switch (data.error.code) {

      case 'INVALID_TOKEN':

        // Redirect to login

        break;

      case 'VALIDATION_ERROR':

        // Show validation errors

        break;

      default:

        // Generic error handling

    }

  } else {

    // Success handling

    console.log('Data:', data.data);

  }

} catch (error) {

  console.error('Network error:', error);

}

```


## Rate Limiting

API имеет встроенное ограничение запросов для защиты от abuse:

- **Общий лимит:** 100 запросов за 15 минут

- **Пользовательский лимит:** 200 запросов за 15 минут для авторизованных пользователей

- **Заголовки ответа:**

  - `X-RateLimit-Limit`: Максимальное количество запросов

  - `X-RateLimit-Remaining`: Оставшиеся запросы

  - `X-RateLimit-Reset`: Время сброса в Unix timestamp

### Пример превышения лимита

```json

{

  "success": false,

  "error": {

    "code": "RATE_LIMIT_EXCEEDED",

    "message": "Too many requests, please try again later"

  }

}

```


## Примеры использования

### Полный флоу: Создание проекта

```javascript

// 1. Регистрация

const registerResponse = await fetch('/api/auth/register', {

  method: 'POST',

  headers: { 'Content-Type': 'application/json' },

  body: JSON.stringify({

    email: 'user@example.com',

    password: 'SecurePass123!',

    confirmPassword: 'SecurePass123!'

  })

});

  

// 2. Вход

const loginResponse = await fetch('/api/auth/login', {

  method: 'POST',

  headers: { 'Content-Type': 'application/json' },

  body: JSON.stringify({

    email: 'user@example.com',

    password: 'SecurePass123!'

  })

});

  

const { accessToken } = await loginResponse.json().data;

  

// 3. Создание проекта

const projectResponse = await fetch('/api/projects', {

  method: 'POST',

  headers: {

    'Authorization': `Bearer ${accessToken}`,

    'Content-Type': 'application/json'

  },

  body: JSON.stringify({

    title: 'My Portfolio Project',

    type: 'album'

  })

});

  

const { project } = await projectResponse.json().data;

console.log('Created project:', project.id);

```

### Работа с пагинацией

```javascript

// Получение проектов с пагинацией

async function getProjects(page = 1, limit = 20) {

  const response = await fetch(

    `/api/projects?page=${page}&limit=${limit}`,

    {

      headers: {

        'Authorization': `Bearer ${token}`

      }

    }

  );

  

  const data = await response.json();

  

  if (data.success) {

    console.log('Projects:', data.data.projects);

    console.log('Pagination:', data.data.meta);

  

    // Следующая страница

    if (page < data.data.meta.totalPages) {

      return getProjects(page + 1, limit);

    }

  }

}

```

### Обработка ошибок и повторные попытки

```javascript

async function apiRequest(url, options = {}, retries = 3) {

  try {

    const response = await fetch(url, {

      headers: {

        'Authorization': `Bearer ${token}`,

        'Content-Type': 'application/json',

        ...options.headers

      },

      ...options

    });

  

    const data = await response.json();

  

    if (!data.success) {

      // Специфическая обработка ошибок

      if (data.error.code === 'INVALID_TOKEN' && retries > 0) {

        // Попытка обновить токен и повторить

        await refreshToken();

        return apiRequest(url, options, retries - 1);

      }

  

      throw new Error(`${data.error.code}: ${data.error.message}`);

    }

  

    return data.data;

  } catch (error) {

    if (retries > 0 && error.name === 'NetworkError') {

      // Повтор при сетевых ошибках

      await new Promise(resolve => setTimeout(resolve, 1000));

      return apiRequest(url, options, retries - 1);

    }

  

    throw error;

  }

}

```

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