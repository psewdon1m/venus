import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const E=resolve('.docs/implementation/evidence/p05/recovery-method10-actual01'),run=E+'/run',j=p=>JSON.parse(readFileSync(p)),stdout=readFileSync(E+'/p05-recovery-method10-run01.txt','utf8');
const {verifyTerminal}=await import(pathToFileURL(run+'/inputs/next/verify-terminal.mjs').href),prep=j(run+'/preparation.json'),supervisor=j(run+'/control/live/watchdog-terminal.json'),ownedAfter=j(run+'/control/receipts/owned-after-cleanup.json');
const options=()=>({exitCode:0,prep:structuredClone(prep),supervisor:structuredClone(supervisor),ownedAfter:structuredClone(ownedAfter)}),row=JSON.parse(stdout),checks=[];
assert.equal(verifyTerminal(stdout,options()).status,'VERIFIED_COMPLETE_NON_GATING_TERMINAL');checks.push({name:'exact actual terminal positive independent rerun',status:'PASS'});
for(const [field,value]of [['status','NOT_ACCEPTED'],['capacityFault','LATE_FAULT'],['error','LATE_ERROR'],['cleanup','retained'],['exportVerified',false],['workerStopped',false],['auditFailures',[{path:'late'}]],['owner','f'.repeat(32)],['supervisor_exit_code',1]]){
 assert.throws(()=>verifyTerminal(JSON.stringify({...row,[field]:value}),options()));checks.push({name:'actual terminal negative '+field,status:'PASS'});
}
for(const [field,value]of [['stdout_truncated',true],['stderr_truncated',true],['spawn_error','EPERM'],['stderr','ERROR'],['stdout','{}']]){
 assert.throws(()=>verifyTerminal(JSON.stringify({...row,supervisor_diagnostics:{...row.supervisor_diagnostics,[field]:value}}),options()));checks.push({name:'actual supervisor diagnostics negative '+field,status:'PASS'});
}
for(const field of ['exit','remaining','supervisorFault']){
 const o=options();if(field==='exit')o.exitCode=1;if(field==='remaining')o.ownedAfter.remaining.volumes=['RETAINED'];if(field==='supervisorFault')o.supervisor.capacity_fault={reason:'LOW'};
 assert.throws(()=>verifyTerminal(stdout,o));checks.push({name:'closed proof negative '+field,status:'PASS'});
}
const result={status:'PASS_ACTUAL_TERMINAL_AND_NEGATIVE_CONTROLS',count:checks.length,checks,Docker_calls:0,actual_R100_repeated:false};writeFileSync('.artifacts/p05-method10-actual-independent01/terminal-controls-result.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,count:checks.length}));
