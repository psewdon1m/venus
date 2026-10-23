/** AUTHOR three-process full-restore controller. Private state exists only in API tmpfs. */
import assert from 'node:assert/strict';
import {fork} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,rmSync,lstatSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {setTimeout,clearTimeout} from 'node:timers';
import pg from 'pg';
import {Keyring} from '../../apps/api/dist/security.js';
import {rootNames,authorityMap,roomAuthority,rawDatabase,assertRestored,liveUntouched,sha} from './observations.mjs';
import {fixtureFrom} from './phases.mjs';
const output=resolve(process.env.P05_ARTIFACT_DIRECTORY??'/artifacts'),runId=process.env.P05_RUN_ID;
assert.equal(process.platform,'linux');assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');assert(/^venus-topic-restore-[a-f0-9]{12}$/.test(runId));
const start=performance.now(),privateRoot='/tmp/venus-topic-restore-private-'+randomBytes(12).toString('hex'),directory=join(privateRoot,'authority'),keyringFile=join(privateRoot,'keyring.json'),stateFile=join(privateRoot,'state.json');
const report={schema_version:1,status:'FAIL',run_id:runId,scope:'P05_CURRENT_COMPONENT_FULL_POSTGRES_RESTORE_SYNTHETIC_ONLY',full_stage_acceptance:false,production_approval:false,checks:[],children:[],chronology:[],runtime_cleanup:'failed',clock_policy:{phase1_ms:1000000,phase2_ms:1001000,phase3_ms:1002000,native_clock_unmodified:true,fixed_forward_fixture:true}};
let child=null,pool=null,step='private_setup';
const mark=stage=>report.chronology.push({stage,native_elapsed_ms:performance.now()-start,wall_utc:new Date().toISOString()});
const save=()=>writeFileSync(join(output,'restore-runtime.json'),JSON.stringify(report,null,2)+'\n');
const check=(id,detail)=>{assert(!report.checks.some(row=>row.id===id));report.checks.push({id,status:'PASS',detail});};
function signal(name,detail){assert(pool===null&&child===null,'No API child or controller PG pool at host dump/restore barrier');writeFileSync(join(output,name+'.json'),JSON.stringify({schema_version:1,run_id:runId,controller_pid:process.pid,no_child:true,no_controller_pool:true,...detail},null,2)+'\n');mark(name);}
async function waitSignal(name){const until=performance.now()+600000;while(performance.now()<until){const file=join(output,name+'.json');if(existsSync(file)){const value=JSON.parse(readFileSync(file,'utf8'));assert.equal(value.run_id,runId);assert.equal(value.status,'PASS');assert.equal(value.exit_code,0);return value;}await delay(250);}throw Error('Host phase timeout');}
async function observe(work){assert.equal(pool,null);pool=new pg.Pool({host:process.env.DB_HOST,user:'venus',database:'venus',password:readFileSync(process.env.DB_PASSWORD_FILE,'utf8').trim(),application_name:'p05-restore-controller-observer'});try{return await work(pool,Keyring.fromFile(keyringFile));}finally{await pool.end();pool=null;}}
async function boot(phase){
 assert.equal(child,null);assert.equal(pool,null);const configFile=join(privateRoot,'phase'+phase+'.json');writeFileSync(configFile,JSON.stringify({privateRoot,directory,keyringFile,stateFile,phase,now:1000000+(phase-1)*1000}),{mode:0o600});
 const c=fork(resolve('tests/p05-topic-restore/child.mjs'),[configFile,output],{stdio:['ignore','pipe','pipe','ipc']});child=c;const pid=c.pid,streams={stdout:{bytes:0,hash:createHash('sha256')},stderr:{bytes:0,hash:createHash('sha256')}};let completed=null,duplicate=false;
 for(const name of ['stdout','stderr'])c[name].on('data',bytes=>{streams[name].bytes+=bytes.length;streams[name].hash.update(bytes);});
 c.on('message',message=>{if(message?.type==='CHILD_COMPLETE'){if(completed)duplicate=true;completed=message.report;}});
 let timeout=false;const timer=setTimeout(()=>{timeout=true;c.kill('SIGKILL');},600000);
 let exit;try{exit=await new Promise((resolve,reject)=>{c.once('error',reject);c.once('exit',(code,signal)=>resolve({code,signal}));});}finally{clearTimeout(timer);child=null;}
 const streamMetadata=Object.fromEntries(Object.entries(streams).map(([name,s])=>[name,{bytes:s.bytes,sha256:s.hash.digest('hex')}]));
 const row={pid,phase,exit_code:exit.code,exit_signal:exit.signal,timed_out:timeout,streams:streamMetadata,report:completed};report.children.push(row);writeFileSync(join(output,'child-phase'+phase+'.json'),JSON.stringify(row,null,2)+'\n');
 assert(!timeout&&!duplicate&&exit.code===0&&exit.signal===null);assert(completed&&completed.status==='PASS'&&completed.runtime_cleanup==='completed');assert.equal(completed.pid,pid);assert.equal(completed.phase,phase);assert(!report.children.slice(0,-1).some(v=>v.pid===pid),'All three real Node PIDs distinct');for(const row of completed.checks)check(row.id,row.detail);mark('child'+phase+'_terminal_all_pools_closed');return completed;
}
function state(){const s=lstatSync(stateFile);assert(s.isFile()&&!s.isSymbolicLink()&&(s.mode&0o077)===0);return JSON.parse(readFileSync(stateFile,'utf8'));}
function dumpProof(value){assert(/^[a-f0-9]{64}$/.test(value.dump_sha256));assert(Number.isSafeInteger(value.dump_bytes)&&value.dump_bytes>0);assert.equal(value.api_connections,0);return {exit_code:value.exit_code,dump_sha256:value.dump_sha256,dump_bytes:value.dump_bytes,api_connections:value.api_connections};}
try{
 mkdirSync(privateRoot,{mode:0o700});mkdirSync(directory,{mode:0o700});for(const name of rootNames)mkdirSync(join(directory,name),{mode:0o700});writeFileSync(keyringFile,JSON.stringify({current:'test',keys:{test:randomBytes(32).toString('base64')}}),{mode:0o600});mark('private_tmpfs_configuration_created');
 step='first_child';await boot(1);let original=state(),baseline;
 step='quiescent_dump_observer';await observe(async(p,keys)=>{baseline=await rawDatabase(p);const D=await liveUntouched(p,keys,fixtureFrom(original.D),1000000),A=await liveUntouched(p,keys,fixtureFrom(original.A),1000000),authority=authorityMap(directory);original={...original,baseline:{A,D},authorityAtDump:authority,authorityDAtDump:roomAuthority(authority,original.D.room)};writeFileSync(stateFile,JSON.stringify(original),{mode:0o600});writeFileSync(join(privateRoot,'database-before.json'),JSON.stringify(baseline),{mode:0o600});});
 const keyringShaAtDump=sha(readFileSync(keyringFile));report.pre_dump={keyring_file_sha256:keyringShaAtDump,tables:baseline.summary,sequences_sha256:baseline.sequences_sha256,authority:original.authorityAtDump,untouched_D:original.baseline.D};step='dump_wait';signal('READY_FOR_DUMP',{schema_generation:3,baseline_nonempty:baseline.summary.some(v=>v.count>0)});const dump=await waitSignal('DUMP_COMPLETE');check('P05-RESTORE-03',{...dumpProof(dump),all_api_children_terminal:true,controller_pool_closed:true,format:'custom',entire_database:true});
 step='second_child';await boot(2);step='post_mutation_observer';let afterRoots;
 await observe(async p=>{const changed=await rawDatabase(p);assert.notEqual(sha(changed.privateRows),sha(baseline.privateRows),'Real post-dump database mutations required');afterRoots=authorityMap(directory);assert.notEqual(sha(afterRoots),sha(original.authorityAtDump));assert.deepEqual(roomAuthority(afterRoots,original.D.room),original.authorityDAtDump);report.post_mutation={tables:changed.summary,authority:afterRoots,D_authority_unchanged:true};});
 step='restore_wait';signal('READY_FOR_RESTORE',{post_dump_database_mutations:true,external_authority_advanced:true});const restored=await waitSignal('RESTORE_COMPLETE');assert.equal(restored.dump_sha256,dump.dump_sha256);assert.equal(restored.api_connections,0);
 step='restored_raw_observer_before_third_boot';let futureD;
 await observe(async(p,keys)=>{const actual=await rawDatabase(p),comparison=assertRestored(baseline,actual),B=(await p.query('SELECT state,closed_at FROM rooms WHERE id=$1',[original.B.room])).rows[0],peer=original.C.members.find(a=>a.id!==original.C.host.id),C=(await p.query('SELECT m.removed_at,s.revoked_at,s.expires_at FROM room_members m JOIN room_sessions s ON s.room_id=m.room_id AND s.member_id=m.id WHERE m.room_id=$1 AND m.id=$2',[original.C.room,peer.id])).rows;assert.equal(B.state,'open');assert.equal(B.closed_at,null);assert.equal(C.length,1);assert(C[0].removed_at===null&&C[0].revoked_at===null&&C[0].expires_at.getTime()>1002000);futureD=await liveUntouched(p,keys,fixtureFrom(original.D),1002000);report.raw_restored={...comparison,B_original_open:true,C_original_live_credential:true,D:futureD};});
 assert.equal(sha(readFileSync(keyringFile)),keyringShaAtDump,'Existing protected keyring must not be rolled back or replaced');const restoredRoots=authorityMap(directory);assert.deepEqual(restoredRoots,afterRoots,'External protected roots and legacy deletion ledger never roll back with database');assert.deepEqual(roomAuthority(restoredRoots,original.D.room),original.authorityDAtDump);check('P05-RESTORE-06',{exit_code:restored.exit_code,api_connections:restored.api_connections,raw_comparison:report.raw_restored,observed_before_third_boot:true});check('P05-RESTORE-07',{all_five_roots_and_legacy_deletion_ledger_equal:true,exact_tree:restoredRoots,D_original_roots_unchanged:true});mark('restored_raw_and_external_authority_observer_completed');
 step='third_child';await boot(3);assert.equal(report.children.length,3);assert.equal(new Set(report.children.map(v=>v.pid)).size,3);check('P05-RESTORE-14',{fixed_forward_server_times:report.children.map(v=>v.report.server_time_ms),restored_D_unexpired_before_boot:futureD,all_remaining_positive:Object.values(futureD.remaining_ms).every(v=>v>0),native_elapsed_ms:performance.now()-start,native_clock_unmodified:true});
 const expected=Array.from({length:14},(_,i)=>'P05-RESTORE-'+String(i+1).padStart(2,'0'));assert.equal(report.checks.length,14);assert(expected.every(id=>report.checks.filter(r=>r.id===id&&r.status==='PASS').length===1));report.status='PASS';
}catch(error){report.failure={step,name:error.name,code:typeof error.code==='string'&&/^[A-Z0-9_]+$/.test(error.code)?error.code:null,frames:String(error.stack??'').split('\n').filter(line=>/^\s*at /.test(line)&&line.includes('file:///app/')).slice(0,12)};report.status='FAIL';}
finally{
 try{if(child){child.kill('SIGKILL');await new Promise(resolve=>child.once('exit',resolve));child=null;}if(pool){await pool.end();pool=null;}assert.equal(dirname(privateRoot),'/tmp');assert(/^\/tmp\/venus-topic-restore-private-[a-f0-9]+$/.test(privateRoot));if(existsSync(privateRoot)){assert(!lstatSync(privateRoot).isSymbolicLink());rmSync(privateRoot,{recursive:true,force:true});}assert(!existsSync(privateRoot));report.runtime_cleanup='completed';mark('owned_private_configuration_roots_keys_deleted');}catch(error){report.runtime_cleanup='failed';report.status='FAIL';report.cleanup_error_name=error.name;}
 report.native_elapsed_ms=performance.now()-start;save();console.log(JSON.stringify({status:report.status,runtime_cleanup:report.runtime_cleanup,checks:report.checks.length,report:'restore-runtime.json'}));
}
process.exitCode=report.status==='PASS'&&report.runtime_cleanup==='completed'?0:1;
