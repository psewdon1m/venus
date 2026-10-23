/** Pure/static host gates; importing this module never starts Docker. */
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {assertMatrix} from './matrix.mjs';
import {assertTextRows} from './real-text-probe.mjs';
export const sha=b=>createHash('sha256').update(b).digest('hex');
export function captureProducer(root){
 return Object.fromEntries(readdirSync(root).sort().map(name=>{const p=join(root,name),s=lstatSync(p);assert(!s.isSymbolicLink(),'PRODUCER_SYMLINK_FORBIDDEN');assert(s.isFile()||s.isDirectory(),'PRODUCER_FILETYPE_FORBIDDEN');return [name,s.isFile()?{type:'file',sha256:sha(readFileSync(p)),bytes:s.size}:{type:'historical_or_extraction_directory'}];}));
}
export function assertBinding(binding,ack){
 assert.equal(binding.schema_version,1);assert(/^[a-f0-9]{64}$/.test(binding.source_identity));assert.equal(binding.included_files,1846);assert(/^sha256:[a-f0-9]{64}$/.test(binding.image));assert(/^[a-f0-9]{64}$/.test(binding.root_build_receipt_sha256));
 assert.equal(ack.root_run_ack,true,'ROOT_RUN_ACK_REQUIRED');assert.equal(ack.independent_producer_review,'PASS');assert(/^[a-f0-9]{64}$/.test(ack.independent_review_index_sha256));assert.equal(ack.source_identity,binding.source_identity);assert.equal(ack.image,binding.image);assert(/^[a-f0-9]{64}$/.test(ack.producer_runtime_digest));
}
export function runtimeDigest(inventory){const runtime=Object.fromEntries(Object.entries(inventory).filter(([name])=>name.endsWith('.mjs')||name==='binding.json'||name==='DESIGN.md'));return sha(Buffer.from(JSON.stringify(runtime)));}
export function assertUnchanged(before,after){assert.deepEqual(after,before,'PRODUCER_FILESET_OR_BYTES_CHANGED');}
export function assertShard(report,engine,locale){
 assertTextRows(report.real_text_observations??[],locale);
 assert.equal(report.status,'PASS');assert.equal(report.cleanup,'PASS');assert.equal(report.engine,engine);assert.equal(report.locale,locale);assert.equal(report.scope,'ACTUAL_V2_LAYOUT_SHARD_NOT_FULL_STAGE');assert.equal(report.full_matrix,false);assert.equal(report.page_errors.length,0);assert.equal(report.page_errors_overflow,false);assert(!report.observer_error&&!report.request_metadata_overflow);
 const result=assertMatrix(report.records,{engine,locale});assert.equal(result.cells,51);assert.equal(result.full_matrix,false);
 assert.equal(report.keyboard_actions.length,14);assert.equal(new Set(report.keyboard_actions.map(a=>a.scene+'/'+a.native)).size,14);
 const groups=[...new Set(report.records.map(r=>r.scene))].flatMap(scene=>[scene+'/false',scene+'/true']).sort();assert.deepEqual(report.keyboard_actions.map(a=>a.scene+'/'+a.native).sort(),groups);
 for(const action of report.keyboard_actions){if(['entry','setup'].includes(action.scene)){assert.equal(action.kind,'Space-checkbox');assert.equal(action.control,action.scene==='entry'?'adult18':'topic-allow-creative');assert.equal(action.status,'PASS');assert.equal(action.actual_toggle,true);}else{assert.equal(action.kind,'Enter-exact-HTTP-receipt');assert.equal(action.status,200);assert.equal(action.receipt_matches,true);assert.equal(action.control,({public_questions:'game-pause',private_offer:'topic-decline',private_active:'topic-other',truth_dare_choice:'game-dare',yes_but_condition:'game-condition-submit'})[action.scene]);}}
 assert(report.screenshots.count>0&&report.screenshots.count<=1836);assert(report.screenshots.bytes<=4*1024**3);return result;
}
