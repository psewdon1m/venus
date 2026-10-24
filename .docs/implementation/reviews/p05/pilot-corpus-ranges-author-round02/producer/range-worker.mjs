/** Fixed offline case range. Root's existing owned Docker lifecycle is external. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {parseRange,descriptors} from './range-plan.mjs';
import {loadBound,staticCell,runPreflight,canaryCell} from './c2/consumer.mjs';
import {loadEnvironment,gfCase} from './m3/adapter.mjs';
import {modelSession} from './m3/model.mjs';
import {durableSink} from './raw/durable-sink.mjs';
import {safeError} from './raw/safe-metadata.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function executeCase(section,row,env,{model=modelSession,gf=gfCase}={}){
 if(section.startsWith('c2-'))return (section==='c2-static'?staticCell:section==='c2-trajectory'?runPreflight:canaryCell)(row.cell,env);
 if(section==='m3-gf')return gf(env,row.descriptor);
 const public_frames=[];
 try{return {...model(env,row.descriptor,{onFrame:frame=>public_frames.push(frame)}),public_frames};}
 catch(error){if(error&&typeof error==='object'&&error.domain_prefix)error.domain_prefix.public_frames=public_frames;throw error;}
}
export function validateAck(ack,range,bindingRaw,preregRaw,reviewRaw){
 assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'PILOT_FIXED_RANGE_02');assert.equal(ack.no_actual_approval,false);assert.match(ack.owner,/^[a-f0-9]{32}$/);
 assert.deepEqual(ack.range,range);assert.equal(ack.binding_sha256,sha(bindingRaw));assert.equal(ack.prereg_sha256,sha(preregRaw));assert.equal(ack.method_review_sha256,sha(reviewRaw));
 const b=JSON.parse(bindingRaw);assert.equal(b.source_identity,ack.source_identity);assert.equal(b.image,ack.image_id);
 return ack;
}
export async function main(args){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');const range=parseRange(args),bindingRaw=fs.readFileSync(path.join(here,'binding.json')),preregRaw=fs.readFileSync(path.join(here,'RANGE-PREREG.json')),
  ack=validateAck(JSON.parse(fs.readFileSync('/run/pilot-range-root-ack.json')),range,bindingRaw,preregRaw,fs.readFileSync('/run/pilot-range-review-index.json'));
 const env=range.section.startsWith('c2-')?await loadBound():await loadEnvironment();assert.equal(env.binding.source_identity,ack.source_identity);assert.equal(env.binding.image,ack.image_id);
 const start=performance.now(),deadline=start+1200000;
 const guard=additional=>{assert(performance.now()<deadline,'FIXED_20MIN_WORKER_CEILING');assert(Number.isSafeInteger(additional)&&additional>=0&&additional<32*1024**2);const stat=fs.statfsSync('/artifacts');assert(stat.bavail*stat.bsize>32*1024**3+additional,'EXTERNAL_32G_FREE_SPACE_GUARD');};
 const sink=durableSink('/artifacts/raw',{guard,owner:ack.owner,payloadLimit:200*1024**2}),summary={schema_version:1,scope:'FIXED_RANGE_PURE_DOMAIN_NOT_ACTUAL_AUTH_WIRE_OR_STAGE',status:'RUNNING',range,owner:ack.owner,source_identity:ack.source_identity,image:ack.image_id,binding_sha256:ack.binding_sha256,prereg_sha256:ack.prereg_sha256,method_review_sha256:ack.method_review_sha256,approval_scope:env.pack.approval_scope,pack_digest:env.pack.digest,map_pins:env.map.pins,completed:0,typed_refusals:0,elapsed_ms:null,full_section_PASS:false,full_P05_PASS:false};
 let active=null;
 try{
  for(const row of descriptors(range)){
   guard(0);active=row.ordinal;const before=performance.now(),result=executeCase(range.section,row,env),elapsed_ms=performance.now()-before;
   sink.append('corpus-case',{section:range.section,ordinal:row.ordinal,result,elapsed_ms},{group:range.section,cell:String(row.ordinal)});summary.completed++;summary.typed_refusals+=Number(result.status==='SAFE_REFUSAL');
   if(summary.completed%10===0)console.log(JSON.stringify({kind:'FIXED_RANGE_PROGRESS',section:range.section,start:range.start,completed:summary.completed,elapsed_ms:performance.now()-start}));
  }
  assert.equal(summary.completed,range.count);summary.elapsed_ms=performance.now()-start;summary.status='RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE';summary.raw=await sink.finish(summary);
 }catch(error){summary.status='FAIL_NO_RETRY_PREFIX_RETAINED';summary.failed_ordinal=active;summary.error=safeError(error);if(error?.domain_prefix){try{sink.append('failed-domain-prefix',{section:range.section,ordinal:active,...error.domain_prefix},{group:range.section,cell:String(active)});}catch{summary.failed_prefix_append_failed=true;}}summary.raw=sink.abort();process.exitCode=1;}
 finally{
  summary.elapsed_ms=performance.now()-start;let terminalError=null;
  try{const raw=Buffer.from(JSON.stringify(summary,null,2)+'\n');assert(raw.length<2*1024**2);const fd=fs.openSync('/artifacts/summary.json','wx',0o600);try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  catch(error){terminalError=safeError(error);process.exitCode=1;}
  console.log(JSON.stringify({kind:'FIXED_RANGE_TERMINAL',status:terminalError?'FAIL_TERMINAL_WRITE':summary.status,range,completed:summary.completed,terminal_error:terminalError,full_section_PASS:false}));
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main(process.argv.slice(2));
