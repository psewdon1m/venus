import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {verifyRangeExport,validateAuthority,producerPins} from 'file:///C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs';
import {caseAt} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-corpus-ranges02/m3/descriptor.mjs';
const R='C:/.projects/venus',D=R+'/.artifacts/p05-fixedrange-interruption-recovery01',O=path.dirname(fileURLToPath(import.meta.url)),read=p=>JSON.parse(fs.readFileSync(p)),sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const plan=read(R+'/.artifacts/p05-full-original-ranges02/MANIFEST.json'),index=read(D+'/INDEX.json'),validation=read(D+'/VALIDATION.json'),rows=[];
assert.equal(sha(D+'/VALIDATION.json'),'58fcd2dba06307f1a2de17dbc3813709a845cbedef89354cd71140f6baa2d794');assert.equal(index.rows.length,8);
const pins=producerPins(plan.ack_base.producer_root),binding=fs.readFileSync(path.join(plan.ack_base.producer_root,'binding.json')),prereg=fs.readFileSync(path.join(plan.ack_base.producer_root,'RANGE-PREREG.json')),review=fs.readFileSync(plan.consumer_review);
for(const x of index.rows){
 const job=plan.jobs[x.ordinal];assert.equal(x.owner,job.owner);assert.deepEqual(x.range,job.range);assert.equal(x.name,'venus-fixedrange-'+x.owner);assert.equal(x.image,plan.ack_base.image_id);assert.equal(x.running,false);assert.equal(x.copy_exit,0);
 const ackPath=R+'/.artifacts/p05-full-original-execution03/acks/'+x.owner+'.json',ack=read(ackPath);assert.equal(sha(ackPath),x.original_ACK_sha256);assert.equal(sha(ackPath),job.ack_sha256);validateAuthority(ack,binding,prereg,review,pins,sha(plan.host_runner));
 const hp=R+'/.artifacts/p05-fixedranges/'+x.owner+'/host-report.json';assert.equal(sha(hp),x.original_host_report_sha256);const h=read(hp);assert.equal(h.status,'FAIL');assert.equal(h.worker_exit,null);assert.equal(h.export_verified,false);assert.equal(h.producer_unchanged,true);assert.deepEqual(read(path.dirname(hp)+'/producer-before.json'),pins);assert.deepEqual(read(path.dirname(hp)+'/producer-after.json'),pins);
 const original=validation.rows.find(r=>r.owner===x.owner);assert(original);let verified=null,error=null;
 try{verified=verifyRangeExport(x.raw_snapshot_path,ack,job.range);}catch(e){error={name:e.name,code:e.code??null};}
 if(x.exit_code===0){
  assert.equal(error,null);assert.equal(verified.records,101);assert.equal(verified.summary.status,'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE');assert.equal(verified.summary.completed,100);assert.deepEqual(verified.summary.range,job.range);assert(verified.summary.elapsed_ms<1200000);assert.equal(sha(D+'/'+x.owner+'/validated-export-pins.json'),original.export_pins_sha256);assert.deepEqual(verified,read(D+'/'+x.owner+'/validated-export-pins.json'));assert(original.status.startsWith('FULL_SEALED_EXPORT_AND_NATIVE_EXIT0'));
  let next=job.range.start;const rawIndex=read(x.raw_snapshot_path+'/raw/payload/FINAL_INDEX.json');
  for(const seg of rawIndex.segments){for(const l of gunzipSync(fs.readFileSync(x.raw_snapshot_path+'/raw/payload/'+seg.file),{maxOutputLength:32*1024**2}).toString('utf8').trimEnd().split('\n')){const row=JSON.parse(l);if(row.kind==='corpus-case'){assert.deepEqual(row.value.result.descriptor,caseAt('invariants',next++));}}}assert.equal(next,job.range.end);
  rows.push({ordinal:x.ordinal,owner:x.owner,range:x.range,status:'SEALED_NATIVE_EXIT0_EXPORT_VALID_PENDING_OWNED_CLEANUP_AND_CARRY',records:101,head:verified.head,bytes:verified.bytes,typed_refusals:verified.summary.typed_refusals,elapsed_ms:verified.summary.elapsed_ms,independent_saved_raw_descriptor_check:true});
 }else{
  assert.equal(x.exit_code,255);assert(error);assert.equal(verified,null);assert.equal(fs.existsSync(x.raw_snapshot_path+'/summary.json'),false);assert.equal(original.status,'NOT_CREDITED_PARTIAL_INTERRUPTED');rows.push({ordinal:x.ordinal,owner:x.owner,range:x.range,status:'NOT_CREDITED_PARTIAL_INTERRUPTED',native_exit_code:255,validator_error:error,summary_present:false});
 }
}
assert.equal(rows.filter(r=>r.records===101).length,3);assert.equal(rows.filter(r=>r.native_exit_code===255).length,5);
fs.writeFileSync(O+'/EXPORT-VERIFICATION.json',JSON.stringify({status:'THREE_SEALED_RECOVERED_RANGES_PENDING_CLEANUP_FIVE_PARTIAL_UNCREDITED',rows,full_M3_PASS:false,native_actions:0,independent_model_execution:false},null,2)+'\n');console.log(JSON.stringify({valid:3,partial_uncounted:5,records:303,salvaged_cases_pending_cleanup:300,native_actions:0}));
