import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {producerPins,verifyRangeExport} from 'file:///C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs';
import {validateMatchedAuthority} from 'file:///C:/.projects/venus/.artifacts/p05-privacy-matched-host01.mjs';
import {caseAt,classifyPair} from 'file:///C:/.projects/venus/.artifacts/p05-privacy-matched-operational01/consumer.mjs';
const R='C:/.projects/venus',O=path.dirname(fileURLToPath(import.meta.url)),D=R+'/.artifacts/p05-privacy-matched-runs01/65acd7b620ab363cbda1ea589b4ea0db',P=R+'/.artifacts/p05-privacy-matched-operational01';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>JSON.parse(fs.readFileSync(p)),pin=p=>({bytes:fs.statSync(p).size,sha256:sha(fs.readFileSync(p))}),save=(n,d)=>fs.writeFileSync(path.join(O,n),JSON.stringify(d,null,2)+'\n');
const ackPath=R+'/.artifacts/p05-privacy-matched-root-ack.run02.json',ack=read(ackPath),host=read(D+'/host-report.json'),summary=read(D+'/export/summary.json');
assert.equal(pin(ackPath).sha256,'029fad661166e46fd11319ad7b208ba15894914ced04f5d577e28b7b797557ae');
const parentPins=producerPins(ack.range_producer_root),pins=producerPins(P),domain=fs.readFileSync(ack.domain_review_path);
validateMatchedAuthority(ack,fs.readFileSync(P+'/binding.json'),fs.readFileSync(P+'/PREREG.json'),domain,pins,parentPins,sha(fs.readFileSync(R+'/.artifacts/p05-privacy-matched-host01.mjs')));
assert.equal(sha(domain),'f1b675aab1cf71d7a781cbe7c479f0289b2e3f4292ca4ad25156db8894fccbcd');
assert.equal(pin(ack.operational_review_path).sha256,ack.operational_review_sha256);assert.equal(ack.operational_review_sha256,'323e209aff4f0ff833dda72759529b1065e362c39c6588ed1304921cc40ade5d');
assert.equal(pin(ack.A18_qualification.source_review_path).sha256,ack.A18_qualification.source_review_sha256);assert.equal(ack.A18_qualification.source_review_sha256,'6ba12785c55f5cdb547717902a4a397794fee3899f58d1ba909d3afa7a24cd5d');
assert.equal(pin(ack.prereg_witness_path).sha256,ack.prereg_witness_sha256);
for(const n of ['producer-before.json','producer-after.json'])assert.deepEqual(read(D+'/'+n),pins);
for(const n of ['range-producer-before.json','range-producer-after.json'])assert.deepEqual(read(D+'/'+n),parentPins);
const verified=verifyRangeExport(D+'/export',ack,ack.range);assert.deepEqual(verified,read(D+'/export-pins.json'));
assert.equal(read(R+'/.artifacts/p05-privacy-matched-a18-run01.exit.json').exit_code,0);
assert.equal(host.worker_exit,0);assert.equal(host.timeout,false);assert(host.writer_stopped&&host.export_verified&&host.producer_unchanged);assert.equal(host.cleanup,'COMPLETE');assert.deepEqual(host.cleanup_errors,[]);assert.equal(host.privacy_gate_accepted,false);
assert.equal(host.status,summary.status);assert.equal(summary.status,'MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE');assert.equal(summary.completed,84);assert(summary.native_replay_completed);assert.equal(summary.typed_refusals,0);assert.equal(summary.native_arm_refusals,114);assert.equal(summary.matched.status,'NOT_COVERED');assert.deepEqual(summary.matched.failures,[]);assert.equal(summary.elapsed_ms<3600000,true);assert.equal(summary.full_section_PASS,false);assert.equal(summary.full_P05_PASS,false);
const index=read(D+'/export/raw/payload/FINAL_INDEX.json'),records=[];
for(const seg of index.segments){const decoded=gunzipSync(fs.readFileSync(D+'/export/raw/payload/'+seg.file),{maxOutputLength:32*1024**2});for(const l of decoded.toString('utf8').trimEnd().split('\n')){const row=JSON.parse(l);if(row.kind==='corpus-case')records.push(row.value.result);}}
assert.equal(records.length,84);const grid=[],out=[],failures=[],classCounts={},arms={R20:{},R100:{}},support={exclusion:[],semantic:[]};let armCount=0,refusals=0,sequenceMismatch=0,traceMismatch=0;
const inc=(obj,key)=>obj[key]=(obj[key]??0)+1;
for(const [ordinal,row] of records.entries()){
 const d=caseAt(ordinal);assert.deepEqual(row.descriptor,d);assert.equal(row.actual_transport,false);assert.equal(row.model,'DOMAIN_MODEL_NOT_ACTUAL_AUTH');
 const item={...d,affected_eligible_private_cards:row.affected_eligible_private_card_ids.length,prior_private_rows:row.raw.prior.history.private_history.length,prior_private_families:row.prior_private_family_ids.length,arms:{},comparisons:{}};
 for(const [name,a] of Object.entries(row.raw)){
  armCount++;assert.equal(a.history_provenance,'RUNTIME');assert.equal(a.raw_rounds.length,a.selected_rounds);assert.equal(a.completed_rounds,a.selected_rounds);assert(a.invariants.every(i=>i.violations===0));assert.equal(a.counts.current_session_exact_ID_repeats,0);assert.equal(a.counts.Kprivate,a.counts.private_playable+a.counts.private_safe_empty);
  const key='R'+a.requested_rounds;inc(arms[key],a.status);if(a.status==='SAFE_REFUSAL'){refusals++;assert.equal(a.refusal.reason,'TOPIC_SAFE_POOL_EXHAUSTED');assert.equal(a.refusal.completed_prefix,a.completed_rounds);}else assert.equal(a.completed_rounds,a.requested_rounds);
  item.arms[name]={status:a.status,requested:a.requested_rounds,completed:a.completed_rounds,private_playable:a.counts.private_playable,private_safe_empty:a.counts.private_safe_empty,refusal:a.refusal};
 }
 for(const kind of ['exclusion','semantic']){
  const comparison=classifyPair(row.raw.base,row.raw[kind],{changed:kind==='exclusion'||row.raw.prior.history.private_history.length>0,effective:kind==='exclusion'?row.affected_eligible_private_card_ids.length>0:row.raw.prior.history.private_history.length>0});
  assert.deepEqual(comparison,row.comparisons[kind]);item.comparisons[kind]=comparison;inc(classCounts,comparison.classification);sequenceMismatch+=Number(!comparison.sequence_equal);traceMismatch+=Number(!comparison.public_trace_equal);
  if(comparison.status.startsWith('FAIL'))failures.push({ordinal,kind,...comparison});
  if(comparison.classification==='COMMON_SUPPORT_FULL_CONTROLLED_LIFECYCLE')support[kind].push(d.cell);else out.push({ordinal,kind,...comparison});
 }
 grid.push(item);
}
assert.equal(armCount,336);assert.equal(refusals,summary.native_arm_refusals);assert.deepEqual(out,summary.matched.out_of_support);assert.deepEqual(failures,summary.matched.failures);
const uncovered=Object.fromEntries(Object.entries(support).map(([kind,cells])=>[kind,Array.from({length:42},(_,i)=>i).filter(i=>!cells.includes(i))]));assert.deepEqual(uncovered,summary.matched.uncovered_cells);
const cells=Array.from({length:42},(_,cell)=>({cell,size:grid[cell*2].size,mode:grid[cell*2].mode,context:grid[cell*2].context,exclusion_covered:!uncovered.exclusion.includes(cell),semantic_covered:!uncovered.semantic.includes(cell),observations:grid.slice(cell*2,cell*2+2)}));
save('CELL-COVERAGE.json',{status:'NOT_COVERED',cells});save('VERIFICATION.json',{status:'PASS_EXECUTION_INTEGRITY_NOT_PRIVACY_ACCEPTANCE',owner:ack.owner,source_identity:ack.source_identity,image:ack.image_id,A18_qualification:ack.A18_qualification,range:ack.range,records:records.length,arms:armCount,native_replay_completed_sealed:summary.native_replay_completed,replay_native_models_expected_from_executed_source:336,independent_native_reexecution:false,comparisons:168,classifications:classCounts,arm_status_by_actual_requested_rounds:arms,native_arm_refusals:refusals,uncovered_cells:uncovered,support_comparisons:Object.fromEntries(Object.entries(support).map(([k,v])=>[k,v.length])),sequence_mismatches:sequenceMismatch,public_trace_mismatches_all_dispositions:traceMismatch,failures,export_bytes:verified.bytes,export_files:verified.files.length,segments:index.segments.length,hashchain_records:verified.records,sealed_head:verified.head,elapsed_ms:summary.elapsed_ms,cleanup:host.cleanup,privacy_gate_accepted:false,native_actions:0,full_P05_PASS:false});
save('INPUT-PINS.json',{ack:{path:ackPath,...pin(ackPath)},producer_pins:pins,parent_pins:parentPins,host:{path:R+'/.artifacts/p05-privacy-matched-host01.mjs',...pin(R+'/.artifacts/p05-privacy-matched-host01.mjs')},domain_review:{path:ack.domain_review_path,...pin(ack.domain_review_path)},operational_review:{path:ack.operational_review_path,...pin(ack.operational_review_path)},A18_review:{path:ack.A18_qualification.source_review_path,...pin(ack.A18_qualification.source_review_path)},prereg_witness:{path:ack.prereg_witness_path,...pin(ack.prereg_witness_path)},raw_location:D,export_file_pins:verified.files});
console.log(JSON.stringify(read(O+'/VERIFICATION.json')));
