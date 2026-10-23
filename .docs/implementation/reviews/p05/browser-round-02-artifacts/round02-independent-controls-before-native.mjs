import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {selection,validateBrowserReport,assertPageErrors} from '../../tests/p05/report-contract.mjs';
const wrapper=fs.readFileSync('tools/p05-browser.mjs','utf8'),browser=fs.readFileSync('tests/p05/browser.mjs','utf8');
const baseline=JSON.parse(fs.readFileSync('.artifacts/p05/venus-p05-5735c76a8c65/browser-report.json','utf8'));
const cases=['P05-18-EXPLICIT','P05-01-CAPACITY-IDENTITY','P05-03-05-09-10-LOCALIZED-GAME','P05-UI-YESBUT-CONDITION-REPLAY','P05-04-PRIVATE-CHAT-CONSENT-ACL','P05-06-NOT-A-FRIEND-ALL-MODES','P05-NEUTRAL-SAFETY-RESET','P05-IN-PERSON-PRIVATE-NO-CHAT','P05-STALE-READ-AFTER-NEW-PREPARE','P05-EXPIRED-CHAT-RETRY-PURGE'];
const controls=[];
function receipt(){const r=structuredClone(baseline);r.selected_engine='all';r.selected_case=null;r.full_suite=true;const engines=['chromium','firefox','webkit'];r.versions=engines.map(engine=>({engine,version:'SYNTHETIC_REVIEW_CONTROL'}));r.records=engines.flatMap(engine=>cases.map(id=>({engine,id,status:'PASS'})));r.matrix=engines.flatMap(engine=>baseline.matrix.map(row=>({...structuredClone(row),engine})));r.native_zoom=engines.flatMap(engine=>baseline.native_zoom.map(row=>({...structuredClone(row),engine})));return r;}
function execute(label,{args=[],env={},report=receipt(),fault,inspect='absent'}={}){
 const files=new Map(),fds=new Map(),calls=[];let next=1,invocations=0;
 const fakeProcess={argv:['node','tools/p05-browser.mjs',...args],env,exitCode:undefined};
 const cwd=process.cwd(),temp=path.resolve('.artifacts/p05-browser-review/virtual-temp');
 const context={process:fakeProcess,console:{log(){}},Buffer,Error,JSON,selection,validateBrowserReport,
 randomBytes:n=>Buffer.alloc(n,2),tmpdir:()=>temp,resolve:path.resolve,dirname:path.dirname,join:path.join,
 mkdtempSync:p=>p+'fixture',mkdirSync(){},rmSync(){},writeFileSync:(p,data)=>files.set(path.resolve(p),String(data)),
 readFileSync:p=>{const value=files.get(path.resolve(p));if(value===undefined)throw Error('Unstubbed read '+p);return value;},
 openSync:p=>{const fd=next++;fds.set(fd,path.resolve(p));files.set(path.resolve(p),'');return fd;},closeSync(){},
 execFileSync:(name,argv)=>name==='git'?(argv[0]==='rev-parse'?'a'.repeat(40):''):JSON.stringify({files:[],source_identity_sha256:(fault==='source-changed'&&invocations++?'d':'b').repeat(64)}),
 spawnSync:(name,argv,options)=>{
  calls.push({name,args:argv,selected_engine:options.env?.P05_ENGINE,selected_case:options.env?.P05_CASE,timeout:options.timeout});
  const log=options.stdio&&fds.get(options.stdio[1]);if(log)files.set(log,argv[0]==='image'?'sha256:'+'c'.repeat(64):'SYNTHETIC PARTIAL LOG');
  if(argv[0]==='container'&&argv[1]==='inspect'){
   if(inspect==='timeout')return {status:null,error:{code:'ETIMEDOUT'}};
   if(inspect==='absent')return {status:1,stderr:'No such container'};
   const name=argv[2],role=name.endsWith('-probe')?'probe':'browser',project=name.slice(0,-role.length-1);
   return {status:0,stdout:JSON.stringify([{Name:'/'+name,Config:{Labels:{'venus.p05.project':project,'venus.p05.role':inspect==='foreign-role'?'foreign':role}}}])};
  }
  if(argv[0]==='container'&&argv[1]==='rm'&&fault==='remove-timeout')return {status:null,error:{code:'ETIMEDOUT'}};
  if(argv.includes('run')&&!argv.includes('--network'))files.set(path.join(cwd,'.artifacts/p05/venus-p05-020202020202/browser-report.json'),JSON.stringify(report));
  return fault==='run-timeout'&&argv[0]==='run'?{status:null,error:{code:'ETIMEDOUT'}}:{status:0};
 }};
 vm.runInNewContext(wrapper.replace(/^import .*;\r?\n/gm,''),context,{timeout:3000});
 const r=JSON.parse(files.get(path.join(cwd,'.artifacts/p05/venus-p05-020202020202/runner.json')));
 controls.push({label,receipt:r,commands:calls,exit_code:fakeProcess.exitCode});return {r,calls,exit:fakeProcess.exitCode};
}
let c=execute('Inherited selectors explicitly reset to all/full',{env:{P05_ENGINE:'firefox',P05_CASE:'P05-18-EXPLICIT'}});assert.equal(c.r.status,'PASS');assert.equal(c.r.full_browser_matrix,true);assert.equal(c.calls.find(x=>x.args.includes('run')).selected_engine,'all');assert.equal(c.calls.find(x=>x.args.includes('run')).selected_case,'');
c=execute('Prior narrowed inner receipt now rejected',{report:baseline});assert.equal(c.r.status,'FAIL');assert.match(c.r.error,/selection differs/);
c=execute('Explicit targeted actual-shaped receipt accepted honestly',{args:['--engine=firefox','--case=P05-03-05-09-10-LOCALIZED-GAME'],report:baseline});assert.equal(c.r.status,'PASS');assert.equal(c.r.full_browser_matrix,false);
c=execute('Full receipt rejected for targeted request',{args:['--engine=firefox','--case=P05-18-EXPLICIT']});assert.equal(c.r.status,'FAIL');
for(const [label,mutate] of [
 ['Missing layout',r=>r.matrix=[]],['Application pageerror',r=>r.page_errors=[{message:'INDEPENDENT SYNTHETIC ERROR'}]],['Error overflow',r=>r.page_errors_overflow=true],['Display cleanup failed',r=>r.display_cleanup='failed'],['Duplicate engine',r=>r.versions[2]=r.versions[0]],['Missing case',r=>r.records.pop()],['Wrong baseline viewport',r=>r.matrix[0].actual_baseline_viewport.width=200],['Native shared process',r=>r.native_zoom[0].separate_browser_process=false],['Native reset failure',r=>r.native_zoom[0].reset_verified=false],['Native measured DPR absent',r=>r.native_zoom[0].after.dpr=null]
]){const r=receipt();mutate(r);c=execute(label,{report:r});assert.equal(c.r.status,'FAIL',label);assert.equal(c.exit,1,label);}
for(const [label,config,cleanup,removals] of [
 ['Probe timeout owned removed',{fault:'run-timeout',inspect:'owned'},'completed',1],
 ['Probe timeout inspect unconfirmed',{fault:'run-timeout',inspect:'timeout'},'failed',0],
 ['Probe timeout foreign role untouched',{fault:'run-timeout',inspect:'foreign-role'},'failed',0],
 ['Probe owned removal timeout',{fault:'remove-timeout',inspect:'owned'},'failed',1],
 ['Successful probe already absent',{inspect:'absent'},'completed',0],
 ['Successful probe residual owned container removed',{inspect:'owned'},'completed',1]
]){
 c=execute(label,{args:['--probe'],...config});assert.equal(c.r.cleanup,cleanup,label);const run=c.calls.find(x=>x.args[0]==='run'),name=run.args[run.args.indexOf('--name')+1];assert.equal(name,'venus-p05-020202020202-probe');const rm=c.calls.filter(x=>x.args[0]==='container'&&x.args[1]==='rm');assert.equal(rm.length,removals,label);for(const row of rm)assert.equal(row.args.at(-1),name);if(config.fault||cleanup==='failed')assert.equal(c.r.status,'FAIL',label);else assert.equal(c.r.status,'PASS',label);
}
c=execute('Source identity changed fails',{fault:'source-changed'});assert.equal(c.r.status,'FAIL');assert.equal(c.r.source_unchanged,false);
// Execute exact producer finally block to cover late errors after cleanup, not just validator.
const finalBlock=browser.slice(browser.lastIndexOf('finally{try{if(service)'),browser.lastIndexOf('finally{try{if(service)')+browser.slice(browser.lastIndexOf('finally{try{if(service)')).length).replace(/^finally/,'');
for(const overflow of [false,true]){
 const r={status:'PASS',records:[],matrix:[],native_zoom:[],page_errors:overflow?[]:[{message:'INDEPENDENT ERROR'}],page_errors_overflow:overflow};const p={exitCode:0};
 await vm.runInNewContext('(async()=>'+finalBlock+')()',{report:r,service:{close:async()=>{}},xserver:{close:async()=>{}},process:p,assertPageErrors,writeFileSync(){},pathJoin:path.join,output:'unused',console:{log(){}},JSON});
 assert.equal(r.status,'FAIL');assert.equal(p.exitCode,1);controls.push({label:overflow?'Exact producer finalizer rejects late overflow':'Exact producer finalizer rejects late app error',status:r.status,exit_code:p.exitCode});
}
const result={schema_version:1,isolated_control_only:true,no_docker_executed:true,receipt_kind:'SYNTHETIC_WRAPPER_CONTROL_NOT_DOCKER_PROOF',source:{wrapper_sha256:createHash('sha256').update(wrapper).digest('hex'),browser_sha256:createHash('sha256').update(browser).digest('hex'),contract_sha256:createHash('sha256').update(fs.readFileSync('tests/p05/report-contract.mjs')).digest('hex')},controls};fs.writeFileSync('.artifacts/p05-browser-review/round02-independent-controls.json',JSON.stringify(result,null,2));console.log(JSON.stringify({controls:controls.length,pass:controls.length,fail:0,source:result.source}));
