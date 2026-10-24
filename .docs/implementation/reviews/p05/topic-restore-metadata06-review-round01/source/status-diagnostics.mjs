/** Safe producer-only HTTP diagnostics. No paths, bodies, headers or generic assertion values. */
import assert from 'node:assert/strict';
import {lstatSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
const step='MISSING_OWNED_ROOM_PERSONAL_CHAIN_READ';
const codes=new Set(['INTERNAL_ERROR','SERVICE_UNAVAILABLE','TOPIC_STORAGE_UNAVAILABLE','TOPIC_ROOM_UNAVAILABLE','TOPIC_LEDGER_UNAVAILABLE','TOPIC_ROOM_INVALID','TOPIC_LEDGER_INVALID','TOPIC_BIRTH_UNAVAILABLE','TOPIC_ROOT_UNSAFE','PRIVATE_TOPICS_UNAVAILABLE','AUTH_REQUIRED','ENTRY_REACCEPT_REQUIRED','ROOM_CLOSED','RATE_LIMITED','INVALID_REQUEST','NOT_FOUND']);
const httpStatus=value=>Number.isSafeInteger(value)&&value>=100&&value<=599;
export function ownedPersonalChainPath(h,f){
 const directory=resolve(h.directory);assert(/^\/tmp\/venus-topic-restore-private-[a-f0-9]+\/authority$/.test(directory));assert(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(f.room));const parent=resolve(h.parents.personalChainDirectory);assert.equal(parent,resolve(directory,'personalChainDirectory'));const path=resolve(parent,f.room,'chain');assert.equal(dirname(path),resolve(parent,f.room));const stat=lstatSync(path);assert(stat.isFile()&&!stat.isSymbolicLink()&&stat.uid===process.getuid()&&(stat.mode&0o7777)===0o600&&stat.nlink===1);return path;
}
export function faultHttpObservation(response,{absentBefore,absentAfter}){
 const code=response?.body?.code;return {step,expected_http_status:503,actual_http_status:httpStatus(response?.status)?response.status:null,status_invalid:!httpStatus(response?.status),code:codes.has(code)?code:null,code_unlisted:typeof code==='string'&&!codes.has(code),owned_path_verified:true,fault_path_absent_before:absentBefore===true,fault_path_absent_after:absentAfter===true,assertion_completed:false};
}
export function numericHttpAssertion(error,observations){
 const row=observations.at(-1);if(row?.step!==step||row.assertion_completed!==false||error?.code!=='ERR_ASSERTION'||error.operator!=='strictEqual'||!httpStatus(error.actual)||error.expected!==503||error.actual!==row.actual_http_status||row.expected_http_status!==503)return null;return {step,expected_http_status:503,actual_http_status:error.actual};
}
