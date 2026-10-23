import {firefox,webkit} from 'playwright';
import {display,xdo} from '/app/tests/p05/display.mjs';
import {windowInventory} from '/app/tests/p05/window-inventory.mjs';
import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
const report={scope:'OWNED_EMPTY_DATA_DOCUMENT_FF_WEBKIT_WINDOW_CALIBRATION_ONLY',status:'FAIL',engine_bound_ms:20000,engines:[],cleanup:'NOT_RUN'};
let xserver,server,browser;
function escaped(value){return [...value].map(c=>c.codePointAt(0)>126?'\\u{'+c.codePointAt(0).toString(16)+'}':c).join('');}
function template(value,nonce){
 if(typeof value!=='string'||[...value].length>nonce.length+80||/[\p{Cc}\p{Cf}]/u.test(value))return {kind:'UNSAFE_OR_OVERSIZE_NOT_RECORDED'};
 const at=value.indexOf(nonce);if(at>=0&&value.indexOf(nonce,at+1)<0){const before=value.slice(0,at),after=value.slice(at+nonce.length);if([...before+after].length<=80)return {kind:'OWN_NONCE_TEMPLATE',prefix_escaped:escaped(before),suffix_escaped:escaped(after),normalized_template:escaped(before)+'VENUS_NONCE'+escaped(after)};}
 // This branch is reachable only from an explicit ownedbrowserPID query, never
 // a title-wide/global inventory. The page is a fresh controlled empty document.
 return [...value].length<=80?{kind:'OWN_PID_BLANK_VENDOR_TITLE_NO_NONCE',vendor_title_escaped:escaped(value)}:{kind:'UNKNOWN_NOT_RECORDED'};
}
try{
 xserver=await display();
 for(const [engineName,engine]of Object.entries({firefox,webkit})){
  const start=performance.now(),deadline=start+20000,remaining=()=>Math.max(1,deadline-performance.now());
  const row={engine:engineName,status:'UNRESOLVED',query_counts:[],observations:[],document_kind:'CONTROLLED_EMPTY_DATA_DOCUMENT',page_title_is_own_nonce:false};report.engines.push(row);
  server=await engine.launchServer({host:'127.0.0.1',headless:false,timeout:Math.min(15000,remaining()),env:{...process.env,DISPLAY:xserver.name}});
  browser=await engine.connect(server.wsEndpoint(),{timeout:Math.min(15000,remaining())});const page=await browser.newPage();
  await page.goto('data:text/html,<html><head><title>Venus calibration</title></head><body></body></html>',{timeout:remaining()});
  const nonce='Venus layout '+randomUUID();await page.evaluate(title=>{document.title=title;},nonce);row.page_title_is_own_nonce=(await page.title())===nonce;
  const pid=server.process().pid;
  while(performance.now()<deadline){
   const exact=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name','^'+nonce+'$'));
   const ownNonce=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name','^'+nonce));
   const ownPID=await windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--pid',String(pid)));
   if(row.query_counts.length<8)row.query_counts.push({elapsed_ms:Math.round(performance.now()-start),exact_count:exact.length,nonce_prefix_count:ownNonce.length,own_browser_PID_count:ownPID.length});
   if(ownNonce.length>1||ownPID.length>1){row.status='AMBIGUOUS_FAIL';break;}
   const ids=[...new Set([...ownNonce,...ownPID])];if(ids.length===1){
    const id=ids[0],value=xdo(xserver.name,'getwindowname',id);let pidMatch=null;try{pidMatch=Number(xdo(xserver.name,'getwindowpid',id))===pid;}catch{/* No PID attribute is explicitly unresolved, not assumed. */}
    const projected=template(value,nonce);const observed={...projected,own_browser_PID_match:pidMatch,selected_by_nonce:ownNonce.includes(id),selected_by_own_PID:ownPID.includes(id)};
    if(row.observations.length<8&&JSON.stringify(row.observations.at(-1))!==JSON.stringify(observed))row.observations.push(observed);
    if(projected.kind==='OWN_NONCE_TEMPLATE'&&row.page_title_is_own_nonce&&pidMatch===true){row.status='MEASURED_OWN_NONCE_TEMPLATE';break;}
   }
   await delay(Math.min(75,Math.max(0,deadline-performance.now())));
  }
  row.elapsed_ms=Math.round(performance.now()-start);await browser.close();browser=null;await server.close();server=null;
 }
 report.status=report.engines.every(r=>r.status==='MEASURED_OWN_NONCE_TEMPLATE')?'PASS_CALIBRATION_ONLY':'INCOMPLETE_CALIBRATION_NO_METHOD_PASS';
}catch(error){report.failure_kind=error?.name==='TimeoutError'?'TimeoutError':'Error';}
finally{
 const failures=[];for(const [name,operation]of [['browser',()=>browser?.close()],['server',()=>server?.close()],['display',()=>xserver?.close()]])try{await operation();}catch{failures.push(name);}
 report.cleanup=failures.length?'FAIL':'PASS';report.cleanup_failed=failures;if(failures.length)report.status='FAIL';
}
console.log(JSON.stringify(report,null,2));process.exitCode=report.status==='PASS_CALIBRATION_ONLY'&&report.cleanup==='PASS'?0:1;
