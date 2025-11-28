// Venus Platform - Project Service
// Project and album management microservice

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import type { HealthCheckResponse } from '@venus/types';
import projectRouter from './routes/projects';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PROJECT_SERVICE_PORT || 4002;

// ==================================================
// Middleware
// ==================================================

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// ==================================================
// Routes
// ==================================================

// Health check (mock for development)
app.get('/health', async (req, res) => {
  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'project-service',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
    checks: {
      database: true, // Mock for development
    },
  };

  res.status(200).json(health);
});

// Projects routes
app.use('/projects', projectRouter);

// ==================================================
// Server
// ==================================================

const server = app.listen(PORT, () => {
  console.log(`Project Service started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

export default app;
