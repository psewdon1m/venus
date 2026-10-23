import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selection,validateBrowserReport,validateSelfActionsReport} from '../../tests/p05/report-contract.mjs';
const source=fs.readFileSync('tools/p05-browser.mjs','utf8'),results=[];
const fixture=()=>({schema_version:1,suite:'P05_SELF_ACTIONS',synthetic_fixture_only:true,status:'PASS',runtime_cleanup:'completed',checks:[{id:'P05-SA-INDEPENDENT-CONTROL',status:'PASS'}]});
function run(label,{report=fixture(),rawReport,omitReport=false,args=['--self-actions'],fault,env={P05_ENGINE:'firefox',P05_CASE:'P05-18-EXPLICIT'}}={}){
 const files=new Map(),fds=new Map(),calls=[],writes=[];let fd=0,invocations=0;
 const cwd=process.cwd(),temp=path.resolve('.artifacts/p05-self-actions-runner-review/virtual-temp'),output=path.join(cwd,'.artifacts/p05/venus-p05-030303030303');
 const p={argv:['node','tools/p05-browser.mjs',...args],env,exitCode:undefined};
 const context={process:p,console:{log(){}},Buffer,Error,JSON,selection,validateBrowserReport,validateSelfActionsReport,
 randomBytes:n=>Buffer.alloc(n,3),tmpdir:()=>temp,resolve:path.resolve,dirname:path.dirname,join:path.join,mkdtempSync:x=>x+'owned',mkdirSync(){},rmSync(){},
 writeFileSync:(name,data)=>{files.set(path.resolve(name),String(data));writes.push(path.resolve(name));},
 readFileSync:name=>{const text=files.get(path.resolve(name));if(text===undefined)throw Error('ENOENT '+name);return text;},
 openSync:name=>{fds.set(++fd,path.resolve(name));files.set(path.resolve(name),'');return fd;},closeSync(){},
 execFileSync:(binary,argv)=>binary==='git'?(argv[0]==='rev-parse'?'d'.repeat(40):''):JSON.stringify({files:[],source_identity_sha256:(fault==='source-change'&&invocations++?'e':'f').repeat(64)}),
 spawnSync:(binary,argv,options)=>{
  calls.push({binary,args:argv,engine:options.env?.P05_ENGINE,selected_case:options.env?.P05_CASE,timeout:options.timeout});const logfile=options.stdio&&fds.get(options.stdio[1]);if(logfile)files.set(logfile,argv[0]==='image'?'sha256:'+'4'.repeat(64):'INDEPENDENT SYNTHETIC PARTIAL RAW');
  if(argv[0]==='container'&&argv[1]==='inspect'){
   if(fault==='inspect-timeout')return {status:null,error:{code:'ETIMEDOUT'}};
   if(fault==='wrong-owner')return {status:0,stdout:JSON.stringify([{Name:'/'+argv[2],Config:{Labels:{'venus.p05.project':'foreign','venus.p05.role':'browser'}}}])};
   return {status:1,stderr:'No such container'};
  }
  if(argv[0]==='compose'&&argv.includes('run')){
   if(!omitReport)files.set(path.join(output,'self-actions-report.json'),rawReport??JSON.stringify(report));
   files.set(path.join(output,'browser-report.json'),JSON.stringify({status:'PASS',runtime_cleanup:'completed'}));
   if(fault==='node-fail')return {status:1};if(fault==='node-timeout')return {status:null,error:{code:'ETIMEDOUT'}};
  }
  if(argv[0]==='compose'&&argv.includes('down')&&fault==='cleanup-fail')return {status:1};
  return {status:0};
 }};
 let thrown;try{vm.runInNewContext(source.replace(/^import .*;\r?\n/gm,''),context,{timeout:3000});}catch(error){thrown=error.message;}
 const text=files.get(path.join(output,'runner.json')),receipt=text?JSON.parse(text):null;
 const result={label,receipt,calls,exit_code:p.exitCode,thrown,raw_log:files.get(path.join(output,'self-actions-tests.txt'))};results.push(result);return result;
}
let c=run('Valid isolated component accepts fixed service suite and resets inherited selectors');assert.equal(c.receipt.status,'PASS');assert.equal(c.receipt.self_actions_only,true);assert.equal(c.receipt.full_browser_matrix,false);assert.equal(c.receipt.selected_engine,'all');assert.equal(c.receipt.selected_case,null);const command=c.calls.find(row=>row.args.includes('run'));assert.deepEqual(Array.from(command.args.slice(-4)),['browser','node','--test','tests/p05-self-actions/integration.mjs']);assert.equal(command.engine,'all');assert.equal(command.selected_case,'');
for(const [label,mutate] of [
 ['Wrong schema',r=>r.schema_version=2],['Wrong suite',r=>r.suite='P05_BROWSER'],['Wrong fixture scope',r=>r.synthetic_fixture_only=false],['Top failure status',r=>r.status='FAIL'],['Runtime cleanup missing',r=>delete r.runtime_cleanup],['Runtime cleanup failed',r=>r.runtime_cleanup='failed'],['Error despite PASS',r=>r.error='INDEPENDENT ERROR'],['Empty checks',r=>r.checks=[]],['Missing checks',r=>delete r.checks],['Duplicate IDs',r=>r.checks.push(r.checks[0])],['Invalid ID namespace',r=>r.checks[0].id='P05-OTHER'],['Null check',r=>r.checks=[null]],['Failed check',r=>r.checks[0].status='FAIL'],['Skipped check',r=>r.checks[0].status='SKIP'],['Missing check status',r=>delete r.checks[0].status]
]){const report=fixture();mutate(report);c=run(label,{report});assert.equal(c.receipt.status,'FAIL',label);assert.equal(c.exit_code,1,label);}
for(const [label,options] of [['Missing report despite unrelated browser PASS',{omitReport:true}],['Malformed JSON',{rawReport:'{invalid'}],['Null JSON',{rawReport:'null'}]]){c=run(label,options);assert.equal(c.receipt.status,'FAIL');assert.equal(c.exit_code,1);}
for(const fault of ['node-fail','node-timeout','source-change','cleanup-fail','inspect-timeout','wrong-owner']){
 c=run(fault,{fault});assert.equal(c.receipt.status,'FAIL');assert.equal(c.exit_code,1);assert.ok(c.raw_log.includes('PARTIAL RAW'));if(['cleanup-fail','inspect-timeout','wrong-owner'].includes(fault))assert.equal(c.receipt.cleanup,'failed');if(fault==='source-change')assert.equal(c.receipt.source_unchanged,false);
}
for(const flag of ['--chat','--catalog','--probe','--engine=firefox','--case=P05-18-EXPLICIT']){c=run('Conflict '+flag,{args:['--self-actions',flag]});assert.ok(c.thrown);assert.equal(c.receipt,null);assert.equal(c.calls.length,0);}
const output={schema_version:1,isolated_control_only:true,no_docker_executed:true,scope:'Actual host-wrapper control flow with external commands/files isolated; not service, clean-source, browser or full-stage evidence',source_sha256:createHash('sha256').update(source).digest('hex'),contract_sha256:createHash('sha256').update(fs.readFileSync('tests/p05/report-contract.mjs')).digest('hex'),controls:results};fs.writeFileSync('.artifacts/p05-self-actions-runner-review/independent-controls-01.json',JSON.stringify(output,null,2));console.log(JSON.stringify({controls:results.length,pass:results.length,fail:0,source_sha256:output.source_sha256,contract_sha256:output.contract_sha256}));

