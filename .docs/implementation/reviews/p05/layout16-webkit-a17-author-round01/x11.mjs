/** P1 physical-window mechanics adapted for isolated actual V2 scenes. No P1 game setup/results imported. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {display,xdo} from '../../tests/p05/display.mjs';
import {windowInventory} from '../../tests/p05/window-inventory.mjs';
import {bounded,assertNativeZoom} from './probe-policy.mjs';
/* global window,document,getComputedStyle */
export {display};
export async function launch(engine,xserver){
 const server=await engine.launchServer({host:'127.0.0.1',headless:false,env:{...process.env,DISPLAY:xserver.name}});let browser;
 try{browser=await engine.connect(server.wsEndpoint(),{timeout:15000});}catch(e){await server.close();throw e;}
 return {browser,async close(){let error;try{await browser.close();}catch(e){error=e;}try{await server.close();}catch(e){error??=e;}const child=server.process();if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await Promise.race([exited,delay(5000)]);error??=Error('BROWSER_FORCED_KILL');}if(error)throw error;}};
}
// Only exact vendor suffixes measured on these pinned owned browsers are allowed.
// WebKit's measured Playwright prefix still contains the full exact own nonce.
const chromiumWindowSuffix=' - Google Chrome for Testing';
const firefoxWindowSuffix=' \u2014 Nightly';
const webkitWindowPrefix='\u{1f3ad} Playwright: ';
function vendorWindowPrefix(engine){return engine==='webkit'?webkitWindowPrefix:'';}
function vendorWindowSuffix(engine){return engine==='chromium'?chromiumWindowSuffix:engine==='firefox'?firefoxWindowSuffix:'';}
function checkWindowNonce(title){assert(typeof title==='string'&&/^Venus layout [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(title),'EXACT_V2_WINDOW_REQUIRED');}
export function windowTitlePattern(title,engine){
 checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return '^'+(prefix?'('+prefix+')?':'')+title+(suffix?'('+suffix+')?':'')+'$';
}
export function ownWindowTitle(title,engine,value){
 checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||value===prefix+title+suffix);
}
export async function readyOwnedWindow(query,budget,wait=delay){
 for(;;){
  budget.check();const windows=await query();budget.check();
  if(windows.length){assert.equal(windows.length,1,'EXACT_V2_WINDOW_REQUIRED');return windows;}
  await wait(Math.min(25,budget.remaining()));
 }
}
export async function windowFor(page,xserver,budget){
 const title='Venus layout '+randomUUID();await bounded(budget,'window-title',()=>page.evaluate(t=>{document.title=t;},title));
 const engine=page.context().browser().browserType().name(),pattern=windowTitlePattern(title,engine);
 const windows=await readyOwnedWindow(()=>windowInventory(()=>xdo(xserver.name,'search','--onlyvisible','--name',pattern)),budget);
 assert.equal(windows.length,1,'EXACT_V2_WINDOW_REQUIRED');const id=windows[0];assert(ownWindowTitle(title,engine,xdo(xserver.name,'getwindowname',id)),'EXACT_V2_WINDOW_REQUIRED');xdo(xserver.name,'windowraise',id);xdo(xserver.name,'windowfocus','--sync',id);assert.equal(xdo(xserver.name,'getwindowfocus'),id);
 await bounded(budget,'content-focus',()=>page.bringToFront());assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;
}

export async function native200(page,xserver,budget){
 const id=await windowFor(page,xserver,budget);xdo(xserver.name,'windowsize','--sync',id,'640','1000');xdo(xserver.name,'windowmove',id,'0','0');xdo(xserver.name,'key','--clearmodifiers','ctrl+0');
 const measure=()=>bounded(budget,'native-measure',()=>page.evaluate(()=>({inner_width:window.innerWidth,dpr:window.devicePixelRatio,css_zoom:getComputedStyle(document.documentElement).zoom,scroll_width:document.documentElement.scrollWidth})));
 const before=await measure();assert.equal(before.dpr,1);let after=before,steps=0;
 while(after.dpr/before.dpr<1.99&&steps<14){budget.check();xdo(xserver.name,'key','--clearmodifiers','ctrl+equal');await delay(60);after=await measure();steps++;}
 const result={window_id:id,before_width:before.inner_width,after_width:after.inner_width,before_dpr:before.dpr,after_dpr:after.dpr,scroll_width:after.scroll_width,css_zoom:after.css_zoom,x11_keyboard:true,isolated_browser:true,reset_verified:false,steps};assertNativeZoom(result);return result;
}
export async function resetNative(page,xserver,measurement,budget){
 xdo(xserver.name,'windowfocus','--sync',measurement.window_id);xdo(xserver.name,'key','--clearmodifiers','ctrl+0');
 for(let n=0;n<20;n++){budget.check();if(await page.evaluate(()=>window.devicePixelRatio)===measurement.before_dpr){measurement.reset_verified=true;return;}await delay(25);}
 throw Error('NATIVE_RESET_FAILED');
}
export async function nativeScreenshot(page,xserver,measurement,path,budget){
 // Opaque fixed overlays hide fixture invitation secrets without changing layout or measured geometry.
 assert(!/[?&#]invite=/.test(page.url()),'TOKEN_IN_NATIVE_ADDRESSBAR');
 await bounded(budget,'native-mask',()=>page.evaluate(()=>{const masks=[];for(const e of document.querySelectorAll('[data-testid="room-invite"],[data-testid="join-invite"]')){const r=e.getBoundingClientRect(),mask=document.createElement('div');mask.dataset.venusLayoutSecretMask='1';Object.assign(mask.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',background:'#000',zIndex:'2147483647',pointerEvents:'none'});document.documentElement.append(mask);masks.push(mask);}return masks.length;}));
 try{budget.check();const geometry=Object.fromEntries(xdo(xserver.name,'getwindowgeometry','--shell',measurement.window_id).split('\n').map(v=>v.split('=')));assert(/^\d+$/.test(geometry.WIDTH)&&/^\d+$/.test(geometry.HEIGHT)&&/^-?\d+$/.test(geometry.X)&&/^-?\d+$/.test(geometry.Y));xdo(xserver.name,'windowraise',measurement.window_id);xdo(xserver.name,'windowfocus','--sync',measurement.window_id);execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-n','-f','x11grab','-video_size',`${geometry.WIDTH}x${geometry.HEIGHT}`,'-i',`${xserver.name}+${geometry.X},${geometry.Y}`,'-frames:v','1',path],{timeout:Math.max(1,Math.min(15000,budget.remaining()))});}
 finally{if(!page.isClosed())await page.evaluate(()=>{for(const e of document.querySelectorAll('[data-venus-layout-secret-mask]'))e.remove();});}
}
