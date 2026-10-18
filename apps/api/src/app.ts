import Fastify, {LogController, type FastifyServerOptions} from 'fastify';
import staticFiles from '@fastify/static';
import {randomUUID} from 'node:crypto';
import type {Version, HealthLive, HealthReady} from '@venus/contracts';

export interface AppOptions {
  probe: () => Promise<void>; version: Version; staticRoot?: string;
  logger?: FastifyServerOptions['logger'];
}
export async function createApp(options: AppOptions) {
  const app = Fastify({logger: options.logger ?? true, logController: new LogController({disableRequestLogging: true}),
    genReqId: () => randomUUID(), requestIdHeader: false, bodyLimit: 65536});
  // A small allowlist: never log query strings, headers, bodies, names or raw exceptions.
  app.addHook('onResponse', async (request, reply) => {
    app.log.info({event: 'request_complete', request_id: request.id,
      route: request.routeOptions.url ?? 'unmatched', method: request.method,
      status_code: reply.statusCode}, 'request_complete');
  });
  app.addHook('onSend', async (_request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    reply.header('Cache-Control', 'no-store');
  });
  app.setErrorHandler((error, request, reply) => {
    const code = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 500;
    const status = typeof code === 'number' && code >= 400 && code < 500 ? code : 500;
    return reply.code(status).send({code: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST', message: 'Request could not be completed', request_id: request.id});
  });
  app.get('/health/live', async (): Promise<HealthLive> => ({status: 'alive'}));
  app.get('/health/ready', async (_request, reply): Promise<HealthReady> => {
    try {
      await options.probe();
      return {status: 'ready', database: 'ready', schema_generation: 0};
    } catch {
      reply.code(503);
      return {status: 'unavailable', database: 'unavailable', schema_generation: 0};
    }
  });
  app.get('/api/v1/version', async (): Promise<Version> => options.version);
  if (options.staticRoot) await app.register(staticFiles, {root: options.staticRoot});
  app.setNotFoundHandler((request, reply) => reply.code(404).send({code: 'NOT_FOUND', message: 'Route not found', request_id: request.id}));
  return app;
}
