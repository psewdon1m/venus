// Authentication middleware for media-service

import { Request, Response, NextFunction } from 'express';
// import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'USER' | 'ADMIN';
    type: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> => {
  // TODO: Re-enable JWT authentication when jsonwebtoken dependency is installed
  // For now, allow all requests (development only)
  req.user = {
    userId: 'dev-user-id',
    email: 'dev@example.com',
    role: 'USER',
    type: 'access',
  };
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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