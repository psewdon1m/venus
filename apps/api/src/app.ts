import Fastify, {LogController, type FastifyReply, type FastifyServerOptions} from 'fastify';
import staticFiles from '@fastify/static';
import {randomUUID} from 'node:crypto';
import type {Version, HealthLive, HealthReady} from '@venus/contracts';
import websocket from '@fastify/websocket';
import type {Rooms} from './rooms.js';
import {registerRooms} from './room-routes.js';
import {DomainError} from './security.js';
import type {Games} from './games.js';
import type {PrivateTopicPreferences} from './private-topic-preferences.js';
import type {TopicGames} from './topic-games.js';
import type {Music} from './music.js';
import type {Media} from './media.js';
import type {Presentations} from './presentations.js';
import {requestErrorDiagnostic} from './request-error-diagnostic.js';

export interface AppOptions {
  probe: () => Promise<void>; version: Version; staticRoot?: string;
  logger?: FastifyServerOptions['logger'];
  rooms?:Rooms;
  games?:Games;
  privateTopics?:PrivateTopicPreferences;
  topicGames?:TopicGames;
  roomCreationProtocol?:1|2;
  schemaGeneration?:number;
  music?:Music;
  media?:Media;
  presentations?:Presentations;
  servingBarrier?:()=>void;
}
export async function createApp(options: AppOptions) {
  const app = Fastify({logger: options.logger ?? true, logController: new LogController({disableRequestLogging: true}),
    frameworkErrors: (_error, request, reply) => {
      // Router failures occur before normal hooks/errorHandler. Do not reflect raw URL.
      // The framework hook is generic over route schemas; this response has the common Error shape.
      const response = reply as FastifyReply;
      response.header('X-Content-Type-Options', 'nosniff').header('Referrer-Policy', 'no-referrer')
        .header('Cache-Control', 'no-store').header('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
      response.code(400).send({code: 'INVALID_REQUEST', message: 'Request could not be completed', request_id: request.id});
    },
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
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    reply.header('Cache-Control', 'no-store');
  });
  app.setErrorHandler((error, request, reply) => {
    const code = error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : 500;
    const status = error instanceof DomainError ? error.statusCode : typeof code === 'number' && code >= 400 && code < 500 ? code : 500;
    if(status===500&&!(error instanceof DomainError))app.log.error({event:'request_failed',request_id:request.id,...requestErrorDiagnostic(error)},'request_failed');
    return reply.code(status).send({code: error instanceof DomainError?error.code:status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST', message: 'Request could not be completed', request_id: request.id});
  });
  await app.register(websocket,{options:{maxPayload:options.media?262144:8192,perMessageDeflate:false},...(options.media?{errorHandler:(_error:Error,socket:{terminate:()=>void})=>{socket.terminate();}}:{})});
  if(options.servingBarrier)app.addHook('onRequest',async request=>{if(!['/health/live','/health/ready','/api/v1/version','/internal/v1/media/prepare','/internal/v1/presentations/quiesce'].includes(request.url))options.servingBarrier!();});
  if(options.rooms) await registerRooms(app,options.rooms,options.games,options.privateTopics,options.topicGames,options.roomCreationProtocol??1,options.music,options.media,options.presentations);
  if(options.presentations&&options.media)app.post('/internal/v1/presentations/quiesce',async request=>{options.media!.internalCredential(request.headers['x-venus-media-internal']);return options.presentations!.quiesce();});
  if(options.media)app.post('/internal/v1/media/prepare',async request=>{options.media!.internalCredential(request.headers['x-venus-media-internal']);return options.media!.prepareDelivery(options.servingBarrier);});
  app.get('/health/live', async (): Promise<HealthLive> => ({status: 'alive'}));
  app.get('/health/ready', async (_request, reply): Promise<HealthReady> => {
    try {
      await options.probe();
      return {status: 'ready', database: 'ready', schema_generation: options.schemaGeneration??0};
    } catch {
      reply.code(503);
      return {status: 'unavailable', database: 'unavailable', schema_generation: options.schemaGeneration??0};
    }
  });
  app.get('/api/v1/version', async (): Promise<Version> => options.version);
  if (options.staticRoot) await app.register(staticFiles, {root: options.staticRoot});
  app.setNotFoundHandler((request, reply) => reply.code(404).send({code: 'NOT_FOUND', message: 'Route not found', request_id: request.id}));
  return app;
}
