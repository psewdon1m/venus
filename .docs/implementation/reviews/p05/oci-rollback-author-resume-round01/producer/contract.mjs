import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
export const controlIds=Object.freeze(Array.from({length:14},(_,i)=>'OCI'+String(i+1).padStart(2,'0')));
export const stages=Object.freeze(['A1','B2','A3']);
export const expected={
 OCI01:['both_image_ids','runtime_compiled64','expanded_image_maps','no_image_overlay'],
 OCI02:['three_actual_served_UI_maps','fixture_version_DTO_bound','actual_TLS_CA_verified'],
 OCI03:['real_admissions','A_D_private_positive','nonselected_host_denied','observer_denied','auth_CSRF_Origin_negatives'],
 OCI04:['HTTP_narrow_close_leave','authority_advanced','snapshot_history_captured'],
 OCI05:['D_live_before_switch','A1_pool_closed','zero_API_clients','same_DB_roots_keyring'],
 OCI06:['B2_distinct_process','migration_only_equality','no_down_migration'],
 OCI07:['D_live_before_boot','actual_bootGate','raw_revocation_before_listen','snapshot_history_preserved'],
 OCI08:['A_exclusion','B_closed','C_retired','newer_roots_preserved'],
 OCI09:['private_denials','exact_receipt_semantics','fresh_ID_denials','no_grant_revival'],
 OCI10:['actual_B_UI','retained_A_cleared','fresh_B_page','browser_safe_exit'],
 OCI11:['fresh_E_bilateral_positive','same_synthetic_pins','E_live_before_switch'],
 OCI12:['A3_distinct_process','E_live_before_boot','raw_revocation_before_listen','old_E_denied'],
 OCI13:['final_current_A','safe_exit','narrowed_policy_preserved','source_producer_unchanged'],
 OCI14:['resource_guard_completed','secrets_destroyed','all_apps_pools_closed','owner_inventory_empty','full_evidence_index']};
