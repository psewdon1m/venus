// Logger utility for Project Service

import { createLogger, format, transports } from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = createLogger({
  level: logLevel,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'project-service' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  })
);

logger.rejections.handle(
  new transports.Console({
    format: format.combine(format.colorize(), format.simple()),
  })
);
