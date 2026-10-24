/** Explicit OCI512/900 policy; METHOD06 remains byte-for-byte unchanged. */
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
export const policy=Object.freeze({total:512*1024**2,nativeReserved:320*1024**2,hostLimit:160*1024**2,burstSafety:32*1024**2,reserve:10*1024**3,deadline:900000,receiptMaximum:2*1024**2});
export function validatePlan(p){
 assert.equal(p.schema_version,1);assert(/^[a-f0-9]{32}$/.test(p.owner));assert(/^venus-p05-oci-[a-f0-9]{12}$/.test(p.project));assert.equal(p.output_root,resolve(p.workspace_root,'.artifacts/p05',p.project));assert.equal(p.guard_file,resolve(p.output_root,'control/guard.json'));assert.equal(p.total_cap_bytes,policy.total);assert.equal(p.reserve_bytes,policy.reserve);assert.equal(p.deadline_ms,policy.deadline);assert.equal(p.no_global_cleanup,true);assert.equal(p.protected_roots_rollback,false);
 assert.deepEqual(p.partitions_mib,{PG:256,authority:32,readonly_inputs:16,private_tmpfs:32,host_evidence:64,archive:64,logs_control:16,safety:32});assert.deepEqual(p.private_tmpfs_split_mib,{private:8,browser:16,API:4,proxy:2,helpers:2});
 for(const[k,v]of Object.entries(p.volumes))assert.equal(v,p.project+'-'+k);for(const key of ['A','B'])assert(/^sha256:[a-f0-9]{64}$/.test(p.images[key]));return true;
}
export function checkSample(s,next=0){
 assert(Number.isSafeInteger(next)&&next>=0&&next<=16*1024**2);assert.equal(s.stop_requested,false);assert(Number.isSafeInteger(s.host_allocated_bytes)&&s.host_allocated_bytes>=0);assert(s.host_allocated_bytes+next+1048576<=policy.hostLimit,'HOST160_PROSPECTIVE_CAP');assert(BigInt(s.actual_host_free_bytes)>=BigInt(policy.reserve+policy.total),'HOST_RESERVE');assert(BigInt(s.actual_native_free_bytes)>=BigInt(policy.reserve+policy.total),'NATIVE_RESERVE');assert(policy.nativeReserved+s.host_allocated_bytes+next+1048576<=policy.total);return true;
}
export function validateVolumes(rows,p){
 assert(Array.isArray(rows)&&rows.length<=3);const seen=new Set();
 for(const row of rows){const key=Object.keys(p.volumes).find(k=>p.volumes[k]===row.Name);assert(key&&!seen.has(key));seen.add(key);assert.equal(row.Driver,'local');assert.equal(row.Labels['com.venus.oci.owner'],p.owner);assert.equal(row.Labels['com.venus.oci.project'],p.project);assert.deepEqual(row.Options,{type:'tmpfs',device:'tmpfs',o:{db:'size=256m,mode=0700',authority:'size=32m,mode=0700',private:'size=8m,mode=0700,uid=0,gid=0'}[key]});}return true;
}
