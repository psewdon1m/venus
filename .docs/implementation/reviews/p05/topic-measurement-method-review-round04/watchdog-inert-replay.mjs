/** Independent exact-function replay. All clocks/files/Docker replies are inert. */
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import ts from '../../../../../node_modules/typescript/lib/typescript.js';
const out=dirname(fileURLToPath(import.meta.url)),packet=resolve(out,'../topic-measurement-method-preparation-round04');
const raw=readFileSync(join(packet,'exact-source/r100-v3-watchdog.mjs.bytes'));
assert.equal(createHash('sha256').update(raw).digest('hex'),'c96f120c7569b2eb6da08172b48c0ea4a27638ef11c2d0ffa9521510d5a5a87e');
const parsed=ts.createSourceFile('watchdog.mjs',raw.toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const exact=name=>parsed.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===name).getText(parsed).replace(/^export /,'');
const limits={BOOTSTRAP:30000,PROBE:10000,RUN:300000,STOP:30000,EXPORT:60000,ARCHIVE:30000,CLEANUP:30000,DONE:0};
const config={owner:'a'.repeat(32),container:'venus-r100-v3-'+ 'b'.repeat(12),volume:'venus-r100-v3-'+ 'b'.repeat(12)+'-output',image:'sha256:'+'c'.repeat(64),control_directory:resolve(out,'inert-fs'),host_output_path:resolve(out,'inert-host'),reserve_bytes:10*1024**3,global_owned_cap_bytes:128*1024**2};
async function replay(){
 let now=0,waits=0,statfsCalls=0,dockerCalls=0,postFailureLow=false;
 const files=new Map(),phase=()=>join(config.control_directory,'phase.json');
 const putPhase=(value,counter)=>files.set(phase(),JSON.stringify({owner:config.owner,phase:value,counter,worker_stopped:true,owned_cleanup:'completed',export_verified:true}));
 putPhase('BOOTSTRAP',1);
 files.set(join(config.control_directory,'native-write-probe.json'),JSON.stringify({owner:config.owner,volume:config.volume,image:config.image,uid:1000,gid:1000,status:'WRITE_FSYNC_READ_DELETE_EMPTY_PASS',native_available_bytes:String(12*1024**3)}));
 const scope={validateConfig:()=>true,resolve,join,phaseLimits:limits,performance:{now:()=>now},existsSync:p=>files.has(p),lstatSync:()=>({isSymbolicLink:()=>false}),readFileSync:p=>files.get(p),writeFileSync:(p,b)=>{assert(!files.has(p));files.set(p,b);},renameSync:(a,b)=>{files.set(b,files.get(a));files.delete(a);},statfsSync:()=>{statfsCalls++;return{bavail:postFailureLow?0n:12n*1024n**3n,bsize:1n};},assert,docker:async()=>{dockerCalls++;postFailureLow=true;return{code:0,stdout:'',stderr:''};},wait:async()=>{waits++;if(waits===1){now=250;putPhase('PROBE',2);}else if(waits===2){now=500;putPhase('RUN',3);}else if(waits===3){now=300501;putPhase('RUN',4);}else if(waits===4){now+=250;putPhase('EXPORT',5);}else if(waits===5){now+=250;putPhase('ARCHIVE',6);}else if(waits===6){now+=250;putPhase('CLEANUP',7);}else{now+=250;putPhase('DONE',8);}}};
 const run=new Function(...Object.keys(scope),exact('nextPhase')+'\n'+exact('supervise')+'\nreturn supervise;')(...Object.values(scope));
 const report=await run(config),guard=JSON.parse(files.get(join(config.control_directory,'host-space.json')));
 assert.equal(report.status,'STOPPED_NOT_ACCEPTED');assert.equal(report.reason,'EXTERNAL_RUN_MONOTONIC_DEADLINE');
 assert(report.events.some(e=>e.phase==='FAILURE_PREFIX_EXPORTED_AND_CLEANED'));
 assert.equal(statfsCalls,4);assert.equal(dockerCalls,1);assert.equal(guard.stop_requested,true);
 assert(BigInt(guard.available_bytes)>0n);assert(postFailureLow);
 return{status:'REPRODUCED_POST_STOP_HOST_SPACE_NOT_RECHECKED',exact_supervise_sha256:createHash('sha256').update(exact('supervise')).digest('hex'),inert_statfs_calls_before_stop:statfsCalls,inert_statfs_calls_after_stop:0,inert_Docker_reply_calls:dockerCalls,actual_Docker_calls:0,simulated_available_after_stop:'0',last_guard_available:guard.available_bytes,report,guard};
}
const result=await replay();writeFileSync(join(out,'watchdog-inert-replay-result.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
