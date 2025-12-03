# scripts/ — Скрипты автоматизации проекта Venus

**Последнее обновление:** 2025-12-03
**Статус:** Security и admin скрипты добавлены

---

## Назначение папки

Папка `scripts/` содержит автоматизированные скрипты для:

- **Database operations** — миграции, бэкапы, восстановление
- **Deployment** — развертывание и откат
- **Setup** — инициализация development environment
- **Maintenance** — обслуживание и мониторинг

---

## Структура папки

```
scripts/
├── generate-secrets.js  # Генерация безопасных секретов
├── create-admin.js      # Создание admin пользователя
├── db/                  # Database скрипты
│   ├── migrate.sh       # Миграции БД
│   ├── backup.sh        # Бэкапы
│   ├── restore.sh       # Восстановление
│   └── seed.sh          # Заполнение тестовыми данными
├── deploy/              # Deployment скрипты
│   ├── staging.sh       # Deploy на staging
│   ├── production.sh    # Deploy на production
│   └── rollback.sh      # Откат deployment
├── setup/               # Setup скрипты
│   ├── dev.sh           # Настройка development
│   ├── ci.sh            # Настройка CI environment
│   └── clean.sh         # Очистка environment
└── README.md           # Этот файл
```

---

## Security Scripts

### Secret Generation (`generate-secrets.js`)

**Назначение:** Генерация криптографически безопасных секретов для JWT, сессий и баз данных.

**Использование:**
```bash
# Сгенерировать новые секреты
node scripts/generate-secrets.js

# Вывод:
# JWT_SECRET=6RVP4v63py16d7uuMTlVxweQN8VkGQmSkaYq2Ko1dQ4=
# SESSION_SECRET=neIdMSRMAKJM7qHeTRgDL4OopuxYwnrUN5V+034AdB0=
# DATABASE_PASSWORD=hUT///qxWBGhrcDzS8Kk1w==
# REDIS_PASSWORD=wFUMEU5vxklSi+EwTUT5zQ==
```

**Безопасность:**
- Использует `crypto.randomBytes()` для криптографической стойкости
- JWT_SECRET: 256+ бит (32 байта, base64 encoded)
- SESSION_SECRET: 256+ бит (32 байта, base64 encoded)
- Генерирует уникальные значения при каждом запуске

**Когда использовать:**
- При настройке нового environment (staging/production)
- При ротации секретов (рекомендуется каждые 90 дней)
- Никогда не используйте одинаковые секреты для разных сред!

---

## Admin Scripts

### Admin User Creation (`create-admin.js`)

**Назначение:** Создание администраторского пользователя для тестирования и управления системой.

**Использование:**
```bash
# Создать admin пользователя
node scripts/create-admin.js

# Использует переменные из .env:
# ADMIN_EMAIL=admin@venus.app
# ADMIN_PASSWORD=VenusAdmin2025!
```

**Функциональность:**
- Создает пользователя с ролью ADMIN
- Хэширует пароль с bcrypt
- Проверяет существование пользователя перед созданием

---

## Database Scripts

## Database Scripts

### Migration Script (`db/migrate.sh`)
```bash
#!/bin/bash
# Database migration script

echo "Running database migrations..."

# Check if we're in development
if [ "$NODE_ENV" = "development" ]; then
  npx prisma migrate dev
else
  npx prisma migrate deploy
fi

echo "Migrations completed successfully"
```

### Backup Script (`db/backup.sh`)
```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/opt/venus/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "Creating database backup..."

pg_dump -U postgres venus_prod > $BACKUP_DIR/venus_prod_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/venus_prod_$DATE.sql s3://venus-backups/

echo "Backup completed: venus_prod_$DATE.sql"
```

---

## Deployment Scripts

### Staging Deployment (`deploy/staging.sh`)
```bash
#!/bin/bash
# Staging deployment script

echo "Deploying to staging..."

# Pull latest images
docker compose pull

# Run migrations
docker compose run --rm api-gateway npm run migrate

# Deploy services
docker compose up -d

# Health checks
sleep 30
curl -f https://staging.venus.app/health || exit 1

echo "Staging deployment completed"
```

### Production Deployment (`deploy/production.sh`)
```bash
#!/bin/bash
# Production deployment script

echo "Deploying to production..."

# Create backup
./scripts/db/backup.sh

# Blue-green deployment
aws ecs update-service --cluster venus-production \
  --service frontend-green \
  --task-definition venus-frontend:$VERSION

# Wait for healthy
aws ecs wait services-stable --cluster venus-production \
  --services frontend-green

# Switch traffic
aws elbv2 modify-listener --listener-arn $ALB_LISTENER \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TARGET_GROUP

echo "Production deployment completed"
```

---

## Setup Scripts

### Development Setup (`setup/dev.sh`)
```bash
#!/bin/bash
# Development environment setup

echo "Setting up development environment..."

# Install dependencies
pnpm install

# Start services
make dev

# Run migrations
make migrate

# Seed database
make seed

echo "Development environment ready!"
```

### CI Setup (`setup/ci.sh`)
```bash
#!/bin/bash
# CI environment setup

echo "Setting up CI environment..."

# Install dependencies
npm ci

# Setup test database
docker run -d --name postgres-test -e POSTGRES_PASSWORD=test postgres:16
docker run -d --name redis-test redis:7

# Wait for services
sleep 10

# Run migrations
npm run migrate:test

echo "CI environment ready"
```

---

## Использование

### Локально
```bash
# Setup development
./scripts/setup/dev.sh

# Database operations
./scripts/db/migrate.sh
./scripts/db/backup.sh

# Deployment (with caution)
./scripts/deploy/staging.sh
```

### В CI/CD
```yaml
# .github/workflows/deploy.yml
- name: Deploy to staging
  run: ./scripts/deploy/staging.sh
  environment: staging
```

### На сервере
```bash
# SSH to server
ssh deploy@31.172.78.81

# Run deployment
cd /opt/venus
./scripts/deploy/production.sh
```

---

## Best Practices

### ✅ DO
- Использовать absolute paths
- Добавлять error handling
- Логировать все операции
- Проверять prerequisites
- Использовать environment variables

### ❌ DON'T
- Хардкодить credentials
- Игнорировать error codes
- Запускать без тестирования
- Менять production без backup

---

## Security Considerations

### Permissions
```bash
# Set executable permissions
chmod +x scripts/**/*.sh

# Restrict access
chown deploy:deploy scripts/
chmod 755 scripts/
chmod 700 scripts/deploy/production.sh
```

### Secrets
- Использовать environment variables
- Никогда не логировать sensitive data
- Валидировать input parameters

---

## Связанные документы

- [Makefile](../Makefile) — команды автоматизации
- [CI/CD Pipeline](../.docs/ci-cd_pipeline.md) — интеграция скриптов
- [Infrastructure](../infrastructure/README.md) — развертывание

---

**Последнее обновление этого файла:** 2025-12-03