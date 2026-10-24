/** Child-only process boundary stub for actual tools/p05-browser.mjs negative controls. No Docker executes. */
import child from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const control=JSON.parse(readFileSync(process.env.P05_REPORT_CONTROL,'utf8')),trace=[];
function record(args,env){trace.push({args,selection:{engine:env?.P05_ENGINE,selected_case:env?.P05_CASE}});writeFileSync(control.trace,JSON.stringify({isolated_control_only:true,no_docker_executed:true,calls:trace},null,2));}
child.execFileSync=(binary,args)=>{if(binary==='git')return args[0]==='rev-parse'?'b'.repeat(40):' M control-fixture';return JSON.stringify({files:[],source_identity_sha256:'c'.repeat(64)});};
child.spawnSync=(binary,args,options={})=>{
  if(binary!=='docker')throw new Error('Unexpected control subprocess');record(args,options.env);
  const project=args.includes('--project-name')?args[args.indexOf('--project-name')+1]:null;
  let stdout='CONTROL_ONLY\n';
  if(args[0]==='image')stdout='sha256:'+'1'.repeat(64)+'\n';
  if(args[0]==='container'&&args[1]==='inspect'){
    if(control.probeTimeout){
      if(control.inspectUnconfirmed)return {status:1,stderr:'daemon unavailable',stdout:''};
      const name=args[2],owner=name.replace(/-probe$/,'');return {status:0,stdout:JSON.stringify([{Name:'/'+name,Config:{Labels:{'venus.p05.project':control.wrongOwner?'foreign':owner,'venus.p05.role':'probe'}}}]),stderr:''};
    }
    return {status:1,stderr:'Error: No such container: '+args[2],stdout:''};
  }
  if(args[0]==='container'&&args[1]==='rm'&&control.removeFailed)return {status:1};
  if(args[0]==='run'&&control.probeTimeout)return {status:null,error:{code:'ETIMEDOUT'}};
  if(project&&args.includes('run')){
    if(control.report!==undefined)writeFileSync(join(options.env.VENUS_P05_ARTIFACT_DIRECTORY,'browser-report.json'),JSON.stringify(control.report));
    if(control.selfActionsReport!==undefined)writeFileSync(join(options.env.VENUS_P05_ARTIFACT_DIRECTORY,'self-actions-report.json'),JSON.stringify(control.selfActionsReport));
    if(control.suiteExit)return {status:control.suiteExit,stdout:'CONTROL FAILED TEST PROCESS',stderr:''};
  }
  if(Array.isArray(options.stdio)&&typeof options.stdio[1]==='number')writeFileSync(options.stdio[1],stdout);
  return {status:0,stdout,stderr:''};
};
syncBuiltinESMExports();
