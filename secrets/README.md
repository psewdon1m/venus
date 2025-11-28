# secrets/ — Sensitive configuration files

**Последнее обновление:** 2025-11-27  
**Статус:** Directory for sensitive files

---

## ⚠️ ВАЖНО

Эта папка предназначена **ТОЛЬКО** для хранения чувствительных конфигурационных файлов, которые **НИКОГДА** не должны попадать в git репозиторий.

## Что хранить здесь

- SSL сертификаты (`.pem`, `.key` файлы)
- SSH приватные ключи
- API ключи third-party сервисов (резервные копии)
- Database credentials (локальные копии)
- VPN конфигурации

## Структура (пример)

```
secrets/
├── .gitkeep              # Для отслеживания пустой папки
├── server-access.md      # SSH доступы и IP адреса
├── ssh/                  # SSH ключи
│   └── venus-deploy-key  # Приватный ключ для deployment
├── api-keys.txt          # API ключи (зашифрованные)
├── database-creds.txt    # Database пароли
└── ssl/                  # SSL сертификаты
    ├── cert.pem
    ├── chain.pem
    └── privkey.pem
```

## Правила безопасности

### ✅ ДО
- Хранить файлы с правами `chmod 600`
- Использовать шифрование для чувствительных файлов
- Регулярно ротировать ключи и сертификаты
- Делать резервные копии на encrypted носителях
- Логировать доступ к секретам

### ❌ НЕ
- Коммитить реальные секреты в git
- Делиться секретами по email или чату
- Хранить секреты в plain text
- Использовать слабые пароли
- Игнорировать expiration даты

## Доступ

### Development
- Локальные `.env` файлы (не в этой папке)
- Test credentials для локальной разработки

### Production
- Server-side `.env.production` файлы
- Encrypted backups на secure storage

### Access Control
- **Development:** Все разработчики (локально)
- **Production:** Только maintainer + DevOps
- **Emergency:** Project owner

## Инструменты

### Шифрование
```bash
# Зашифровать файл
openssl enc -aes-256-cbc -salt -in secrets.txt -out secrets.enc

# Расшифровать
openssl enc -d -aes-256-cbc -in secrets.enc -out secrets.txt
```

### SSH Keys
```bash
# Генерация ключа
ssh-keygen -t ed25519 -C "deploy@venus" -f venus-deploy-key

# Права доступа
chmod 600 venus-deploy-key
chmod 644 venus-deploy-key.pub
```

## Ротация секретов

### Schedule
- **JWT/Sessions:** Каждые 90 дней
- **Database:** Каждые 180 дней
- **API Keys:** При компрометации или по требованию

### Process
1. Generate новые секреты
2. Update на сервере
3. Rolling restart сервисов
4. Verify работоспособность
5. Log в access registry

## Emergency Procedures

### При компрометации
1. **Немедленная ротация** всех affected секретов
2. **Update** на всех серверах
3. **Restart** сервисов
4. **Monitor** за anomalies
5. **Document** incident

### Recovery
- Encrypted backups на offline storage
- Multi-person approval для recovery
- Audit trail всех операций

## Связанные документы

- [Secrets Management](../.docs/secrets_management.md) — детальная документация
- [Infrastructure](../infrastructure/README.md) — deployment
- [Security Practices](../.docs/constitution.md) — общие правила

---

**Файл обновлен:** 2025-11-27