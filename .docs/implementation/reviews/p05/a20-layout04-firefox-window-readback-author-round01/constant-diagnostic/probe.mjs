/** One constantHTML foreground diagnosis; no APP/API/DB/zoom or gate credit. */
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {randomUUID} from 'node:crypto';
import {firefox} from 'playwright';
import {display,launch,xdo,windowTitlePattern,ownWindowTitle} from '/app/tests/p05-v2-layout-producer/x11.mjs';
import {windowInventory} from '/app/tests/p05/window-inventory.mjs';
import {absoluteBudget,bounded,safeFailure} from '/app/tests/p05-v2-layout-producer/probe-policy.mjs';
const report={scope:'ONE_CONSTANT_FIREFOX_FOREGROUND_NOT_APP_OR_UI_GATE',status:'FAIL',phases:[]},started=performance.now(),budget=absoluteBudget(12000);
const save=()=>writeFileSync('/out/report.json',JSON.stringify(report,null,2)+'\n');
const guard=setTimeout(()=>{report.status='DIAGNOSTIC_DEADLINE';save();process.exit(1);},15000);
let x,owned,context,page;
async function phase(name,fn){const at=performance.now();report.phase=name;save();const result=await bounded(budget,name,fn);report.phases.push({phase:name,elapsed_ms:performance.now()-at});save();return result;}
try{
 x=await phase('DISPLAY',()=>display());owned=await phase('LAUNCH',()=>launch(firefox,x));report.version=owned.browser.version();context=await phase('CONTEXT',()=>owned.browser.newContext({viewport:{width:320,height:568}}));page=await phase('PAGE',()=>context.newPage());
 await phase('CONSTANT_HTML',()=>page.setContent('<!doctype html><html><body><h1>Constant Firefox foreground diagnosis</h1></body></html>'));
 await phase('BRING_TO_FRONT',()=>page.bringToFront());const title='Venus layout '+randomUUID();await phase('SET_OWN_TITLE',()=>page.evaluate(t=>{document.title=t;},title));
 const original=await phase('ORIGINAL_PATTERN',()=>windowInventory(()=>xdo(x.name,'search','--onlyvisible','--name',windowTitlePattern(title,'firefox'))));report.original_pattern_matches=original.length;
 const visible=await phase('ASCII_VISIBLE_INVENTORY',()=>windowInventory(()=>xdo(x.name,'search','--onlyvisible','--name','.')));report.visible_windows=visible.length;
 const own=await phase('OWN_NONCE_READBACK',()=>visible.filter(id=>{budget.check();return xdo(x.name,'getwindowname',id).includes(title);}));report.full_nonce_matches=own.length;
 if(own.length===1){const name=xdo(x.name,'getwindowname',own[0]);report.exact_original_own_title=ownWindowTitle(title,'firefox',name);report.suffix=name.startsWith(title)?name.slice(title.length):'UNKNOWN_PREFIX';if(report.exact_original_own_title){await phase('EXACT_PHYSICAL_FOCUS',()=>{xdo(x.name,'windowraise',own[0]);xdo(x.name,'windowfocus','--sync',own[0]);report.focus_matches=xdo(x.name,'getwindowfocus')===own[0];});}}
 report.status='DIAGNOSTIC_COMPLETE_NOT_GATE';
}catch(error){report.error=safeFailure(error);}
finally{try{if(context)await context.close();if(owned)await owned.close();if(x)await x.close();report.cleanup='COMPLETE';}catch(error){report.cleanup='FAIL';report.cleanup_error=safeFailure(error);}clearTimeout(guard);report.elapsed_ms=performance.now()-started;save();console.log(JSON.stringify({status:report.status,cleanup:report.cleanup,elapsed_ms:report.elapsed_ms}));process.exitCode=report.status==='DIAGNOSTIC_COMPLETE_NOT_GATE'&&report.cleanup==='COMPLETE'?0:1;}
