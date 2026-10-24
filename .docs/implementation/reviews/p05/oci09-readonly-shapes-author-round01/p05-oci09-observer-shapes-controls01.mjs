import assert from 'node:assert/strict';
import {consentShape,dateShape,projectionShape} from './p05-oci09-observer-shapes01.mjs';
const secret='PRIVATE_ID_NAME_CIPHER_TEXT_COOKIE_CANARY';
const a=consentShape({state:secret,acks:[secret,secret],active_until:1,offer_id:secret,text:secret});assert.deepEqual(a,{present:true,state:'UNKNOWN',acks_count:2,active_until_safe:true});assert(!JSON.stringify(a).includes(secret));
assert.deepEqual(consentShape(null),{present:false,state:'UNKNOWN',acks_count:null,active_until_safe:false});
assert.deepEqual(dateShape(new Date(0)),{native_date:true,getTime_type:'function'});assert.deepEqual(dateShape(secret),{native_date:false,getTime_type:'undefined'});
let calls=0;const hostile={};Object.defineProperty(hostile,'getTime',{get(){calls++;throw Error(secret);}});assert.deepEqual(dateShape(hostile),{native_date:false,getTime_type:'ACCESSOR'});assert.equal(calls,0);
const context={data:{boot_id:secret,plan:{round_id:secret}},game:{rev:'7'},conversation:{revision:4,epoch:2}},p={schema_version:2,boot_id:secret,round_id:secret,game_rev:7,conversation_revision:4,epoch:2,view:{prompt:{text:secret},offer:{own_accepted:true,token:secret}}};const projection=projectionShape(p,context);assert(Object.values(projection).every(v=>v===true));assert(!JSON.stringify(projection).includes(secret));
console.log(JSON.stringify({status:'PASS_HOST_PURE_SHAPE_PRIVACY_ONLY',checks:6,Docker_RUN:false,DB_connections:0}));
