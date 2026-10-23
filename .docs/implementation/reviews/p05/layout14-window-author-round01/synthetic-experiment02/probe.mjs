import {chromium} from 'playwright';
import {display,xdo} from '/app/tests/p05/display.mjs';
import {windowInventory} from '/app/tests/p05/window-inventory.mjs';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
const report={scope:'OWNED_SYNTHETIC_BLANKPAGE_WINDOW_DIAGNOSIS_ONLY',status:'FAIL',whole_bound_ms:20000,engines:[],cleanup:'NOT_RUN'},deadline=performance.now()+20000;
let xvfb,server,browser;
function budget(){if(performance.now()>=deadline)throw Error('DIAGNOSTIC20S_EXPIRED');}
function suffixKind(value,title){if(!value.startsWith(title))return {kind:'NOT_OWNED_NONCE'};const suffix=value.slice(title.length);return suffix.length<=80&&/^[\x20-\x7e]*$/.test(suffix)?{kind:'OWN_SYNTHETIC_ASCII_SUFFIX',normalized_title:'VENUS_NONCE'+suffix,suffix}:{kind:'NON_ASCII_OR_OVERSIZE_NOT_RECORDED'};}
try{
 xvfb=await display();
 for(const [engineName,engine]of Object.entries({chromium})){
  budget();const row={engine:engineName,observations:[],status:'FAIL'};report.engines.push(row);
  server=await engine.launchServer({host:'127.0.0.1',headless:false,timeout:Math.max(1,Math.min(15000,deadline-performance.now())),env:{...process.env,DISPLAY:xvfb.name}});
  browser=await engine.connect(server.wsEndpoint(),{timeout:Math.max(1,Math.min(15000,deadline-performance.now()))});const page=await browser.newPage();
  const title='Venus layout '+randomUUID();await page.evaluate(t=>{document.title=t;},title);
  const start=performance.now();for(const at of [0,25,100,250,500]){
   const wait=at-(performance.now()-start);if(wait>0)await delay(wait);budget();
   const exact=await windowInventory(()=>xdo(xvfb.name,'search','--onlyvisible','--name','^'+title+'$'));
   const owned=await windowInventory(()=>xdo(xvfb.name,'search','--onlyvisible','--name','^'+title));
   const kinds=owned.map(id=>({...suffixKind(xdo(xvfb.name,'getwindowname',id),title),own_pid_match:Number(xdo(xvfb.name,'getwindowpid',id))===server.process().pid}));
   row.observations.push({target_elapsed_ms:at,exact_count:exact.length,nonce_prefix_count:owned.length,title_kinds:kinds});
  }
  row.status='OBSERVED';await browser.close();browser=null;await server.close();server=null;
 }
 report.status='PASS_DIAGNOSIS_ONLY';
}catch(error){report.failure_kind=error?.name==='TimeoutError'?'TimeoutError':error?.name==='AssertionError'?'AssertionError':'Error';}
finally{
 const failures=[];for(const [name,operation]of [['browser',()=>browser?.close()],['server',()=>server?.close()],['display',()=>xvfb?.close()]])try{await operation();}catch{failures.push(name);}
 report.cleanup=failures.length?'FAIL':'PASS';report.cleanup_components_failed=failures;if(failures.length)report.status='FAIL';
}
console.log(JSON.stringify(report,null,2));process.exitCode=report.status==='PASS_DIAGNOSIS_ONLY'&&report.cleanup==='PASS'?0:1;
