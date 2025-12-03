// Venus Platform - Auth Service
// Authentication and Authorization microservice

import cors from 'cors';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import healthRouter from './routes/health';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4001;

// ==================================================
// Middleware
// ==================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ==================================================
// Routes
// ==================================================

app.use('/health', healthRouter);
app.use('/auth', authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ==================================================
// Server
// ==================================================

const server = app.listen(PORT, () => {
  logger.info(`Auth Service started on port ${PORT}`, {
    environment: process.env.NODE_ENV,
    version: '0.0.1-alpha',
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
