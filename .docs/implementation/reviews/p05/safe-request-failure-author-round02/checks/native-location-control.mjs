import assert from 'node:assert/strict';
import {Writable} from 'node:stream';
import {createApp} from '../../apps/api/dist/app.js';
import {requestErrorDiagnostic} from '../../apps/api/dist/request-error-diagnostic.js';
import {equal} from '../../apps/api/dist/security.js';
let error;try{equal(undefined,'synthetic');}catch(value){error=value;}
const projected=requestErrorDiagnostic(error);
assert.equal(projected.error_kind,'TypeError');assert.equal(projected.failure_code,'UNKNOWN');assert.equal(projected.source_module,'security');
assert(Number.isSafeInteger(projected.source_line)&&projected.source_line>0&&projected.source_line<=1000000);assert(Number.isSafeInteger(projected.source_column)&&projected.source_column>0&&projected.source_column<=100000);
assert(!JSON.stringify(projected).includes('synthetic'));
console.log(JSON.stringify({status:'PASS_NATIVE_NODE24_LAZY_STACK_SAFE_LOCATION_ONLY',projected,raw_error_logged:false}));
for(const key of ['name','message','toString',Symbol.toPrimitive]){
 let calls=0;const value=new Error('controlled');Object.defineProperty(value,key,{get(){calls++;throw Error('CONTROLLED_GETTER_CANARY');},configurable:true});requestErrorDiagnostic(value);assert.equal(calls,0);
}
console.log(JSON.stringify({status:'PASS_NATIVE_NODE24_ACCESSOR_CANARIES',getters_called:false,raw_error_logged:false}));
let output='';const stream=new Writable({write(chunk,_encoding,callback){output+=String(chunk);callback();}});
const app=await createApp({probe:async()=>{},version:{service:'venus',version:'0.0.0',source_revision:'a'.repeat(40),image_digest:'sha256:'+'b'.repeat(64),contract_revision:'P00-2'},logger:{stream,level:'info'}});
app.get('/native-type-error',()=>equal(undefined,'synthetic'));
try{
 const response=await app.inject('/native-type-error');assert.equal(response.statusCode,500);assert.equal(response.json().code,'INTERNAL_ERROR');
 const rows=output.trim().split('\n').map(line=>JSON.parse(line)),failure=rows.find(r=>r.event==='request_failed');assert(failure);assert.equal(failure.request_id,response.json().request_id);assert.equal(failure.error_kind,'TypeError');assert.equal(failure.source_module,'security');assert(!output.includes('synthetic'));assert(!output.includes('ERR_INVALID_ARG_TYPE'));assert(!output.includes('security.js'));assert(!Object.hasOwn(failure,'err'));assert(!Object.hasOwn(failure,'stack'));
 console.log(JSON.stringify({status:'PASS_COLD_COMPILED_FASTIFY_500_TRACE',error_kind:failure.error_kind,failure_code:failure.failure_code,source_module:failure.source_module,source_line:failure.source_line,source_column:failure.source_column,request_uuid_correlated:true,raw_error_logged:false}));
}finally{await app.close();}

for(const native of [false,true]){let calls=0;const proxy=new Proxy({}, {getOwnPropertyDescriptor(){calls++;return undefined;},getPrototypeOf(){calls++;return Error.prototype;}}),error=native?Object.setPrototypeOf(new Error('controlled'),Object.create(proxy)):proxy;assert.deepEqual(requestErrorDiagnostic(error),{error_kind:'UNKNOWN',failure_code:'UNKNOWN'});assert.equal(calls,0);}
console.log(JSON.stringify({status:'PASS_NATIVE_PROXY_CHAIN_ZERO_TRAPS',trap_calls:0,raw_error_logged:false}));
