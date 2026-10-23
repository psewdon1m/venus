import {describe,it,expect} from 'vitest';
import {requestErrorDiagnostic,websocketErrorDiagnostic} from './request-error-diagnostic.js';

const secret='PRIVATE_MESSAGE_BODY_COOKIE_TOKEN_SQL_PARAMS_CANARY';
const known=new URL('./topic-games.ts',import.meta.url).href;
function withStack(stack:string){const error=new TypeError(secret);Object.defineProperty(error,'stack',{value:stack,configurable:true});return error;}
describe('literal server error diagnostic privacy',()=>{
 for(const code of ['40P01','40001','57014','25P02','23505','08006'])it('retains only literal PG code '+code,()=>{
  const error=Object.assign(new Error(secret),{code,detail:secret,query:secret,params:[secret],body:secret,cookie:secret});
  const d=requestErrorDiagnostic(error);expect(d.error_kind).toBe('Error');expect(d.failure_code).toBe(code);expect(JSON.stringify(d)).not.toContain(secret);
 });
 for(const error of [null,undefined,secret,{},Object.assign(new Error(secret),{code:secret})])it('omits unknown properties and raw errors',()=>{
  const d=requestErrorDiagnostic(error);expect(d.failure_code).toBe('UNKNOWN');expect(JSON.stringify(d)).not.toContain(secret);expect(Object.keys(d).every(k=>['error_kind','failure_code','source_module','source_line','source_column'].includes(k))).toBe(true);
 });
 it('recognizes exactly the native PG query timeout literal',()=>{expect(requestErrorDiagnostic(new Error('Query read timeout'))).toMatchObject({error_kind:'Error',failure_code:'QUERY_TIMEOUT'});});
 for(const message of ['Query read timeout '+secret,'Query read timeout\n'+secret,'query read timeout',' Query read timeout'])it('does not classify a near-match timeout',()=>expect(requestErrorDiagnostic(new Error(message)).failure_code).toBe('UNKNOWN'));
 it('does not reinterpret a typed error or conflicting code as a query timeout',()=>{
  expect(requestErrorDiagnostic(new TypeError('Query read timeout')).failure_code).toBe('UNKNOWN');expect(requestErrorDiagnostic(Object.assign(new Error('Query read timeout'),{code:secret})).failure_code).toBe('UNKNOWN');
 });
 it('uses native class identity instead of an untrusted error name',()=>{const e=new TypeError(secret);e.name=secret;expect(requestErrorDiagnostic(e).error_kind).toBe('TypeError');expect(JSON.stringify(requestErrorDiagnostic(e))).not.toContain(secret);});
 it('projects a known application frame to a literal label and bounded numbers only',()=>{
  const d=requestErrorDiagnostic(withStack(`TypeError: ${secret}\n    at ${secret} (${known}:321:45)\n    at ${secret} (/arbitrary/private/location.js:1:2)`));
  expect(d).toEqual({error_kind:'TypeError',failure_code:'UNKNOWN',source_module:'topic-games',source_line:321,source_column:45});expect(JSON.stringify(d)).not.toMatch(/file:|\/|PRIVATE|location|stack|message/);
 });
 it('accepts only exact own module locations, never basename matches',()=>{
  for(const location of ['/private/topic-games.ts:321:45','file:///tmp/topic-games.ts:321:45',known+'-private:321:45',known+':321:45?token='+secret])expect(requestErrorDiagnostic(withStack(`TypeError: ${secret}\n    at ${secret} (${location})`))).not.toHaveProperty('source_module');
 });
 for(const suffix of ['0:1','-1:1','1.5:1','1000001:1','1:100001','1:0','1:1 extra'])it('omits malformed/unbounded location '+suffix,()=>expect(requestErrorDiagnostic(withStack(`TypeError: ${secret}\n    at fn (${known}:${suffix})`))).not.toHaveProperty('source_module'));
 it('caps stack bytes, frames and line shape without exposing them',()=>{
  const frame=`    at fn (${known}:1:2)`;
  for(const stack of [secret.repeat(1000)+'\n'+frame,'Ş'.repeat(9000)+'\n'+frame,`TypeError: ${secret}\n`+Array(16).fill('    at unknown (/private.js:1:2)').join('\n')+'\n'+frame,`TypeError: ${secret}\n    at fn (${known}:1:2)\r${secret}`])expect(requestErrorDiagnostic(withStack(stack))).not.toHaveProperty('source_module');
 });
 it('never invokes custom name/message/code/stack getters',()=>{
  let calls=0;const e=new TypeError(secret);for(const key of ['name','message','code','stack'])Object.defineProperty(e,key,{get(){calls++;throw Error(secret);},configurable:true});
  expect(requestErrorDiagnostic(e)).toEqual({error_kind:'TypeError',failure_code:'UNKNOWN'});expect(calls).toBe(0);
 });
 it('fails closed on a hostile prototype proxy',()=>{
  const e=new Proxy({}, {getPrototypeOf(){throw Error(secret);},getOwnPropertyDescriptor(){throw Error(secret);}});
  expect(requestErrorDiagnostic(e)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});
 });
 it('does not turn an Error-prototype lookalike into native timeout or frame evidence',()=>{
  const e=Object.assign(Object.create(Error.prototype),{message:'Query read timeout',stack:`Error\n    at fn (${known}:1:2)`});expect(requestErrorDiagnostic(e)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});
 });
 it('never invokes a replacement stack formatter',()=>{
  const before=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');let calls=0;
  try{Object.defineProperty(Error,'prepareStackTrace',{configurable:true,writable:true,value:()=>{calls++;throw Error(secret);}});expect(requestErrorDiagnostic(new TypeError(secret))).toEqual({error_kind:'TypeError',failure_code:'UNKNOWN'});expect(calls).toBe(0);}
  finally{if(before)Object.defineProperty(Error,'prepareStackTrace',before);else Reflect.deleteProperty(Error,'prepareStackTrace');}
 });
 it('uses only the explicit native JS error categories',()=>{
  const errors=[new TypeError(secret),new RangeError(secret),new ReferenceError(secret),new SyntaxError(secret),new URIError(secret),new EvalError(secret),new AggregateError([],secret),new Error(secret)];expect(errors.map(e=>requestErrorDiagnostic(e).error_kind)).toEqual(['TypeError','RangeError','ReferenceError','SyntaxError','URIError','EvalError','AggregateError','Error']);
 });
 it('rejects a top-level Proxy before own-descriptor reflection',()=>{
  let calls=0;const error=new Proxy({}, {getOwnPropertyDescriptor(){calls++;return undefined;},getPrototypeOf(){calls++;return null;}});expect(requestErrorDiagnostic(error)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});expect(calls).toBe(0);
 });
 it('rejects a Proxy anywhere in a native-error prototype chain before instanceof or descriptor lookup',()=>{
  for(const indirect of [false,true]){let calls=0;const proxy=new Proxy(Error.prototype,{getOwnPropertyDescriptor(){calls++;return undefined;},getPrototypeOf(){calls++;return Error.prototype;}}),error=new Error(secret);Object.setPrototypeOf(error,indirect?Object.create(proxy):proxy);expect(requestErrorDiagnostic(error)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});expect(calls).toBe(0);}
 });
});

