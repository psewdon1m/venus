/** Terminal evidence independent of disk writers; preserves first + secondary faults. */
import assert from 'node:assert/strict';
const names=new Set(['Error','AssertionError','TypeError','RangeError','AbortError','SyntaxError']);
const codes=new Set(['EIO','ENOSPC','EDQUOT','EACCES','EPERM','ENOENT','EBADF','ERR_ASSERTION','ERR_STREAM_DESTROYED','ERR_STREAM_WRITE_AFTER_END']);
const safe=e=>({name:names.has(e?.name)?e.name:'Error',code:codes.has(e?.code)?e.code:null});
export function failureLedger(owner,{send=value=>process.stdout.write(value)}={}){
 assert(/^[a-f0-9]{32}$/.test(owner));let first=null,dropped=0;const secondary=[];
 return{record(error,stage){assert(/^[a-z][a-z0-9-]{0,63}$/.test(stage));if(!first)first={error,stage};else if(first.error!==error){if(secondary.length<16)secondary.push({stage,...safe(error)});else dropped++;}return first.error;},get firstError(){return first?.error??null;},snapshot(){return{first_failure:first?{stage:first.stage,...safe(first.error)}:null,secondary_failures:secondary.slice(),dropped_secondary_failures:dropped};},emit(status,workerStop){assert(['STOP_FAILED','NOT_ACCEPTED_PREFIX_RETAINED','BOUNDED_PURE_EXECUTION_COMPLETE_REQUIRES_INDEPENDENT_RAW_AUDIT'].includes(status));send(JSON.stringify({kind:'STATS32_SUPERVISOR_TERMINAL',owner,status,worker_stop:workerStop,...this.snapshot(),full_P05_PASS:false})+'\n');}};
}
