import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000/api';
const DEFAULT_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'TestPass123!';

const buildEmail = (label: string) => `venus-e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;

async function registerUser(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, password, confirmPassword: password },
  });
  expect(response.status(), 'registration should succeed').toBe(201);
  const payload = await response.json();
  expect(payload.success).toBe(true);
  return payload;
}

async function loginUser(request: APIRequestContext, email: string, password: string) {
  const response = await request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });
  return response;
}

test.describe('Auth service smoke tests', () => {
  test('register + login + profile flow works', async ({ request }) => {
    const email = buildEmail('auth-flow');

    await registerUser(request, email, DEFAULT_PASSWORD);

    const loginResponse = await loginUser(request, email, DEFAULT_PASSWORD);
    expect(loginResponse.status(), 'login should succeed').toBe(200);

    const loginPayload = await loginResponse.json();
    const { accessToken, refreshToken, user } = loginPayload.data;

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(user.email).toBe(email);

    const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meResponse.status()).toBe(200);
    const mePayload = await meResponse.json();
    expect(mePayload.data.user.email).toBe(email);

    const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshResponse.status()).toBe(200);
    const refreshPayload = await refreshResponse.json();
    expect(refreshPayload.data.accessToken).toBeTruthy();
  });

  test('rejects invalid credentials', async ({ request }) => {
    const email = buildEmail('invalid');
    await registerUser(request, email, DEFAULT_PASSWORD);

    const invalidLogin = await loginUser(request, email, 'WrongPassword123!');
    expect(invalidLogin.status()).toBe(401);

    const invalidPayload = await invalidLogin.json();
    expect(invalidPayload.error.code).toBe('INVALID_CREDENTIALS');
  });
});
