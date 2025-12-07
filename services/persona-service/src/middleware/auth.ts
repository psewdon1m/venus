// Authentication middleware for persona-service

import { verify, type JwtPayload } from 'jsonwebtoken';
import { logger } from '../utils/logger';

import type { NextFunction, Request, Response } from 'express';

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

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
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

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'USER',
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
