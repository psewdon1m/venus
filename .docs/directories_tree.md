# Структура директорий проекта Venus

---

## Полная структура проекта

```
venus/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── cd-stage.yml
│   │   └── cd-production.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── docs/
│   ├── manifest.md
│   ├── stages.md
│   ├── traceability-matrix.md
│   ├── directory_tree.md
│   ├── ci-cd-pipeline.md
│   ├── codex.md
│   ├── git_managment.md
│   ├── api_usage.md
│   ├── project_passport.md
│   └── versions.md
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── personas/
│   │   │   │   ├── projects/
│   │   │   │   └── settings/
│   │   │   ├── (public)/
│   │   │   │   └── [persona]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── project/
│   │   │   │           └── [slug]/
│   │   │   ├── api/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── placeholders/
│   │   │   ├── layouts/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── projects/
│   │   │   │   ├── personas/
│   │   │   │   └── cv/
│   │   │   └── shared/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── styles/
│   ├── public/
│   │   ├── fonts/
│   │   ├── icons/
│   │   └── images/
│   ├── locales/
│   │   ├── en/
│   │   └── ru/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── .env.example
│   ├── .eslintrc.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── package.json
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── README.md
│
├── services/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   ├── config/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── auth-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── validators/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── project-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── validators/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── persona-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── validators/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   ├── media-service/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   ├── processors/
│   │   │   ├── validators/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   │
│   └── ai-cv-service/
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── models/
│       │   ├── routes/
│       │   ├── templates/
│       │   ├── prompts/
│       │   ├── validators/
│       │   ├── types/
│       │   └── index.ts
│       ├── tests/
│       ├── package.json
│       ├── Dockerfile
│       └── README.md
│
├── shared/
│   ├── types/
│   ├── utils/
│   ├── config/
│   └── package.json
│
├── infrastructure/
│   ├── postgres/
│   │   ├── schema.sql
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── init.sql
│   ├── redis/
│   │   └── redis.conf
│   ├── monitoring/
│   │   ├── prometheus/
│   │   ├── grafana/
│   │   ├── loki/
│   │   └── docker-compose.monitoring.yml
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── sites-available/
│   └── cloud/
│       ├── aws/
│       ├── terraform/
│       └── kubernetes/
│
├── tests/
│   ├── e2e/
│   ├── integration/
│   ├── performance/
│   ├── fixtures/
│   └── playwright.config.ts
│
├── scripts/
│   ├── setup/
│   ├── deploy/
│   ├── db/
│   ├── monitoring/
│   └── utils/
│
├── secrets/
│   ├── .gitkeep
│   └── README.md
│
├── config/
│   ├── environments/
│   ├── placeholder-types.json
│   ├── cv-templates.json
│   └── features.json
│
├── tools/
│   ├── generators/
│   └── validators/
│
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .husky/
│   ├── pre-commit
│   └── commit-msg
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.test.yml
├── Makefile
├── .env.example
├── .gitignore
├── .dockerignore
├── .prettierrc
├── .eslintrc.js
├── tsconfig.json
├── package.json
├── pnpm-workspace.yaml
├── LICENSE
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── CHANGELOG.md
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