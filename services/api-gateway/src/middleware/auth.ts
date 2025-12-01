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
        role: string;
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
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token required',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if it's an access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Access token required',
        },
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'USER',
      type: decoded.type,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
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
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required',
        },
      });
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
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Insufficient permissions. Required role: ${requiredRole}, your role: ${userRole}`,
        },
      });
    }

    next();
  };
};

// Specific role middlewares
export const requireAdmin = requireRole('ADMIN');
export const requireUser = requireRole('USER');
