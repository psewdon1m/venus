# CI/CD Pipeline & Setup Guide — Venus Platform

Полное руководство по настройке и использованию CI/CD pipeline для проекта Venus с интеграцией управления секретами.

---

## Содержание

1. [Обзор Pipeline](#обзор-pipeline)
2. [Быстрый Старт](#быстрый-старт)
3. [Pipeline Стадии](#pipeline-стадии)
4. [Настройка Окружения](#настройка-окружения)
5. [GitHub Actions Workflows](#github-actions-workflows)
6. [Стратегии Развертывания](#стратегии-развертывания)
7. [Мониторинг и Troubleshooting](#мониторинг-и-troubleshooting)
8. [Безопасность](#безопасность)

---

## Обзор Pipeline

### Архитектура

```
Commit/PR → Lint → Test → Build → Security Scan → Deploy Stage → E2E Tests → Manual Approval → Deploy Production
```

### Ключевые Возможности

- **Автоматическое тестирование** каждого PR и push
- **Security scanning** кода и зависимостей
- **Docker builds** с multi-stage optimization
- **Blue-green deployment** для zero-downtime
- **Automated rollback** при failures
- **Secrets management** через GitHub Secrets + future Vault

### Поддерживаемые Среды

| Среда | Триггер | Автоматизация | URL |
|-------|---------|---------------|-----|
| **Development** | Push to any branch | CI only | localhost |
| **Stage** | Push to main | CI + Auto deploy | stage.venus.app |
| **Production** | Manual approval | Full pipeline | venus.app |

---

## Быстрый Старт

### Предварительные Требования

-  GitHub repository с Actions enabled
-  VPS server для stage/production
-  Domain configuration (см. `infrastructure/cloud/domains.md`)
-  SSH access к deployment server

### Базовая Настройка (10 минут)

1. **GitHub Repository Setup:**
   ```bash
   # Enable branch protection для main
   # Settings → Branches → Add rule: main
   # Require PR reviews + status checks
   ```

2. **GitHub Secrets Configuration:**
   ```bash
   # Repository Secrets:
   # SNYK_TOKEN - для vulnerability scanning
   # SLACK_WEBHOOK - для notifications
   ```

3. **SSH Key Generation:**
   ```bash
   ssh-keygen -t ed25519 -C "deploy@venus" -f ~/.ssh/venus_deploy_key
   ssh-copy-id -i ~/.ssh/venus_deploy_key.pub deploy@31.172.78.81
   ```

4. **Environment Secrets:**
   ```bash
   # Stage Environment в GitHub:
   # STAGE_HOST=31.172.78.81
   # STAGE_SSH_PRIVATE_KEY=<paste-key>
   # STAGE_DATABASE_URL=postgresql://...
   ```

5. **Тест Pipeline:**
   ```bash
   git add .
   git commit -m "feat: add CI/CD pipeline"
   git push origin main
   # Monitor Actions tab
   ```

---

## Pipeline Стадии

### 1. Lint & Code Quality

**Цель:** Проверка качества кода перед тестированием

**Jobs:**
- `lint-frontend`: ESLint + Prettier для Next.js
- `lint-backend`: ESLint для всех Node.js сервисов
- `lint-docker`: hadolint для Dockerfile'ов
- `lint-yaml`: yamllint для configs
- `lint-markdown`: markdownlint для документации

**Exit Criteria:** Все линтеры проходят без ошибок

### 2. Test

**Цель:** Unit и integration тесты

**Setup:**
- PostgreSQL + Redis containers
- Test database seeding
- Coverage reporting (>80%)

**Tools:** Jest, Testing Library, Supertest, Codecov

### 3. Build

**Цель:** Сборка Docker образов

**Strategy:**
- Multi-stage Dockerfiles
- Layer caching
- GitHub Container Registry (ghcr.io)

**Tags:** `latest`, `v1.2.3`, `sha-abc123f`

### 4. Security Scan

**Цель:** Обнаружение уязвимостей

**Tools:**
- Snyk для dependencies
- Trivy для containers
- CodeQL для SAST
- gitleaks для secrets

**Fail on:** Critical/High severity issues

### 5. Deploy Stage

**Цель:** Автоматический deploy на stage

**Process:**
1. Pre-deployment checks
2. Database migrations
3. Rolling update services
4. Health checks
5. E2E tests

### 6. Deploy Production

**Цель:** Контролируемый production deploy

**Features:**
- Manual approval required
- Blue-green deployment
- Automated rollback on failure
- Maintenance mode support

---

## Настройка Окружения

### GitHub Repository Setup

#### Branch Protection Rules
```yaml
# Settings → Branches → Add rule
Branch name: main
Required PR reviews: 
Required status checks:
  - lint
  - test
  - build
  - security-scan
Require branches up to date: 
```

#### Container Registry
- Автоматически доступен для public repos
- Images: `ghcr.io/YOUR_USERNAME/venus/service:latest`

### GitHub Secrets Configuration

#### Repository Secrets
| Secret | Purpose | Example |
|--------|---------|---------|
| `SNYK_TOKEN` | Vulnerability scanning | `abc123...` |
| `SLACK_WEBHOOK` | Deployment notifications | `https://hooks.slack.com/...` |

#### Environment Secrets

**Stage Environment (store in GitHub Secrets):**
```yaml
STAGE_HOST=31.172.78.81
STAGE_SSH_PRIVATE_KEY=<stage-ssh-key-stored-in-github-secret>
STAGE_DATABASE_URL=postgresql://venus_user:password@postgres:5432/venus_stage
STAGE_REDIS_URL=redis://:password@redis:6379
```

**Production Environment (store in GitHub Secrets):**
```yaml
PRODUCTION_HOST=your-prod-server.com
PRODUCTION_SSH_PRIVATE_KEY=<prod-ssh-key-stored-in-github-secret>
PRODUCTION_DATABASE_URL=postgresql://venus_user:password@postgres:5432/venus_prod
ALB_LISTENER_ARN=arn:aws:elasticloadbalancing:...
GREEN_TARGET_GROUP=arn:aws:elasticloadbalancing:...
BLUE_TARGET_GROUP=arn:aws:elasticloadbalancing:...
```

### Server Setup

#### Directory Structure
```bash
/opt/venus/
├── .env.stage          # Stage environment variables
├── .env.production       # Production environment variables
├── docker-compose.stage.yml
├── docker-compose.prod.yml
├── backups/              # Database backups
└── tmp/                  # Temporary files
    ├── uploads/         # Media uploads
    └── cv-generated/    # Generated CVs
```

#### Environment Files

**Stage (.env.stage):**
```bash
# Database
DATABASE_URL=postgresql://venus_user:strong_password@postgres:5432/venus_stage

# Redis
REDIS_URL=redis://:redis_password@redis:6379

# JWT & Sessions
JWT_SECRET=<48-char-random-string>
SESSION_SECRET=<32-char-random-string>

# External Services
OPENAI_API_KEY=sk-your-openai-key
S3_ACCESS_KEY=your-r2-access-key
S3_SECRET_KEY=your-r2-secret-key

# URLs
NEXT_PUBLIC_API_URL=https://api.stage.venus.app
NEXT_PUBLIC_SITE_URL=https://stage.venus.app
```

---

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  push:
    branches: [main, 'feature/**']
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [frontend, api-gateway, auth-service, project-service, persona-service, media-service, ai-cv-service]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
        working-directory: ${{ matrix.service }}
      - run: npm run lint
        working-directory: ${{ matrix.service }}

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run migrate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
      - run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    strategy:
      matrix:
        service: [frontend, api-gateway, auth-service, project-service, persona-service, media-service, ai-cv-service]
    steps:
      - uses: actions/checkout@v4
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: ${{ matrix.service }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  security-scan:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      - name: Run gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### CD Stage Workflow (`.github/workflows/cd-stage.yml`)

```yaml
name: Deploy to Stage
on:
  push:
    branches: [main]
  workflow_run:
    workflows: ["CI"]
    types: [completed]
    branches: [main]

jobs:
  deploy-stage:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment:
      name: stage
      url: https://stage.venus.app
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGE_HOST }}
          username: deploy
          key: ${{ secrets.STAGE_SSH_PRIVATE_KEY }}
          script: |
            cd /opt/venus
            # Pull latest images
            docker compose pull
            # Run migrations
            docker compose run --rm api-gateway npm run migrate
            # Deploy
            docker compose up -d
            # Health checks
            sleep 30
            curl -f https://api.stage.venus.app/health || exit 1
            curl -f https://stage.venus.app/api/health || exit 1
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": " Deployed to stage: ${{ github.sha }}"
            }
```

### CD Production Workflow (`.github/workflows/cd-production.yml`)

```yaml
name: Deploy to Production
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy (e.g., v1.2.3)'
        required: true
        type: string

jobs:
  pre-deployment-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Verify stage health
        run: |
          curl -f https://stage.venus.app/health || exit 1
      - name: Check recent E2E results
        run: |
          # Verify last stage deploy was successful
          gh run list --workflow=cd-stage --status=success --limit=1

  deploy-production:
    runs-on: ubuntu-latest
    needs: pre-deployment-checks
    environment:
      name: production
      url: https://venus.app
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}
      - name: Backup database
        run: |
          # AWS RDS backup
          aws rds create-db-snapshot \
            --db-instance-identifier venus-prod \
            --db-snapshot-identifier venus-prod-pre-deploy-$(date +%Y%m%d%H%M%S)
      - name: Blue-green deployment
        run: |
          # Deploy to green environment
          aws ecs update-service \
            --cluster venus-production \
            --service frontend-green \
            --task-definition venus-frontend:${{ inputs.version }}
          # Wait for healthy
          aws ecs wait services-stable \
            --cluster venus-production \
            --services frontend-green
          # Switch traffic to green
          aws elbv2 modify-listener \
            --listener-arn ${{ secrets.ALB_LISTENER_ARN }} \
            --default-actions Type=forward,TargetGroupArn=${{ secrets.GREEN_TARGET_GROUP }}
      - name: Post-deployment validation
        run: |
          curl -f https://venus.app/health || exit 1
          curl -f https://api.venus.app/health || exit 1
      - name: Create GitHub release
        uses: actions/create-release@v1
        with:
          tag_name: ${{ inputs.version }}
          release_name: Release ${{ inputs.version }}
          body: |
            See [CHANGELOG](../CHANGELOG.md) for details.
      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": " Deployed to production: ${{ inputs.version }}"
            }
```

---

## Стратегии Развертывания

### Blue-Green Deployment

**Концепция:**
```
Load Balancer
├─ Blue (current production)
│  └─ Services v1.2.2
└─ Green (new deployment)
   └─ Services v1.2.3
```

**Process:**
1. Deploy на Green environment
2. Health checks на Green
3. Switch traffic Blue → Green
4. Keep Blue для rollback (1 hour)

**Benefits:** Zero downtime, instant rollback

### Rolling Updates

**Для Kubernetes:**
```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Database Migrations

**Safe migrations:**
```sql
--  Safe: Add column with default
ALTER TABLE projects ADD COLUMN new_field VARCHAR DEFAULT '';

--  Unsafe: Drop column (breaks old code)
ALTER TABLE projects DROP COLUMN old_field;
```

---

## Мониторинг и Troubleshooting

### Pipeline Metrics

**Track:**
- Pipeline execution time (<10 min target)
- Success/failure rates (>95% target)
- Deploy frequency (stage: multiple/day, prod: weekly)
- Cost per pipeline run

### Common Issues

#### SSH Connection Failed
```bash
# Test connection
ssh -T deploy@31.172.78.81

# Check SSH key
ssh-keygen -lf ~/.ssh/venus_deploy_key
```

#### Docker Build Failed
```bash
# Test locally
docker build -t test ./services/api-gateway

# Check build logs in Actions
```

#### Health Check Failed
```bash
# Check service logs
docker compose logs api-gateway

# Test endpoint
curl http://localhost:4000/health
```

#### Database Migration Failed
```bash
# Check migration status
docker compose exec postgres psql -U postgres -d venus_stage \
  -c "SELECT * FROM _prisma_migrations"

# Manual migration
docker compose exec api-gateway npm run migrate
```

### Rollback Procedures

#### Automatic Rollback
**Triggers:** Health checks fail, error rate spike, performance degradation

#### Manual Rollback
```bash
# Switch traffic back to Blue
aws elbv2 modify-listener \
  --listener-arn $ALB_LISTENER \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TARGET_GROUP

# Database rollback from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier venus-prod \
  --db-snapshot-identifier venus-prod-pre-deploy-TIMESTAMP
```

---

## Безопасность

### Secrets Management

**Current:** GitHub Secrets + server `.env` files
**Future:** HashiCorp Vault integration

**Best Practices:**
-  Use environment-specific secrets
-  Rotate secrets regularly (90-180 days)
-  Never commit secrets to git
-  Audit secret access logs

### Access Control

**GitHub:**
-  Protected main branch
-  Required PR reviews
-  Environment protection rules

**Server:**
-  SSH key authentication only
-  Limited user access (deploy user)
-  File permissions (600 for .env files)

### Secrets Rotation

```bash
# Generate new secrets
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 32  # Database password

# Update on server
nano /opt/venus/.env.production

# Restart services
docker compose restart auth-service api-gateway

# Monitor for issues
```

---

## Cost Optimization

### GitHub Actions Costs
- **Free:** 2000 minutes/month (public repos)
- **Paid:** $0.008/minute (private repos)

### Optimization Strategies
1. **Cache dependencies** aggressively
2. **Parallel jobs** with matrix builds
3. **Skip redundant runs** on irrelevant changes
4. **Monitor usage** in repository settings

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
