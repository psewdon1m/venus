# Архитектура и текущее состояние проекта Venus

Документ описывает архитектурные решения и технические детали проекта Venus.

---

## Основные принципы

- **Docker + Compose как единый каркас.** В корне репозитория лежит [`docker-compose.yml`](../docker-compose.yml), а каждый сервис имеет собственную директорию верхнего уровня (`frontend/`, `api-gateway/`, `auth-service/`, `media-service/` и т. п.) с Dockerfile, конфигами и README.
- **Микросервисная архитектура.** Система разбита на независимые сервисы, взаимодействующие через API Gateway. Каждый сервис отвечает за свою область: аутентификация, управление проектами, обработка медиа, генерация CV и т.д.
- **Сети по ролям.** В Compose заводим минимум три сети: `frontend_net` (фронтенд и gateway), `backend_net` (микросервисы), `data_net` (базы данных и кэш). Сервисы подключаются только к тем сетям, которые им необходимы.
- **Среды исполнения.** Все переменные выносятся в `.env` и `configs/*.env`. Секреты не хранятся в git — используем HashiCorp Vault или AWS Secrets Manager.
- **Контроль версий артефактов.** После завершения каждого этапа версии образов/скриптов фиксируются в [`docs/versions.md`](versions.md), а состояние проекта — в [`docs/project_passport.md`](project_passport.md).
- **Матрица трассируемости.** Все требования манифеста связаны с этапами реализации через [`docs/traceability-matrix.md`](traceability-matrix.md).

---

## Архитектурный overview

Venus построена как микросервисная система со следующими компонентами:

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│                    editorial design, SSR/SSG                 │
└────────────────────────────┬────────────────────────────────┘
                              │
┌────────────────────────────┴────────────────────────────────┐
│                      API Gateway (Express)                   │
│              rate limiting, auth validation                  │
└─────┬─────────┬──────────┬────────────┬──────────┬─────────┘
       │         │          │            │          │
┌─────┴─────┐ ┌┴──────┐ ┌─┴──────┐ ┌──┴──────┐ ┌─┴────────┐
│   Auth    │ │Project│ │ Media  │ │   AI    │ │Persona   │
│  Service  │ │Service│ │Service │ │  CV     │ │ Service  │
│           │ │       │ │        │ │ Service │ │          │
└─────┬─────┘ └┬──────┘ └─┬──────┘ └──┬──────┘ └─┬────────┘
       └────────┴──────────┴────────────┴──────────┘
                          │
            ┌─────────────┴─────────────┐
            │   PostgreSQL + Redis      │
            │   S3/R2 (Media Storage)   │
            └───────────────────────────┘
```

---

## Профили Compose

Проект использует систему профилей для модульной активации компонентов:

```yaml
# Основные профили
core              # Минимальный набор (auth, projects, personas)
full              # Полная платформа со всеми сервисами
dev               # Разработка с hot-reload и dev tools

# Отдельные сервисы
media             # Сервис обработки и хранения медиа
ai-cv             # AI-генерация резюме
analytics         # Аналитика просмотров и взаимодействий

# Операционные
observability     # Полный стек мониторинга
testing           # Автоматизированное тестирование
```

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