const digest=/^[a-f0-9]{64}$/;
export function validateReport(r,b){
 assert.equal(r.schema_version,1);assert.equal(r.status,'PASS_BOUNDED_SYNTHETIC_OCI_ROLLBACK');assert.equal(r.full_P05_PASS,false);assert.equal(r.production_approval,false);assert.equal(r.human450,'HOLD_UNCHANGED');assert.equal(r.source_identity,b.source_identity);assert.equal(r.image_switches,2);assert.equal(r.DB_restore,false);assert.equal(r.external_roots_rolled_back,false);assert.equal(r.cleanup,'completed');assert.equal(r.actual_execution,true);
 assert.deepEqual(r.images,b.images);assert.equal(r.boots.length,3);const identities=new Set(),containers=new Set();
 for(let i=0;i<3;i++){const row=r.boots[i];assert.equal(row.phase,stages[i]);assert.equal(row.image,b.images[i===1?'B':'A']);assert(/^[a-f0-9]{64}$/.test(row.container_id));assert(/^[a-f0-9]{32}$/.test(row.process_nonce));assert(Number.isSafeInteger(row.live_host_pid)&&row.live_host_pid>0);assert.equal(row.exit_code,0);assert.equal(row.pool_closed,true);assert.equal(row.runtime_compiled64,true);containers.add(row.container_id);identities.add(row.container_id+':'+row.process_nonce);}
 assert.equal(containers.size,3);assert.equal(identities.size,3);assert.equal(r.controls.length,14);assert.deepEqual(r.controls.map(x=>x.id).sort(),controlIds);
 for(const row of r.controls){assert.equal(row.status,'PASS');assert.deepEqual(Object.keys(row.proof).sort(),[...expected[row.id]].sort());assert(Object.values(row.proof).every(v=>v===true));assert(Array.isArray(row.evidence)&&row.evidence.length>0);for(const e of row.evidence){assert(typeof e.path==='string'&&/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(e.path)&&!e.path.split('/').includes('..'));assert(digest.test(e.sha256));assert(Number.isSafeInteger(e.bytes)&&e.bytes>0);}}
 for(const phase of ['B2','A3']){const c=r.chronology.filter(x=>x.phase===phase).map(x=>x.event);for(const event of ['migration_observer','untouched_live','bootGate_return','raw_revoked','maintenance','listen'])assert.equal(c.filter(x=>x===event).length,1);assert(c.indexOf('migration_observer')<c.indexOf('untouched_live')&&c.indexOf('untouched_live')<c.indexOf('bootGate_return')&&c.indexOf('bootGate_return')<c.indexOf('raw_revoked')&&c.indexOf('raw_revoked')<c.indexOf('maintenance')&&c.indexOf('maintenance')<c.indexOf('listen'));}
 assert.equal(r.resource.status,'PASS_OWNED_RESOURCE_GUARD');assert.equal(r.resource.allocated_peak_cap_bytes,512*1024**2);assert.equal(r.resource.reserve_bytes,10*1024**3);assert.equal(r.resource.deadline_ms,900000);assert.equal(r.resource.actual_host_native_guards,true);assert.equal(r.resource.failure_cleanup_supervised,true);assert.equal(r.truncated,false);assert.equal(r.raw_evidence_index.path,'RAW_INDEX.json');assert(digest.test(r.raw_evidence_index.sha256));assert(Number.isSafeInteger(r.raw_evidence_index.bytes)&&r.raw_evidence_index.bytes>0);assert.equal(r.raw_evidence_index.scope,'ALL_IMMUTABLE_MAIN_INPUTS_LOGS_PHASE_REPORTS_EXCEPT_SELF_RUNNER_AND_LIVE_CONTROL');return true;
}
const hash=b=>createHash('sha256').update(b).digest('hex');
export function rawEvidenceMap(root){const map={};const visit=(p,rel='')=>{const s=lstatSync(p);assert(!s.isSymbolicLink());assert(s.isDirectory()||s.isFile());if(s.isDirectory()){for(const n of readdirSync(p).sort()){const next=rel?rel+'/'+n:n;if(next==='control')continue;visit(join(p,n),next);}}else if(!['runner.json','RAW_INDEX.json'].includes(rel)){const b=readFileSync(p);map[rel]={bytes:b.length,sha256:hash(b)};}};visit(resolve(root));return map;}
export function validateEvidence(root,r){const raw=readFileSync(join(root,r.raw_evidence_index.path));assert.equal(hash(raw),r.raw_evidence_index.sha256);assert.equal(raw.length,r.raw_evidence_index.bytes);const index=JSON.parse(raw);assert.equal(index.scope,r.raw_evidence_index.scope);assert.deepEqual(index.files,rawEvidenceMap(root));for(const row of r.controls)for(const e of row.evidence){const actual=index.files[e.path];assert(actual);assert.equal(actual.bytes,e.bytes);assert.equal(actual.sha256,e.sha256);}return true;}
export function validateRunAuthority(binding,ack,indexSha){
 assert.equal(binding.status,'ROOT_FROZEN_INDEPENDENTLY_REVIEWED_READY');assert.equal(binding.root_run_ack,true);assert.equal(ack.status,'AUTHORIZED');assert.equal(ack.root_run_ack,true);assert.equal(ack.producer_index_sha256,indexSha);assert.equal(ack.attempts,1);assert.equal(ack.statistics_RUN,false);assert.equal(binding.resource_guard.status,'INDEPENDENTLY_REVIEWED_READY');assert(digest.test(binding.resource_guard.sha256));assert.equal(ack.resource_guard_sha256,binding.resource_guard.sha256);assert(digest.test(ack.expanded_image_map_sha256));assert.equal(binding.expanded_actual_image_UI_migration_maps_sha256,ack.expanded_image_map_sha256);return true;
}
/** Root must archive guard-stop.json; an active guard snapshot is insufficient. */
export function validateFinalGuardReceipt(r,report){assert.equal(r.owner,report.owner);assert.equal(r.status,'PASS_OWNED_RESOURCE_GUARD_FINAL');assert.equal(r.external_native_probe_cleanup,'completed');assert.equal(r.failure,null);assert(r.receipt_persisted!==false);assert(Number.isFinite(r.elapsed_ms)&&r.elapsed_ms>=0&&r.elapsed_ms<=900000);return true;}
