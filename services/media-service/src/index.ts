// Venus Platform - Media Service
// Media processing, upload, and storage microservice

import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';

import type { HealthCheckResponse } from '@venus/types';

dotenv.config();

const app = express();
const PORT = process.env.MEDIA_SERVICE_PORT || 4004;
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', async (req, res) => {
  let dbHealthy = false;
  let storageHealthy = true; // TODO: Actual S3/R2 check

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (error) {
    dbHealthy = false;
  }

  const health: HealthCheckResponse = {
    status: dbHealthy && storageHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'media-service',
    version: '0.0.1-alpha',
    uptime: process.uptime(),
    checks: {
      database: dbHealthy,
      storage: storageHealthy,
    },
  };

  res.status(dbHealthy && storageHealthy ? 200 : 503).json(health);
});

// Media endpoints (stubbed)
app.post('/media/upload', (req, res) => {
  res.status(501).json({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Upload not yet implemented' },
  });
});

const server = app.listen(PORT, () => {
  console.log(`Media Service started on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

export default app;
