// Venus Platform - API Gateway
// Single entry point for all backend services

import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import http from 'http';
import https from 'https';
import { z } from 'zod';

import { authenticateToken, optionalAuth, requireAdmin } from './middleware/auth';
import { combinedRateLimit } from './middleware/rateLimit';
import { logger } from './utils/logger';

// ==================================================
// Zod validation schemas
// ==================================================

const adminRoleUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    role: z.enum(['USER', 'ADMIN']),
  }),
});

// Validation middleware
const validate = (schema: any) => {
  return (req: any, res: any, next: any) => {
    try {
      schema.parse(req);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        });
      }
      next(error);
    }
  };
};

dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 4000;

// Service URLs (using localhost for development)
const AUTH_SERVICE_URL = 'http://localhost:4001';
const PROJECT_SERVICE_URL = 'http://localhost:4002';
const PERSONA_SERVICE_URL = 'http://localhost:4003';
const MEDIA_SERVICE_URL = 'http://localhost:4004';
const AI_CV_SERVICE_URL = 'http://localhost:4005';

// ==================================================
// Middleware
// ==================================================

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Combined rate limiting (per-user for authenticated, IP-based for anonymous)
app.use(combinedRateLimit);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Helper function to proxy requests to services
const proxyToService = (serviceUrl: string) => {
  return (req: express.Request, res: express.Response) => {
    const targetPath = req.originalUrl.replace(/^\/api/, '');
    const fullUrl = serviceUrl + targetPath;
    logger.info(`Proxying ${req.method} ${req.originalUrl} to ${fullUrl}`);

    const url = new URL(fullUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: url.hostname,
      },
    };

    logger.info(`Proxy options: ${JSON.stringify({ hostname: options.hostname, port: options.port, path: options.path, method: options.method })}`);

    const client = url.protocol === 'https:' ? https : http;
    const proxyReq = client.request(options, (proxyRes) => {
      res.status(proxyRes.statusCode || 500);
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key] as string);
      });

      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      logger.error('Proxy request error', { error: err.message, serviceUrl });
      res.status(503).json({ error: 'Service unavailable' });
    });

    // Forward request body
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }

    proxyReq.end();
  };
};

// ==================================================
// Service Proxies
// ==================================================

// Auth Service (public routes - no auth required)
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onProxyReq: (proxyReq, req, res) => {
    // Ensure body is properly forwarded
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    logger.error('Auth service proxy error', { error: err.message });
    res.status(503).json({ error: 'Auth service unavailable' });
  },
}));

// Project Service (protected routes - auth required)
app.use('/api/projects', authenticateToken, proxyToService(PROJECT_SERVICE_URL));

// Persona Service (protected routes - auth required)
app.use('/api/personas', authenticateToken, proxyToService(PERSONA_SERVICE_URL));

// Public persona access (optional auth)
app.use('/api/public', optionalAuth, createProxyMiddleware({
  target: PERSONA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/public': '/public' },
}));

// Media Service (protected routes - auth required)
app.use('/api/media', authenticateToken, createProxyMiddleware({
  target: MEDIA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/media': '/media' },
  onError: (err, req, res) => {
    logger.error('Media service proxy error', { error: err.message });
    res.status(503).json({ error: 'Media service unavailable' });
  },
}));

// AI CV Service (protected routes - auth required)
app.use('/api/cv', authenticateToken, createProxyMiddleware({
  target: AI_CV_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/cv': '/cv' },
  onError: (err, req, res) => {
    logger.error('AI-CV service proxy error', { error: err.message });
    res.status(503).json({ error: 'AI-CV service unavailable' });
  },
}));

// ==================================================
// Health Check
// ==================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
  });
});

// Admin routes (require admin role)
app.get('/api/admin/health', requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Admin access granted',
      user: req.user,
    },
  });
});

// Proxy admin routes to services
app.use('/api/admin/auth', requireAdmin, createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/admin/auth': '/admin' },
}));

app.use('/api/admin/personas', requireAdmin, createProxyMiddleware({
  target: PERSONA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/admin/personas': '/admin/personas' },
}));

app.use('/api/admin/projects', requireAdmin, createProxyMiddleware({
  target: PROJECT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/admin/projects': '/admin/projects' },
}));

app.use('/api/admin/media', requireAdmin, createProxyMiddleware({
  target: MEDIA_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/admin/media': '/admin' },
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
  });
});

// ==================================================
// Server
// ==================================================

const server = app.listen(PORT, () => {
  logger.info(`API Gateway started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});

export default app;
