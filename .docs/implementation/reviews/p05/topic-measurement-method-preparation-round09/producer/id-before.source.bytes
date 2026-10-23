/** Allocation-free orchestration: Docker adapter injected, no artifact writer call. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
export async function cleanupOwned({docker,owner,image,container,volume,exportVerified,now=()=>performance.now()}){
 const start=now(),actions=[],roles=['','-bootstrap','-probe','-volume-inspect','-export'];let workerStopped=false,remaining=null,error;
 async function call(args){const left=30000-(now()-start);assert(left>0,'OWNED_CLEANUP_TOTAL_DEADLINE');const result=await docker(args,{timeout:left});actions.push({operation:args[0],exit_code:result.code});assert.equal(result.code,0,'OWNED_CLEANUP_DOCKER_COMMAND_FAILED');return result;}
 async function list(){const c=await call(['ps','-aq','--filter','label=com.venus.measurement.owner='+owner]),v=await call(['volume','ls','-q','--filter','label=com.venus.measurement.owner='+owner]);return{containers:c.stdout.toString().trim().split(/\s+/).filter(Boolean),volumes:v.stdout.toString().trim().split(/\s+/).filter(Boolean)};}
 try{
  let owned=await list();if(owned.containers.length){const details=JSON.parse((await call(['inspect',...owned.containers])).stdout);assert.equal(details.length,owned.containers.length);for(const r of details){assert(owned.containers.includes(r.Id));assert.equal(r.Config?.Labels?.['com.venus.measurement.owner'],owner);assert.equal(r.Image,image);assert(roles.some(role=>r.Name==='/'+container+role));}const running=details.filter(r=>r.State.Running).map(r=>r.Id);if(running.length)await call(['kill',...running]);await call(['rm','-f',...owned.containers]);}workerStopped=true;
  owned=await list();if(exportVerified)for(const name of owned.volumes){const [v]=JSON.parse((await call(['volume','inspect',name])).stdout);assert.equal(v.Name,volume);assert.equal(v.Labels?.['com.venus.measurement.owner'],owner);await call(['volume','rm',name]);}
  remaining=await list();
 }catch(e){error=e.message;}
 return{cleanup:!error&&remaining?.containers.length===0&&remaining?.volumes.length===0?'completed':'retained',workerStopped,remaining,actions,error,elapsed_ms:now()-start,prefix_retained_without_export:!exportVerified,artifact_write_calls:0};
}
