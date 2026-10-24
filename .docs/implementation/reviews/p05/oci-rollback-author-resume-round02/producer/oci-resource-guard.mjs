/** Cold512/900 external supervisor adapter. No work without validated host plan. */
import assert from 'node:assert/strict';
import {clearTimeout} from 'node:timers';
import {fork} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validatePlan,checkSample} from './oci-resource-policy.mjs';
export const api_version='P05_OCI_EXTERNAL_RESOURCE_GUARD_1';
export async function startOCIResourceGuard(plan){
 validatePlan(plan);const child=fork(fileURLToPath(new URL('./oci-resource-supervisor.mjs',import.meta.url)),[],{windowsHide:true,stdio:['ignore','ignore','ignore','ipc']});let serial=0,last=null,fault=null,terminal=null;const requests=new Map();
 child.on('message',r=>{if(r?.owner!==plan.owner)return;if(r.kind==='sample')last=r.sample;if(r.kind==='fault')fault=Error(r.reason);if(r.kind==='terminal')terminal=r.report;if(r.kind==='reply'){const q=requests.get(r.id);if(q){requests.delete(r.id);r.error?q.reject(Error(r.error)):q.resolve(r.value);}}});
 child.on('exit',code=>{if(code!==0)fault=Error('EXTERNAL_SUPERVISOR_EXIT_'+code);for(const q of requests.values())q.reject(fault??Error('SUPERVISOR_EXIT'));requests.clear();});
 function rpc(kind,value={}){assert(child.connected,'EXTERNAL_SUPERVISOR_DISCONNECTED');const id=++serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{requests.delete(id);reject(Error('SUPERVISOR_RPC_DEADLINE'));},30000);requests.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});child.send({owner:plan.owner,id,kind,...value});});}
 await rpc('initialize',{plan});
 return{api_version,owner:plan.owner,output_root:plan.output_root,external_process_pid:child.pid,external_supervisor:true,
  async beforeMutation(v){assert.equal(v.owner,plan.owner);assert(!fault,fault?.message);const s=await rpc('before',{phase:v.phase,next:v.next_bytes});checkSample(s,v.next_bytes);return s;},
  async terminalReport(){assert(!fault,fault?.message);const r=await rpc('report');assert.equal(r.owner,plan.owner);return r;},
  async finish(value){await rpc('finish',{value});},
  async stop(){if(child.connected){await rpc('stop');child.disconnect();}return terminal??last;}
 };
}
