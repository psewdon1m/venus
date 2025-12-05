# config/ — Конфигурационные файлы проекта Venus

**Последнее обновление:** 2025-11-27  
**Статус:** Базовые конфигурации созданы

---

## Назначение папки

Папка `config/` содержит все конфигурационные файлы проекта:

- **Docker Compose** — оркестрация сервисов
- **Linting** — правила качества кода
- **Environments** — переменные окружения
- **CI/CD** — автоматизация процессов

---

## Структура папки

```
config/
├── docker/               # Docker конфигурации
│   ├── docker-compose.yml          # Базовая конфигурация
│   ├── docker-compose.dev.yml      # Development overrides
│   ├── docker-compose.prod.yml     # Production overrides
│   └── docker-compose.stage.yml  # Stage overrides
├── environments/        # Environment переменные
│   ├── .env.example                # Шаблон переменных
│   ├── .env.production.example     # Production template
│   └── .env.stage.example        # Stage template
├── linting/             # Правила линтинга
│   ├── .eslintrc.js                # ESLint конфигурация
│   ├── .prettierrc                # Prettier конфигурация
│   ├── .markdownlint.json          # Markdown linting
│   ├── .yamllint.yaml              # YAML linting
│   ├── .hadolint.yaml              # Dockerfile linting
│   └── commitlint.config.js        # Commit message linting
└── README.md            # Этот файл
```

---

## Docker Configuration

### docker-compose.yml (Base)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: venus_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Environment-specific Overrides

#### Development (docker-compose.dev.yml)
```yaml
version: '3.8'
services:
  postgres:
    ports:
      - "5432:5432"  # Expose for local development

  redis:
    ports:
      - "6379:6379"  # Expose for debugging
```

#### Production (docker-compose.prod.yml)
```yaml
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_DB: venus_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
```

---

## Environment Variables

### .env.example (Template)
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/venus_dev
REDIS_URL=redis://localhost:6379

# API Gateway
API_GATEWAY_PORT=4000

# Services
AUTH_SERVICE_PORT=4001
PROJECT_SERVICE_PORT=4002
PERSONA_SERVICE_PORT=4003
MEDIA_SERVICE_PORT=4004
AI_CV_SERVICE_PORT=4005

# Security
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12
```

### Environment-specific Templates
- **.env.stage.example** — для stage environment
- **.env.production.example** — для production environment

---

## Code Quality Configuration

### ESLint (.eslintrc.js)
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error'
  }
}
```

### Prettier (.prettierrc)
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Commitlint (commitlint.config.js)
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore']
    ],
    'scope-enum': [
      2,
      'always',
      ['frontend', 'auth', 'projects', 'personas', 'media', 'cv']
    ]
  }
}
```

---

## Использование

### Development Setup
```bash
# Копирование шаблона
cp config/environments/.env.example .env

# Запуск с development конфигурацией
docker compose -f config/docker/docker-compose.yml \
               -f config/docker/docker-compose.dev.yml up -d
```

### Production Deployment
```bash
# Использование production конфигурации
docker compose -f config/docker/docker-compose.yml \
               -f config/docker/docker-compose.prod.yml up -d
```

### Code Quality Checks
```bash
# Линтинг
npx eslint . --config config/linting/.eslintrc.js

# Форматирование
npx prettier --config config/linting/.prettierrc --write .

# Проверка commits
npx commitlint --config config/linting/commitlint.config.js --edit
```

---

## Best Practices

### ✅ DO
- Использовать environment-specific конфигурации
- Валидировать конфигурационные файлы
- Документировать все переменные окружения
- Использовать секреты вместо hardcoded значений

### ❌ DON'T
- Коммитить реальные секреты
- Использовать одинаковые значения для разных сред
- Менять конфигурацию без тестирования

---

## Связанные документы

- [Infrastructure Setup](../infrastructure/README.md) — развертывание
- [Secrets Management](../.docs/secrets_management.md) — управление секретами
- [CI/CD Pipeline](../.docs/ci-cd_pipeline.md) — автоматизация

---

**Последнее обновление этого файла:** 2025-11-27