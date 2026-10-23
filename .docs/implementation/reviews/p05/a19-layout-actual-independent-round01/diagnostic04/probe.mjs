/** One bounded diagnosis of the failed WebKit foreground step; no application or gate execution. */
import {writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {webkit} from 'playwright';
import {display,launch,windowTitlePattern,ownWindowTitle} from '/app/tests/p05-v2-layout-producer/x11.mjs';
import {xdo} from '/app/tests/p05/display.mjs';
const report={scope:'ONE_WEBKIT_FOREGROUND_DIAGNOSIS_NOT_APP_OR_LAYOUT_ACCEPTANCE',steps:[],status:'FAIL'},start=performance.now();
let x,owned;
const save=()=>writeFileSync('/out/report.json',JSON.stringify(report,null,2)+'\n');
const step=async(name,fn,project=value=>value)=>{const at=performance.now();const result=await fn();report.steps.push({name,elapsed_ms:performance.now()-at,result:project(result)});save();return result;};
const timer=setTimeout(()=>{report.status='DIAGNOSTIC_DEADLINE';save();process.exit(1);},55000);
try{
 x=await step('display',display,()=>null);owned=await step('launch-existing-helper',()=>launch(webkit,x),()=>null);
 report.version=owned.browser.version();
 const context=await owned.browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
 await step('constant-content',()=>page.setContent('<title>Venus diagnostic</title><main>Window diagnostic</main>'));
 await step('resize-like-failed-cell',()=>page.setViewportSize({width:320,height:568}));
 await step('bringToFront',()=>page.bringToFront());
 const title='Venus layout 00000000-0000-4000-8000-000000000001';
 await step('set-title',()=>page.evaluate(t=>{document.title=t;return document.title;},title));
 const pattern=windowTitlePattern(title,'webkit');report.pattern=pattern;
 for(let n=0;n<1;n++){
  await delay(150);
  const ids=xdo(x.name,'search','--onlyvisible','--name','.').split(/\s+/).filter(Boolean);
  await step('visible-owned-display-windows-'+n,()=>ids.map(id=>{const name=xdo(x.name,'getwindowname',id);return{id,name,expected_own_title:ownWindowTitle(title,'webkit',name)};}));
  let found;try{found=xdo(x.name,'search','--onlyvisible','--name',pattern);}catch(error){found={exit:error.status};}
  await step('exact-original-pattern-'+n,()=>found);
  const exactIds=ids.filter(id=>xdo(x.name,'getwindowname',id).includes(title));
  await step('read-back-full-nonce-candidates',()=>({full_nonce:title,ids:exactIds}));assert.equal(exactIds.length,1);
  const id=exactIds[0];assert(ownWindowTitle(title,'webkit',xdo(x.name,'getwindowname',id)));
  await step('original-full-UTF8-title-and-physical-focus',()=>{xdo(x.name,'windowraise',id);xdo(x.name,'windowfocus','--sync',id);const focused=xdo(x.name,'getwindowfocus');assert.equal(focused,id);return{focused,full_title_original_assertion:true};});
  try{await step('owned-X11-title-properties',()=>execFileSync('xprop',['-display',x.name,'-id',id,'WM_NAME','_NET_WM_NAME'],{encoding:'utf8',timeout:3000}));}catch(error){report.xprop_error=error.code??error.name;}
  report.locale={LANG:process.env.LANG??null,LC_ALL:process.env.LC_ALL??null,LC_CTYPE:process.env.LC_CTYPE??null};
 }
 report.status='DIAGNOSIS_COMPLETE_NOT_GATE_PASS';
}catch(error){report.error={name:error.name,code:error.code??null};}
finally{
 try{if(owned)await owned.close();if(x)await x.close();report.cleanup='COMPLETE';}catch(error){report.cleanup='FAIL';report.cleanup_error=error.name;}
 clearTimeout(timer);report.elapsed_ms=performance.now()-start;save();console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,elapsed_ms:report.elapsed_ms}));
}
