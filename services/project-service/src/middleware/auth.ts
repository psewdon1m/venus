// Authentication middleware for Project Service

import { verify, type JwtPayload } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface AccessTokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role?: string;
  type: 'access';
}

export interface AuthenticatedRequest extends Request {
  user?: Omit<AccessTokenPayload, 'iat' | 'exp'>;
}

// JWT verification middleware
export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
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

  try {
    const decoded = verify(token, JWT_SECRET) as AccessTokenPayload;

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
