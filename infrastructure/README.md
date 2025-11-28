# infrastructure/ — Инфраструктура и развертывание Venus

**Последнее обновление:** 2025-11-27  
**Статус:** Базовая инфраструктура настроена

---

## Назначение папки

Папка `infrastructure/` содержит всю инфраструктуру проекта Venus:

- **Database** — PostgreSQL и Redis конфигурации
- **Cloud** — домены, SSL, secrets management
- **Monitoring** — Grafana, Prometheus (planned)
- **Deployment** — Docker Compose файлы

---

## Структура папки

```
infrastructure/
├── cloud/                 # Облачная инфраструктура
│   ├── cloud-setup.md     # Настройка провайдеров
│   ├── domains.md         # DNS и домены
│   └── secrets-management.md # Управление секретами
├── postgres/              # PostgreSQL конфигурация
│   ├── init.sql           # Инициализация БД
│   └── schema.prisma      # Prisma схема
├── redis/                 # Redis конфигурация
└── monitoring/            # Мониторинг (planned)
```

---

## Database Layer

### PostgreSQL (`postgres/`)

#### Schema Definition
```sql
-- init.sql - Базовая инициализация
CREATE DATABASE venus_dev;
CREATE USER venus_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE venus_dev TO venus_user;
```

#### Prisma Schema
```prisma
// schema.prisma
datasource db {
  provider = "postgresql"  // Production
  // provider = "sqlite"   // Development
  url      = env("DATABASE_URL")
}

model Account {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  // ... relations
}
```

#### Migrations
```bash
# Генерация миграции
npx prisma migrate dev --name add-user-avatar

# Применение в production
npx prisma migrate deploy

# Rollback (если нужно)
npx prisma migrate reset
```

### Redis (`redis/`)

#### Configuration
```redis.conf
# Основные настройки
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-redis-password
```

#### Use Cases
- **Session storage** — JWT refresh tokens
- **Rate limiting** — request counters
- **Cache** — API responses, user data
- **Pub/Sub** — real-time notifications (future)

---

## Cloud Infrastructure

### Domains & DNS (`cloud/domains.md`)

#### Current Setup
- **Primary Domain:** `venus.app` (planned)
- **Test Domain:** `tgcall.us` (current)
- **Subdomains:**
  - `api.tgcall.us` — API Gateway
  - `cdn.tgcall.us` — Media CDN
  - `staging.venus.app` — Staging environment

#### DNS Configuration
```dns
# Cloudflare DNS
tgcall.us     A     31.172.78.81
api.tgcall.us CNAME tgcall.us
cdn.tgcall.us CNAME tgcall.us
```

### SSL/TLS Certificates

#### Let's Encrypt Setup
```bash
# На сервере
certbot certonly --standalone -d tgcall.us -d api.tgcall.us -d cdn.tgcall.us

# Автоматическое обновление
certbot renew --quiet
```

#### Certificate Locations
```bash
/etc/letsencrypt/live/tgcall.us/
├── cert.pem      # Certificate
├── chain.pem     # Intermediate certificate
├── fullchain.pem # Certificate + chain
└── privkey.pem   # Private key
```

### Secrets Management (`cloud/secrets-management.md`)

#### Current Approach (Manual)
```bash
# На сервере
/opt/venus/.env.production
/opt/venus/.env.staging

# Права доступа
chmod 600 .env.*
chown deploy:deploy .env.*
```

#### Future: HashiCorp Vault
```hcl
# vault/config.hcl
storage "postgresql" {
  connection_url = "postgres://vault:vault@localhost:5432/vault"
}

path "venus/*" {
  capabilities = ["create", "read", "update", "delete"]
}
```

---

## Deployment Configuration

### Docker Compose Files

#### Development (`config/docker/docker-compose.dev.yml`)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: venus_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

#### Production (`config/docker/docker-compose.prod.yml`)
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: venus_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_prod:/var/lib/postgresql/data
    networks:
      - venus_network
```

### Environment Configuration

#### Development (`.env`)
```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/venus_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
```

#### Production (`.env.production`)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://venus_user:strong_password@postgres:5432/venus_prod
REDIS_URL=redis://:redis_password@redis:6379
JWT_SECRET=<openssl-generated-48-char>
SESSION_SECRET=<openssl-generated-48-char>
```

---

## Monitoring & Observability

### Planned Stack

#### Prometheus (`monitoring/prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'venus-services'
    static_configs:
      - targets: ['api-gateway:4000', 'auth-service:4001']
    metrics_path: '/metrics'
```

#### Grafana Dashboards
- **System Metrics** — CPU, Memory, Disk
- **Application Metrics** — Response times, Error rates
- **Business Metrics** — User registrations, CV generations
- **Database Metrics** — Query performance, Connection count

#### Health Checks
```bash
# API Gateway health
curl -f https://api.tgcall.us/health

# Database connectivity
docker exec venus-postgres pg_isready -U postgres

# Redis connectivity
docker exec venus-redis redis-cli ping
```

---

## Backup & Recovery

### Database Backups
```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U postgres venus_prod > /backups/venus_prod_$DATE.sql

# Upload to S3
aws s3 cp /backups/venus_prod_$DATE.sql s3://venus-backups/
```

### Disaster Recovery
1. **Spin up new server** with same configuration
2. **Restore database** from latest backup
3. **Deploy services** with blue-green strategy
4. **Update DNS** to point to new server
5. **Verify functionality** with health checks

---

## Security Considerations

### Network Security
- **Firewall** — restrict ports (only 80, 443, 22 open)
- **VPN** — for administrative access
- **Fail2Ban** — SSH brute force protection

### Data Security
- **Encryption at rest** — PostgreSQL with pgcrypto
- **Encryption in transit** — TLS 1.3 everywhere
- **Backup encryption** — AES-256 for offsite backups

### Access Control
```bash
# Server access
useradd deploy
usermod -aG docker deploy

# SSH key authentication only
echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
systemctl restart sshd
```

---

## Scaling Considerations

### Horizontal Scaling
- **Load Balancer** — Nginx or AWS ALB
- **Service Discovery** — Consul or Kubernetes DNS
- **Session Affinity** — Redis-backed sessions

### Database Scaling
- **Read Replicas** — PostgreSQL streaming replication
- **Connection Pooling** — PgBouncer
- **Sharding** — by account_id (future)

### Storage Scaling
- **CDN** — Cloudflare for global distribution
- **Object Storage** — S3 multi-region replication
- **Caching** — Redis cluster for session storage

---

## Cost Optimization

### Current Costs (VPS)
- **Server:** €50/month (VPS with 4GB RAM, 2 vCPU)
- **Domains:** €10/year (tgcall.us)
- **SSL:** Free (Let's Encrypt)
- **Storage:** €5/month (Cloudflare R2)

### Optimization Strategies
1. **Reserved Instances** for predictable workloads
2. **Spot Instances** for staging/development
3. **CDN** to reduce bandwidth costs
4. **Object Storage** instead of block storage

---

## Связанные документы

- [Cloud Setup](cloud/cloud-setup.md) — настройка провайдеров
- [Domains](cloud/domains.md) — DNS конфигурация
- [Secrets Management](cloud/secrets-management.md) — управление секретами
- [CI/CD Pipeline](../.docs/ci-cd_pipeline.md) — автоматизация развертывания

---

**Последнее обновление этого файла:** 2025-11-27