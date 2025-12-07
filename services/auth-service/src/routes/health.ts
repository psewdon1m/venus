// Health check endpoint for Auth Service

import { Router } from 'express';

import type { HealthCheckResponse } from '@venus/types';
import type { Response } from 'express';

const router: Router = Router();

router.get('/', (_req, res: Response) => {
  const uptime = process.uptime();

  const health: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
    version: '0.0.1-alpha',
    uptime,
    checks: {
      database: true, // TODO: Actual DB check
      redis: true, // TODO: Actual Redis check
    },
  };

  res.status(200).json(health);
});

export default router;
