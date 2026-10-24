import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {producerPins,verifyRangeExport} from 'file:///C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs';
import {validateMatchedAuthority} from 'file:///C:/.projects/venus/.artifacts/p05-privacy-support-constructive01/host.mjs';
import {caseAt,classifyPair} from 'file:///C:/.projects/venus/.artifacts/p05-privacy-support-constructive01/consumer.mjs';
const R='C:/.projects/venus', O=path.dirname(fileURLToPath(import.meta.url)), D=R+'/.artifacts/p05-privacy-support-constructive-runs01/2cdeaac11252da12707c2875865e4d9f', P=R+'/.artifacts/p05-privacy-support-constructive01';
const sha=b=>createHash('sha256').update(b).digest('hex'), read=p=>JSON.parse(fs.readFileSync(p)), pin=p=>({bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}), save=(n,d)=>fs.writeFileSync(path.join(O,n),JSON.stringify(d,null,2)+'\n');
const ackPath=R+'/.artifacts/p05-privacy-support-constructive-root-ack01.json',ack=read(ackPath),host=read(D+'/host-report.json'),summary=read(D+'/export/summary.json');
assert.equal(pin(ackPath).sha256,'1fa07b2e6a54bc7b2b63dfba63af326cbd5cb550f6253fc0c2c3d9d6586d2633');
const parentPins=producerPins(ack.range_producer_root),pins=producerPins(P),reviewRaw=fs.readFileSync(ack.operational_review_path);
validateMatchedAuthority(ack,fs.readFileSync(P+'/binding.json'),fs.readFileSync(P+'/PREREG.json'),reviewRaw,pins,parentPins,sha(fs.readFileSync(P+'/host.mjs')));
assert.equal(sha(reviewRaw),'5b40b9b59ca590b020c40a5f14d56f454dfaf4cbea9ff322498d7979ae4f925e');
for(const n of ['producer-before.json','producer-after.json'])assert.deepEqual(read(D+'/'+n),pins);
for(const n of ['range-producer-before.json','range-producer-after.json'])assert.deepEqual(read(D+'/'+n),parentPins);
const verified=verifyRangeExport(D+'/export',ack,ack.range);assert.deepEqual(verified,read(D+'/export-pins.json'));
assert.equal(read(R+'/.artifacts/p05-privacy-support-constructive-actual-run01.exit.json').exit_code,0);
assert.equal(host.worker_exit,0);assert.equal(host.timeout,false);assert(host.writer_stopped&&host.export_verified&&host.producer_unchanged);assert.equal(host.cleanup,'COMPLETE');assert.deepEqual(host.cleanup_errors,[]);assert.equal(host.privacy_gate_accepted,false);
assert.equal(host.status,summary.status);assert.equal(summary.status,'MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE');assert.equal(summary.completed,7);assert(summary.native_replay_completed);assert.equal(summary.typed_refusals,0);assert.equal(summary.native_arm_refusals,0);assert.equal(summary.matched.status,'PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE');assert.deepEqual(summary.matched.failures,[]);assert.deepEqual(summary.matched.out_of_support,[]);assert(summary.elapsed_ms<3600000);
const index=read(D+'/export/raw/payload/FINAL_INDEX.json'),records=[];
for(const seg of index.segments){const decoded=gunzipSync(fs.readFileSync(D+'/export/raw/payload/'+seg.file),{maxOutputLength:32*1024**2});for(const l of decoded.toString('utf8').trimEnd().split('\n')){const row=JSON.parse(l);if(row.kind==='corpus-case')records.push(row.value.result);}}
assert.equal(records.length,7);const grid=[],retained=[],targets=[],supplement={exclusion:[],semantic:[]};let arms=0;
for(const [ordinal,row] of records.entries()){
 const d=caseAt(ordinal);assert.deepEqual(row.descriptor,d);assert.equal(row.actual_transport,false);assert.equal(row.model,'DOMAIN_MODEL_NOT_ACTUAL_AUTH');
 const item={descriptor:d,arms:{},comparisons:{},affected_private_cards:row.affected_eligible_private_card_ids.length,prior_private_rows:row.raw.prior.history.private_history.length};
 assert.deepEqual(Object.keys(row.raw),['prior','base','exclusion','semantic']);
 for(const [name,a] of Object.entries(row.raw)){
  arms++;assert.equal(a.status,'COMPLETE_DOMAIN_MODEL');assert.equal(a.history_provenance,'RUNTIME');assert.equal(a.requested_rounds,20);assert.equal(a.completed_rounds,20);assert.equal(a.selected_rounds,20);assert.equal(a.raw_rounds.length,20);assert.equal(a.counts.private_safe_empty,0);assert.equal(a.counts.current_session_exact_ID_repeats,0);assert(a.invariants.every(i=>i.violations===0));assert.equal(a.refusal,null);
  item.arms[name]={status:a.status,requested:a.requested_rounds,completed:a.completed_rounds,private_playable:a.counts.private_playable,safe_empty:a.counts.private_safe_empty};
 }
 for(const kind of ['exclusion','semantic']){
  const c=classifyPair(row.raw.base,row.raw[kind],{changed:kind==='exclusion'||row.raw.prior.history.private_history.length>0,effective:kind==='exclusion'?row.affected_eligible_private_card_ids.length>0:row.raw.prior.history.private_history.length>0});assert.deepEqual(c,row.comparisons[kind]);assert.equal(c.status,'PASS_MATCHED_DOMAIN_ONLY');assert.equal(c.classification,'COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE');assert(c.changed&&c.effective&&c.positive_private&&c.sequence_equal&&c.public_trace_equal);
  const targeted=d.target_comparisons.includes(kind);retained.push({ordinal,cell:d.cell,kind,targeted,...c});item.comparisons[kind]=c;if(targeted){targets.push({ordinal,cell:d.cell,kind,status:c.status});supplement[kind].push(d.cell);}
 }
 grid.push(item);
}
assert.equal(arms,28);assert.deepEqual(retained,summary.matched.retained_comparisons);assert.deepEqual(targets,summary.matched.targets);assert.equal(targets.length,10);assert.equal(retained.filter(x=>!x.targeted).length,4);
const oldIndex=R+'/.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/INDEX.json';assert.equal(pin(oldIndex).sha256,'b87c4c5d18ba827144205ba2737b76c5a84fed4039697f77a0f25c9bbd539f56');
const oldCoverage=read(path.dirname(oldIndex)+'/CELL-COVERAGE.json');assert.equal(oldCoverage.status,'NOT_COVERED');
const coverage=read(P+'/ORIGINAL-COVERAGE.json');assert.equal(sha(fs.readFileSync(P+'/ORIGINAL-COVERAGE.json')),'bcbee530ee09c1b9f85d22b835fb61aa61ba6a97bad4dd3e21be426e2a9bbb0f');
assert.equal(coverage.cells.length,42);for(const c of coverage.cells){const old=oldCoverage.cells[c.cell];for(const kind of ['exclusion','semantic'])assert.equal(c[kind+'_covered'],old[kind+'_covered']);}
const combined=coverage.cells.map(c=>({...c,supplemental_exclusion:supplement.exclusion.includes(c.cell),supplemental_semantic:supplement.semantic.includes(c.cell)}));assert.deepEqual(combined,summary.matched.combined_coverage);
const counts={};for(const kind of ['exclusion','semantic']){assert.deepEqual(supplement[kind].sort((a,b)=>a-b),coverage.cells.filter(c=>!c[kind+'_covered']).map(c=>c.cell));counts[kind]={original:coverage.cells.filter(c=>c[kind+'_covered']).length,new_targeted:supplement[kind].length,combined:combined.filter(c=>c[kind+'_covered']||c['supplemental_'+kind]).length};assert.equal(counts[kind].combined,42);}
assert.deepEqual(summary.matched.uncovered_cells,{exclusion:[],semantic:[]});
save('CELL-COVERAGE.json',{status:'PASS_MATCHED_DOMAIN_COVERAGE_ONLY',counts,cells:combined,constructive_cases:grid,original84:'NOT_COVERED_IMMUTABLE',refused_prefix_credit:false});
save('VERIFICATION.json',{status:'PASS_MATCHED_DOMAIN_ONLY_PENDING_STRUCTURAL_AND_WIRE_ACCEPTANCE',records:7,arms:28,completed_rounds:560,comparisons:14,targeted:10,untargeted:4,common_support_comparisons:14,failures:[],out_of_support:[],typed_refusals:0,native_arm_refusals:0,hashchain_records:verified.records,segments:index.segments.length,sealed_head:verified.head,export_files:verified.files.length,export_bytes:verified.bytes,native_replay_completed_sealed:true,replay_native_arms_expected_from_executed_source:28,independent_native_reexecution:false,coverage:counts,elapsed_ms:summary.elapsed_ms,cleanup:host.cleanup,actual_wire:false,privacy_gate_accepted:false,full_P05_PASS:false,native_actions:0});
save('INPUT-PINS.json',{ack:{path:ackPath,...pin(ackPath)},producer_pins:pins,parent_pins:parentPins,host:{path:P+'/host.mjs',...pin(P+'/host.mjs')},method:{path:ack.operational_review_path,...pin(ack.operational_review_path)},A18_qualification:ack.current_A18_qualification,prereg_witness:{...ack.new_clean_preregistration_witness,...pin(ack.new_clean_preregistration_witness.path)},original_actual:{path:oldIndex,...pin(oldIndex)},raw_location:D,export_files:verified.files});
console.log(JSON.stringify(read(O+'/VERIFICATION.json')));
