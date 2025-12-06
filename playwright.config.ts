import { defineConfig } from '@playwright/test';

const frontendBaseURL = process.env.E2E_FRONTEND_URL ?? 'http://localhost:3000';
const isCI = !!process.env.CI;

const allureReporter: [string, Record<string, unknown>] = [
  'allure-playwright',
  {
    outputFolder: 'allure-results',
    detail: true,
    suiteTitle: false,
  },
];

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  reporter: [
    ...(isCI ? [['github'], ['line']] : [['list']]),
    allureReporter,
  ],
  use: {
    baseURL: frontendBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
});
