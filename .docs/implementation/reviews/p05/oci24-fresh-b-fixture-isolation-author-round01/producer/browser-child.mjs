/** Actual image UI in a single pinned Chromium; no replacement React/DOM bundle. */
/* global document */
import assert from 'node:assert/strict';
import {verifyOwnIPC} from './ipc-policy.mjs';
import {readFileSync,existsSync,statfsSync,openSync,constants,fstatSync,writeSync,closeSync} from 'node:fs';
import {setInterval,clearInterval} from 'node:timers';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {X509Certificate,createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {imageRequire} from './image-modules.mjs';
import {ResourceLease} from './resource-lease.mjs';
import {safeError} from './bound-profile.mjs';
/** OCI21 public diagnostic only: fixed paths, fixed numeric projection, one file. */
export function browserResourceDiagnostic(){
 const number=value=>{if(typeof value==='bigint')return value>=0n&&value<=BigInt(Number.MAX_SAFE_INTEGER)?Number(value):null;if(typeof value==='string'&&/^\d{1,16}\n?$/.test(value)){const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n:null;}return null;};
 const text=path=>{try{const value=readFileSync(path,'utf8');return value.length<=4096?value:null;}catch{return null;}};
 const scalar=path=>number(text(path));
 const event=(path,keys)=>{const value=text(path),result=Object.fromEntries(keys.map(key=>[key,null]));if(value!==null)for(const line of value.split('\n')){const pair=/^([a-z_]+) (\d{1,16})$/.exec(line);if(pair&&Object.hasOwn(result,pair[1]))result[pair[1]]=number(pair[2]);}return result;};
 let total=null,free=null;try{const s=statfsSync('/tmp',{bigint:true});total=number(s.blocks*s.bsize);free=number(s.bavail*s.bsize);}catch{/* explicit null/unknown below */}
 const result={pids_current:scalar('/sys/fs/cgroup/pids.current'),pids_events:event('/sys/fs/cgroup/pids.events',['max']),memory_current:scalar('/sys/fs/cgroup/memory.current'),memory_events:event('/sys/fs/cgroup/memory.events',['oom','oom_kill']),tmp_total_bytes:total,tmp_free_bytes:free};
 return{...result,unknown:Object.values(result).some(value=>value===null||typeof value==='object'&&Object.values(value).some(n=>n===null))};
}
export function createBrowserDiagnostic(lease,gates){
 const name='browser-diagnostic.json',path='/evidence/'+name,steps=new Set(["A1_PAGE_OPEN","A1_PRIVATE_ASSERT","A1_PRIVATE_WAIT","A1_READY_WRITE","A1_STATE_READ","A3_CLOCK_UPDATE","A3_COMMAND_WAIT","A3_PAGE_ERRORS_ASSERT","A3_PRIVATE_HIDDEN","A3_RELEASE","A3_RESUMED_CURRENT","B2_CLOCK_UPDATE","B2_COMMAND_WAIT","B2_FRESH_PAGE_OPEN","B2_GAME_STATE_WAIT","B2_HOLD_DRAIN","B2_HOST_PRE_CLOSE_HOLD","B2_HOST_CONTEXT_CLOSE","B2_HOST_PAGE_OPEN","B2_LEAVE_CLICK","B2_OBSERVER_PAGE_OPEN","B2_PRIVATE_ASSERT","B2_PRIVATE_WAIT","B2_READY_WRITE","B2_RELEASE","B2_RESUMED_CURRENT","B2_RETAINED_HIDDEN","B2_ROOM_DETACHED","B2_STATE_READ","B2_STOP_CLICK","B2_STOP_ENABLED","B2_STOP_WAIT","CHROMIUM_LAUNCH","COMPLETE","NARROW_COMMAND_WAIT","NARROW_HOLD_DRAIN","NARROW_PRIVATE_HIDDEN","NARROW_READY_WRITE"]);
 let fd=null,timer=null,failed=false,sample=0;
 const stop=()=>{if(timer!==null){clearInterval(timer);timer=null;}};
 function persist(phase,step,state,error){
  try{
   assert(['A1','B2','A3'].includes(phase));assert(steps.has(step));assert(['AWAITING','CAUGHT_FAILURE'].includes(state));assert(sample<1000,'BROWSER_DIAGNOSTIC_SAMPLE_BOUND');
   const json=Buffer.from(JSON.stringify({status:'DIAGNOSTIC_NOT_ACCEPTANCE',phase,diagnostic_step:step,state,sample:++sample,resources:browserResourceDiagnostic(),API_quiescence:gates.slice(0,4).map(g=>g.diagnostic()),gate_overflow:gates.length>4,...(error?{error:safeError(error,phase)}:{})})+'\n');
   assert(json.length<=4096,'BROWSER_DIAGNOSTIC_SIZE_BOUND');const data=Buffer.alloc(4096,32);json.copy(data);lease.assert(data.length);
   if(fd===null){lease.write('/evidence',name,data);fd=openSync(path,constants.O_WRONLY|constants.O_NOFOLLOW);assert(fstatSync(fd).isFile());}
   else{const s=statfsSync('/evidence',{bigint:true});assert(s.bavail*s.bsize>=BigInt(data.length+4096),'QRB_OUTPUT_QUOTA');assert.equal(writeSync(fd,data,0,data.length,0),data.length);}
  }catch{failed=true;stop();throw Error('BROWSER_DIAGNOSTIC_WRITE_FAILED');}
 }
 return{
  async awaiting(phase,step,operation){
   assert(timer===null,'BROWSER_DIAGNOSTIC_OVERLAP');persist(phase,step,'AWAITING');
   timer=setInterval(()=>{try{persist(phase,step,'AWAITING');}catch{/* failure latched, never converted into zero/success */}},1000);timer.unref();
   try{const result=await operation();assert(!failed,'BROWSER_DIAGNOSTIC_WRITE_FAILED');return result;}finally{stop();}
  },
  caught(error,phase,step){stop();persist(phase,step,'CAUGHT_FAILURE',error);},
  close(){stop();if(fd!==null){try{closeSync(fd);}catch{failed=true;}fd=null;}return !failed;},
 };
}

/** Browser-native transport hold only; no clock/DOM/cache/database mutation. */
export async function installApiQuiescence(context,room,lease){
 const origin='https://localhost:8443',current=origin+'/api/v2/rooms/'+room+'/game/current';
 const own=(url,ws=false)=>{try{const u=new URL(String(url));return u.origin===(ws?'wss://localhost:8443':origin)&&u.pathname.startsWith('/api/');}catch{return false;}};
 let held=false,disposing=false,failure=null,blockedHTTP=0,blockedWS=0,completedCurrent=0;
 const active=new Set(),forwarded=new WeakSet(),successful=new WeakSet();
 const latch=()=>{failure??=Error('BROWSER_API_QUIESCENCE_FAILED');};
 const health=()=>{lease.assert();if(failure)throw failure;assert(active.size<=256,'BROWSER_API_INFLIGHT_BOUND');};
 context.on('request',request=>{if(own(request.url())){if(active.size>=256)latch();else active.add(request);}});
 context.on('response',response=>{const request=response.request();if(!held&&forwarded.has(request)&&request.method()==='GET'&&request.url()===current&&response.status()===200)successful.add(request);});
 context.on('requestfinished',request=>{active.delete(request);if(!held&&forwarded.has(request)&&successful.has(request))completedCurrent++;});
 context.on('requestfailed',request=>{active.delete(request);});
 await context.route(url=>own(url),async route=>{
  try{if(held||failure){blockedHTTP++;await route.abort('blockedbyclient');}else{forwarded.add(route.request());await route.continue();}}
  catch{if(!disposing)latch();}
 });
 await context.routeWebSocket(url=>own(url,true),async route=>{
  try{if(held||failure){blockedWS++;await route.close({code:1001,reason:'Fixture API hold'});}else route.connectToServer();}
  catch{if(!disposing)latch();}
 });
 const until=async predicate=>{const deadline=performance.now()+120000;while(!predicate()){health();assert(performance.now()<deadline,'BROWSER_API_QUIESCENCE_DEADLINE');await new Promise(r=>setTimeout(r,25));}health();};
 return {
  async hold(){held=true;await until(()=>active.size===0);return this.snapshot();},
  release(){health();assert(held,'BROWSER_API_RELEASE_WITHOUT_HOLD');held=false;return completedCurrent;},
  async resumedCurrent(cursor){assert(!held,'BROWSER_API_STILL_HELD');assert(Number.isSafeInteger(cursor)&&cursor>=0);await until(()=>completedCurrent>cursor);return this.snapshot();},
  snapshot(){health();return{held,inflight_HTTP:active.size,blocked_HTTP:blockedHTTP,blocked_WS:blockedWS,completed_current_GET200:completedCurrent};},
  diagnostic(){const values=[active.size,blockedHTTP,blockedWS,completedCurrent],bounded=value=>Number.isSafeInteger(value)&&value>=0&&value<=1000000?value:null;return{held,disposing,failure_latched:failure!==null,inflight_HTTP:bounded(active.size),blocked_HTTP:bounded(blockedHTTP),blocked_WS:bounded(blockedWS),completed_current_GET200:bounded(completedCurrent),counter_overflow:values.some(value=>bounded(value)===null)};},
  dispose(){held=true;disposing=true;}
 };
}
/** A real zero-inflight hold and confirmed native close precede retirement. */
export async function closeHeldHostGate(gate,close,observe,retired,proof={}){
 assert(!retired.has(gate),'BROWSER_HOST_GATE_ALREADY_RETIRED');
 const preClose=await observe('B2_HOST_PRE_CLOSE_HOLD',()=>gate.hold());
 assert.equal(preClose.held,true,'BROWSER_HOST_PRE_CLOSE_NOT_HELD');assert.equal(preClose.inflight_HTTP,0,'BROWSER_HOST_PRE_CLOSE_NOT_DRAINED');
 proof.pre_close_quiescence=preClose;proof.context_closed=false;
 gate.dispose();await observe('B2_HOST_CONTEXT_CLOSE',close);
 proof.context_closed=true;retired.add(gate);return proof;
}
export async function browser(config){verifyOwnIPC('browser');const require=imageRequire(),{chromium}=require('playwright'),lease=new ResourceLease({...config,privateRoot:'/tmp'});await lease.initial();const spki=createHash('sha256').update(new X509Certificate(readFileSync(config.caFile)).publicKey.export({type:'spki',format:'der'})).digest('base64');let runtime,diagnosticStep='CHROMIUM_LAUNCH',diagnosticPhase='A1';const contexts=[],gates=[],retiredGates=new Set(),report={status:'FAIL',engine:'chromium',page_errors:0,clock_scope:'EXPLICIT_FIXED_DATE_FIXTURE_NOT_NATURAL_TTL',TLS_scope:'CHROMIUM_EXACT_PUBLIC_FIXTURE_SPKI_PIN_PLUS_INDEPENDENT_NODE_CA_VERIFICATION',prior_known_bug:'b244 timing P2 and unbounded WS poll queue / heartbeat-starvation P2; fixed fixtureclock compatibility does not close either natural-time behavior',raw_private_evidence_exported:false};
 const write=(name,data)=>lease.write('/evidence',name,JSON.stringify(data,null,2)+'\n'),wait=async name=>{const limit=performance.now()+120000,path='/private/browser-command-'+name+'.json';while(performance.now()<limit){lease.assert();if(existsSync(path)){const v=JSON.parse(readFileSync(path));assert.equal(v.owner,config.owner);assert.equal(v.command,name);return;}await new Promise(r=>setTimeout(r,50));}throw Error('BROWSER_PHASE_DEADLINE');};
 const read=name=>JSON.parse(readFileSync('/private/'+name+'.json')),diagnostic=createBrowserDiagnostic(lease,gates);
 async function page(f,a,clock){const context=await runtime.newContext({viewport:{width:1280,height:800},ignoreHTTPSErrors:false,serviceWorkers:'block'});contexts.push(context);const gate=await installApiQuiescence(context,f.room,lease);gates.push(gate);await context.addCookies([{name:'venus_room_session',value:a.credential,url:'https://localhost:8443',httpOnly:true,secure:true,sameSite:'Strict'}]);const page=await context.newPage();page.setDefaultTimeout(12000);await page.clock.setFixedTime(new Date(clock));page.on('pageerror',()=>{report.page_errors++;});await page.goto('https://localhost:8443/#room='+f.room);await page.getByTestId('room-shell').waitFor();return page;}
 async function hidden(page){await page.waitForFunction(()=>document.querySelectorAll('[data-testid="private-prompt"],[data-testid="pair-chat"],[data-testid="advice-text"]').length===0,undefined,{timeout:12000});lease.assert();}
 try{diagnosticStep='CHROMIUM_LAUNCH';runtime=await chromium.launch({headless:true,args:['--ignore-certificate-errors-spki-list='+spki,'--disable-dev-shm-usage']});report.version=runtime.version();diagnosticStep='A1_STATE_READ';const aState=read('state-A1-seed'),a=aState.A,who=a.members.find(x=>x.id===a.excludedActor);assert(who);diagnosticStep='A1_PAGE_OPEN';const retainedA=await page(a,who,1000000);diagnosticStep='A1_PRIVATE_WAIT';await retainedA.getByTestId('private-prompt').waitFor();diagnosticStep='A1_PRIVATE_ASSERT';assert((await retainedA.getByTestId('private-prompt').innerText()).includes('SYNTHETIC'));diagnosticStep='A1_READY_WRITE';write('browser-A1-ready.json',{status:'RETAINED_A_PRIVATE_POSITIVE',real_image_UI:true});
  diagnosticStep='NARROW_COMMAND_WAIT';await wait('NARROWED');diagnosticStep='NARROW_PRIVATE_HIDDEN';await hidden(retainedA);diagnosticStep='NARROW_HOLD_DRAIN';const beforeB2=await Promise.all(gates.map(g=>g.hold()));diagnosticStep='NARROW_READY_WRITE';write('browser-narrowed-ready.json',{status:'NARROWED_PRIVATE_CLEARED',API_quiescence:beforeB2});diagnosticPhase='B2';diagnosticStep='B2_COMMAND_WAIT';await wait('B2');diagnosticStep='B2_CLOCK_UPDATE';await retainedA.clock.setFixedTime(new Date(1001000));diagnosticStep='B2_RELEASE';const retainedCursor=gates[0].release();diagnosticStep='B2_RESUMED_CURRENT';await gates[0].resumedCurrent(retainedCursor);diagnosticStep='B2_RETAINED_HIDDEN';await hidden(retainedA);diagnosticStep='B2_STATE_READ';const b=read('state-B2-final'),e=b.F,eActor=e.members.find(x=>x.id===e.excludedActor),freshB=await (diagnosticStep='B2_FRESH_PAGE_OPEN',page(e,eActor,1001000));diagnosticStep='B2_PRIVATE_WAIT';await freshB.getByTestId('private-prompt').waitFor();diagnosticStep='B2_PRIVATE_ASSERT';assert((await freshB.getByTestId('private-prompt').innerText()).includes('SYNTHETIC'));
  diagnosticStep='B2_HOST_PAGE_OPEN';const host=await page(b.A,b.A.host,1001000);const stop=host.getByTestId('game-stop');diagnosticStep='B2_STOP_WAIT';await stop.waitFor();diagnosticStep='B2_STOP_ENABLED';assert(await stop.isEnabled());diagnosticStep='B2_STOP_CLICK';await stop.click();diagnosticStep='B2_GAME_STATE_WAIT';await host.getByTestId('game-state').waitFor();await closeHeldHostGate(gates[2],()=>host.context().close(),(step,operation)=>{diagnosticStep=step;return diagnostic.awaiting(diagnosticPhase,step,operation);},retiredGates,report.closed_host_gate={gate_index:2});diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>page(b.A,b.A.members[3],1001000));diagnosticStep='B2_LEAVE_CLICK';await observer.getByTestId('leave-room').click();diagnosticStep='B2_ROOM_DETACHED';await observer.getByTestId('room-shell').waitFor({state:'detached'});report.actual_B_UI=true;report.retained_A_cleared=true;report.fresh_B_page=true;report.browser_safe_exit=true;diagnosticStep='B2_HOLD_DRAIN';const beforeA3=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>Promise.all(gates.filter(g=>!retiredGates.has(g)).map(g=>g.hold())));diagnosticStep='B2_READY_WRITE';write('browser-B2-ready.json',{status:'B2_UI_AND_SAFE_EXITS_PASS',E_untouched:true,API_quiescence:beforeA3,closed_host_gate:report.closed_host_gate});
  diagnosticPhase='A3';diagnosticStep='A3_COMMAND_WAIT';await wait('A3');diagnosticStep='A3_CLOCK_UPDATE';await freshB.clock.setFixedTime(new Date(1002000));diagnosticStep='A3_RELEASE';const freshBCursor=gates[1].release();diagnosticStep='A3_RESUMED_CURRENT';await gates[1].resumedCurrent(freshBCursor);diagnosticStep='A3_PRIVATE_HIDDEN';await hidden(freshB);report.old_B_private_cleared_on_A3=true;diagnosticStep='A3_PAGE_ERRORS_ASSERT';assert.equal(report.page_errors,0);diagnosticStep='COMPLETE';report.status='BROWSER_CONTROLS_COMPLETE';
 }catch(error){report.error=safeError(error,diagnosticPhase);report.error_name=report.error.name;report.failed_step=diagnosticStep;report.API_quiescence=gates.slice(0,4).map(g=>g.diagnostic());report.gate_overflow=gates.length>4;report.status='FAIL';try{diagnostic.caught(error,diagnosticPhase,diagnosticStep);}catch{report.diagnostic_write_failed=true;}}
 finally{const diagnosticClean=diagnostic.close();if(!diagnosticClean){report.diagnostic_write_failed=true;report.status='FAIL';}for(const gate of gates)gate.dispose();let clean=true;for(const c of contexts)try{await c.close();}catch{clean=false;}try{await runtime?.close();}catch{clean=false;}report.cleanup=clean?'completed':'failed';if(!clean)report.status='FAIL';try{write('browser-terminal.json',report);}catch{report.status='FAIL';}console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,page_errors:report.page_errors}));}return report;}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const p=process.argv.find(x=>x.startsWith('--browser='));if(p){const r=await browser(JSON.parse(readFileSync(p.slice(10))));process.exitCode=r.status==='BROWSER_CONTROLS_COMPLETE'?0:1;}else console.log(JSON.stringify({status:'NOT_RUN',browser_launches:0}));}
