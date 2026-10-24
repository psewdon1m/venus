/** Parent stdout is terminal authority only when every closed proof agrees. Cold import. */
import assert from 'node:assert/strict';
import {setTimeout,clearTimeout} from 'node:timers';
export async function emitTerminal(row,{stream=process.stdout,timeoutMs=2000}={}){
 const line=JSON.stringify(row)+'\n';assert(Buffer.byteLength(line)<=65536,'TERMINAL_STDOUT_CAP');
 await new Promise((done,reject)=>{
  let settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);if(!error)stream.removeListener('error',failed);if(error)reject(error);else done();};
  const failed=error=>finish(error),timer=setTimeout(()=>{finish(Error('TERMINAL_STDOUT_TIMEOUT'));stream.destroy();},timeoutMs);
  stream.once('error',failed);try{stream.write(line,error=>finish(error));}catch(error){finish(error);}
 });
}
export function verifyTerminal(stdout,{exitCode,prep,supervisor,ownedAfter}){
 assert.equal(typeof stdout,'string');assert(Buffer.byteLength(stdout)<=65536,'TERMINAL_STDOUT_CAP');
 const row=JSON.parse(stdout.trim());assert.equal(exitCode,0);assert.equal(row.terminal_transport,'BOUNDED_STDOUT_AFTER_SUPERVISOR_V1');
 assert.deepEqual(Object.keys(row).sort(),['terminal_transport','status','error','capacityFault','cleanup','exportVerified','exportVerifiedCounter','workerStopped','auditFailures','owner','container','volume','source_identity','image','root','supervisor_exit_code','supervisor_status','elapsed_ms','statistics_RUN','full_matrix_feasibility'].sort(),'EXACT_TERMINAL_FIELDS');
 assert.equal(row.status,'COMPLETE_NON_GATING');assert.equal(row.error,null);assert.equal(row.capacityFault,null);
 assert(Array.isArray(row.auditFailures)&&row.auditFailures.length===0);assert.equal(row.cleanup,'completed');assert.equal(row.exportVerified,true);assert.equal(row.workerStopped,true);
 for(const key of ['owner','container','volume','image','source_identity'])assert.equal(row[key],prep[key],'TERMINAL_PIN_'+key);
 assert.equal(row.root,prep.root);assert.equal(row.supervisor_exit_code,0);assert.equal(row.supervisor_status,'SUPERVISOR_COMPLETE_NON_GATING');
 assert(Number.isFinite(row.elapsed_ms)&&row.elapsed_ms>=0);assert(Number.isSafeInteger(row.exportVerifiedCounter)&&row.exportVerifiedCounter>0);
 assert.equal(row.statistics_RUN,false);assert.equal(row.full_matrix_feasibility,false);
 assert.equal(supervisor.status,'SUPERVISOR_COMPLETE_NON_GATING');assert.equal(supervisor.phase,'DONE');assert.equal(supervisor.capacity_fault,null);
 assert.equal(supervisor.worker_stop_confirmed,true);assert.equal(supervisor.manual_cleanup_required,false);
 for(const key of ['owner','container','volume'])assert.equal(supervisor[key],prep[key],'SUPERVISOR_PIN_'+key);
 assert.equal(supervisor.last_actual_host_sample?.host_output_allowed,true);assert.equal(supervisor.last_actual_host_sample?.capacity_fault,null);
 assert.equal(supervisor.last_actual_host_sample?.owner,prep.owner);
 assert(BigInt(supervisor.last_actual_host_sample.available_bytes)>=10n*1024n**3n+128n*1024n**2n);
 assert.equal(ownedAfter.cleanup,'completed');assert.equal(ownedAfter.workerStopped,true);assert.deepEqual(ownedAfter.remaining,{containers:[],volumes:[]});
 assert.equal(ownedAfter.prefix_retained_without_export,false);
 return {status:'VERIFIED_COMPLETE_NON_GATING_TERMINAL',source_identity:row.source_identity,image:row.image,owner:row.owner,full_P05_PASS:false};
}
