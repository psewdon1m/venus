// Venus Platform - AI-CV Service
// AI-powered CV generation microservice

import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { config } from 'dotenv';
import express, { json, type Application } from 'express';
import helmet from 'helmet';

import type { HealthCheckResponse } from '@venus/types';
import { logger } from './utils/logger';

config();

const prisma = new PrismaClient();
const app: Application = express();
const PORT = process.env.AI_CV_SERVICE_PORT || 4005;

app.use(helmet());
app.use(cors());
app.use(json());

// Health check
app.get('/health', async (_req, res) => {
  let dbHealthy = false;
  const aiHealthy = Boolean(process.env.OPENAI_API_KEY);

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    dbHealthy = true;
  } catch (error) {
    dbHealthy = false;
  }

  const health: HealthCheckResponse = {
    status: dbHealthy && aiHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'ai-cv-service',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
    checks: {
      database: dbHealthy,
      openai: aiHealthy,
    },
  };

  res.status(dbHealthy && aiHealthy ? 200 : 503).json(health);
});

// CV endpoints (stubbed)
app.post('/cv/generate', (_req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'CV generation not yet implemented' },
  });
});

const server = app.listen(PORT, () => {
  logger.info(`AI-CV Service started on port ${PORT}`);
});

process.on('SIGTERM', () => {
  prisma
    .$disconnect()
    .catch((error) => logger.error('Prisma disconnect error', { error }))
    .finally(() => server.close(() => process.exit(0)));
});

export default app;
