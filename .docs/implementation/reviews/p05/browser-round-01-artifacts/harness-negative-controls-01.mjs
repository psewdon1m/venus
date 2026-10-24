import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const wrapper=fs.readFileSync('tools/p05-browser.mjs','utf8');
const browser=fs.readFileSync('tests/p05/browser.mjs','utf8');
const results=[];
function execute(label,args,env,timeoutProbe=false){
 const files=new Map(),fds=new Map(),calls=[];let next=1;
 const fakeProcess={argv:['node','tools/p05-browser.mjs',...args],env,exitCode:undefined};
 const cwd=process.cwd(),temp=path.resolve('.artifacts/p05-browser-review/virtual-temp');
 const context={process:fakeProcess,console:{log(){}},Buffer,Error,JSON,
 randomBytes:n=>Buffer.alloc(n,1), tmpdir:()=>temp,resolve:path.resolve,dirname:path.dirname,join:path.join,
 mkdtempSync:p=>p+'fixture',mkdirSync(){},rmSync(){},
 writeFileSync:(p,data)=>files.set(path.resolve(p),String(data)),
 readFileSync:p=>{const value=files.get(path.resolve(p));if(value===undefined)throw Error('Unstubbed read '+p);return value;},
 openSync:p=>{const fd=next++;fds.set(fd,path.resolve(p));files.set(path.resolve(p),'');return fd;},closeSync(){},
 execFileSync:(name,argv)=>name==='git'?(argv[0]==='rev-parse'?'a'.repeat(40):''):JSON.stringify({files:[],source_identity_sha256:'b'.repeat(64)}),
 spawnSync:(name,argv,options)=>{
   calls.push({name,args:argv,selected_engine:options.env?.P05_ENGINE,selected_case:options.env?.P05_CASE});
   const log=options.stdio&&fds.get(options.stdio[1]);
   if(argv[0]==='container')return {status:1,stderr:'No such container'};
   if(log)files.set(log,argv[0]==='image'?'sha256:'+'c'.repeat(64):'SYNTHETIC PARTIAL LOG');
   if(argv.includes('run')&&!argv.includes('--network')){
     files.set(path.join(cwd,'.artifacts/p05/venus-p05-010101010101/browser-report.json'),JSON.stringify({status:'PASS',runtime_cleanup:'completed',selected_engine:options.env.P05_ENGINE??'all',selected_case:options.env.P05_CASE??null,versions:[{engine:'firefox'}],records:[{id:'P05-EXPLICIT-18'}],matrix:[],native_zoom:[]}));
   }
   return timeoutProbe&&argv[0]==='run'?{status:null,error:{code:'ETIMEDOUT'}}:{status:0};
 }};
 vm.runInNewContext(wrapper.replace(/^import .*;\r?\n/gm,''),context,{timeout:3000});
 const receipt=JSON.parse(files.get(path.join(cwd,'.artifacts/p05/venus-p05-010101010101/runner.json')));
 const result={label,receipt,commands:calls,exit_code:fakeProcess.exitCode};results.push(result);return result;
}
const inherited=execute('Inherited scope reaches Compose while receipt claims full matrix',[],{P05_ENGINE:'firefox',P05_CASE:'P05-EXPLICIT-18'});
assert.equal(inherited.receipt.status,'PASS');assert.equal(inherited.receipt.full_browser_matrix,true);assert.equal(inherited.receipt.selected_engine,'all');assert.equal(inherited.commands.find(x=>x.args.includes('run')).selected_engine,'firefox');
const malformed=execute('Partial inner PASS receipt accepted without count/scope validation',[],{});
assert.equal(malformed.receipt.status,'PASS');assert.equal(malformed.receipt.full_browser_matrix,true);
const probe=execute('Probe timeout does not inspect/remove unnamed owned container',['--probe'],{},true);
assert.equal(probe.receipt.status,'FAIL');assert.equal(probe.receipt.cleanup,'completed');assert.equal(probe.commands.some(x=>x.args[0]==='container'),false);assert.equal(probe.commands.find(x=>x.args[0]==='run').args.includes('--name'),false);
const assertion=browser.slice(browser.lastIndexOf('  assert.equal(report.records.length,'),browser.indexOf('\n}catch(error){report.error=error.message;'));
for(const overflow of [false,true]){
 const report={records:Array(10).fill({status:'PASS'}),versions:[{engine:'firefox'}],matrix:Array(72).fill({}),native_zoom:Array(9).fill({}),page_errors:overflow?[]:[{message:'Injected application crash'}],page_errors_overflow:overflow,status:'FAIL'};
 vm.runInNewContext(assertion,{report,selectedCase:null,assert},{timeout:1000});assert.equal(report.status,'PASS');results.push({label:overflow?'Application pageerror overflow accepted':'Application pageerror accepted',result_status:report.status,page_errors:report.page_errors,page_errors_overflow:overflow});
}
const output={method:'Isolated execution of actual wrapper bytes and exact inner final acceptance block. Docker/FS side effects stubbed; not actual Docker evidence.',source:{wrapper_sha256:createHash('sha256').update(wrapper).digest('hex'),browser_sha256:createHash('sha256').update(browser).digest('hex')},controls:results};
fs.writeFileSync('.artifacts/p05-browser-review/harness-negative-controls-01.json',JSON.stringify(output,null,2));console.log(JSON.stringify({controls:results.length,expected_defects_reproduced:true,source:output.source}));
