/** Fixed7 prospective constructive native observations and exact existing full native replay. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {fileURLToPath} from 'node:url';
import {count,caseAt,measureMatched,summarize} from './consumer.mjs';
import {loadEnvironment} from '../p05-pilot-corpus-ranges02/m3/adapter.mjs';
import {durableSink} from '../p05-pilot-corpus-ranges02/raw/durable-sink.mjs';
import {safeError} from '../p05-pilot-corpus-ranges02/raw/safe-metadata.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function validateAck(ack,bindingRaw,preregRaw,reviewRaw){
 assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'PILOT_PRIVACY_SUPPORT_CONSTRUCTIVE_01');assert.equal(ack.no_actual_approval,false);assert.match(ack.owner,/^[a-f0-9]{32}$/);assert.equal(ack.binding_sha256,sha(bindingRaw));assert.equal(ack.prereg_sha256,sha(preregRaw));assert.equal(ack.method_review_sha256,sha(reviewRaw));assert.match(JSON.parse(reviewRaw).verdict,/^PASS_PROSPECTIVE_PRIVACY_SUPPORT_CONSTRUCTIVE_METHOD_ONLY/);
 assert.deepEqual(ack.range,{section:'privacy-support-constructive',start:0,count:7,end:7});const b=JSON.parse(bindingRaw);assert.equal(b.source_identity,ack.source_identity);assert.equal(b.image,ack.image_id);return ack;
}
export async function executeMatched(env,{append,replay,measure=measureMatched,reduce=summarize,guard=()=>{}}){
 for(let ordinal=0;ordinal<count;ordinal++){
  guard(0);const result=measure(env,caseAt(ordinal));append('corpus-case',{section:'privacy-support-constructive',ordinal,result},{group:'privacy-support-constructive',cell:String(ordinal)});
  assert(!Object.values(result.comparisons).some(r=>r.status.startsWith('FAIL')),'MATCHED_SELECTOR_OR_COMMON_TRACE_FAILURE_NO_RETRY');
 }
 const records=[];for await(const row of replay()){guard(0);assert.equal(row.section,'privacy-support-constructive');assert.equal(row.ordinal,records.length);records.push(row.result);}assert.equal(records.length,count);
 guard(0);const summary=reduce(records,env);guard(0);assert.notEqual(summary.status,'FAIL','MATCHED_REPLAY_COMPARISON_FAILURE');return summary;
}
export async function main(args){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');assert.deepEqual(args,[]);
 const bindingRaw=fs.readFileSync(path.join(here,'binding.json')),preregRaw=fs.readFileSync(path.join(here,'PREREG.json')),ack=validateAck(JSON.parse(fs.readFileSync('/run/pilot-matched-root-ack.json')),bindingRaw,preregRaw,fs.readFileSync('/run/pilot-matched-review-index.json'));
 const env=await loadEnvironment();assert.equal(env.binding.source_identity,ack.source_identity);assert.equal(env.binding.image,ack.image_id);
 const start=performance.now(),guard=additional=>{assert(performance.now()-start<3600000,'MATCHED_FIXED60MIN_WORKER_CEILING');assert(Number.isSafeInteger(additional)&&additional>=0&&additional<32*1024**2);const stat=fs.statfsSync('/artifacts');assert(stat.bavail*stat.bsize>32*1024**3+additional,'EXTERNAL_32G_FREE_SPACE_GUARD');};
 const sink=durableSink('/artifacts/raw',{guard,owner:ack.owner,payloadLimit:200*1024**2}),summary={schema_version:1,scope:'MATCHED_DOMAIN_NOT_ACTUAL_AUTH_WIRE_OR_STAGE',status:'RUNNING',range:ack.range,owner:ack.owner,source_identity:ack.source_identity,image:ack.image_id,binding_sha256:ack.binding_sha256,prereg_sha256:ack.prereg_sha256,method_review_sha256:ack.method_review_sha256,approval_scope:env.pack.approval_scope,pack_digest:env.pack.digest,map_pins:env.map.pins,completed:0,typed_refusals:0,native_arm_refusals:0,elapsed_ms:null,full_section_PASS:false,full_P05_PASS:false};
 try{
  summary.matched=await executeMatched(env,{guard,replay:()=>sink.replay('corpus-case'),append:(kind,value,tags)=>{sink.append(kind,value,tags);summary.completed++;summary.native_arm_refusals+=Object.values(value.result.raw).filter(arm=>arm.status==='SAFE_REFUSAL').length;console.log(JSON.stringify({kind:'MATCHED_PROGRESS',ordinal:value.ordinal,completed:summary.completed,elapsed_ms:performance.now()-start}));}});
  // Existing summarize() reexecutes all7 exact fresh20 native quadruplets and requires deep
  // equality. NOT_COVERED remains explicit; it is not an execution failure/pass.
  summary.native_replay_completed=true;summary.elapsed_ms=performance.now()-start;summary.status='MATCHED_EXECUTION_COMPLETE_NOT_PRIVACY_ACCEPTANCE';summary.raw=await sink.finish(summary);
 }catch(error){summary.status='FAIL_NO_RETRY_PREFIX_RETAINED';summary.error=safeError(error);if(error?.matched_prefix){try{sink.append('failed-matched-prefix',error.matched_prefix);}catch{summary.failed_prefix_append_failed=true;}}summary.raw=sink.abort();process.exitCode=1;}
 finally{
  summary.elapsed_ms=performance.now()-start;let terminalError=null;
  try{const raw=Buffer.from(JSON.stringify(summary,null,2)+'\n');assert(raw.length<2*1024**2);const fd=fs.openSync('/artifacts/summary.json','wx',0o600);try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
  catch(error){terminalError=safeError(error);process.exitCode=1;}
  console.log(JSON.stringify({kind:'MATCHED_TERMINAL',status:terminalError?'FAIL_TERMINAL_WRITE':summary.status,completed:summary.completed,matched_status:summary.matched?.status??null,terminal_error:terminalError,full_P05_PASS:false}));
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main(process.argv.slice(2));
