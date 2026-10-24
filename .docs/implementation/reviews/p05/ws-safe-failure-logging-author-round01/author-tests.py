from pathlib import Path
import datetime,shutil
r=Path.cwd();d=r/'.artifacts/p05-ws-safe-failure01';assert not d.exists();d.mkdir();owned=['apps/api/src/request-error-diagnostic.ts','apps/api/src/room-routes.ts','apps/api/src/request-error-diagnostic.test.ts','apps/api/src/room-socket-poll.test.ts']
for n in owned:p=d/'before'/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p)
(r/'.history/agents/2026-10-21-p05-ws-safe-failure01-author.md').write_text('# Minimal production WebSocket safe failure logging\n\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — ROOT GO after projection independent c5eb20ae PASS. Exact contract2prod/2existingtests+revision; onewebsocket_failed/socket; staticphase/validserverUUID/existinghelper fields/18literaloptional-domain codes; no rawerror/frame/cookie/room/member. Sourceparent copies beforewrites retained; no runtime/timer/close change. Add RED then implementation; no native allocation.\n',encoding='utf-8')
p=r/'apps/api/src/request-error-diagnostic.test.ts';s=p.read_bytes().decode().replace("import {requestErrorDiagnostic}","import {requestErrorDiagnostic,websocketErrorDiagnostic}")
s+='''
describe('WebSocket-only literal policy failure extension',()=>{
 const codes=['AUTH_REQUIRED','ENTRY_REACCEPT_REQUIRED','ROOM_CLOSED','SOCKET_REPLACED','ACTORS_UNAVAILABLE','INVALID_REQUEST','RATE_LIMITED','TICKET_INVALID','CONSENT_EXPIRED','PRIVATE_CHAT_UNAVAILABLE','PRIVATE_EVENT_CAPACITY','TOPIC_ROOM_RETIRED','TOPIC_ROOM_MEMBER_RETIRED','TOPIC_ROOM_MEMBER_NOT_ADMITTED','TOPIC_ROOM_BUSY','TOPIC_LEDGER_BUSY','TOPIC_STATE_CHANGED','TOPIC_ROOM_BIRTH_UNAVAILABLE'];
 for(const code of codes)it('retains only WS literal policy code '+code,()=>{const error=Object.assign(new Error(secret),{code,body:secret,cookie:secret,query:secret,frames:[secret]});expect(websocketErrorDiagnostic(error)).toMatchObject({error_kind:'Error',failure_code:'UNKNOWN',domain_code:code});expect(requestErrorDiagnostic(error)).not.toHaveProperty('domain_code');expect(JSON.stringify(websocketErrorDiagnostic(error))).not.toContain(secret);});
 it('omits unknown, inherited, lookalike and accessor codes without invoking hooks',()=>{
  let calls=0;const accessor=new Error(secret);Object.defineProperty(accessor,'code',{get(){calls++;throw Error(secret);}});
  const inherited=new Error(secret);Object.setPrototypeOf(inherited,Object.assign(Object.create(Error.prototype),{code:'AUTH_REQUIRED'}));
  for(const error of [Object.assign(new Error(secret),{code:secret}),Object.assign(new Error(secret),{code:'AUTH_REQUIRED\\n'+secret}),Object.assign(new Error(secret),{code:'TOPIC_BIRTH_UNAVAILABLE'}),{code:'AUTH_REQUIRED'},accessor,inherited])expect(websocketErrorDiagnostic(error)).not.toHaveProperty('domain_code');expect(calls).toBe(0);
 });
 it('rejects proxy and hostile prototype errors before getters or descriptor traps',()=>{
  let calls=0;const proxy=new Proxy(Error.prototype,{getOwnPropertyDescriptor(){calls++;throw Error(secret);},getPrototypeOf(){calls++;throw Error(secret);}}),native=new Error(secret);Object.setPrototypeOf(native,proxy);
  for(const error of [proxy,native,new Proxy({}, {getOwnPropertyDescriptor(){calls++;throw Error(secret);},getPrototypeOf(){calls++;throw Error(secret);}})])expect(websocketErrorDiagnostic(error)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});expect(calls).toBe(0);
 });
 it('preserves existing SQL/class/location projection and default HTTP helper exactly',()=>{const error=Object.assign(withStack(`TypeError: ${secret}\\n    at fn (${known}:321:45)`),{code:'40P01'});expect(websocketErrorDiagnostic(error)).toEqual(requestErrorDiagnostic(error));expect(websocketErrorDiagnostic(error)).toMatchObject({error_kind:'TypeError',failure_code:'40P01',source_module:'topic-games',source_line:321,source_column:45});});
});
''';p.write_bytes(s.encode())
p=r/'apps/api/src/room-socket-poll.test.ts';s=p.read_bytes().decode();s=s.replace("async function fixture() {","async function fixture(input:{connectError?:unknown;heartbeatError?:unknown;loggerError?:boolean;requestId?:string}={}) {")
s=s.replace("let calls=0,failPoll=false;","let calls=0,failPoll=false;let pollError:unknown=Error('fixture storage unavailable');const events:Record<string,unknown>[]=[];")
s=s.replace("if(failPoll&&calls>1)throw Error('fixture storage unavailable');","if(failPoll&&calls>1)throw pollError;")
s=s.replace("connect:vi.fn(async()=>grant)","connect:vi.fn(async()=>{if('connectError'in input)throw input.connectError;return grant;})")
s=s.replace("liveGrant:vi.fn(async()=>{order.push('heartbeat');})","liveGrant:vi.fn(async()=>{order.push('heartbeat');if('heartbeatError'in input)throw input.heartbeatError;})")
s=s.replace("log:{warn:()=>{}}","log:{warn:(event:Record<string,unknown>)=>{events.push(event);if(input.loggerError)throw Error('logger unavailable');}}")
s=s.replace("{params:{roomId:grant.roomId},headers:","{id:input.requestId??'11111111-1111-4111-8111-111111111111',params:{roomId:grant.roomId},headers:")
s=s.replace("return {socket,service,order,releasePoll,setFailure:()=>{failPoll=true;}","return {socket,service,order,events,releasePoll,setFailure:(error:unknown=Error('fixture storage unavailable'))=>{failPoll=true;pollError=error;}")
at=s.rfind('});');s=s[:at]+'''
 it('logs one safe poll failure then still closes4401, without raw private error content',async()=>{
  const secret='WS_PRIVATE_BODY_COOKIE_TOKEN_MESSAGE\\nCANARY',f=await fixture();try{await vi.advanceTimersByTimeAsync(1000);f.setFailure(Object.assign(new TypeError(secret),{code:'40P01',cookie:secret,body:secret,frames:[secret]}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({event:'websocket_failed',phase:'poll',request_id:'11111111-1111-4111-8111-111111111111',error_kind:'TypeError',failure_code:'40P01'});expect(JSON.stringify(f.events)).not.toContain('WS_PRIVATE');expect(Object.keys(f.events[0]).every(k=>['event','phase','request_id','error_kind','failure_code','domain_code','source_module','source_line','source_column'].includes(k))).toBe(true);expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('logs auth failure as safe policy enum and omits invalid request IDs',async()=>{
  const f=await fixture({connectError:Object.assign(new Error('private cookie'),{code:'AUTH_REQUIRED'}),requestId:'private-cookie-invalid-id'});try{expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({event:'websocket_failed',phase:'auth_or_heartbeat',domain_code:'AUTH_REQUIRED'});expect(f.events[0]).not.toHaveProperty('request_id');expect(JSON.stringify(f.events)).not.toContain('private');expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('keeps a one-socket latch when a queued heartbeat also fails after the poll',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('private'),{code:'CONSENT_EXPIRED'})});try{await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));f.setFailure(Object.assign(new Error('private'),{code:'ACTORS_UNAVAILABLE'}));f.releasePoll();await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'poll',domain_code:'ACTORS_UNAVAILABLE'});expect(f.service.liveGrant).toHaveBeenCalledOnce();expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('heartbeat failure is categorized while logger failure cannot prevent connection closure',async()=>{
  const f=await fixture({heartbeatError:Object.assign(new Error('private'),{code:'SOCKET_REPLACED'}),loggerError:true});try{f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));await vi.advanceTimersByTimeAsync(0);expect(f.events).toHaveLength(1);expect(f.events[0]).toMatchObject({phase:'auth_or_heartbeat',domain_code:'SOCKET_REPLACED'});expect(f.socket.close).toHaveBeenCalledWith(4401,'Connection unavailable');}finally{await f.close();}
 });
 it('normal auth, polls and heartbeat emit no failure events',async()=>{const f=await fixture();try{f.releasePoll();await vi.advanceTimersByTimeAsync(1000);f.socket.emit('message',Buffer.from(JSON.stringify({type:'ping'})));await vi.advanceTimersByTimeAsync(0);expect(f.events).toEqual([]);expect(f.socket.send).toHaveBeenCalledWith(JSON.stringify({type:'pong'}));expect(f.socket.close).not.toHaveBeenCalled();}finally{await f.close();}});
'''+s[at:];p.write_bytes(s.encode())
