import assert from 'node:assert/strict';
import {safeError} from '/run/p05-oci-producer/bound-profile.mjs';
import {assertRevokedRoundView} from '/run/p05-oci-producer/scenarios.mjs';
const formatter=Object.getOwnPropertyDescriptor(Error,'prepareStackTrace');
const signature=formatter&&'value'in formatter&&typeof formatter.value==='function'?Function.prototype.toString.call(formatter.value).replace(/\r\n/g,'\n'):null;
const data=d=>d&&'value'in d?'data':d?.get?'getter':'absent';
const rows=[];
for(const[k,value]of [['SHORT',200],['LONG_SYNTHETIC','S'.repeat(6000)]]){
 let e;try{assertRevokedRoundView({status:value,body:{},raw:'safe'},false,{},'');}catch(error){e=error;}
 assert(e instanceof assert.AssertionError);const message=Object.getOwnPropertyDescriptor(e,'message'),stack=Object.getOwnPropertyDescriptor(e,'stack'),projected=safeError(e,'B2');
 const descriptor={message_kind:data(message),message_chars:typeof message?.value==='string'?message.value.length:null,stack_kind:data(stack)};
 let afterMessageSuppression=null;
 if(k==='LONG_SYNTHETIC'){
  assert(message&&'value'in message);Object.defineProperty(e,'message',{...message,value:'BOUNDED_SYNTHETIC'});
  try{afterMessageSuppression=safeError(e,'B2');}finally{Object.defineProperty(e,'message',message);}
 }
 let stackChars=null;try{const d=Object.getOwnPropertyDescriptor(e,'stack'),s=d&&'value'in d?d.value:d?.get?.call(e);if(typeof s==='string')stackChars=s.length;}catch{}
 rows.push({case:k,...descriptor,stack_chars:stackChars,projection:projected,projection_after_temporary_synthetic_message_suppression:afterMessageSuppression});
}
assert.equal(rows[0].projection.source_module,'scenarios');
assert(rows[1].message_chars>2048);assert.equal(rows[1].projection.source_module,undefined);assert.equal(rows[1].projection_after_temporary_synthetic_message_suppression.source_module,'scenarios');
console.log(JSON.stringify({status:'PASS_NATIVE_B4_SHORT_VS_LONG_ASSERTION_LOCATION_CONTRACT_ONLY',node:process.version,recognized_default_formatter:signature==='function ErrorPrepareStackTrace(error, trace) {\n  return internalPrepareStackTrace(error, trace);\n}',rows,DB_connections:0,private_mounts:0,application_writes:false,actual_error_cause_proven:false}));
