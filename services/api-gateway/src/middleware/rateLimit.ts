// Per-user and IP-based rate limiting middleware

import expressRateLimit from 'express-rate-limit';

import type { NextFunction, Request, Response } from 'express';

interface RequestWithUser extends Request {
  user?: {
    userId?: string;
  };
}

type UserLimitState = {
  count: number;
  resetTime: number;
};

const userRateLimits = new Map<string, UserLimitState>();

const cleanExpiredLimits = (): void => {
  const now = Date.now();
  for (const [key, data] of userRateLimits.entries()) {
    if (now > data.resetTime) {
      userRateLimits.delete(key);
    }
  }
};

setInterval(cleanExpiredLimits, 5 * 60 * 1000);

const windowMs = 60 * 1000; // 1 minute
const maxRequests = 200;

export const perUserRateLimit = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  const userId = req.user?.userId;

  if (!userId) {
    ipRateLimit(req, res, next);
    return;
  }

  const now = Date.now();
  const key = `user:${userId}`;
  const state = userRateLimits.get(key);

  if (!state || now > state.resetTime) {
    userRateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    next();
    return;
  }

  if (state.count >= maxRequests) {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this user',
        retryAfter: Math.ceil((state.resetTime - now) / 1000),
      },
    });
    return;
  }

  state.count += 1;
  next();
};

export const ipRateLimit = expressRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const combinedRateLimit = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.userId) {
    perUserRateLimit(req, res, next);
    return;
  }

  ipRateLimit(req, res, next);
};
