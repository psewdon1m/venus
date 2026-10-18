import {describe, it, expect} from 'vitest';
import {Writable} from 'node:stream';
import {createApp} from './app.js';
import type {Version} from '@venus/contracts';
const version: Version = {service:'venus', version:'0.0.0',source_revision:'a'.repeat(40), image_digest:'sha256:'+ 'b'.repeat(64),contract_revision:'P00-2'};
describe('foundation HTTP contracts and privacy', () => {
  it('separates live from real dependency readiness and recovers', async () => {
    let available = true;
    const app = await createApp({probe: async () => {if (!available) throw new Error('secret-database-url');}, version, logger:false});
    try {
      expect((await app.inject('/health/live')).json()).toEqual({status:'alive'});
      expect((await app.inject('/health/ready')).json()).toEqual({status:'ready',database:'ready',schema_generation:0});
      available = false;
      const failure = await app.inject('/health/ready');
      expect(failure.statusCode).toBe(503);
      expect(failure.json()).toEqual({status:'unavailable',database:'unavailable',schema_generation:0});
      expect((await app.inject('/health/live')).statusCode).toBe(200);
      expect((await app.inject('/api/v1/version')).json()).toEqual(version);
      available = true;
      expect((await app.inject('/health/ready')).statusCode).toBe(200);
    } finally {await app.close();}
  });
  it('never emits sensitive payload, query, header or exception; generates its own request ID', async () => {
    let output = '';
    const stream = new Writable({write(chunk, _encoding, callback) {output += String(chunk); callback();}});
    const app = await createApp({probe:async () => {throw new Error('EXCEPTION_SECRET');}, version, logger:{stream, level:'info'}});
    app.get('/test-error', () => {throw new Error('ERROR_SECRET');});
    try {
      await app.inject('/health/ready?invite=QUERY_SECRET');
      const response = await app.inject({method:'POST',url:'/api/v1/rooms/NAME_SECRET?ticket=QUERY_SECRET', headers:{authorization:'Bearer AUTH_SECRET',cookie:'session=COOKIE_SECRET','x-request-id':'FORGED_SECRET'},payload:{name:'BODY_SECRET'}});
      expect(response.statusCode).toBe(404);
      expect(response.json().request_id).toMatch(/^[a-f0-9-]{36}$/);
      expect((await app.inject('/test-error')).statusCode).toBe(500);
    } finally {await app.close();}
    expect(output).not.toMatch(/SECRET/);
    const rows = output.trim().split('\n').map(line => JSON.parse(line));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every(row => row.event === 'request_complete' && row.request_id)).toBe(true);
  });
});
