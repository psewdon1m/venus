/** Static-page diagnosis only; no application, API, DB or gate execution. */
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {webkit} from 'playwright';
import {display,launch,windowFor} from '/app/tests/p05-v2-layout-producer/x11.mjs';
import {xdo} from '/app/tests/p05/display.mjs';
import {absoluteBudget} from '/app/tests/p05-v2-layout-producer/probe-policy.mjs';
const report={scope:'STATIC_WEBKIT_TEXT_SCROLL_DIAGNOSIS_NOT_APP_OR_GATE_PASS',status:'FAIL',steps:[]},start=performance.now();
const save=()=>writeFileSync('/out/report.json',JSON.stringify(report,null,2)+'\n');
const step=async(name,fn)=>{report.pending=name;save();const at=performance.now();const result=await fn();report.steps.push({name,elapsed_ms:performance.now()-at,result});delete report.pending;save();return result;};
const snapshot=page=>page.evaluate(()=>({active_tag:document.activeElement?.tagName,active_id:document.activeElement?.id,scroll_top:document.scrollingElement.scrollTop,scroll_height:document.scrollingElement.scrollHeight,client_height:document.scrollingElement.clientHeight,last_bottom:document.getElementById('last').getBoundingClientRect().bottom,viewport:window.innerHeight}));
let x,owned;
const timer=setTimeout(()=>{report.status='DIAGNOSTIC_DEADLINE';save();process.exit(1);},55000);
try{
 x=await display();owned=await launch(webkit,x);report.version=owned.browser.version();
 for(const focusHeading of [false,true]){
  const label=focusHeading?'explicit-owned-heading-focus':'original-nonfocusable-heading-click';
  const context=await owned.browser.newContext({viewport:{width:320,height:568}}),page=await context.newPage();
  await page.setContent('<main><h1 id="heading">Diagnostic heading</h1><div style="height:1200px"></div><input id="field" value="constant" style="height:52px"><section data-venus-owner-text-probe><p id="last" style="height:1500px">Constant diagnostic text</p></section></main>');
  await page.locator('#field').focus();await windowFor(page,x,absoluteBudget(10000));
  await page.locator('h1').click();
  if(focusHeading)await page.locator('h1').evaluate(el=>{el.tabIndex=-1;el.focus({preventScroll:true});});
  await step(label+':before',()=>snapshot(page));
  await step(label+':protocol-Control-End',()=>page.keyboard.press('Control+End'));
  await delay(150);await step(label+':after-protocol',()=>snapshot(page));
  await step(label+':physical-Ctrl-End',()=>{xdo(x.name,'key','--clearmodifiers','ctrl+End');});
  await delay(150);await step(label+':after-physical',()=>snapshot(page));
  await context.close();
 }
 report.status='DIAGNOSIS_COMPLETE_NOT_GATE_PASS';
}catch(error){report.error={name:error.name,code:error.code??null};}
finally{
 try{if(owned)await owned.close();if(x)await x.close();report.cleanup='COMPLETE';}catch(error){report.cleanup='FAIL';report.cleanup_error=error.name;}
 clearTimeout(timer);report.elapsed_ms=performance.now()-start;save();console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,elapsed_ms:report.elapsed_ms}));
}
