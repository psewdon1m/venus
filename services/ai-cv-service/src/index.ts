// Venus Platform - AI-CV Service
// AI-powered CV generation microservice

import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import type { HealthCheckResponse } from '@venus/types';

dotenv.config();

const app = express();
const PORT = process.env.AI_CV_SERVICE_PORT || 4005;
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', async (req, res) => {
  let dbHealthy = false;
  let aiHealthy = Boolean(process.env.OPENAI_API_KEY);

  try {
    await prisma.$queryRaw`SELECT 1`;
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
app.post('/cv/generate', (req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'CV generation not yet implemented' },
  });
});

const server = app.listen(PORT, () => {
  console.log(`AI-CV Service started on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

export default app;
