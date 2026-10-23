/** Read immutable exported range segments, one bounded segment at a time. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {assertCoverage} from './range-plan.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function regular(file,cap){const s=fs.lstatSync(file);assert(s.isFile()&&!s.isSymbolicLink()&&s.nlink===1&&s.size<=cap);return fs.readFileSync(file);}
export function loadInputs(manifest,bindingRaw,preregRaw){
 assert.equal(manifest.schema,1);assert.match(manifest.method_review_sha256,/^[a-f0-9]{64}$/);assert.equal(manifest.binding_sha256,sha(bindingRaw));assert.equal(manifest.prereg_sha256,sha(preregRaw));assertCoverage(manifest.section,manifest.inputs.map(r=>r.range));
 const owners=new Set(),binding=JSON.parse(bindingRaw);
 for(const row of manifest.inputs){assert.match(row.owner,/^[a-f0-9]{32}$/);assert(!owners.has(row.owner));owners.add(row.owner);assert(path.isAbsolute(row.root));
  const summaryRaw=regular(path.join(row.root,'summary.json'),2*1024**2);assert.equal(sha(summaryRaw),row.summary_sha256);const s=JSON.parse(summaryRaw);
  assert.equal(s.status,'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE');assert.deepEqual(s.range,row.range);assert.equal(s.completed,row.range.count);assert.equal(s.owner,row.owner);assert.equal(s.source_identity,binding.source_identity);assert.equal(s.image,binding.image);assert.equal(s.binding_sha256,manifest.binding_sha256);assert.equal(s.prereg_sha256,manifest.prereg_sha256);assert.equal(s.method_review_sha256,manifest.method_review_sha256);assert.equal(s.approval_scope,'OWNER_PROVISIONAL_LOCAL_PILOT');assert.equal(s.pack_digest,binding.pack_digest);assert.deepEqual(s.map_pins,binding.map_pins);assert.equal(s.full_section_PASS,false);assert.equal(s.full_P05_PASS,false);assert.equal(s.raw.owner,row.owner);assert.equal(s.raw.status,'DURABLE_RAW_CLOSED_NOT_STATISTICAL_ACCEPTANCE');assert.equal(s.raw.records,row.range.count+1);assert.equal(s.raw.index_sha256,row.index_sha256);
 }
 return manifest;
}
export function* rangeRecords(input){
 const summaryRaw=regular(path.join(input.root,'summary.json'),2*1024**2);assert.equal(sha(summaryRaw),input.summary_sha256);const summary=JSON.parse(summaryRaw);
 assert.equal(summary.owner,input.owner);assert.deepEqual(summary.range,input.range);assert.equal(summary.completed,input.range.count);assert.equal(summary.status,'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE');assert.equal(summary.raw.index_sha256,input.index_sha256);
 assert(Number.isSafeInteger(summary.typed_refusals)&&summary.typed_refusals>=0&&summary.typed_refusals<=summary.completed);assert(Number.isFinite(summary.elapsed_ms)&&summary.elapsed_ms>=0);
 const indexRaw=regular(path.join(input.root,'raw/payload/FINAL_INDEX.json'),16*1024**2);assert.equal(sha(indexRaw),input.index_sha256);const index=JSON.parse(indexRaw);assert.equal(index.owner,input.owner);
 let seq=0,head='0'.repeat(64),payload=0,next=input.range.start,receipts=0,typedRefusals=0;
 for(const part of index.segments){assert.match(part.file,/^\d{9}\.gz$/);const raw=regular(path.join(input.root,'raw/payload',part.file),4*1024**2+2*1024**2+65536);assert.equal(raw.length,part.bytes);assert.equal(sha(raw),part.sha256);payload+=raw.length;const decoded=gunzipSync(raw,{maxOutputLength:32*1024**2});assert.equal(decoded.length,part.raw_bytes);assert.equal(decoded.at(-1),10);
  for(const line of decoded.toString('utf8').trimEnd().split('\n')){const row=JSON.parse(line),{row_sha256,...body}=row;assert.equal(row.schema,1);assert.equal(row.owner,input.owner);assert.equal(row.sequence,++seq);assert.equal(row.previous_sha256,head);assert.equal(sha(Buffer.from(JSON.stringify(body))),row_sha256);head=row_sha256;
   if(row.kind==='corpus-case'){assert.equal(receipts,0);assert.equal(row.value.section,input.range.section);assert.equal(row.tags.group,input.range.section);assert.equal(row.tags.cell,String(next));assert.equal(row.value.ordinal,next++);assert(Number.isFinite(row.value.elapsed_ms)&&row.value.elapsed_ms>=0);typedRefusals+=Number(row.value.result.status==='SAFE_REFUSAL');yield row.value;}
   else{assert.equal(row.kind,'section-receipt');assert.equal(++receipts,1);assert(!Object.hasOwn(row.value,'raw'));const {raw:closure,elapsed_ms:finalElapsed,...expected}=summary,{elapsed_ms:sealedElapsed,...actual}=row.value;void closure;assert(Number.isFinite(sealedElapsed)&&sealedElapsed>=0&&sealedElapsed<=finalElapsed);assert.deepEqual(actual,expected,'SEALED_TERMINAL_SUMMARY_MISMATCH');}
  }
  assert.equal(seq,part.last_sequence);assert.equal(head,part.head_sha256);
 }
 assert.equal(receipts,1);assert.equal(next,input.range.end);assert.equal(seq,input.range.count+1);assert.equal(seq,index.last_sequence);assert.equal(head,index.head_sha256);assert.equal(payload,index.payload_bytes);
 assert.equal(typedRefusals,summary.typed_refusals,'RAW_REFUSAL_COUNTER_MISMATCH');
}
export function* records(manifest){for(const input of [...manifest.inputs].sort((a,b)=>a.range.start-b.range.start))yield* rangeRecords(input);}
