import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import vm from 'node:vm';
import {infrastructureError} from './p05-topic-measurements-method10/process-diagnostics.mjs';
import {createHash} from 'node:crypto';
const ROOT=process.cwd(),OUT=resolve('.artifacts'),run=resolve('.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970');
const source=fs.readFileSync(resolve('.artifacts/p05-topic-measurements-method10/r100-v3-watchdog.mjs'),'utf8');
const code=source.slice(0,source.indexOf("if(process.argv[1]&&resolve(process.argv[1])"))
 .replace(/^import .*;\r?\n/gm,'').replace(/^export /gm,'');
const cases=[];
for(const fault of [false,true]){
 const root=fs.mkdtempSync(join(tmpdir(),'venus-method08-supervisor-control-'));
 const config=JSON.parse(fs.readFileSync(join(run,'inputs/root-ack.json')));config.control_directory=root;config.host_output_path=root;
 let time=0,reads=0,renameCalls=0,dockerCalls=0;const emitted=[];
 const context={infrastructureError,...fs,assert,resolve,join,performance:{now:()=>time},createHash,Buffer,BigInt,setTimeout,process:{on(){},off(){}},renameSync:(a,b)=>{renameCalls++;if(fault&&b.endsWith('watchdog-terminal.json')){const e=Error('INJECTED_WINDOWS_RENAME_EPERM');e.code='EPERM';e.errno=-4048;e.syscall='rename';throw e;}return fs.renameSync(a,b);}};
 const hooks={now:()=>time,pause:async dt=>{time+=dt;},free:()=>200n*1024n**3n,
  readPhase:()=>({owner:config.owner,counter:++reads,phase:reads===1?'BOOTSTRAP':'DONE',worker_stopped:true,export_verified:true,owned_cleanup:'completed'}),
  emit:value=>emitted.push(value),docker:async()=>{dockerCalls++;return {code:0,stdout:'',stderr:''};}};
 let result,error;try{result=await vm.runInNewContext(code+'\nsupervise(JSON.parse(configJSON),hooks);',vm.createContext({...context,configJSON:JSON.stringify(config),hooks}),{timeout:1000});}catch(e){error=e.message;}
 if(!fault){assert.equal(result.status,'SUPERVISOR_COMPLETE_NON_GATING');assert(fs.existsSync(join(root,'watchdog-terminal.json')));assert.equal(dockerCalls,0);}
 else{assert.equal(error,undefined);assert.equal(result.status,'CAPACITY_FAULT_RETAINED_NOT_ACCEPTED');assert.equal(result.io_failure.code,'EPERM');assert.equal(result.terminal_receipt_written,false);assert(fs.existsSync(join(root,'host-space-next.json')));assert(!fs.existsSync(join(root,'watchdog-state.json')));assert(!fs.existsSync(join(root,'watchdog-terminal.json')));assert.equal(dockerCalls,0);assert(renameCalls>1);assert.equal(result.io_failure.errno,-4048);assert.equal(result.io_failure.syscall,'rename');assert(emitted.some(x=>x.type==='terminal'));}
 cases.push({name:fault?'first final-terminal write fault reconciles typed errno and syscall into IPC report':'exact supervisor happy cold path writes terminal',status:'PASS',injected_rename_failure:fault,observed_error:error??null,rename_calls:renameCalls,docker_calls:dockerCalls,docker_qualification:'INERT_STUB_ONLY',terminal:result?.status??null});
 // Delete only this script's fresh, resolved temporary fixture; no actual prefix.
 assert(resolve(root).startsWith(join(resolve(tmpdir()),'venus-method08-supervisor-control-')));fs.rmSync(root,{recursive:true,force:true});
}
fs.writeFileSync(join(OUT,'p05-method10-final-write-controls01.json'),JSON.stringify({status:'PASS_DIAGNOSIS_CONTROLS_ONLY',exact_module_sha256:createHash('sha256').update(source).digest('hex'),cases,actual_Docker_calls:0,actual_prefix_writes:0},null,2)+'\n');
console.log(JSON.stringify({status:'PASS_DIAGNOSIS_CONTROLS_ONLY',controls:cases.length,actual_Docker_calls:0}));
