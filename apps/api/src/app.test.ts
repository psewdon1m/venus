import {describe, it, expect} from 'vitest';
import {Writable} from 'node:stream';
import {createApp} from './app.js';
import type {Version} from '@venus/contracts';
import {DomainError} from './security.js';
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
      const malformed = await app.inject('/%MALFORMED_SECRET');
      expect(malformed.statusCode).toBe(400);
      expect(malformed.json()).toEqual({code:'INVALID_REQUEST', message:'Request could not be completed',request_id:expect.stringMatching(/^[a-f0-9-]{36}$/)});
      expect(malformed.body).not.toContain('SECRET');
      expect(malformed.headers['cache-control']).toBe('no-store');
      expect(malformed.headers['x-content-type-options']).toBe('nosniff');
      expect(malformed.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    } finally {await app.close();}
    expect(output).not.toMatch(/SECRET/);
    const rows = output.trim().split('\n').map(line => JSON.parse(line));
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.every(row => ['request_complete','request_failed'].includes(row.event) && row.request_id)).toBe(true);
    expect(rows.filter(row=>row.event==='request_failed')).toHaveLength(1);
  });
  it('correlates safe unexpected500 diagnostics with the server UUID without changing normal/error replies',async()=>{
    const secret='PRIVATE_BODY_COOKIE_TOKEN_SQL_NEWLINE_CANARY';let output='';
    const stream=new Writable({write(chunk,_encoding,callback){output+=String(chunk);callback();}}),app=await createApp({probe:async()=>{},version,logger:{stream,level:'info'}});
    const known=new URL('./topic-games.ts',import.meta.url).href;
    app.post('/diagnostic/:member',()=>{const e=new TypeError(secret);Object.assign(e,{code:secret,body:secret,query:secret,parameters:[secret]});Object.defineProperty(e,'stack',{value:`TypeError: ${secret}\n    at ${secret} (${known}:321:45)\n    at ${secret} (/private/host.js:22:33)`});throw e;});
    app.get('/diagnostic-pg',()=>{throw Object.assign(new Error(secret),{code:'40P01',detail:secret});});
    app.get('/diagnostic-timeout',()=>{throw new Error('Query read timeout');});
    app.get('/diagnostic-denied',()=>{throw new DomainError('NOT_ALLOWED',403);});
    let failedId='';
    try{
      const live=await app.inject('/health/live');expect(live.statusCode).toBe(200);expect(live.json()).toEqual({status:'alive'});
      const failed=await app.inject({method:'POST',url:'/diagnostic/'+secret+'?secret='+secret,headers:{cookie:'session='+secret,authorization:'Bearer '+secret,'x-request-id':secret},payload:{name:secret,text:secret}});
      expect(failed.statusCode).toBe(500);expect(failed.json()).toEqual({code:'INTERNAL_ERROR',message:'Request could not be completed',request_id:expect.stringMatching(/^[a-f0-9-]{36}$/)});failedId=failed.json().request_id;
      expect(failed.headers['cache-control']).toBe('no-store');expect(failed.headers['x-content-type-options']).toBe('nosniff');expect(failed.body).not.toContain(secret);
      expect((await app.inject('/diagnostic-pg')).json().code).toBe('INTERNAL_ERROR');expect((await app.inject('/diagnostic-timeout')).statusCode).toBe(500);
      const denied=await app.inject('/diagnostic-denied');expect(denied.statusCode).toBe(403);expect(denied.json()).toMatchObject({code:'NOT_ALLOWED',message:'Request could not be completed'});
    }finally{await app.close();}
    expect(output).not.toContain(secret);expect(output).not.toContain(known);expect(output).not.toContain('/private/host.js');expect(output).not.toContain('Query read timeout');
    const rows=output.trim().split('\n').map(line=>JSON.parse(line)),failures=rows.filter(row=>row.event==='request_failed');expect(failures).toHaveLength(3);
    const first=failures.find(row=>row.request_id===failedId);expect(first).toMatchObject({event:'request_failed',request_id:failedId,error_kind:'TypeError',failure_code:'UNKNOWN',source_module:'topic-games',source_line:321,source_column:45,msg:'request_failed'});
    for(const row of failures){expect(row.request_id).toMatch(/^[a-f0-9-]{36}$/);expect(Object.keys(row).some(key=>['err','error','message','stack','body','headers','cookies','parameters','query','name'].includes(key))).toBe(false);expect(rows.filter(r=>r.event==='request_complete'&&r.request_id===row.request_id)).toHaveLength(1);}
    expect(failures.map(row=>row.failure_code).sort()).toEqual(['40P01','QUERY_TIMEOUT','UNKNOWN']);expect(rows.find(r=>r.event==='request_complete'&&r.route==='/health/live')).toMatchObject({status_code:200});
  });
});
