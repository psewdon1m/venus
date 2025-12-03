// RBAC (Role-Based Access Control) middleware

import { NextFunction, Request, Response } from 'express';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Middleware to check if user has required role
export const requireRole = (requiredRole: UserRole) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_USER',
          message: 'Authentication required',
        },
      });
      return;
    }

    // For now, assign USER role to all authenticated users
    // In production, this should come from database
    const userRole = (req.user.role as UserRole) || UserRole.USER;

    if (userRole !== requiredRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Required role: ${requiredRole}, but user has: ${userRole}`,
        },
      });
      return;
    }

    next();
  };
};

// Middleware for admin-only routes
export const requireAdmin = requireRole(UserRole.ADMIN);

// Middleware for user or admin routes
export const requireUserOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'NO_USER',
        message: 'Authentication required',
      },
    });
    return;
  }

  const userRole = (req.user.role as UserRole) || UserRole.USER;

  if (userRole !== UserRole.USER && userRole !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: 'User or admin role required',
      },
    });
    return;
  }

  next();
};