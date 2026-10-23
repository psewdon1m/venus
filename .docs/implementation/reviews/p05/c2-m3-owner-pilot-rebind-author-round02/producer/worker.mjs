/** One C2-first bounded offline worker. No Docker/job/supervisor API here. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {createHash} from 'node:crypto';
import {loadBound,staticCell,runPreflight,cellAt} from './c2/consumer.mjs';
import {durableSink} from './raw/durable-sink.mjs';
import {safeError} from './raw/safe-metadata.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
export function validatePlan(plan){
 assert.equal(plan.revision,'P05-PILOT-C2-FIRST-02');
 for(const key of ['neutral_static','private_static','neutral_R20','neutral_R100']){assert.equal(plan[key].length,42);assert.equal(new Set(plan[key].map(r=>[r.cell.size,r.cell.mode,r.cell.context].join('/'))).size,42);assert(plan[key].every(r=>r.cell.cap==='ON'&&r.cell.regime==='all_allow'));for(const row of plan[key])assert.deepEqual(row.cell,cellAt(key.startsWith('neutral_R')?'trajectory':'static',row.index));}
 assert(plan.neutral_static.every(r=>r.cell.stage===4&&r.cell.comfort===0&&r.cell.pairClass==='F'));
 assert(plan.private_static.every(r=>r.cell.stage===3&&r.cell.comfort===1&&r.cell.pairClass==='F'));
 assert(plan.neutral_R100.every(r=>r.cell.rounds===100&&r.cell.profile==='neutral_C0_F'&&r.cell.comfort===0&&r.cell.pairClass==='F'));
 assert.equal(plan.required_neutral_baseline,20);assert.equal(plan.required_private_baseline,25);assert.equal(plan.required_originals_per_mode,100);assert.equal(plan.R100_upper_bound_diagnostic_only,100);
 assert(plan.neutral_R20.every(r=>r.cell.rounds===20&&r.cell.profile==='neutral_C0_F'&&r.cell.comfort===0&&r.cell.pairClass==='F'));
 return plan;
}
export function requiredBaselineFailures(summary){assert(Array.isArray(summary.neutral20_failures)&&Array.isArray(summary.private_baseline_shortages));assert.deepEqual(Object.keys(summary.original_mode_counts).sort(),['questions','truth_or_dare','yes_but'].sort());return summary.neutral20_failures.length+summary.private_baseline_shortages.length+Object.values(summary.original_mode_counts).filter(n=>!Number.isSafeInteger(n)||n<100).length;}
export async function main(){
 assert.equal(process.platform,'linux');assert.equal(process.cwd(),'/app');assert.deepEqual(process.argv.slice(2),['c2-first']);
 const ack=JSON.parse(fs.readFileSync('/run/pilot-c2-root-ack.json'));
 assert.equal(ack.status,'ROOT_RUN_ACK');assert.equal(ack.purpose,'PILOT_C2_FIRST_02');assert(/^[a-f0-9]{32}$/.test(ack.owner));
 assert.equal(sha(fs.readFileSync(path.join(here,'binding.json'))),ack.binding_sha256);
 const preregRaw=fs.readFileSync(path.join(here,'C2-FIRST-PREREG.json'));assert.equal(sha(preregRaw),ack.prereg_sha256);const plan=validatePlan(JSON.parse(preregRaw));
 const review=fs.readFileSync('/run/pilot-c2-review-index.json');assert.equal(sha(review),ack.method_review_sha256);
 const base=await loadBound();assert.equal(base.binding.source_identity,ack.source_identity);assert.equal(base.binding.image,ack.image_id);
 const begun=performance.now(),end=begun+1200000,payloadLimit=200*1024**2;
 const guard=additional=>{assert(performance.now()<end,'FIXED_20MIN_WORKER_CEILING');assert(Number.isSafeInteger(additional)&&additional>=0&&additional<32*1024**2);const stat=fs.statfsSync('/artifacts');assert(stat.bavail*stat.bsize>32*1024**2+additional,'EXTERNAL_VOLUME_LOW_SPACE');};
 const sink=durableSink('/artifacts/raw',{guard,owner:ack.owner,payloadLimit});
 const summary={schema_version:1,scope:'OWNER_PILOT_C2_FIRST_NOT_M3_CORPUS',status:'RUNNING',source_identity:ack.source_identity,image:ack.image_id,pack_digest:base.pack.digest,map_pins:base.map.pins,approval_scope:base.pack.approval_scope,static_cases:0,trajectory_cases:0,R100_upper_bound_diagnostics:[],neutral20_failures:[],original_mode_counts:Object.fromEntries(['questions','truth_or_dare','yes_but'].map(mode=>[mode,base.pack.cards.filter(c=>c.mode===mode).length])),private_baseline_shortages:[],refusals:[],full_C2_PASS:false,full_M3_PASS:false,full_P05_PASS:false};
 let active=null;
 try{
  console.log(JSON.stringify({kind:'C2_FIRST_INPUT_COUNTS',approval_scope:summary.approval_scope,original_mode_counts:summary.original_mode_counts,required_originals_per_mode:100,required_neutral_baseline:20,required_private_baseline:25}));
  for(const phase of ['neutral_static','private_static','neutral_R20','neutral_R100'])for(const row of plan[phase]){
   guard(0);active={phase,index:row.index,size:row.cell.size,mode:row.cell.mode,context:row.cell.context};const before=performance.now();
   const result=phase.startsWith('neutral_R')?runPreflight(row.cell,base):staticCell(row.cell,base),elapsed_ms=performance.now()-before;
   sink.append('c2-case',{phase,index:row.index,cell:row.cell,result,elapsed_ms},{group:phase,cell:[row.cell.size,row.cell.mode,row.cell.context].join('/')});
   if(phase.startsWith('neutral_R')){summary.trajectory_cases++;if(result.status==='SAFE_REFUSAL'){summary.refusals.push({...active,error_code:result.error_code,prefix_available:false,classification:phase==='neutral_R100'?'EXPECTED_SAFE_PRESTART_REFUSAL':'REQUIRED_NEUTRAL20_FAILED'});if(phase==='neutral_R20')summary.neutral20_failures.push({...active,error_code:result.error_code});}else{assert.equal(result.planned_rounds,phase==='neutral_R20'?20:100);assert(result.history.rounds.every(r=>r.interaction!=='pair_private'));}}
   else{summary.static_cases++;if(phase==='neutral_static'&&result.neutral.one_family_per_card&&result.neutral.operation_slots_if_single_family<100)summary.R100_upper_bound_diagnostics.push({...active,operation_slots:result.neutral.operation_slots_if_single_family,upper_bound_diagnostic_R:100,not_a_required_neutral_pool_size:true,neutral20_satisfied:result.neutral.card_ids>=20,neutral_card_ids:result.neutral_card_ids});
    if(phase==='private_static'&&result.private_baseline.card_ids<25)summary.private_baseline_shortages.push({...active,card_ids:result.private_baseline.card_ids,required:25,private_card_ids:result.private_baseline_card_ids});}
   console.log(JSON.stringify({kind:'C2_FIRST_PROGRESS',phase,index:row.index,status:result.status,elapsed_ms}));
  }
  assert.equal(summary.static_cases,84);assert.equal(summary.trajectory_cases,84);
  const shortages=requiredBaselineFailures(summary);
  summary.status=shortages?'EXECUTION_COMPLETE_REQUIRED_C2_BASELINE_NOT_ACCEPTED':'EXECUTION_COMPLETE_REQUIRED_BASELINES_AND_PRESTART_CHECKS_ONLY';summary.elapsed_ms=performance.now()-begun;
  summary.raw=await sink.finish({...summary,kind:'C2_FIRST_TERMINAL'});if(shortages)process.exitCode=2;
 }catch(error){summary.status='FAIL_NO_RETRY_PREFIX_RETAINED';summary.failed_case=active;summary.error=safeError(error);summary.raw=sink.abort();process.exitCode=1;}
 finally{let terminalWriteError=null;try{const raw=JSON.stringify(summary,null,2)+'\n';assert(Buffer.byteLength(raw)<2*1024**2);const fd=fs.openSync('/artifacts/summary.json','wx',0o600);try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}catch(error){terminalWriteError=safeError(error);process.exitCode=1;}
  console.log(JSON.stringify({kind:'C2_FIRST_TERMINAL',status:terminalWriteError?'FAIL_TERMINAL_WRITE':summary.status,static_cases:summary.static_cases,trajectory_cases:summary.trajectory_cases,primary_error:summary.error??null,terminal_write_error:terminalWriteError,full_C2_PASS:false}));}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
