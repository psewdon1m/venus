// Per-user rate limiting middleware

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Store for per-user rate limiting
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRateLimits.entries()) {
    if (now > data.resetTime) {
      userRateLimits.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Per-user rate limiter (200 requests per minute per user)
export const perUserRateLimit = (req: Request, res: Response, next: any) => {
  const userId = (req as any).user?.userId;

  if (!userId) {
    // If no user, fall back to IP-based limiting
    return ipRateLimit(req, res, next);
  }

  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 200; // 200 requests per minute per user

  const key = `user:${userId}`;
  const userLimit = userRateLimits.get(key);

  if (!userLimit || now > userLimit.resetTime) {
    // First request or window expired
    userRateLimits.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  if (userLimit.count >= maxRequests) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this user',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
      },
    });
  }

  userLimit.count++;
  next();
};

// IP-based rate limiter (100 requests per 15 minutes)
export const ipRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
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

// Combined rate limiter that uses per-user for authenticated requests
export const combinedRateLimit = (req: Request, res: Response, next: any) => {
  const userId = (req as any).user?.userId;

  if (userId) {
    // Authenticated user - use per-user limiting
    return perUserRateLimit(req, res, next);
  } else {
    // Unauthenticated - use IP-based limiting
    return ipRateLimit(req, res, next);
  }
};