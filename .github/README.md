# .github/ — GitHub configuration and automation

**Последнее обновление:** 2025-11-27  
**Статус:** CI/CD workflows configured

---

## Назначение папки

Папка `.github/` содержит конфигурацию GitHub для проекта Venus:

- **GitHub Actions** — CI/CD workflows
- **Issue templates** — шаблоны для создания issues
- **Pull request templates** — шаблоны для PR
- **Repository settings** — настройки репозитория

---

## Структура папки

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ci.yml             # Continuous Integration
│   ├── cd-staging.yml     # Deploy to staging
│   └── cd-production.yml  # Deploy to production
├── ISSUE_TEMPLATE/        # Issue templates
│   ├── bug-report.md      # Bug report template
│   ├── feature-request.md # Feature request template
│   └── security-issue.md  # Security issue template
├── PULL_REQUEST_TEMPLATE.md # Pull request template
├── dependabot.yml         # Dependabot configuration
├── CODEOWNERS            # Code ownership rules
└── settings.yml          # Repository settings (optional)
```

---

## GitHub Actions Workflows

### CI Workflow (`workflows/ci.yml`)

**Triggers:**
- Push to any branch
- Pull requests

**Jobs:**
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:ci

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
```

### CD Staging (`workflows/cd-staging.yml`)

**Triggers:**
- Push to `main` branch (after CI passes)

**Jobs:**
```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: shimataro/ssh-key-action@v2
        with:
          key: ${{ secrets.STAGING_SSH_PRIVATE_KEY }}
          known_hosts: ${{ secrets.STAGING_KNOWN_HOSTS }}
      - run: |
          ssh deploy@31.172.78.81 << 'EOF'
          cd /opt/venus
          git pull origin main
          docker compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
          EOF
```

### CD Production (`workflows/cd-production.yml`)

**Triggers:**
- Manual approval after staging deploy

**Features:**
- Blue-green deployment
- Automated rollback
- Health checks
- Notifications

---

## Issue Templates

### Bug Report (`ISSUE_TEMPLATE/bug-report.md`)
```markdown
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
---

## Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. See error

## Expected behavior
A clear and concise description of what you expected to happen.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Version: [e.g. v1.2.3]
```

### Feature Request (`ISSUE_TEMPLATE/feature-request.md`)
```markdown
---
name: Feature Request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: enhancement
---

## Problem
A clear and concise description of the problem you're facing.

## Solution
Describe the solution you'd like to see.

## Alternatives
Describe any alternative solutions you've considered.

## Additional context
Add any other context or screenshots about the feature request here.
```

---

## Pull Request Template

### PULL_REQUEST_TEMPLATE.md
```markdown
## Description
Brief description of the changes made.

## Type of change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist:
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

---

## Repository Settings

### Branch Protection Rules
```yaml
# Settings → Branches → Add rule
Branch name: main
Required PR reviews: ✅ (1 reviewer)
Required status checks:
  - lint
  - test
  - build
Require branches up to date: ✅
```

### Dependabot (`dependabot.yml`)
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

## Security Features

### CodeQL Analysis
```yaml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript, typescript

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

### Secret Scanning
- Automatic detection of exposed secrets
- Integration with GitHub Security tab
- Alerts for sensitive data in code

---

## Best Practices

### ✅ DO
- Use descriptive workflow names
- Add proper error handling
- Use caching for dependencies
- Document complex workflows
- Test workflows in branches

### ❌ DON'T
- Hardcode secrets in workflows
- Use deprecated actions
- Skip required status checks
- Ignore security alerts
- Merge without reviews

---

## Связанные документы

- [CI/CD Pipeline](../.docs/ci-cd_pipeline.md) — детальная документация CI/CD
- [Git Management](../.docs/git_managment.md) — git workflow
- [Constitution](../.docs/constitution.md) — правила проекта

---

**Последнее обновление этого файла:** 2025-11-27