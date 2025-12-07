import { createLogger, format, transports } from 'winston';

const level = process.env.LOG_LEVEL || 'info';

export const logger = createLogger({
  level,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'media-service' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});

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
