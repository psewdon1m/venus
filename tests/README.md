# tests/ — Тестирование проекта Venus

**Последнее обновление:** 2025-11-27  
**Статус:** Базовая структура создана

---

## Назначение папки

Папка `tests/` содержит все виды тестов для обеспечения качества кода:

- **Unit тесты** — тестирование отдельных функций и модулей
- **Integration тесты** — тестирование взаимодействия компонентов
- **E2E тесты** — сквозное тестирование пользовательских сценариев
- **Performance тесты** — нагрузочное тестирование

---

## Структура папки

```
tests/
├── e2e/                 # End-to-end тесты
│   ├── auth.spec.ts     # Аутентификация
│   ├── projects.spec.ts # Проекты
│   └── personas.spec.ts # Персоны
├── integration/         # Integration тесты
│   ├── api/            # API endpoints
│   └── database/       # Database operations
├── performance/         # Performance тесты
│   ├── load.js         # Нагрузочное тестирование
│   └── stress.js       # Стресс-тестирование
├── fixtures/            # Тестовые данные
│   ├── auth/           # Auth fixtures
│   └── projects/       # Project fixtures
└── login.json          # Test credentials
```

---

## Типы тестов

### 1. Unit Tests (Jest)
```typescript
// services/auth-service/src/utils/auth.test.ts
describe('Password hashing', () => {
  it('should hash password correctly', async () => {
    const hash = await hashPassword('password123')
    expect(await verifyPassword('password123', hash)).toBe(true)
  })
})
```

### 2. Integration Tests (Supertest)
```typescript
// tests/integration/api/auth.test.ts
describe('Auth API', () => {
  it('should register user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(201)
  })
})
```

### 3. E2E Tests (Playwright)
```typescript
// tests/e2e/auth.spec.ts
test('user can register and login', async ({ page }) => {
  await page.goto('/auth/register')
  await page.fill('[name=email]', 'test@example.com')
  await page.fill('[name=password]', 'password123')
  await page.click('[type=submit]')
  await expect(page).toHaveURL('/dashboard')
})
```

### 4. Performance Tests (k6)
```javascript
// tests/performance/load.js
import http from 'k6/http'

export let options = {
  vus: 10,
  duration: '30s',
}

export default function () {
  http.get('http://localhost:4000/health')
}
```

---

## Запуск тестов

### Локально
```bash
# Все тесты
pnpm test

# Unit тесты
pnpm test:unit

# Integration тесты
pnpm test:integration

# E2E тесты
pnpm test:e2e

# С покрытием
pnpm test:coverage
```

### В CI/CD
```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

---

## Test Data Management

### Fixtures
```typescript
// tests/fixtures/auth/user.ts
export const testUser = {
  email: 'test@example.com',
  password: 'password123',
  persona: {
    slug: 'test-persona',
    displayName: 'Test Persona'
  }
}
```

### Database Seeding
```typescript
// tests/setup.ts
beforeAll(async () => {
  await prisma.account.create({ data: testUser })
})

afterAll(async () => {
  await prisma.account.deleteMany()
})
```

---

## Coverage Requirements

- **Overall:** >80%
- **Critical paths:** >90%
- **New code:** >85%
- **Branches:** >75%

---

## Best Practices

### ✅ DO
- Писать тесты перед кодом (TDD)
- Использовать descriptive названия
- Тестировать edge cases
- Mock external dependencies
- Поддерживать coverage >80%

### ❌ DON'T
- Тестировать implementation details
- Зависеть от реального API
- Использовать sleep() в тестах
- Оставлять flaky тесты
- Дублировать тестовую логику

---

## Связанные документы

- [Testing Guide](../.docs/stages.md#7-1-development-workflow) — стратегия тестирования
- [CI/CD Pipeline](../.docs/ci-cd_pipeline.md) — автоматизация тестов

---

**Последнее обновление этого файла:** 2025-11-27