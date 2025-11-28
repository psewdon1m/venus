# .husky/ — Git hooks for code quality

**Последнее обновление:** 2025-11-27  
**Статус:** Pre-commit hooks configured

---

## Назначение папки

Папка `.husky/` содержит git hooks для автоматической проверки качества кода перед коммитами:

- **pre-commit** — проверки перед коммитом
- **commit-msg** — валидация сообщений коммитов
- **pre-push** — проверки перед push

---

## Структура папки

```
.husky/
├── _/                     # Husky runtime
├── pre-commit            # Pre-commit hook
├── commit-msg            # Commit message validation
└── pre-push              # Pre-push hook (optional)
```

---

## Pre-commit Hook

### pre-commit
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run linting and formatting
npm run lint
npm run format:check

# Run type checking
npm run typecheck

# Run unit tests
npm run test:unit
```

**Что проверяет:**
- ESLint (code quality)
- Prettier (code formatting)
- TypeScript (type checking)
- Unit tests

### Автоматическое исправление
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Auto-fix issues
npm run lint:fix
npm run format

# Add fixed files
git add .
```

---

## Commit Message Hook

### commit-msg
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validate commit message format
npx --no-install commitlint --edit "$1"
```

**Правила commitlint:**
```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style
        'refactor', // Code refactor
        'test',     // Testing
        'chore',    // Maintenance
        'perf',     // Performance
        'ci',       // CI/CD
        'build',    // Build system
        'revert'    // Revert changes
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'auth',
        'projects',
        'personas',
        'media',
        'cv',
        'shared',
        'infra',
        'docs',
        'config'
      ]
    ],
    'subject-max-length': [2, 'always', 72]
  }
}
```

### Примеры правильных коммитов
```
feat(auth): add JWT token refresh
fix(frontend): resolve login form validation
docs(api): update endpoint documentation
style(shared): format TypeScript interfaces
refactor(media): optimize image processing
test(services): add integration tests for API gateway
```

---

## Pre-push Hook (опционально)

### pre-push
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run full test suite before push
npm run test

# Run build to ensure everything compiles
npm run build

# Check for security vulnerabilities
npm audit --audit-level high
```

---

## Настройка Husky

### Установка
```bash
# Install Husky
npm install husky --save-dev

# Initialize Husky
npx husky install

# Add hooks
npx husky add .husky/pre-commit "npm run pre-commit"
npx husky add .husky/commit-msg "npx --no-install commitlint --edit \$1"
```

### Package.json скрипты
```json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "npm run lint && npm run test:unit",
    "postinstall": "husky install"
  }
}
```

---

## Troubleshooting

### Hook не запускается
```bash
# Check if hooks are executable
ls -la .husky/

# Make hooks executable
chmod +x .husky/*

# Reinitialize Husky
npm run prepare
```

### Пропустить hooks (в крайнем случае)
```bash
# Skip all hooks
git commit --no-verify

# Skip specific hook
HUSKY_SKIP_HOOKS=1 git commit
```

### Отладка hooks
```bash
# Enable debug mode
DEBUG=husky npm run prepare

# Check hook execution
git commit -m "test" --verbose
```

---

## Best Practices

### ✅ DO
- Делать hooks быстрыми (<30 сек)
- Использовать `npm run` для consistency
- Добавлять meaningful error messages
- Тестировать hooks локально
- Документировать сложные проверки

### ❌ DON'T
- Блокировать разработку долгими проверками
- Использовать интерактивные команды
- Хардкодить пути
- Игнорировать failed hooks
- Делать hooks слишком строгими

---

## Связанные документы

- [Git Management](../.docs/git_managment.md) — git workflow
- [Constitution](../.docs/constitution.md) — coding standards
- [Config](../config/README.md) — linting configuration

---

**Последнее обновление этого файла:** 2025-11-27