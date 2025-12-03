// JWT Authentication middleware for API Gateway

import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role?: string;
        type: string;
      };
    }
  }
}

// JWT verification middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first
  let token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // If no header token, try to get from cookies
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

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

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if it's an access token
    if (decoded.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Access token required',
        },
      });
      return;
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'USER',
      type: decoded.type,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
    return;
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  // Try to get token from Authorization header first
  let token = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // If no header token, try to get from cookies
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type === 'access') {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role || 'USER',
          type: decoded.type,
        };
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
};

// RBAC middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userRole = req.user.role || 'USER';

    // Define role hierarchy: ADMIN > USER
    const roleHierarchy = {
      'USER': 1,
      'ADMIN': 2,
    };

    const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

    if (userLevel < requiredLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Insufficient permissions. Required role: ${requiredRole}, your role: ${userRole}`,
        },
      });
      return;
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = requireRole('ADMIN');
export const requireUser = requireRole('USER');
