// Auth utilities - Password hashing, JWT, validation

import type { LoginRequest, RegisterRequest } from '@venus/types';
import { compare, hash } from 'bcryptjs';
import { sign, verify, type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// Auth tokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  return await new Promise((resolve, reject) => {
    hash(password, BCRYPT_ROUNDS, (err, hashed) => {
      if (err || !hashed) {
        reject(err || new Error('Failed to hash password'));
        return;
      }
      resolve(hashed);
    });
  });
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await new Promise((resolve, reject) => {
    compare(password, hash, (err, same) => {
      if (err) {
        return reject(err);
      }
      resolve(same);
    });
  });
};

// JWT utilities
export const generateAccessToken = (payload: object): string => {
  return sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY } as SignOptions);
};

export const generateRefreshToken = (payload: object): string => {
  return sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRY } as SignOptions);
};

export const verifyToken = (token: string): any => {
  try {
    return verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const generateTokens = (userId: string, email: string, role: string = 'USER'): AuthTokens => {
  const accessToken = generateAccessToken({ userId, email, role, type: 'access' });
  const refreshToken = generateRefreshToken({ userId, email, role, type: 'refresh' });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiry: Date.now() + 15 * 60 * 1000, // 15 minutes
    refreshTokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// Validation utilities
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH || '8');

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (process.env.PASSWORD_REQUIRE_UPPERCASE === 'true' && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (process.env.PASSWORD_REQUIRE_LOWERCASE === 'true' && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (process.env.PASSWORD_REQUIRE_NUMBERS === 'true' && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (process.env.PASSWORD_REQUIRE_SPECIAL === 'true' && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRegisterData = (data: RegisterRequest): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      errors.push(...passwordValidation.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateLoginData = (data: LoginRequest): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.password) {
    errors.push('Password is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
