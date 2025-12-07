// Authentication middleware for auth-service

import { verify, type JwtPayload } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { storage } from '../utils/storage';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'USER' | 'ADMIN';
    type: string;
  };
}

interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: 'USER' | 'ADMIN';
  type: 'access';
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token required',
        },
      });
      return;
    }

    const decoded = verify(token, process.env.JWT_ACCESS_SECRET as string) as AccessTokenPayload;

    // Get user from database to ensure they still exist and get role
    const user = await storage.getAccountById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: (user.role as 'USER' | 'ADMIN') || 'USER',
      type: decoded.type || 'access',
    };

    next();
  } catch (error) {
    logger.error('Token verification error', { error });
    res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    });
    return;
  }
};

export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NOT_AUTHENTICATED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin access required',
      },
    });
    return;
  }

  next();
};
