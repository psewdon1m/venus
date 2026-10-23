import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const original=JSON.parse(readFileSync('C:/.projects/venus/.artifacts/p05-oci-owned-cleanup-plan02.json','utf8'));
const baseline=new Map(original.projects.map(row=>[row.project,{owner:row.owner,ids:new Set(Object.values(row.current_observation).flat().map(o=>o.id??o.name))}]));
function validate(plan){
 assert.equal(plan.status,'HOLD_NO_CLEANUP_AUTHORITY');assert.equal(plan.cleanup_execution_authority,false);assert.equal(plan.projects.length,9);assert.equal(new Set(plan.projects.map(p=>p.project)).size,9);
 for(const row of plan.projects){const saved=baseline.get(row.project);assert(saved);assert.equal(row.owner,saved.owner);const observed=Object.values(row.current_observation).flat(),ids=new Set(observed.map(o=>o.id??o.name));assert.deepEqual(ids,saved.ids);assert.equal(row.proposed_commands_HOLD_NOT_EXECUTED.length,7);
  for(const object of observed){assert.equal(object.labels['com.venus.oci.owner'],row.owner);assert.equal(object.labels['com.venus.oci.project'],row.project);const id=object.id??object.name,proposal=row.proposed_commands_HOLD_NOT_EXECUTED.find(p=>p.identifier===id);assert(proposal);assert.equal(proposal.status,'HOLD_NOT_EXECUTED');assert.equal(proposal.all_identity_and_evidence_checks_required,true);assert.equal(proposal.immutable_identity_sha256_required,object.immutable_identity_sha256);assert.equal(proposal.revalidate_command.at(-1),id);assert.equal(proposal.revalidate_command[0],'docker');assert.equal(proposal.revalidate_command[2],'inspect');assert.equal(proposal.revalidate_command[3],'--format');
   if(proposal.kind==='containers'){assert(['db','keeper'].includes(object.labels['com.venus.oci.role']));assert.equal(object.name,'/'+row.project+'-'+object.labels['com.venus.oci.role']);assert.match(id,/^[a-f0-9]{64}$/);assert.deepEqual(proposal.stop_ONLY_if_revalidated_running,['docker','stop','--time','10',id]);assert.deepEqual(proposal.delete_ONLY_if_revalidated_stopped,['docker','rm',id]);}
   else if(proposal.kind==='networks'){assert.match(id,/^[a-f0-9]{64}$/);assert(object.attached_container_ids.every(id=>row.current_observation.containers.some(c=>c.id===id)));assert.deepEqual(proposal.delete_ONLY_after_revalidation_empty_endpoints,['docker','network','rm',id]);}
   else{assert.equal(proposal.kind,'volumes');assert(id.startsWith(row.project+'-'));assert.deepEqual(proposal.delete_ONLY_after_revalidation,['docker','volume','rm',id]);}
  }
 }
}
validate(original);const checks=[];
const mutations=[
 ['authority_must_remain_false',p=>{p.cleanup_execution_authority=true;}],
 ['changed_owner_denied',p=>{p.projects[0].owner='0'.repeat(32);}],
 ['extra_unlisted_project_denied',p=>{p.projects.push({...p.projects[0],project:'ra20261020-foreign'});}],
 ['changed_full_container_ID_denied',p=>{p.projects[0].current_observation.containers[0].id='a'.repeat(64);}],
 ['unknown_network_endpoint_denied',p=>{p.projects[0].current_observation.networks[0].attached_container_ids.push('a'.repeat(64));}],
 ['force_container_remove_denied',p=>{p.projects[0].proposed_commands_HOLD_NOT_EXECUTED[0].delete_ONLY_if_revalidated_stopped.splice(2,0,'-f');}],
 ['wrong_volume_target_denied',p=>{p.projects[0].proposed_commands_HOLD_NOT_EXECUTED.find(v=>v.kind==='volumes').delete_ONLY_after_revalidation[3]='foreign-volume';}],
 ['missing_immediate_revalidation_denied',p=>{p.projects[0].proposed_commands_HOLD_NOT_EXECUTED[0].all_identity_and_evidence_checks_required=false;}],
 ['builtin_none_network_cannot_be_added_to_targets',p=>{p.projects[0].proposed_commands_HOLD_NOT_EXECUTED.push({kind:'networks',identifier:p.projects[0].current_observation.containers.find(c=>c.labels['com.venus.oci.role']==='keeper').networks[0].id});}]
];
for(const [name,mutate]of mutations){const p=structuredClone(original);mutate(p);assert.throws(()=>validate(p),{code:'ERR_ASSERTION'});checks.push({name,status:'DENIED_AS_REQUIRED'});}
console.log(JSON.stringify({status:'PASS_NINE_FINITE_PLAN_GUARD_NEGATIVES_NOT_EXECUTOR',positive_plan_validation:true,checks,count:checks.length,Docker_commands:0,mutations_executed:0,cleanup_authority:false}));
