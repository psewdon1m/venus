import fs from 'node:fs';
const out='.docs/implementation/reviews/p05/ws-safe-failure-logging-independent-round01',source=fs.readFileSync('.docs/implementation/reviews/p05/ws-safe-failure-logging-author-round01/after/apps/api/src/room-socket-poll.test.ts','utf8');
const fixture=source.slice(0,source.indexOf("describe('bounded ordinary room WS polling'")).replaceAll("from './","from '../../../../../apps/api/src/");
fs.writeFileSync(out+'/independent.test.ts',fixture+String.raw`
describe('independent safe logging adversarial boundaries',()=>{
 it('revoked Proxy and primitive thrown values do not run conversion hooks or disclose values',async()=>{
  const revocable=Proxy.revocable({},{});revocable.revoke();
  for(const error of [revocable.proxy,Symbol('PRIVATE_UNPRINTABLE_CANARY')]){const f=await fixture({connectError:error});try{expect(f.events).toEqual([{event:'websocket_failed',phase:'auth_or_heartbeat',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'UNKNOWN',failure_code:'UNKNOWN'}]);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}}
 });
 it('native error with safe code never invokes private accessor stack/message/name or toJSON',async()=>{
  let calls=0;const error=Object.assign(new Error(),{code:'AUTH_REQUIRED',toJSON(){calls++;throw Error('PRIVATE_CANARY');}});
  for(const field of ['stack','message','name'])Object.defineProperty(error,field,{get(){calls++;throw Error('PRIVATE_CANARY');},configurable:true});
  const f=await fixture({connectError:error});try{expect(f.events).toEqual([{event:'websocket_failed',phase:'auth_or_heartbeat',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'Error',failure_code:'UNKNOWN',domain_code:'AUTH_REQUIRED'}]);expect(calls).toBe(0);expect(JSON.stringify(f.events)).not.toContain('PRIVATE_CANARY');expect(calls).toBe(0);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('throwing logger consumes only this socket latch and queued failure cannot emit again',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('PRIVATE_CANARY'),{code:'SOCKET_REPLACED'}),loggerError:true});
  try{await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from('{"type":"ping"}'));f.setFailure(Object.assign(new Error('PRIVATE_CANARY'),{code:'TOPIC_LEDGER_BUSY'}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'poll',domain_code:'TOPIC_LEDGER_BUSY'});expect(f.service.liveGrant).toHaveBeenCalledOnce();expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
  const next=await fixture({connectError:Object.assign(new Error('PRIVATE_CANARY'),{code:'AUTH_REQUIRED'})});try{expect(next.events).toHaveLength(1);expect(next.events[0]).toMatchObject({phase:'auth_or_heartbeat',domain_code:'AUTH_REQUIRED'});}finally{await next.close();}
 });
});
`);
