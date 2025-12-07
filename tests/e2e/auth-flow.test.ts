import { expect, test } from '@playwright/test';

import type { APIRequestContext, APIResponse } from '@playwright/test';

const API_BASE_URL = process.env.E2E_API_URL ?? 'http://127.0.0.1:4000/api';
const DEFAULT_PASSWORD = process.env.E2E_TEST_PASSWORD ?? 'TestPass123!';

const buildEmail = (label: string): string => {
  return `venus-e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 1000)}@example.com`;
};

type AuthUser = {
  id: string;
  email: string;
};

type RegisterResponse = {
  success: boolean;
  data: { user: AuthUser };
};

type LoginResponse = {
  data: {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
  };
};

type MeResponse = {
  data: { user: AuthUser };
};

type RefreshResponse = {
  data: { accessToken: string };
};

type ErrorResponse = {
  error: { code: string };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isAuthUser = (value: unknown): value is AuthUser => {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.id === 'string' && typeof value.email === 'string';
};

const isRegisterResponse = (value: unknown): value is RegisterResponse => {
  if (!isRecord(value) || typeof value.success !== 'boolean') {
    return false;
  }

  const data = value.data;
  return isRecord(data) && isAuthUser(data.user);
};

const isLoginResponse = (value: unknown): value is LoginResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const data = value.data;
  return (
    isRecord(data) &&
    typeof data.accessToken === 'string' &&
    typeof data.refreshToken === 'string' &&
    isAuthUser(data.user)
  );
};

const isMeResponse = (value: unknown): value is MeResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const data = value.data;
  return isRecord(data) && isAuthUser(data.user);
};

const isRefreshResponse = (value: unknown): value is RefreshResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const data = value.data;
  return isRecord(data) && typeof data.accessToken === 'string';
};

const isErrorResponse = (value: unknown): value is ErrorResponse => {
  if (!isRecord(value)) {
    return false;
  }

  const error = value.error;
  return isRecord(error) && typeof error.code === 'string';
};

const parseResponse = async <T>(
  response: APIResponse,
  guard: (value: unknown) => value is T,
  context: string
): Promise<T> => {
  const payload: unknown = await response.json();
  if (!guard(payload)) {
    throw new Error(`Unexpected response shape for ${context}`);
  }
  return payload;
};

async function registerUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<RegisterResponse> {
  const response = await request.post(`${API_BASE_URL}/auth/register`, {
    data: { email, password, confirmPassword: password },
  });
  expect(response.status(), 'registration should succeed').toBe(201);
  return parseResponse(response, isRegisterResponse, 'register');
}

async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<APIResponse> {
  return request.post(`${API_BASE_URL}/auth/login`, {
    data: { email, password },
  });
}

test.describe('Auth service smoke tests', () => {
  test('register + login + profile flow works', async ({ request }) => {
    const email = buildEmail('auth-flow');

    const registerPayload = await registerUser(request, email, DEFAULT_PASSWORD);
    expect(registerPayload.success).toBe(true);

    const loginResponse = await loginUser(request, email, DEFAULT_PASSWORD);
    expect(loginResponse.status(), 'login should succeed').toBe(200);

    const loginPayload = await parseResponse(loginResponse, isLoginResponse, 'login');
    const { accessToken, refreshToken, user } = loginPayload.data;

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(user.email).toBe(email);

    const meResponse = await request.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(meResponse.status()).toBe(200);
    const mePayload = await parseResponse(meResponse, isMeResponse, 'me');
    expect(mePayload.data.user.email).toBe(email);

    const refreshResponse = await request.post(`${API_BASE_URL}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshResponse.status()).toBe(200);
    const refreshPayload = await parseResponse(refreshResponse, isRefreshResponse, 'refresh');
    expect(refreshPayload.data.accessToken).toBeTruthy();
  });

  test('rejects invalid credentials', async ({ request }) => {
    const email = buildEmail('invalid');
    const registerPayload = await registerUser(request, email, DEFAULT_PASSWORD);
    expect(registerPayload.success).toBe(true);

    const invalidLogin = await loginUser(request, email, 'WrongPassword123!');
    expect(invalidLogin.status()).toBe(401);

    const invalidPayload = await parseResponse(invalidLogin, isErrorResponse, 'invalid login');
    expect(invalidPayload.error.code).toBe('INVALID_CREDENTIALS');
  });
});
