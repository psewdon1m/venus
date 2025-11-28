# Cloud Infrastructure & Domains — Venus Platform

Полная настройка облачной инфраструктуры, доменов и развертывания для проекта Venus.

---

## Содержание

1. [Обзор Инфраструктуры](#обзор-инфраструктуры)
2. [Серверная Конфигурация](#серверная-конфигурация)
3. [Домен и DNS](#домен-и-dns)
4. [SSL и Безопасность](#ssl-и-безопасность)
5. [Docker и Развертывание](#docker-и-развертывание)
6. [Мониторинг и Troubleshooting](#мониторинг-и-troubleshooting)

---

## Обзор Инфраструктуры

### Текущая Архитектура

**Провайдер:** VPS Hosting (Netherlands)  
**Сервер:** Ubuntu Server, IP: `31.172.78.81`  
**DNS:** Cloudflare  
**SSL:** Let's Encrypt  

### Компоненты Системы

| Компонент | Статус | Назначение |
|-----------|--------|------------|
| **Docker & Compose** | ✅ | Контейнеризация сервисов |
| **PostgreSQL** | ✅ | Основная база данных |
| **Redis** | ✅ | Кеширование и сессии |
| **Nginx** | ✅ | Reverse proxy и SSL termination |
| **SSL Certificates** | ✅ | Let's Encrypt для всех доменов |

### Архитектура Развертывания

```
Internet
    ↓
Cloudflare CDN + DDoS Protection
    ↓
Nginx Reverse Proxy (31.172.78.81:443)
    ├─→ Frontend (Docker: port 3000)
    ├─→ API Gateway (Docker: port 4000)
    └─→ CDN/Media (Docker: port 4004)
         ↓
    Backend Services (Docker network)
    ├─→ Auth Service (port 4001)
    ├─→ Project Service (port 4002)
    ├─→ Persona Service (port 4003)
    ├─→ Media Service (port 4004)
    └─→ AI-CV Service (port 4005)
         ↓
    Data Layer (Docker network)
    ├─→ PostgreSQL (port 5432)
    └─→ Redis (port 6379)
```

---

## Серверная Конфигурация

### Спецификации Сервера

**Рекомендуемые минимальные требования:**
- **CPU:** 2+ cores
- **RAM:** 4GB+ (8GB recommended)
- **Storage:** 50GB+ SSD
- **Network:** 100Mbps+

**Проверка текущих ресурсов:**
```bash
ssh root@31.172.78.81 "lscpu && free -h && df -h"
```

### Доступ к Серверу

**Root доступ:**
```bash
ssh root@31.172.78.81
```

**Рекомендуемый non-root пользователь:**
```bash
ssh deploy@31.172.78.81
```

** Безопасность:** SSH ключи хранятся локально в `secrets/` директории.

### Firewall Конфигурация

**Открытые порты:**
```bash
# Public access
22   - SSH (restrict to trusted IPs)
80   - HTTP (redirect to HTTPS)
443  - HTTPS

# Internal only (Docker networks)
3000 - Frontend (internal)
4000 - API Gateway (internal)
4001-4005 - Microservices (internal)
5432 - PostgreSQL (internal)
6379 - Redis (internal)
```

**UFW настройка:**
```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Безопасность Сервера

**Рекомендуемые действия:**

1. **Создать non-root пользователя:**
```bash
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy
```

2. **Отключить root SSH:**
```bash
# /etc/ssh/sshd_config
PermitRootLogin no
systemctl restart sshd
```

3. **SSH key authentication:**
```bash
ssh-copy-id deploy@31.172.78.81
# Then disable password auth
PasswordAuthentication no
```

4. **Установить fail2ban:**
```bash
apt update && apt install fail2ban
systemctl enable fail2ban
```

5. **Автоматические security updates:**
```bash
apt install unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

---

## Домен и DNS

### Основной Домен

**Домен:** `tgcall.us`  
**Назначение:** Production frontend  
**Cloudflare Proxy:**  Enabled  
**SSL:**  Issued  

**URLs:**
- Production: `https://tgcall.us`
- Staging: `https://staging.tgcall.us` (planned)

### Сабдомены

| Сабдомен | Тип | Назначение | Proxy | SSL |
|----------|-----|------------|-------|-----|
| `api.tgcall.us` | A | API Gateway | ✅ | ✅ |
| `cdn.tgcall.us` | A | Media delivery | ✅ | ✅ |
| `admin.tgcall.us` | A | Admin tools | ✅ | ✅ |

**Все записи указывают на:** `31.172.78.81`

### Будущие Сабдомены

- `staging.tgcall.us` - Staging frontend
- `api.staging.tgcall.us` - Staging API
- `docs.tgcall.us` - API documentation
- `status.tgcall.us` - Status page

### Cloudflare Конфигурация

#### Security Settings
-  SSL/TLS: Full (strict)
-  Always Use HTTPS: Enabled
-  HTTP Strict Transport Security: Enabled
-  Automatic HTTPS Rewrites: Enabled

#### Performance Settings
-  Auto Minify: CSS, JavaScript, HTML
-  Brotli Compression: Enabled
-  Rocket Loader: Enabled (test impact)

#### Caching
- Static assets: Cache Everything (1 year)
- API responses: Bypass cache or short TTL
- CDN assets: Cache Everything (1 month)

#### DDoS Protection
-  DDoS Protection: Enabled (automatic)
-  Rate Limiting: Configure in dashboard
-  Bot Fight Mode: Enabled

### DNS Проверка

```bash
# Check DNS records
dig tgcall.us
dig api.tgcall.us
dig cdn.tgcall.us

# Check from multiple locations
# https://dnschecker.org/
```

---

## SSL и Безопасность

### SSL Сертификаты

**Провайдер:** Let's Encrypt  
**Выпущены на:** Server (31.172.78.81)  
**Автообновление:** Configured via Certbot  

**Расположение сертификатов:**
```
/etc/letsencrypt/live/tgcall.us/fullchain.pem
/etc/letsencrypt/live/tgcall.us/privkey.pem
```

**Обновление:**
```bash
certbot renew --nginx
```

**Проверка срока действия:**
```bash
echo | openssl s_client -servername tgcall.us -connect tgcall.us:443 2>/dev/null | openssl x509 -noout -dates
```

### Nginx Конфигурация

**Reverse proxy setup:**

```nginx
# /etc/nginx/sites-available/tgcall.us
server {
    listen 443 ssl http2;
    server_name tgcall.us;

    ssl_certificate /etc/letsencrypt/live/tgcall.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tgcall.us/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Gateway
server {
    listen 443 ssl http2;
    server_name api.tgcall.us;

    ssl_certificate /etc/letsencrypt/live/tgcall.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tgcall.us/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# CDN
server {
    listen 443 ssl http2;
    server_name cdn.tgcall.us;

    ssl_certificate /etc/letsencrypt/live/tgcall.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tgcall.us/privkey.pem;

    location / {
        proxy_pass http://localhost:4004;
        proxy_set_header Host $host;

        # Caching headers
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Admin (restricted access)
server {
    listen 443 ssl http2;
    server_name admin.tgcall.us;

    ssl_certificate /etc/letsencrypt/live/tgcall.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tgcall.us/privkey.pem;

    # IP whitelist (add your IPs)
    # allow YOUR_IP_ADDRESS;
    # deny all;

    location / {
        proxy_pass http://localhost:5050;  # pgAdmin
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Docker и Развертывание

### Структура Директорий

```bash
/opt/venus/
├── .env.staging          # Staging environment variables
├── .env.production       # Production environment variables
├── docker-compose.staging.yml
├── docker-compose.prod.yml
├── backups/              # Database backups
└── tmp/                  # Temporary files
    ├── uploads/         # Media uploads
    └── cv-generated/    # Generated CVs
```

### Начальное Развертывание

1. **SSH на сервер:**
```bash
ssh root@31.172.78.81
```

2. **Создать директорию проекта:**
```bash
mkdir -p /opt/venus
cd /opt/venus
```

3. **Клонировать репозиторий:**
```bash
git clone https://github.com/your-org/venus.git .
```

4. **Настроить окружение:**
```bash
cp .env.example .env.production
nano .env.production  # Edit with production values
```

5. **Развернуть с Docker Compose:**
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Обновления

```bash
# SSH to server
ssh root@31.172.78.81

# Navigate to project
cd /opt/venus

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Check status
docker compose ps
```

### Backup Стратегия

**Database backups:**
```bash
# Daily backup script (add to crontab)
0 2 * * * /opt/venus/scripts/backup-db.sh

# Manual backup
docker compose exec postgres pg_dump -U postgres venus_prod > backup-$(date +%Y%m%d).sql
```

**Storage:**
- Local: `/opt/venus/backups/`
- Remote: S3/R2 bucket (configure in Etapa 2)

---

## Мониторинг и Troubleshooting

### Health Checks

```bash
# Check all services
curl https://tgcall.us/api/health
curl https://api.tgcall.us/health

# Check individual services
docker compose ps
docker compose logs -f frontend
```

### Resource Monitoring

```bash
# System resources
docker stats

# Disk usage
df -h

# Memory usage
free -h

# Network connections
netstat -tuln
```

### Common Issues

#### SSH Connection Failed
```bash
# Check if port is open
telnet 31.172.78.81 22

# Check firewall
ssh root@31.172.78.81 "ufw status"
```

#### SSL Certificate Issues
```bash
# Renew manually
ssh root@31.172.78.81 "certbot renew --force-renewal"

# Check Nginx config
ssh root@31.172.78.81 "nginx -t"
```

#### Service Not Responding
```bash
# Check service status
ssh root@31.172.78.81 "docker compose ps"

# Check logs
ssh root@31.172.78.81 "docker compose logs -f SERVICE_NAME"

# Restart service
ssh root@31.172.78.81 "docker compose restart SERVICE_NAME"
```

### Maintenance Tasks

**Monthly:**
-  Verify SSL certificates auto-renewal
-  Check DNS records validity
-  Review Cloudflare analytics
-  Update firewall rules if needed

**Quarterly:**
-  Review and update Cloudflare settings
-  Audit subdomain usage
-  Check for unused DNS records

---

## Cost Tracking

**Monthly costs:**
- VPS hosting: $X/month
- Domain registration: $X/year
- Cloudflare: Free (or Pro plan)
- SSL certificates: Free (Let's Encrypt)
- Bandwidth: Included in VPS

**Total estimated:** Track in project budget

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