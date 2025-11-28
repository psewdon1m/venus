# tools/ — Development and build tools

**Последнее обновление:** 2025-11-27  
**Статус:** Directory for development utilities

---

## Назначение папки

Папка `tools/` содержит вспомогательные инструменты и утилиты для:

- **Code generation** — автоматическая генерация кода
- **Development helpers** — скрипты для разработки
- **Build tools** — кастомные build utilities
- **Project utilities** — различные helper tools

---

## Структура папки

```
tools/
├── generators/           # Code generators
│   ├── service-generator.js    # Генерация нового сервиса
│   ├── component-generator.js  # Генерация React компонентов
│   └── migration-generator.js  # Генерация DB миграций
├── dev-helpers/          # Development utilities
│   ├── db-reset.js             # Сброс development БД
│   ├── seed-generator.js       # Генерация тестовых данных
│   └── api-tester.js           # Testing API endpoints
├── build-tools/          # Build utilities
│   ├── docker-builder.js       # Кастомный Docker build
│   ├── bundle-analyzer.js      # Анализ bundle size
│   └── asset-optimizer.js      # Оптимизация assets
└── README.md            # Этот файл
```

---

## Code Generators

### Service Generator (`generators/service-generator.js`)
```javascript
#!/usr/bin/env node
// Generate new microservice structure

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const serviceName = process.argv[2]
if (!serviceName) {
  console.error('Usage: node service-generator.js <service-name>')
  process.exit(1)
}

const serviceDir = path.join(__dirname, '..', 'services', serviceName)

// Create directory structure
fs.mkdirSync(serviceDir, { recursive: true })
fs.mkdirSync(path.join(serviceDir, 'src'), { recursive: true })

// Generate package.json
const packageJson = {
  name: `@venus/${serviceName}`,
  version: '0.0.1',
  scripts: {
    dev: 'tsx watch src/index.ts',
    build: 'tsc',
    start: 'node dist/index.js'
  }
}
fs.writeFileSync(
  path.join(serviceDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
)

// Generate basic files
const indexTs = `
import express from 'express'

const app = express()
const PORT = process.env.PORT || 4000

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: '${serviceName}' })
})

app.listen(PORT, () => {
  console.log('${serviceName} listening on port \${PORT}')
})
`
fs.writeFileSync(path.join(serviceDir, 'src', 'index.ts'), indexTs)

console.log(\`Service \${serviceName} generated successfully!\`)
```

### Component Generator (`generators/component-generator.js`)
```javascript
#!/usr/bin/env node
// Generate React component

const fs = require('fs')
const path = require('path')

const componentName = process.argv[2]
const componentDir = path.join(__dirname, '..', 'frontend', 'src', 'components')

const componentCode = `
import React from 'react'

interface ${componentName}Props {
  // Add props here
}

export default function ${componentName}({}: ${componentName}Props) {
  return (
    <div>
      <h1>${componentName}</h1>
    </div>
  )
}
`

fs.writeFileSync(
  path.join(componentDir, \`\${componentName}.tsx\`),
  componentCode
)

console.log(\`Component \${componentName} generated!\`)
```

---

## Development Helpers

### Database Reset (`dev-helpers/db-reset.js`)
```javascript
#!/usr/bin/env node
// Reset development database

const { execSync } = require('child_process')

console.log('Resetting development database...')

try {
  // Drop and recreate database
  execSync('docker compose down -v', { stdio: 'inherit' })
  execSync('docker compose up -d postgres redis', { stdio: 'inherit' })

  // Wait for database
  console.log('Waiting for database...')
  execSync('sleep 10')

  // Run migrations
  execSync('cd shared/types && npm run migrate:reset', { stdio: 'inherit' })

  console.log('Database reset complete!')
} catch (error) {
  console.error('Error resetting database:', error.message)
  process.exit(1)
}
```

### API Tester (`dev-helpers/api-tester.js`)
```javascript
#!/usr/bin/env node
// Test API endpoints

const axios = require('axios')

const baseURL = process.env.API_URL || 'http://localhost:4000'

async function testEndpoint(endpoint, method = 'GET') {
  try {
    const response = await axios({
      method,
      url: \`\${baseURL}\${endpoint}\`,
      timeout: 5000
    })
    console.log(\`✅ \${method} \${endpoint}: \${response.status}\`)
    return true
  } catch (error) {
    console.log(\`❌ \${method} \${endpoint}: \${error.response?.status || 'ERROR'}\`)
    return false
  }
}

async function runTests() {
  console.log('Testing API endpoints...')

  const tests = [
    ['/health', 'GET'],
    ['/api/auth/health', 'GET'],
    ['/api/projects/health', 'GET'],
    // Add more tests
  ]

  let passed = 0
  for (const [endpoint, method] of tests) {
    if (await testEndpoint(endpoint, method)) passed++
  }

  console.log(\`\\nResults: \${passed}/\${tests.length} tests passed\`)
}

runTests()
```

---

## Build Tools

### Docker Builder (`build-tools/docker-builder.js`)
```javascript
#!/usr/bin/env node
// Advanced Docker build with optimizations

const { execSync } = require('child_process')
const fs = require('fs')

const service = process.argv[2]
if (!service) {
  console.error('Usage: node docker-builder.js <service-name>')
  process.exit(1)
}

console.log(\`Building \${service} with optimizations...\`)

// Build with BuildKit
execSync(\`docker build --target production -t venus/\${service}:latest ./services/\${service}\`, {
  stdio: 'inherit',
  env: { ...process.env, DOCKER_BUILDKIT: '1' }
})

// Analyze image size
const result = execSync(\`docker images venus/\${service}:latest --format "{{.Size}}"\`)
console.log(\`Image size: \${result.toString().trim()}\`)

// Run security scan
execSync(\`docker run --rm -v /var/run/docker.sock:/var/run/docker.sock goodwithtech/dockle:v0.4.14 venus/\${service}:latest\`, {
  stdio: 'inherit'
})

console.log('Build completed successfully!')
```

---

## Использование

### Генерация кода
```bash
# Создать новый сервис
node tools/generators/service-generator.js my-new-service

# Создать React компонент
node tools/generators/component-generator.js MyComponent
```

### Development helpers
```bash
# Сбросить базу данных
node tools/dev-helpers/db-reset.js

# Протестировать API
node tools/dev-helpers/api-tester.js
```

### Build tools
```bash
# Продвинутый Docker build
node tools/build-tools/docker-builder.js api-gateway
```

---

## Best Practices

### ✅ DO
- Документировать usage каждого tool
- Добавлять error handling
- Использовать consistent naming
- Тестировать tools перед commit

### ❌ DON'T
- Создавать tools без необходимости
- Хардкодить paths и конфигурации
- Игнорировать error cases
- Коммитить broken tools

---

## Contributing

### Добавление нового tool
1. Создать файл в соответствующей папке
2. Добавить shebang `#!/usr/bin/env node`
3. Сделать файл executable: `chmod +x`
4. Документировать usage в этом README
5. Протестировать functionality

### Code Style
- Использовать async/await для асинхронных операций
- Добавлять JSDoc комментарии
- Handle errors gracefully
- Use environment variables для конфигурации

---

## Связанные документы

- [Scripts](../scripts/README.md) — automation scripts
- [Config](../config/README.md) — configuration files
- [Development Workflow](../.docs/stages.md) — development process

---

**Последнее обновление этого файла:** 2025-11-27