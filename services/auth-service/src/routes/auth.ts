// Auth routes - Register, Login, Refresh Token

import type { LoginRequest, LoginResponse, RefreshTokenResponse, RegisterRequest, RegisterResponse } from '@venus/types';
import { Router } from 'express';
import { generateTokens, hashPassword, verifyPassword, verifyToken } from '../utils/auth';
import { logger } from '../utils/logger';
import { storage } from '../utils/storage';
import { registerSchema, loginSchema, refreshTokenSchema, accountDeletionSchema } from '../schemas/auth';
import { requireAdmin } from '../middleware/auth';

// Proper JWT authentication middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_TOKEN', message: 'Access token required' }
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid access token' }
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'USER',
      type: decoded.type
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token verification failed' }
    });
  }
};

const router = Router();

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    // Validate input data with Zod
    const validation = registerSchema.safeParse(req);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration data',
          details: validation.error.issues,
        },
      });
    }

    const data = validation.data.body;

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
    const account = await storage.createAccount({
      email: data.email,
      passwordHash,
    });

    // Generate tokens for auto-login after registration
    const tokens = generateTokens(account.id, account.email, account.role);

    // Create session for refresh token
    await storage.createSession(
      account.id,
      tokens.refreshToken,
      req.get('user-agent'),
      req.ip
    );

    // Set httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove password hash from response
    const { passwordHash: _, ...accountWithoutPassword } = account;

    const response: RegisterResponse = {
      user: accountWithoutPassword,
      message: 'Account created successfully',
    };

    logger.info('User registered and auto-logged in', { userId: account.id, email: account.email });

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
    // Validate input data with Zod
    const validation = loginSchema.safeParse(req);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login data',
          details: validation.error.issues,
        },
      });
    }

    const data = validation.data.body;

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

    // Generate tokens with role
    const tokens = generateTokens(account.id, account.email, account.role);

    // Create session for refresh token
    await storage.createSession(
      account.id,
      tokens.refreshToken,
      req.get('user-agent'),
      req.ip
    );

    // Remove password hash from response
    const { passwordHash: _, ...accountWithoutPassword } = account;

    // Set httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: LoginResponse = {
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
router.post('/refresh', async (req, res) => {
  try {
    // Try to get refresh token from cookies first, then from body for backward compatibility
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Refresh token is required',
        },
      });
    }

    // Verify refresh token exists in database
    const session = await storage.getSessionByRefreshToken(refreshToken);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid refresh token' }
      });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: { code: 'EXPIRED_REFRESH_TOKEN', message: 'Refresh token expired' }
      });
    }

    // Generate new tokens with role
    const tokens = generateTokens(session.account.id, session.account.email, session.account.role);

    // Revoke old session and create new one (token rotation)
    await storage.revokeSession(session.id);
    await storage.createSession(
      session.account.id,
      tokens.refreshToken,
      req.get('user-agent'),
      req.ip
    );

    // Set new httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const response: RefreshTokenResponse = {
      accessToken: tokens.accessToken,
      expiresIn: Math.floor((tokens.accessTokenExpiry - Date.now()) / 1000),
    };

    logger.info('Token refreshed with rotation', { userId: session.account.id });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Token refresh error', { error: (error as Error).message });
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
  // Clear httpOnly cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

// ==================================================
// GDPR Compliance Endpoints
// ==================================================

// GET /account/export - Export user data (GDPR)
router.get('/account/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    // Get account data
    const account = await storage.getAccountById(userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        },
      });
    }

    // Get related data
    const personas = await storage.getPersonasByAccountId(userId);
    const projects = await storage.getProjectsByAccountId(userId);
    const mediaFiles = await storage.getMediaFilesByAccountId(userId);
    const cvGenerations = await storage.getCVGenerationsByAccountId(userId);

    const exportData = {
      account: {
        id: account.id,
        email: account.email,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      personas,
      projects,
      mediaFiles,
      cvGenerations,
      exportDate: new Date().toISOString(),
    };

    logger.info('Account data exported', { userId });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="venus-account-export-${userId}.json"`);
    res.status(200).json(exportData);
  } catch (error) {
    logger.error('Account export error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to export account data',
      },
    });
  }
});

// DELETE /account - Delete account and all data (GDPR)
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { confirmEmail } = req.body;

    // Get account to verify email
    const account = await storage.getAccountById(userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        },
      });
    }

    // Verify email confirmation
    if (!confirmEmail || confirmEmail !== account.email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMAIL_CONFIRMATION_REQUIRED',
          message: 'Please confirm your email address to delete your account',
        },
      });
    }

    // Delete all related data (cascade delete should handle this via Prisma)
    await storage.deleteAccount(userId);

    logger.info('Account deleted', { userId, email: account.email });

    res.status(200).json({
      success: true,
      data: {
        message: 'Account and all associated data have been permanently deleted',
      },
    });
  } catch (error) {
    logger.error('Account deletion error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete account',
      },
    });
  }
});

// GET /me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const account = await storage.getAccountById(userId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        },
      });
    }

    // Remove password hash from response
    const { passwordHash: _, ...accountWithoutPassword } = account;

    res.json({
      success: true,
      data: {
        user: accountWithoutPassword,
      },
    });
  } catch (error) {
    logger.error('Get current user error', { error: (error as Error).message, userId: req.user?.userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get user info',
      },
    });
  }
});

// ==================================================
// Admin Operations (require admin role)
// ==================================================

// GET /admin/accounts - List all accounts (admin only)
router.get('/admin/accounts', requireAdmin, async (req, res) => {
  try {

    const accounts = await storage.getAllAccounts();
    res.json({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    logger.error('Admin list accounts error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list accounts',
      },
    });
  }
});

// POST /admin/accounts/:id/role - Change user role (admin only)
router.post('/admin/accounts/:id/role', requireAdmin, async (req, res) => {
  try {

    const accountId = req.params.id;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'Role must be USER or ADMIN',
        },
      });
    }

    const account = await storage.updateAccountRole(accountId, role);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ACCOUNT_NOT_FOUND',
          message: 'Account not found',
        },
      });
    }

    logger.info('Account role updated by admin', {
      adminId: req.user!.userId,
      accountId,
      newRole: role,
    });

    res.json({
      success: true,
      data: {
        message: 'Account role updated successfully',
        account,
      },
    });
  } catch (error) {
    logger.error('Admin update role error', { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update account role',
      },
    });
  }
});

export default router;
