/** Pure/static host gates; importing this module never starts Docker. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {assertMatrix,expectedCells} from './matrix.mjs';
import {sweepBudget} from './probe-policy.mjs';
import {assertTextRows} from './real-text-probe.mjs';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function captureProducer(root){
 return Object.fromEntries(readdirSync(root).sort().map(name=>{const p=join(root,name),s=lstatSync(p);assert(!s.isSymbolicLink(),'PRODUCER_SYMLINK_FORBIDDEN');assert(s.isFile()||s.isDirectory(),'PRODUCER_FILETYPE_FORBIDDEN');return [name,s.isFile()?{type:'file',sha256:sha(readFileSync(p)),bytes:s.size}:{type:'historical_or_extraction_directory'}];}));
}
export function assertBinding(binding,ack){
 assert.equal(binding.schema_version,1);assert(/^[a-f0-9]{64}$/.test(binding.source_identity));assert.equal(binding.included_files,1878);assert(/^sha256:[a-f0-9]{64}$/.test(binding.image));assert(/^[a-f0-9]{64}$/.test(binding.root_build_receipt_sha256));
 assert.equal(ack.root_run_ack,true,'ROOT_RUN_ACK_REQUIRED');assert.equal(ack.independent_producer_review,'PASS');assert(/^[a-f0-9]{64}$/.test(ack.independent_review_index_sha256));assert.equal(ack.source_identity,binding.source_identity);assert.equal(ack.image,binding.image);assert(/^[a-f0-9]{64}$/.test(ack.producer_runtime_digest));
}
export function runtimeDigest(inventory){const runtime=Object.fromEntries(Object.entries(inventory).filter(([name])=>name.endsWith('.mjs')||name==='binding.json'||name==='DESIGN.md'));return sha(Buffer.from(JSON.stringify(runtime)));}
export function assertUnchanged(before,after){assert.deepEqual(after,before,'PRODUCER_FILESET_OR_BYTES_CHANGED');}
/** Fixed prospective partition: only private_offer normal8 becomes contiguous4+4. */
export function sweepGroups(rows){
 return [...new Set(rows.map(r=>r.scene))].flatMap(scene=>[false,true].flatMap(native=>{const cells=rows.filter(r=>r.scene===scene&&r.native===native);assert(cells.length);if(scene==='private_offer'&&!native){assert.equal(cells.length,8);return [0,1].map(chunk=>({scene,native,chunk,sweep_id:scene+'/'+native+'/'+chunk,cells:cells.slice(chunk*4,chunk*4+4)}));}return [{scene,native,chunk:0,sweep_id:scene+'/'+native+'/0',cells}];}));
}
export function assertSweepEvidence(report){
 assert.equal(report.layout_method_revision,'A18_BOUNDED_OFFER_SWEEPS_05');const groups=sweepGroups(expectedCells().filter(c=>c.engine===report.engine&&c.locale===report.locale));assert.equal(groups.length,15);assert.equal(report.sweep_preparations.length,15);assert.equal(report.keyboard_actions.length,15);
 assert.equal(new Set(report.keyboard_actions.map(a=>a.scene+'/'+a.native)).size,14);assert.equal(new Set(report.keyboard_actions.map(a=>a.sweep_id)).size,15);
 const rooms=[],sessions=[];
 for(const [index,g]of groups.entries()){
  const preparation=report.sweep_preparations[index];for(const k of ['scene','native','chunk','sweep_id'])assert.equal(preparation[k],g[k]);assert.equal(preparation.setup_id,index+1);assert.deepEqual(preparation.cell_ids,g.cells.map(c=>c.id));assert.equal(preparation.budget_ms,sweepBudget(g.scene));assert(preparation.elapsed_ms>=0&&preparation.elapsed_ms<=preparation.budget_ms);
  if(g.scene==='entry'){assert.equal(preparation.room_id,null);assert.equal(preparation.session_id,null);}else{assert(typeof preparation.room_id==='string'&&preparation.room_id.length>0);rooms.push(preparation.room_id);if(g.scene==='setup')assert.equal(preparation.session_id,null);else{assert(typeof preparation.session_id==='string'&&preparation.session_id.length>0);sessions.push(preparation.session_id);}}
  const action=report.keyboard_actions[index];for(const k of ['scene','native','chunk','sweep_id'])assert.equal(action[k],g[k]);assert.equal(action.session_id,preparation.session_id);
  for(const cell of g.cells){const row=report.records.find(r=>r.id===cell.id);assert(row);assert.equal(row.sweep_id,g.sweep_id);assert.equal(row.sweep_chunk,g.chunk);assert.equal(row.sweep_budget_ms,preparation.budget_ms);}
 }
 assert.equal(rooms.length,13);assert.equal(new Set(rooms).size,13);assert.equal(sessions.length,11);assert.equal(new Set(sessions).size,11);
 return {preparations:15,keyboard_actions:15,original_scene_native_coverage:14,private_setups:9,private_session_record_cap:27};
}
export function assertShard(report,engine,locale){
 assertTextRows(report.real_text_observations??[],locale,engine);
 assert.equal(report.status,'PASS');assert.equal(report.cleanup,'PASS');assert.equal(report.engine,engine);assert.equal(report.locale,locale);assert.equal(report.scope,'ACTUAL_V2_LAYOUT_SHARD_NOT_FULL_STAGE');assert.equal(report.full_matrix,false);assert.equal(report.page_errors.length,0);assert.equal(report.page_errors_overflow,false);assert(!report.observer_error&&!report.request_metadata_overflow);
 const result=assertMatrix(report.records,{engine,locale});assert.equal(result.cells,51);assert.equal(result.full_matrix,false);
 assertSweepEvidence(report);
 for(const action of report.keyboard_actions){if(['entry','setup'].includes(action.scene)){assert.equal(action.kind,'Space-checkbox');assert.equal(action.control,action.scene==='entry'?'adult18':'topic-allow-creative');assert.equal(action.status,'PASS');assert.equal(action.actual_toggle,true);}else{assert.equal(action.kind,'Enter-exact-HTTP-receipt');assert.equal(action.status,200);assert.equal(action.receipt_matches,true);assert.equal(action.control,({public_questions:'game-pause',private_offer:'topic-decline',private_active:'topic-other',truth_dare_choice:'game-dare',yes_but_condition:'game-condition-submit'})[action.scene]);}}
 assert(report.screenshots.count>0&&report.screenshots.count<=1836);assert(report.screenshots.bytes<=4*1024**3);return result;
}
