// Venus Platform - Persona Service
// Persona management microservice

import cors from 'cors';
import { config } from 'dotenv';
import express, { json, type Express, urlencoded } from 'express';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import personaRouter from './routes/personas';
import { logger } from './utils/logger';

config();

const app: Express = express();
const PORT = process.env.PERSONA_SERVICE_PORT || 4003;

// ==================================================
// Middleware
// ==================================================

app.use(helmet());
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

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

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'persona-service',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
  });
});

app.use('/personas', personaRouter);
app.use('/public', personaRouter); // Public persona access

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
  logger.info(`Persona Service started on port ${PORT}`, {
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
