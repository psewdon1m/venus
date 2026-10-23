/** One-off fixed preregistered lanes; invokes unchanged accepted host03. No retries/resampling. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {producerPins,validateAuthority} from './p05-fixedrange-host03.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const bytes=o=>Buffer.from(JSON.stringify(o,null,2)+'\n');
export function plannedAck(base,job){return {...base,status:'ROOT_RUN_ACK',no_actual_approval:false,owner:job.owner,range:job.range};}
export function validatePlan(plan){
 assert.equal(plan.status,'PREASSIGNED_ORIGINAL_RANGES_PENDING_ROOT_ACTIVATION');assert.equal(plan.lanes,8);assert.equal(plan.jobs.length,2609);
 assert.deepEqual(plan.counts,{'c2-static':47040,'c2-trajectory':37072,'c2-canary':336,'m3-invariants':70000,'m3-fairness':84000,'m3-gf':1000000,'m3-inference':126000});
 assert.deepEqual(plan.chunks,{'c2-static':5000,'c2-trajectory':100,'c2-canary':100,'m3-invariants':100,'m3-fairness':500,'m3-gf':10000,'m3-inference':100});
 assert.equal(plan.prefixes.length,7);assert.deepEqual(plan.prefixes.map(p=>p.section),Object.keys(plan.counts));
 for(const prefix of plan.prefixes){const count=prefix.section==='m3-gf'?1000:100;assert.deepEqual(prefix.range,{section:prefix.section,start:0,count,end:count});}
 const sections=Object.keys(plan.counts),owners=new Set(),expected=[],sectionNext=Object.fromEntries(sections.map(s=>[s,s==='m3-gf'?1000:100]));
 for(const prefix of plan.prefixes){assert(!owners.has(prefix.owner));owners.add(prefix.owner);}
 for(const [i,job]of plan.jobs.entries()){
  assert.equal(job.ordinal,i);assert.equal(job.lane,i%8);assert.match(job.owner,/^[a-f0-9]{32}$/);assert(!owners.has(job.owner));owners.add(job.owner);
  const r=job.range;assert(sections.includes(r.section));assert.equal(r.start,sectionNext[r.section]);assert.equal(r.count,Math.min(plan.chunks[r.section],plan.counts[r.section]-r.start));assert(r.count>0);assert.equal(r.end,r.start+r.count);sectionNext[r.section]=r.end;
  assert.equal(job.ack_sha256,sha(bytes(plannedAck(plan.ack_base,job))));expected.push(job.ordinal);
 }
 assert.deepEqual(sectionNext,plan.counts);assert.deepEqual(plan.lane_jobs,Array.from({length:8},(_,l)=>expected.filter(i=>i%8===l)));
 assert.equal(plan.jobs.reduce((a,j)=>a+j.range.count,0)+1600,Object.values(plan.counts).reduce((a,n)=>a+n,0));return true;
}
export async function fixedLanes(plan,run,stopped,fail){
 const records=[];
 await Promise.all(plan.lane_jobs.map(async(ids,lane)=>{
  for(const id of ids){if(stopped())break;const job=plan.jobs[id];let result;
   try{result=await run(job,lane);}catch{result={ok:false,code:'ONEOFF_HOST_START_OR_COLLECTION_FAILED'};}
   records.push({ordinal:id,lane,...result});if(!result.ok){fail({ordinal:id,lane,...result});break;}
  }
 }));return records.sort((a,b)=>a.ordinal-b.ordinal);
}
export async function main(args=process.argv.slice(2)){
 assert.equal(args.length,2);const [manifestFile,activationFile]=args.map(p=>path.resolve(p));
 const manifestRaw=fs.readFileSync(manifestFile),plan=JSON.parse(manifestRaw),activation=JSON.parse(fs.readFileSync(activationFile));validatePlan(plan);
 assert.equal(activation.status,'ROOT_BATCH_RUN_ACK');assert.equal(activation.no_actual_approval,false);assert.equal(activation.manifest_sha256,sha(manifestRaw));assert.equal(activation.oneoff_sha256,sha(fs.readFileSync(fileURLToPath(import.meta.url))));assert.equal(activation.maximum_workers,8);
 assert.equal(plan.oneoff_sha256,activation.oneoff_sha256);
 assert.match(activation.operational_review_sha256,/^[a-f0-9]{64}$/);const opReview=fs.readFileSync(activation.operational_review_path);assert.equal(sha(opReview),activation.operational_review_sha256);assert.match(JSON.parse(opReview).status,/^PASS(?:_|$)/);
 for(const [file,hash]of Object.entries(plan.inputs))assert.equal(sha(fs.readFileSync(file)),hash,file);
 assert.deepEqual(producerPins(plan.ack_base.producer_root),plan.ack_base.producer_pins);
 const binding=fs.readFileSync(path.join(plan.ack_base.producer_root,'binding.json')),prereg=fs.readFileSync(path.join(plan.ack_base.producer_root,'RANGE-PREREG.json')),review=fs.readFileSync(plan.consumer_review);
 for(const job of plan.jobs)validateAuthority(plannedAck(plan.ack_base,job),binding,prereg,review,plan.ack_base.producer_pins,plan.inputs[plan.host_runner]);
 for(const prefix of plan.prefixes){assert.equal(sha(fs.readFileSync(prefix.ack_path)),prefix.ack_sha256);assert.equal(sha(fs.readFileSync(prefix.report_path)),prefix.report_sha256);const report=JSON.parse(fs.readFileSync(prefix.report_path));assert.equal(report.status,'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE');assert.equal(report.cleanup,'COMPLETE');assert.equal(report.export_verified,true);assert.equal(report.producer_unchanged,true);assert.deepEqual(report.range,prefix.range);}
 assert(!fs.existsSync(plan.run_root),'NO_BATCH_RESTART_OR_RETRY');fs.mkdirSync(plan.run_root);fs.mkdirSync(path.join(plan.run_root,'acks'));fs.mkdirSync(path.join(plan.run_root,'logs'));
 fs.writeFileSync(path.join(plan.run_root,'activation.json'),bytes(activation),{flag:'wx'});
 let stopFlag=false,stopWriteError=null;const stop=path.join(plan.run_root,'STOP.json'),fail=record=>{stopFlag=true;try{fs.writeFileSync(stop,bytes({at:new Date().toISOString(),first_observed_failure:record,inflight_policy:'LET_ACCEPTED_HOST_FINALLY_STOP_EXPORT_CLEANUP_COMPLETE_NO_NEW_JOBS'}),{flag:'wx'});}catch(error){if(error.code!=='EEXIST')stopWriteError=error.code??'STOP_MARKER_WRITE_FAILED';}};
 const records=await fixedLanes(plan,(job,lane)=>new Promise(resolve=>{
  const ackRaw=bytes(plannedAck(plan.ack_base,job));assert.equal(sha(ackRaw),job.ack_sha256);const ackFile=path.join(plan.run_root,'acks',job.owner+'.json');fs.writeFileSync(ackFile,ackRaw,{flag:'wx'});
  const record={ordinal:job.ordinal,lane,owner:job.owner,started_at:new Date().toISOString(),range:job.range};const log={stdout:[],stderr:[]},length={stdout:0,stderr:0};let overflow=false;
  const child=spawn(process.execPath,[plan.host_runner,ackFile,plan.consumer_review],{cwd:plan.cwd,windowsHide:true,stdio:['ignore','pipe','pipe']});
  for(const stream of ['stdout','stderr'])child[stream].on('data',data=>{length[stream]+=data.length;if(length[stream]<=2*1024**2)log[stream].push(data);else{overflow=true;fail({...record,code:'HOST_LOG_OVERFLOW_NO_CHILD_KILL'});}});
  child.on('error',error=>{record.spawn_error=error.code??'SPAWN_FAILED';});
  child.on('close',(code,signal)=>{try{for(const stream of ['stdout','stderr'])fs.writeFileSync(path.join(plan.run_root,'logs',job.owner+'.'+stream+'.txt'),Buffer.concat(log[stream]),{flag:'wx'});
   let report=null;const reportFile=path.join(plan.output_parent,job.owner,'host-report.json');try{report=JSON.parse(fs.readFileSync(reportFile));}catch{/* exact missing report is failure */}
   const ok=code===0&&!signal&&!overflow&&!record.spawn_error&&report?.status==='RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE'&&report.cleanup==='COMPLETE'&&report.export_verified===true&&report.writer_stopped===true&&report.producer_unchanged===true&&report.owner===job.owner&&JSON.stringify(report.range)===JSON.stringify(job.range);
   const done={...record,finished_at:new Date().toISOString(),ok,exit_code:code,signal,log_bytes:length,overflow,host_report:reportFile,host_report_sha256:fs.existsSync(reportFile)?sha(fs.readFileSync(reportFile)):null};fs.writeFileSync(path.join(plan.run_root,'logs',job.owner+'.json'),bytes(done),{flag:'wx'});if(!ok)fail(done);resolve(done);
  }catch(error){const done={...record,ok:false,exit_code:code,signal,code:error.code??'HOST_RECEIPT_COLLECTION_FAILED'};fail(done);resolve(done);}
  });
 }),()=>stopFlag||fs.existsSync(stop),fail);
 const complete=records.length===plan.jobs.length&&records.every(r=>r.ok)&&!stopFlag&&!fs.existsSync(stop);
 const terminal={status:complete?'ALL_FIXED_RANGES_EXECUTED_NOT_STATISTICAL_ACCEPTANCE':'STOPPED_AFTER_FAILURE_NO_RETRY',manifest_sha256:sha(manifestRaw),activation_sha256:sha(fs.readFileSync(activationFile)),completed_jobs:records.length,planned_jobs:plan.jobs.length,stop_marker_write_error:stopWriteError,records,full_C2_PASS:false,full_M3_PASS:false,full_P05_PASS:false};
 fs.writeFileSync(path.join(plan.run_root,'BATCH_TERMINAL.json'),bytes(terminal),{flag:'wx'});console.log(JSON.stringify({status:terminal.status,completed_jobs:records.length,planned_jobs:plan.jobs.length,full_P05_PASS:false}));process.exitCode=complete?0:1;return terminal;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