describe('WebSocket-only literal policy failure extension',()=>{
 const codes=['AUTH_REQUIRED','ENTRY_REACCEPT_REQUIRED','ROOM_CLOSED','SOCKET_REPLACED','ACTORS_UNAVAILABLE','INVALID_REQUEST','RATE_LIMITED','TICKET_INVALID','CONSENT_EXPIRED','PRIVATE_CHAT_UNAVAILABLE','PRIVATE_EVENT_CAPACITY','TOPIC_ROOM_RETIRED','TOPIC_ROOM_MEMBER_RETIRED','TOPIC_ROOM_MEMBER_NOT_ADMITTED','TOPIC_ROOM_BUSY','TOPIC_LEDGER_BUSY','TOPIC_STATE_CHANGED','TOPIC_ROOM_BIRTH_UNAVAILABLE'];
 for(const code of codes)it('retains only WS literal policy code '+code,()=>{const error=Object.assign(new Error(secret),{code,body:secret,cookie:secret,query:secret,frames:[secret]});expect(websocketErrorDiagnostic(error)).toMatchObject({error_kind:'Error',failure_code:'UNKNOWN',domain_code:code});expect(requestErrorDiagnostic(error)).not.toHaveProperty('domain_code');expect(JSON.stringify(websocketErrorDiagnostic(error))).not.toContain(secret);});
 it('omits unknown, inherited, lookalike and accessor codes without invoking hooks',()=>{
  let calls=0;const accessor=new Error(secret);Object.defineProperty(accessor,'code',{get(){calls++;throw Error(secret);}});
  const inherited=new Error(secret);Object.setPrototypeOf(inherited,Object.assign(Object.create(Error.prototype),{code:'AUTH_REQUIRED'}));
  for(const error of [Object.assign(new Error(secret),{code:secret}),Object.assign(new Error(secret),{code:'AUTH_REQUIRED\n'+secret}),Object.assign(new Error(secret),{code:'TOPIC_BIRTH_UNAVAILABLE'}),{code:'AUTH_REQUIRED'},accessor,inherited])expect(websocketErrorDiagnostic(error)).not.toHaveProperty('domain_code');expect(calls).toBe(0);
 });
 it('rejects proxy and hostile prototype errors before getters or descriptor traps',()=>{
  let calls=0;const proxy=new Proxy(Error.prototype,{getOwnPropertyDescriptor(){calls++;throw Error(secret);},getPrototypeOf(){calls++;throw Error(secret);}}),native=new Error(secret);Object.setPrototypeOf(native,proxy);
  for(const error of [proxy,native,new Proxy({}, {getOwnPropertyDescriptor(){calls++;throw Error(secret);},getPrototypeOf(){calls++;throw Error(secret);}})])expect(websocketErrorDiagnostic(error)).toEqual({error_kind:'UNKNOWN',failure_code:'UNKNOWN'});expect(calls).toBe(0);
 });
 it('preserves existing SQL/class/location projection and default HTTP helper exactly',()=>{const error=Object.assign(withStack(`TypeError: ${secret}\n    at fn (${known}:321:45)`),{code:'40P01'});expect(websocketErrorDiagnostic(error)).toEqual(requestErrorDiagnostic(error));expect(websocketErrorDiagnostic(error)).toMatchObject({error_kind:'TypeError',failure_code:'40P01',source_module:'topic-games',source_line:321,source_column:45});});
});
