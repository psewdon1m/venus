import type {FastifyReply} from 'fastify';
/** Final synchronous enqueue. Fastify's asynchronous onSend chain would otherwise
 * run after the catalogue/room transaction fence has been released. No hooks,
 * serializers or promises may intervene between the final read and raw.end(). */
export function enqueueFencedJson(reply:FastifyReply,payload:unknown) {
  if(reply.raw.destroyed) return;
  const bytes=Buffer.from(JSON.stringify(payload));reply.code(200);reply.hijack();
  reply.raw.writeHead(200,{
    'content-type':'application/json; charset=utf-8','content-length':bytes.length,
    'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer',
    'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
  });reply.raw.end(bytes);
}

/** The complete bounded PNG is synchronously queued after its final room fence. */
export function enqueueFencedPng(reply:FastifyReply,bytes:Buffer) {
  if(reply.raw.destroyed)return;reply.code(200);reply.hijack();reply.raw.writeHead(200,{
    'content-type':'image/png','content-length':bytes.length,'cache-control':'no-store, private',
    'cross-origin-resource-policy':'same-origin','x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'"
  });reply.raw.end(bytes);
}
