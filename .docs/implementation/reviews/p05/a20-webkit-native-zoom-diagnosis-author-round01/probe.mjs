/** ONE constantHTML native zoom diagnosis; scalar output only, no APP. */
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {webkit} from 'playwright';
import {display,launch,windowFor,xdo} from '/app/tests/p05-v2-layout-producer/x11.mjs';
import {absoluteBudget,bounded,assertNativeZoom,safeFailure} from '/app/tests/p05-v2-layout-producer/probe-policy.mjs';
const report={scope:'ONE_CONSTANT_NATIVE_ZOOM_DIAGNOSTIC_NOT_APP_OR_UI_GATE',status:'FAIL',sequences:[]},started=performance.now();
const save=()=>writeFileSync('/out/report.json',JSON.stringify(report,null,2)+'\n');
let x,owned,context,page,id;
const guard=setTimeout(()=>{report.status='DIAGNOSTIC_DEADLINE';save();process.exit(1);},55000);
async function snapshot(budget){
 const m=await bounded(budget,'native-measure',()=>page.evaluate(()=>({inner_width:window.innerWidth,dpr:window.devicePixelRatio,css_zoom:getComputedStyle(document.documentElement).zoom,scroll_width:document.documentElement.scrollWidth})));
 const g=Object.fromEntries(xdo(x.name,'getwindowgeometry','--shell',id).split('\n').map(v=>v.split('=')));
 return {...m,physical_width:Number(g.WIDTH),physical_height:Number(g.HEIGHT)};
}
async function reset(budget){
 xdo(x.name,'windowfocus','--sync',id);xdo(x.name,'key','--clearmodifiers','ctrl+0');
 for(let n=0;n<20;n++){budget.check();const m=await snapshot(budget);if(m.dpr===1)return m;await delay(25);}
 throw Error('NATIVE_RESET_FAILED');
}
async function sequence(key){
 const budget=absoluteBudget(20000),before=await snapshot(budget),row={key,before,samples:[],assertion:null};report.sequences.push(row);save();assert.equal(before.dpr,1);
 let after=before,steps=0;
 while(after.dpr/before.dpr<1.99&&steps<14){budget.check();xdo(x.name,'key','--clearmodifiers',key);await delay(60);after=await snapshot(budget);steps++;row.samples.push({step:steps,...after});save();}
 const result={before_width:before.inner_width,after_width:after.inner_width,before_dpr:before.dpr,after_dpr:after.dpr,scroll_width:after.scroll_width,css_zoom:after.css_zoom,steps};
 try{assertNativeZoom(result);row.assertion='ORIGINAL_NATIVE_ASSERT_PASS';}catch(error){row.assertion=safeFailure(error);}
 row.elapsed_ms=budget.elapsed();save();
}
try{
 x=await display();owned=await launch(webkit,x);report.version=owned.browser.version();context=await owned.browser.newContext({viewport:null});page=await context.newPage();
 await page.setContent('<!doctype html><html><body><h1>Constant native zoom diagnostic</h1><p>Fixed text; no application or private data.</p></body></html>');
 id=await windowFor(page,x,absoluteBudget(10000));xdo(x.name,'windowsize','--sync',id,'640','1000');xdo(x.name,'windowmove',id,'0','0');
 report.initial_reset=await reset(absoluteBudget(5000));await sequence('ctrl+equal');report.between_reset=await reset(absoluteBudget(5000));await sequence('ctrl+plus');report.final_reset=await reset(absoluteBudget(5000));report.status='DIAGNOSTIC_COMPLETE_NOT_GATE';
}catch(error){report.error=safeFailure(error);}
finally{
 try{if(context)await context.close();if(owned)await owned.close();if(x)await x.close();report.cleanup='COMPLETE';}catch(error){report.cleanup='FAIL';report.cleanup_error=safeFailure(error);}
 clearTimeout(guard);report.elapsed_ms=performance.now()-started;save();console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,elapsed_ms:report.elapsed_ms}));process.exitCode=report.status==='DIAGNOSTIC_COMPLETE_NOT_GATE'&&report.cleanup==='COMPLETE'?0:1;
}
