/** Cold authorization precedes fixture loading or selector imports. Host worker. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {authorize,runPreparedSection} from './section-runner.mjs';
import {durableSink} from './durable-sink.mjs';
import {resourceLease,validateResourcePlan} from './resource32-policy.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function buildAuthority(plan){
 const git=args=>execFileSync('git',args,{cwd:plan.repository,maxBuffer:64*1024**2}),commit=git(['rev-parse','HEAD']).toString().trim(),dirty=git(['status','--porcelain','--untracked-files=all']).length>0;
 const manifest=JSON.parse(readFileSync(plan.source_manifest)),files={};
 assert(manifest&&Object.keys(manifest).length>0);for(const[name,digest]of Object.entries(manifest)){assert(!name.startsWith('/')&&!name.split('/').includes('..'));const path=resolve(plan.repository,name);assert(lstatSync(path).isFile()&&!lstatSync(path).isSymbolicLink());files[name]=sha(readFileSync(path));assert.equal(files[name],digest,'SOURCE_CHANGED:'+name);}
 const inventory=JSON.parse(execFileSync(plan.python,['-B','-c','import sys,json;sys.path.insert(0,"tools");from stage_inventory import inventory,identity;f=inventory();print(json.dumps({"files":f,"identity":identity(f)}))'],{cwd:plan.repository,maxBuffer:64*1024**2}));assert.deepEqual(files,inventory.files,'MANIFEST_MUST_COVER_FULL_CURRENT_SOURCE');const source=inventory.identity;
 const inputs=JSON.parse(readFileSync(plan.input_manifest));for(const[name,digest]of Object.entries(inputs)){assert(!name.startsWith('/')&&!name.split('/').includes('..'));assert.equal(sha(readFileSync(resolve(plan.repository,name))),digest,'INPUT_CHANGED:'+name);}
 for(const n of ['cards','manifest','map','taxonomy','semantic']){const p=resolve(plan.fixture_directory,n+'.json'),relative=p.slice(resolve(plan.repository).length+1).replaceAll('\\','/');assert(p.startsWith(resolve(plan.repository)+sep));assert.equal(inputs[relative],sha(readFileSync(p)),'FIXTURE_BYTES_MUST_BE_PREREGISTERED');}
 return{source,commit,dirty,inputs,gitBlob:(tag,name)=>git(['show',tag+':'+name])};
}
export async function main(args=process.argv.slice(2)){
 if(args.length===0||args[0]==='--describe'){console.log(JSON.stringify({status:'NOT_RUN',statistics_RUN:false,profile:'P05_STATS32_EXTERNAL_1'}));return;}
 assert.equal(args.length,1);const plan=JSON.parse(readFileSync(args[0]));validateResourcePlan(plan);assert.equal(plan.worker_protocol,'EXTERNAL_GUARD_REQUIRED');
 const ack=JSON.parse(readFileSync(plan.ack)),authority=buildAuthority(plan);authorize(ack,authority);assert.equal(ack.image,plan.image);assert.equal(ack.total_wall_ms,plan.total_wall_ms);assert.deepEqual(ack.section_wall_ms,plan.section_wall_ms);assert.deepEqual(ack.stats32_limits,plan.limits);assert.equal(ack.runtime_adapter_scope,'MARKED_FIXTURE_DERIVATIVE_WITH_ACTUAL_PG_HTTP_WS');
 const checkPins=async()=>{const current=buildAuthority(plan);assert.equal(current.source,authority.source);assert.equal(current.commit,authority.commit);assert.equal(current.dirty,false);assert.deepEqual(current.inputs,authority.inputs);};
 const guard=resourceLease(join(plan.output_root,'control','guard.json'),plan.owner);guard();
 // No fixture creation here: exact reviewed persisted bytes are preregistered inputs.
 const loadFixture=async()=>{await checkPins();return(await import('../p05-topic-measurements/fixture.mjs')).loadFixture(plan.fixture_directory);};
 const sections=['C2_eligibility','C2_neutral','C2_negative','C2_private','invariants','fairness','gf','social','exclusion'];assert.deepEqual(ack.sections,sections,'FULL_FIXED_SECTION_ORDER_REQUIRED');
 const accepted=r=>r.status.startsWith('PASS')||r.status==='COMPLETE_ELIGIBILITY_ROWS_NOT_CONTENT_APPROVAL';const receipts=[];for(const section of sections){guard();await checkPins();const sink=durableSink(join(plan.output_root,'payload',section),{guard,owner:plan.owner});let receipt;try{receipt=await runPreparedSection(section,{ack,authority,guard,checkPins,loadFixture,sink});}catch(error){sink.abort();throw error;}receipts.push(receipt);if(!accepted(receipt))break;}
 await checkPins();guard();writeFileSync(join(plan.output_root,'control','worker-final.json'),JSON.stringify({status:receipts.length===sections.length&&receipts.every(accepted)?'PURE_SECTIONS_COMPLETE_REQUIRES_INDEPENDENT_RAW_AUDIT':'NOT_ACCEPTED',receipts,full_P05_PASS:false,human470:'HOLD_UNCHANGED'})+'\n',{flag:'wx'});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.stack);process.exitCode=1;});
