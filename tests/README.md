# tests

This directory hosts shared end-to-end assets for the Venus platform.

## Structure
- `e2e/auth-flow.test.ts` – Playwright smoke tests that cover register/login/refresh against the auth service.
- `login.json`, `test.json`, `test2.json` – JSON payload samples used by manual QA or API clients.

## Running the Playwright suite
1. Start the dev stack so API Gateway (port 4000) and the frontend (port 3000) are reachable, e.g.
   ```bash
   docker compose --env-file .env -f config/docker/docker-compose.yml -f config/docker/docker-compose.dev.yml up -d --build
   ```
2. Execute the tests with explicit endpoints (otherwise defaults fallback to 127.0.0.1):
   ```bash
   E2E_API_URL=http://127.0.0.1:4000/api \
   E2E_TEST_PASSWORD=TestPass123! \
   pnpm test:e2e
   ```

3. (Опционально) Построить HTML-отчет Allure:
   ```bash
   pnpm allure:report
   npx serve allure-report  # или откройте index.html вручную
   ```

### Useful environment variables
- `E2E_API_URL` – API Gateway base URL (default `http://127.0.0.1:4000/api`).
- `E2E_FRONTEND_URL` – kept for backward compatibility with older scripts.
- `E2E_TEST_PASSWORD` – Password used for generated accounts (defaults to `TestPass123!`).

## Why only E2E?
Integration/performance suites live inside individual packages (`services/*`) and run via `pnpm test:integration` inside CI. The shared `tests/` folder now keeps only assets that benefit from being centralized; empty placeholder folders were removed to avoid confusion.

> **Heads-up:** PostgreSQL must contain the latest schema (`pnpm --filter @venus/project-service migrate:dev`) before running the suite, otherwise the auth-service will raise `accounts table does not exist`.
