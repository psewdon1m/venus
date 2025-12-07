// Logger utility using Winston

import { createLogger, format, transports } from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = createLogger({
  level: logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    isDevelopment
      ? format.combine(
          format.colorize(),
          format.printf((info) => {
            const { timestamp, level, message, ...meta } = info as {
              timestamp: string;
              level: string;
              message: string;
              [key: string]: unknown;
            };
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}]: ${String(message)} ${metaStr}`;
          })
        )
      : format.json()
  ),
  transports: [
    new transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});

// Add file transport in production
if (!isDevelopment) {
  logger.add(
    new transports.File({
      filename: 'logs/auth-service-error.log',
      level: 'error',
    })
  );
  logger.add(
    new transports.File({
      filename: 'logs/auth-service.log',
    })
  );
}
