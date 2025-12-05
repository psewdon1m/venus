# Secrets Management - Venus Platform

**Last Updated:** 2025-11-27
**Status:** Manual management (Vault integration planned for Etapa 4+)

---

## Overview

Venus использует многоуровневый подход к управлению секретами:

| Уровень | Метод | Безопасность | Использование |
|---------|-------|--------------|---------------|
| **Development** | `.env` файлы (локально) | Низкая (тестовые данные) | Локальная разработка |
| **Stage/Production** | `.env` файлы на сервере | Средняя (ручное управление) | Текущее продакшн |
| **Future** | HashiCorp Vault | Высокая (автоматизированная) | Etapa 4+ |

---

## Current Implementation

### Development Environment

**Хранение:** `.env` файл (исключен из git)
**Шаблон:** `.env.example`

**Настройка:**
```bash
cp .env.example .env
# Edit with local test values
```

### Production Environment

**Хранение:** `.env.production` на сервере `/opt/venus/`
**Права доступа:** `chmod 600`, owner: `deploy:deploy`

**Генерация секретов:**
```bash
# JWT & Session secrets (48 bytes)
openssl rand -base64 48

# Database passwords (32 bytes)
openssl rand -base64 32

# API tokens (hex)
openssl rand -hex 32
```

**Настройка на сервере:**
```bash
ssh deploy@31.172.78.81
cd /opt/venus
cp .env.example .env.production
nano .env.production  # Add generated secrets
chmod 600 .env.production
```

---

## Secrets Inventory

### Critical Secrets

| Secret | Purpose | Generation | Rotation |
|--------|---------|------------|----------|
| `JWT_SECRET` | Token signing | `openssl rand -base64 48` | 90 days |
| `SESSION_SECRET` | Session encryption | `openssl rand -base64 48` | 90 days |
| `DATABASE_PASSWORD` | PostgreSQL access | `openssl rand -base64 32` | 180 days |
| `REDIS_PASSWORD` | Redis access | `openssl rand -base64 32` | 180 days |

### API Keys (Provider-managed)

| Service | Storage | Rotation |
|---------|---------|----------|
| OpenAI API | `.env.production` | As needed |
| Cloudflare R2 | `.env.production` | 90 days |
| Resend Email | `.env.production` | As needed |
| Sentry | `.env.production` | As needed |

### Password Requirements

**Production secrets must:**
- Minimum 24+ characters
- Cryptographically random (openssl rand)
- Unique per environment
- Never reused from examples

---

## Secret Rotation

### Schedule

| Frequency | Secrets | Process |
|-----------|---------|---------|
| **90 days** | JWT_SECRET, SESSION_SECRET, S3 keys | Generate → Update → Restart services |
| **180 days** | DATABASE_PASSWORD, REDIS_PASSWORD | Same + backup verification |
| **As needed** | API keys (OpenAI, etc.) | Provider rotation |

### Rotation Process

1. **Generate:** `openssl rand -base64 48`
2. **Update:** Edit `.env.production` on server
3. **Deploy:** Rolling restart affected services
4. **Verify:** Health checks pass
5. **Log:** Document in access log

---

## Storage & Access

### Local Development
**Location:** `secrets/` directory (gitignored)
- `secrets/server-access.md` - SSH credentials
- `secrets/ssh/venus-prod-key` - SSH private key
- `secrets/api-keys.txt` - Third-party keys

**Permissions:** `chmod 600 secrets/*`

### Production Server
**Location:** `/opt/venus/.env.production`
**Permissions:** `chmod 600`, owner: `deploy:deploy`

### Access Control

| Environment | Who Has Access | Permissions |
|-------------|----------------|-------------|
| **Development** | All developers | Local `.env` only |
| **Production** | Project maintainer + DevOps | Server `.env` file |

**Access logging:** All secret operations documented in `secrets/access-log.md`

---

## Emergency Procedures

**При компрометации секретов:**

1. **Немедленная ротация:** Generate new secrets with `openssl rand`
2. **Обновление:** Edit `.env.production` on server
3. **Перезапуск:** `docker compose restart affected-services`
4. **Проверка:** Health checks pass
5. **Документация:** Log incident in access log

---

## Future: Vault Integration

**Планируется в Etapa 4+**

### Benefits
- **Централизованное управление** секретами
- **Автоматическая ротация** по расписанию
- **Audit logging** всех операций
- **Dynamic secrets** для баз данных
- **Fine-grained access control**

### Migration Plan
1. Deploy Vault server (Docker/managed)
2. Migrate secrets from `.env` to Vault
3. Update services to use Vault SDK
4. Configure auto-rotation policies
5. Remove `.env` files

---

## Security Best Practices

### DO
- Use cryptographically strong secrets (`openssl rand`)
- Different secrets per environment
- Regular rotation (90-180 days)
- Restrict file permissions (`chmod 600`)
- Environment variables in containers
- Log all secret access

### DON'T
- Commit secrets to git
- Share secrets via email/chat
- Reuse secrets across environments
- Use weak/predictable secrets
- Hardcode secrets in code
- Log secret values in plain text

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