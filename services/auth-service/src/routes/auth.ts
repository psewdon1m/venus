// Auth routes - Register, Login, Refresh Token

import type { LoginRequest, LoginResponse, RefreshTokenResponse, RegisterRequest, RegisterResponse } from '@venus/types';
import { Router } from 'express';
import { generateTokens, hashPassword, validateLoginData, validateRegisterData, verifyPassword, verifyToken } from '../utils/auth';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';

const router = Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const data: RegisterRequest = req.body;

    // Validate input data
    const validation = validateRegisterData(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: validation.errors,
        },
      });
    }

    // Check if email already exists
    const existingAccount = await storage.getAccountByEmail(data.email);
    if (existingAccount) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_EXISTS',
          message: 'Account with this email already exists',
        },
      });
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create account
    const account = storage.createAccount({
      email: data.email,
      passwordHash,
    });

    // Remove password hash from response
    const { passwordHash: _, ...accountWithoutPassword } = account;

    const response: RegisterResponse = {
      user: accountWithoutPassword,
      message: 'Account created successfully',
    };

    logger.info('User registered', { userId: account.id, email: account.email });

    res.status(201).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      },
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const data: LoginRequest = req.body;

    // Validate input data
    const validation = validateLoginData(data);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data',
          details: validation.errors,
        },
      });
    }

    // Find account by email
    const account = await storage.getAccountByEmail(data.email);
    if (!account) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(data.password, account.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      });
    }

    // Generate tokens
    const tokens = generateTokens(account.id, account.email);

    // Remove password hash from response
    const { passwordHash: _, ...accountWithoutPassword } = account;

    const response: LoginResponse = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: accountWithoutPassword,
      expiresIn: Math.floor((tokens.accessTokenExpiry - Date.now()) / 1000),
    };

    logger.info('User logged in', { userId: account.id, email: account.email });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
      },
    });
  }
});

// Refresh token endpoint
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid refresh token',
        },
      });
    }

    // Generate new tokens
    const tokens = generateTokens(decoded.userId, decoded.email);

    const response: RefreshTokenResponse = {
      accessToken: tokens.accessToken,
      expiresIn: Math.floor((tokens.accessTokenExpiry - Date.now()) / 1000),
    };

    logger.info('Token refreshed', { userId: decoded.userId });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Token refresh error', { error: error.message });
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token refresh failed',
      },
    });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  // For now, just return success
  // In production, you might want to blacklist the token
  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

export default router;
