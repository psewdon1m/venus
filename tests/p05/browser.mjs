/** Real browser/HTTPS/WS/PostgreSQL/component evidence. All names/content are synthetic fixtures. */
import {chromium,firefox,webkit} from 'playwright';
import {expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join as pathJoin} from 'node:path';
import {URLSearchParams} from 'node:url';
/* global document, matchMedia, innerWidth, innerHeight, outerWidth, devicePixelRatio, getComputedStyle, window */
import {runtime} from './runtime.mjs';
import {display,xdo} from './display.mjs';
import {setTimeout as delay} from 'node:timers/promises';
import {setTimeout,clearTimeout} from 'node:timers';
import {once} from 'node:events';
import {assertPageErrors} from './report-contract.mjs';
import {windowInventory} from './window-inventory.mjs';
const output=process.env.P05_ARTIFACT_DIRECTORY??'/artifacts';mkdirSync(output,{recursive:true});
const require=createRequire(import.meta.url),toolchain={node:process.version,npm:execFileSync('npm',['--version'],{encoding:'utf8'}).trim(),playwright:require('playwright/package.json').version};
const selectedCase=process.env.P05_CASE||null;
if(process.env.P05_ENGINE&&!['all','chromium','firefox','webkit'].includes(process.env.P05_ENGINE))throw new Error('Unknown engine selection');
const report={synthetic_fixture_only:true,production_approval:false,desktop_linux_engines_only:true,toolchain,selected_engine:process.env.P05_ENGINE??'all',selected_case:selectedCase,full_suite:!selectedCase,native_browser_zoom:'NOT_RUN',native_zoom:[],records:[],matrix:[],versions:[],status:'FAIL',deferred:[{spec:'04§8.2',scope:'Music output and real phones',status:'DEFERRED_OWNER'},{spec:'04§8.7',scope:'Cinema capture/music preservation',status:'FUTURE_STAGE_P09'},{spec:'04§8.8',scope:'Real iOS/Android audio unlock',status:'DEFERRED_OWNER'}]};
const sizes=[{width:320,height:568},{width:375,height:667},{width:768,height:768},{width:1024,height:768},{width:1440,height:900},{width:1920,height:1080},{width:667,height:375,label:'landscape'},{width:320,height:568,label:'zoom200',zoom:2}];
let service,activeBrowser,xserver;
const ownedBrowsers=new WeakMap(),pageWindows=new WeakMap();report.steps=[];
report.page_errors=[];report.page_errors_overflow=false;report.keyboard=[];
function capturePageErrors(page,label){page.on('pageerror',error=>{if(report.page_errors.length>=128){report.page_errors_overflow=true;return;}report.page_errors.push({page:label,phase:report.steps.at(-1)?.step??'initial',name:error.name,message:error.message.slice(0,2048),stack:(error.stack??'').slice(0,8192)});});}
async function visibleWindows(...query){return windowInventory(()=>xdo(xserver.name,'search','--onlyvisible',...(query.length?query:['--class','.'])),observation=>{report.window_inventory??=[];report.window_inventory.push(observation);});}
async function step(label,operation,timeout=15000){
  const started=Date.now();console.log(JSON.stringify({step:label,status:'START'}));let timer;
  try{const result=await Promise.race([Promise.resolve().then(operation),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(label+' timed out after '+timeout+'ms')),timeout);})]);report.steps.push({step:label,status:'PASS',elapsed_ms:Date.now()-started});console.log(JSON.stringify({step:label,status:'PASS'}));return result;}
  catch(error){report.steps.push({step:label,status:'FAIL',elapsed_ms:Date.now()-started,error:error.message});console.log(JSON.stringify({step:label,status:'FAIL'}));throw error;}
  finally{clearTimeout(timer);}
}
async function launchBrowser(engine,label){
  const server=await step(label+':launch',()=>engine.launchServer({host:'127.0.0.1',headless:false,env:{...process.env,DISPLAY:xserver.name}}),30000);
  try{const browser=await step(label+':connect',async()=>{try{return await engine.connect(server.wsEndpoint(),{timeout:15000});}catch(error){throw new Error('Local browser connection failed',{cause:error});}});ownedBrowsers.set(browser,{server,label,closed:false});return browser;}
  catch(error){try{await step(label+':failed-launch-kill',()=>server.kill(),10000);}catch{const child=server.process();if(child.exitCode===null&&child.signalCode===null)child.kill('SIGKILL');}throw error;}
}
async function closeBrowser(browser){
  const owned=ownedBrowsers.get(browser);if(!owned||owned.closed)return;owned.closed=true;const errors=[];
  try{await step(owned.label+':browser-close',()=>browser.close(),10000);}catch(error){errors.push(error);}
  try{await step(owned.label+':process-close',()=>owned.server.close(),10000);}catch(error){errors.push(error);const child=owned.server.process();if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill('SIGKILL');await step(owned.label+':forced-process-exit',()=>exited,5000);}}
  if(errors.length)throw new AggregateError(errors,'Owned browser cleanup failed');
}
async function closeContext(context){await step('context-close',()=>context.close(),10000);}
async function focusPage(page,label){
  let id=pageWindows.get(page);
  if(!id){
    const title='Venus focus '+randomUUID();await step(label+':window-title',()=>page.evaluate(value=>{document.title=value;},title));
    await step(label+':window-identify',async()=>{await expect.poll(async()=>{id=(await visibleWindows('--name',title))[0];return Boolean(id);},{timeout:5000}).toBe(true);});pageWindows.set(page,id);
  }
  xdo(xserver.name,'windowraise',id);xdo(xserver.name,'windowfocus','--sync',id);assert.equal(xdo(xserver.name,'getwindowfocus'),id,'Actual X11 focus must belong to the selected test page');
  await step(label+':protocol-focus',()=>page.bringToFront());
  assert.equal(xdo(xserver.name,'getwindowfocus'),id,'Protocol focus must retain selected X11 window');
}
async function run(id,engine,action){if(selectedCase&&selectedCase!==id)return;try{const detail=await action();report.records.push({id,engine,status:'PASS',detail});console.log(JSON.stringify({id,engine,status:'PASS'}));}catch(error){report.records.push({id,engine,status:'FAIL',error:error.message});console.log(JSON.stringify({id,engine,status:'FAIL'}));throw error;}}
async function actor(browser,locale='en',{viewport={width:1024,height:768},label='main'}={}){
  const existing=await visibleWindows();
  const context=await browser.newContext({ignoreHTTPSErrors:true,locale,reducedMotion:'reduce',viewport});context.on('page',page=>capturePageErrors(page,`${browser.browserType().name()}:${locale}:${label}`));const page=await context.newPage();
  const frames=[];page.on('websocket',socket=>socket.on('framereceived',event=>{frames.push(String(event.payload));if(frames.length>2000)frames.shift();}));
  page.setDefaultTimeout(12000);await page.goto(service.origin);await page.getByTestId('adult18').waitFor();
  await page.locator(`nav button[lang="${locale}"]`).click();
  const created=(await visibleWindows()).filter(id=>!existing.includes(id));assert.equal(created.length,1,'Actor page must own one identifiable new X11 window');pageWindows.set(page,created[0]);
  return {context,page,locale,csrf:'',roomId:null,memberId:null,frames};
}
async function accept(a){await a.page.getByTestId('accept-offer').check();await a.page.getByTestId('adult18').check();}
async function api(a,path,method='GET',body,expected=200){
  const response=await a.context.request.fetch(service.origin+path,{method,headers:{origin:service.origin,'x-csrf-token':a.csrf},...(body===undefined?{}:{data:body})});
  const json=await response.json();assert.equal(response.status(),expected,JSON.stringify(json));if(response.headers()['x-csrf-token'])a.csrf=response.headers()['x-csrf-token'];return json;
}
const base=a=>'/api/v1/rooms/'+a.roomId;
async function identify(a){const room=await api(a,base(a));const prefs=await api(a,base(a)+'/me/preferences');a.memberId=prefs.owner_member_id;return room;}
async function create(a,context='online'){
  await accept(a);await a.page.getByTestId('create-name').fill('SYNTHETIC HOST');await a.page.locator('select').first().selectOption(context);await a.page.getByTestId('create-room').click();
  await a.page.getByTestId('room-shell').waitFor();a.roomId=new URLSearchParams(new URL(a.page.url()).hash.slice(1)).get('room');await identify(a);
  await expect(a.page.getByTestId('room-invite')).not.toHaveValue('');return a.page.getByTestId('room-invite').inputValue();
}
async function join(a,url,name='SYNTHETIC GUEST'){
  await accept(a);await a.page.getByTestId('join-name').fill(name);await a.page.getByTestId('join-invite').fill(url);await a.page.getByTestId('join-room').click();
  await a.page.getByTestId('room-shell').waitFor();a.roomId=new URLSearchParams(new URL(a.page.url()).hash.slice(1)).get('room');await identify(a);
}
async function preferences(a,comfort=0,edges={}){
  const own=await api(a,base(a)+'/me/preferences');await api(a,base(a)+'/me/preferences','PUT',{comfort,edges,expected_rev:own.rev,idempotency_key:randomUUID()});await a.page.reload();await a.page.getByTestId('room-shell').waitFor();
}
async function setupGame(host,actors,mode='questions',rounds=1){
  await expect.poll(async()=>{const room=await api(host,base(host));return actors.every(actor=>room.members.some(member=>member.id===actor.memberId&&member.presence==='online'));},{timeout:15000}).toBe(true);
  const room=await api(host,base(host));const draft=await api(host,base(host)+'/game/prepare','POST',{mode,round_count:rounds,players:actors.map(actor=>actor.memberId),expected_rev:room.room_rev,idempotency_key:randomUUID()});
  await api(host,base(host)+'/game/start','POST',{draft_rev:draft.game_rev,idempotency_key:randomUUID()});
  await host.page.getByTestId('game-state').waitFor();return draft.session_id;
}
async function current(a){return api(a,base(a)+'/game/current');}
async function scene(a){
  if(!a.roomId)return null;let game;
  try{game=await current(a);}catch(error){if(!error.message.includes('GAME_NOT_FOUND'))throw error;return {room_id:a.roomId,member_id:a.memberId,game:null};}
  return {room_id:a.roomId,member_id:a.memberId,session_id:game.session_id,state:game.state,round_id:game.current_round?.round_id??null,round_state:game.current_round?.state??null,card_id:game.current_round?.card_id??null,kind:game.current_round?.kind??null};
}
async function acceptRoundConsents(host,actors,session,engine,context){
  const selected=await service.plan(session),path=base(host)+`/game/${session}/round/${selected.round_id}`;
  report.localized_setup??=[];const evidence={engine,context,room_id:host.roomId,interaction:selected.interaction,requires_action_consent:selected.requires_action_consent,before:await current(host),action_before:[],action_after:[]};report.localized_setup.push(evidence);
  const participants=actors.filter(actor=>selected.actors.includes(actor.memberId));
  if(selected.interaction==='pair_public')for(const actor of participants){const invitation=await api(actor,path+'/invitation');await api(actor,path+'/response','POST',{kind:'accept',scope:'invitation',offer_id:invitation.offer_id,proposal_revision:invitation.proposal_revision,request_id:randomUUID()});}
  if(selected.requires_action_consent)for(const actor of participants){const action=await api(actor,path+'/action-consent');evidence.action_before.push({member_id:actor.memberId,...action});await api(actor,path+'/response','POST',{kind:'accept',scope:'action',offer_id:action.offer_id,proposal_revision:action.proposal_revision,request_id:randomUUID()});}
  evidence.after=await current(host);if(selected.requires_action_consent)for(const actor of participants)evidence.action_after.push({member_id:actor.memberId,...await api(actor,path+'/action-consent')});
  return selected;
}
async function diagnose(actor,name){
  const actual=await current(actor).catch(error=>({diagnostic_error:error.message}));report.diagnostics??=[];
  report.diagnostics.push({name,actual_current:actual,game_state:await actor.page.getByTestId('game-state').allTextContents(),availability:await actor.page.getByTestId('game-availability').allTextContents(),game_error:await actor.page.getByTestId('game-error').allTextContents(),root_error:await actor.page.getByTestId('error-message').allTextContents(),connection:await actor.page.getByTestId('connection-status').allTextContents(),panel:await actor.page.getByTestId('games-panel').allTextContents()});
  await actor.page.screenshot({path:pathJoin(output,name+'.png'),fullPage:true});
}
async function setupGameUi(host,actors,mode,rounds){
  const room=await api(host,base(host));await host.page.getByTestId('game-mode').selectOption(mode);await host.page.getByTestId('game-rounds').fill(String(rounds));
  for(const member of room.members)await host.page.getByTestId('game-player-'+member.id).setChecked(actors.some(actor=>actor.memberId===member.id));
  await host.page.getByTestId('game-prepare').click();await expect(host.page.getByTestId('game-start')).toBeEnabled();await host.page.getByTestId('game-start').click();await expect.poll(async()=>(await current(host)).state).toBe('active');return (await current(host)).session_id;
}
async function resumeIfPaused(host,actors){
  const view=await current(host);report.phase={name:'resume-check',state:view.state,session_id:view.session_id,ui_state:await host.page.getByTestId('game-state').allTextContents(),connection:await host.page.getByTestId('connection-status').allTextContents(),error:await host.page.getByTestId('game-error').allTextContents()};if(view.state!=='paused')return;
  await expect.poll(async()=>{const room=await api(host,base(host));return actors.every(actor=>room.members.some(member=>member.id===actor.memberId&&member.presence==='online'));},{timeout:15000}).toBe(true);
  try{
    await expect.poll(async()=>{if((await current(host)).state==='active')return true;if(await host.page.getByTestId('game-resume').isVisible()){await host.page.getByTestId('game-resume').click();return true;}return false;},{timeout:15000}).toBe(true);
  }catch(error){report.phase.failure_ui={game_state:await host.page.getByTestId('game-state').allTextContents(),connection:await host.page.getByTestId('connection-status').allTextContents(),error:await host.page.getByTestId('game-error').allTextContents(),root_error:await host.page.getByTestId('error-message').allTextContents(),panel:await host.page.getByTestId('games-panel').allTextContents(),view:await current(host)};await host.page.screenshot({path:pathJoin(output,'failure-resume.png'),fullPage:true});throw error;}
  await expect.poll(async()=>(await current(host)).state).toBe('active');
}
async function finishRound(host,actors){
  const view=await current(host),round=await service.plan(view.session_id);
  const primary=actors.find(actor=>actor.memberId===round.primary_member_id);assert.ok(primary);
  if(!['completed','skipped','stopped'].includes(view.current_round.state))await api(primary,base(primary)+`/game/${view.session_id}/round/${round.round_id}/response`,'POST',{kind:'skip',request_id:randomUUID()});
  const fresh=await current(host);await api(host,base(host)+`/game/${view.session_id}/round/advance`,'POST',{expected_rev:fresh.game_rev,idempotency_key:randomUUID()});
}
async function matrix(page,engine,locale,screen){
  await focusPage(page,`${engine}:${locale}:${screen}:focus`);
  for(const size of sizes){
    const label=`${engine}-${locale}-${screen}-${size.label??size.width}`;
    await step(label+':resize',()=>page.setViewportSize({width:size.width,height:size.height}));
    const viewport=await step(label+':actual-viewport',()=>page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,cssZoom:getComputedStyle(document.documentElement).zoom})));
    assert.equal(viewport.width,size.width,label+' actual CSS viewport width');assert.equal(viewport.height,size.height,label+' actual CSS viewport height');assert.equal(viewport.dpr,1,label+' must retain baseline DPR');assert.equal(viewport.cssZoom,'1',label+' must begin with baseline CSS zoom');
    if(size.zoom)await step(label+':css-zoom',()=>page.evaluate(()=>{document.documentElement.style.zoom='2';}));
    const overflow=await step(label+':overflow',()=>page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(element=>element.getBoundingClientRect().right>document.documentElement.clientWidth+2).slice(0,12).map(element=>({tag:element.tagName,testid:element.getAttribute('data-testid'),width:element.getBoundingClientRect().width,right:element.getBoundingClientRect().right}))})));
    await step(label+':screenshot',()=>page.screenshot({path:pathJoin(output,label+'.png'),fullPage:true,timeout:12000}));assert.ok(overflow.scroll<=overflow.width+2,label+' horizontal overflow '+JSON.stringify(overflow));
    await step(label+':keyboard-and-motion',async()=>{for(let attempt=0;attempt<4;attempt++){await page.keyboard.press('Tab');if(await page.evaluate(()=>document.activeElement!==document.body))break;}assert.ok(await page.evaluate(()=>document.activeElement!==document.body),label+' keyboard focus');assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);});
    report.matrix.push({engine,locale,screen,width:size.width,height:size.height,actual_baseline_viewport:viewport,css_zoom:size.zoom??1,keyboard_focus:true,reduced_motion:true,horizontal_overflow:false,status:'PASS'});
    if(size.zoom)await step(label+':css-reset',()=>page.evaluate(()=>{document.documentElement.style.zoom='';}));
  }
}
async function keyboardReach(page,testId){
  await focusPage(page,'keyboard:'+testId+':focus');const target=page.getByTestId(testId);await target.waitFor();
  const diagnostic={testid:testId,before:await page.evaluate(()=>({has_focus:document.hasFocus(),active:document.activeElement?.getAttribute('data-testid'),dialogs:[...document.querySelectorAll('dialog[open]')].length})),input:'Playwright Tab after neutral heading click'};report.keyboard.push(diagnostic);
  // Bringing an OS window forward does not focus Firefox's webcontent after a different process closed.
  // A real click on the noninteractive heading establishes content focus; the target is reached only by Tab.
  await step('keyboard:'+testId+':content-focus',()=>page.locator('h1').first().click());
  await page.evaluate(()=>{window.__p05TabEvents=[];window.__p05TabListener=event=>{if(event.key==='Tab'&&window.__p05TabEvents.length<128)window.__p05TabEvents.push({type:event.type,default_prevented:event.defaultPrevented});};document.addEventListener('keydown',window.__p05TabListener);});
  try{await step('keyboard:'+testId+':reach',async()=>{const trace=[];for(let attempt=0;attempt<120;attempt++){await page.keyboard.press('Tab');if(await target.evaluate(element=>element===document.activeElement)){diagnostic.attempts=attempt+1;return;}trace.push(await page.evaluate(()=>({tag:document.activeElement.tagName,testid:document.activeElement.getAttribute('data-testid'),has_focus:document.hasFocus()})));}diagnostic.last_focus=trace.slice(-20);throw new Error('Keyboard cannot reach '+testId+': '+JSON.stringify(trace.slice(-20)));},25000);}
  finally{diagnostic.events=await page.evaluate(()=>{document.removeEventListener('keydown',window.__p05TabListener);const events=window.__p05TabEvents;delete window.__p05TabEvents;delete window.__p05TabListener;return events;});diagnostic.after_os_focus=xdo(xserver.name,'getwindowfocus');}
}
async function nativeZoom(browser,actor,engine,screen){
  const label=`${engine}:${actor.locale}:${screen}:native`,mainBefore=await step(label+':main-baseline',()=>actor.page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})));
  const sourceSceneBefore=await scene(actor),nativeBrowser=await launchBrowser(browser.browserType(),label);
  let page,windowId,observation,bodyError,nativeActor;const cleanupErrors=[],nativeActors=[];
  try{
    nativeActor=await step(label+':fresh-actor',()=>actorFactory(nativeBrowser,actor.locale,{viewport:null,label:'native:'+screen}),25000);nativeActors.push(nativeActor);page=nativeActor.page;
    if(actor.roomId){
      const invite=await step(label+':fresh-room',()=>create(nativeActor)),guest=await actorFactory(nativeBrowser,actor.locale==='en'?'ru':'en',{label:'native-guest:'+screen});nativeActors.push(guest);await join(guest,invite,'SYNTHETIC NATIVE GUEST');for(const member of nativeActors)await preferences(member);
      if(screen==='active'){const session=await setupGame(nativeActor,nativeActors,'questions',1);await acceptRoundConsents(nativeActor,nativeActors,session,engine,'native:'+actor.locale);await page.getByTestId('game-prompt').waitFor();assert.equal((await scene(nativeActor)).round_state,'active');}
      assert.notEqual(nativeActor.roomId,actor.roomId,'Native fixture must not reuse the main room/member/session');
    }
    const title='Venus native '+randomUUID();await step(label+':title',()=>page.evaluate(value=>{document.title=value;},title));await step(label+':focus',()=>page.bringToFront());await delay(150);
    windowId=pageWindows.get(page);assert.ok(windowId,'Native host must have its own exact identified X11 window');
    xdo(xserver.name,'windowsize','--sync',windowId,'640','1000');xdo(xserver.name,'windowmove',windowId,'0','0');xdo(xserver.name,'windowraise',windowId);xdo(xserver.name,'windowfocus','--sync',windowId);xdo(xserver.name,'key','--clearmodifiers','ctrl+0');await delay(100);
    const measure=()=>step(label+':measure',()=>page.evaluate(()=>({innerWidth:innerWidth,outerWidth:outerWidth,dpr:devicePixelRatio,cssZoom:getComputedStyle(document.documentElement).zoom,scrollWidth:document.documentElement.scrollWidth})));
    const before=await measure();let after=before,steps=0;
    assert.equal(before.dpr,1,'Fresh native browser baseline DPR');
    while(after.dpr<before.dpr*1.99&&steps<14){xdo(xserver.name,'key','--clearmodifiers','ctrl+equal');await delay(100);after=await measure();steps++;}
    assert.equal(after.cssZoom,'1');assert.ok(after.dpr>=before.dpr*1.99,'Native zoom not reached');assert.ok(after.innerWidth<=before.innerWidth/1.9,'Native layout did not reflow');assert.ok(after.scrollWidth<=after.innerWidth+2,'Native zoom horizontal overflow');
    const geometry=Object.fromEntries(xdo(xserver.name,'getwindowgeometry','--shell',windowId).split('\n').map(line=>line.split('=')));
    function capture(label){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-n','-f','x11grab','-video_size',`${geometry.WIDTH}x${geometry.HEIGHT}`,'-i',`${xserver.name}+${geometry.X},${geometry.Y}`,'-frames:v','1',pathJoin(output,`${engine}-${actor.locale}-${screen}-native-${label}.png`)],{timeout:15000});}
    await step(label+':scroll-top',()=>page.evaluate(()=>window.scrollTo(0,0)));capture('top');await keyboardReach(page,screen==='active'?'game-stop':actor.roomId?'leave-room':'create-name');capture('controls');
    observation={engine,locale:actor.locale,screen,before,after,window_geometry:geometry,steps,actual_zoom_percent:Math.round(after.dpr/before.dpr*10000)/100,status:'PASS',physical_keyboard_x11:true,separate_browser_process:true,isolated_fixture_room:Boolean(actor.roomId),native_scene:await scene(nativeActor),screenshot_source:'X11 window rectangle; includes browser chrome'};
  }catch(error){bodyError=error;}
  finally{
    try{if(windowId&&page&&!page.isClosed()){xdo(xserver.name,'windowfocus','--sync',windowId);xdo(xserver.name,'key','--clearmodifiers','ctrl+0');await step(label+':verify-native-reset',async()=>{await expect.poll(()=>page.evaluate(()=>devicePixelRatio),{timeout:5000}).toBe(1);});}}catch(error){cleanupErrors.push(error);}
    for(const member of nativeActors)try{await closeContext(member.context);}catch(error){cleanupErrors.push(error);}
    try{await closeBrowser(nativeBrowser);}catch(error){cleanupErrors.push(error);}
  }
  await focusPage(actor.page,label+':restore-main-focus');const mainAfter=await step(label+':verify-main-unchanged',()=>actor.page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})));assert.deepEqual(mainAfter,mainBefore,'Native process must not change the main browser viewport/DPR');
  const sourceSceneAfter=await scene(actor);assert.deepEqual(sourceSceneAfter,sourceSceneBefore,'Native probe must not replace or change the main room/game/card/round state');
  if(bodyError||cleanupErrors.length)throw new AggregateError([...(bodyError?[bodyError]:[]),...cleanupErrors],label+' failed');
  observation.reset_verified=true;observation.main_viewport_before=mainBefore;observation.main_viewport_after=mainAfter;observation.source_scene_before=sourceSceneBefore;observation.source_scene_after=sourceSceneAfter;report.native_zoom.push(observation);
}
const actorFactory=actor;
try{
  assert.deepEqual(toolchain,{node:'v24.22.1',npm:'11.19.1',playwright:'1.64.1'});
  service=await runtime();xserver=await display();
  for(const engine of [chromium,firefox,webkit].filter(engine=>!process.env.P05_ENGINE||process.env.P05_ENGINE==='all'||engine.name()===process.env.P05_ENGINE)){
    const browser=await launchBrowser(engine,engine.name()+':main');activeBrowser=browser;report.versions.push({engine:engine.name(),version:browser.version(),node:process.version});
    try{
      await run('P05-18-EXPLICIT',engine.name(),async()=>{const a=await actor(browser);try{await a.page.getByTestId('create-name').fill('SYNTHETIC');await expect(a.page.getByTestId('create-room')).toBeDisabled();await a.page.getByTestId('accept-offer').check();await expect(a.page.getByTestId('create-room')).toBeDisabled();await a.page.getByTestId('adult18').check();await expect(a.page.getByTestId('create-room')).toBeEnabled();}finally{await closeContext(a.context);}});
      await run('P05-01-CAPACITY-IDENTITY',engine.name(),async()=>{
        const members=[];try{const host=await actor(browser);members.push(host);const invite=await create(host);
          for(let i=1;i<8;i++){const guest=await actor(browser);members.push(guest);await join(guest,invite,i<3?'SYNTHETIC SAME NAME':'SYNTHETIC '+i);await preferences(guest);}
          assert.equal(new Set(members.map(member=>member.memberId)).size,8);const duplicate=await host.context.newPage();await duplicate.goto(host.page.url());await duplicate.getByTestId('room-shell').waitFor();assert.equal((await identify(host)).members.length,8);await duplicate.close();
          const ninth=await actor(browser);members.push(ninth);await accept(ninth);await ninth.page.getByTestId('join-name').fill('SYNTHETIC NINTH');await ninth.page.getByTestId('join-invite').fill(invite);await ninth.page.getByTestId('join-room').click();await ninth.page.getByTestId('error-message').waitFor();assert.equal((await identify(host)).members.length,8);
          return {admitted:8,ninth_rejected:true,duplicate_tab_added_member:false,distinct_ids_for_same_names:true};
        }finally{for(const member of members)await closeContext(member.context);}
      });
      await run('P05-03-05-09-10-LOCALIZED-GAME',engine.name(),async()=>{
        const actors=[];try{
          for(const locale of ['ru','en','tr'])actors.push(await actor(browser,locale));
          for(const actor of actors){await matrix(actor.page,engine.name(),actor.locale,'entry');await nativeZoom(browser,actor,engine.name(),'entry');}
          const invite=await create(actors[0]);for(const actor of actors.slice(1))await join(actor,invite,'SYNTHETIC '+actor.locale);
          for(const actor of actors){await preferences(actor);await matrix(actor.page,engine.name(),actor.locale,'lobby');await nativeZoom(browser,actor,engine.name(),'lobby');}
          const session=await setupGame(actors[0],actors,'questions',1);
          await acceptRoundConsents(actors[0],actors,session,engine.name(),'main');
          for(const actor of actors){await expect(actor.page.getByTestId('comfort')).toBeDisabled();await actor.page.getByTestId('game-prompt').waitFor();}
          const views=await Promise.all(actors.map(current));assert.equal(new Set(views.map(view=>view.current_round.card_id)).size,1);
          for(const actor of actors){report.phase={name:'active-locale-matrix',locale:actor.locale,actual_current:await current(actor),ui_state:await actor.page.getByTestId('game-state').allTextContents(),connection:await actor.page.getByTestId('connection-status').allTextContents()};await expect(actor.page.getByTestId('game-prompt')).toContainText('SYNTHETIC '+actor.locale.toUpperCase());await matrix(actor.page,engine.name(),actor.locale,'active');await nativeZoom(browser,actor,engine.name(),'active');}
          await keyboardReach(actors[0].page,'game-stop');
          service.fault(true);await expect(actors[0].page.getByTestId('connection-status')).not.toHaveText(/connected|подключено|bağlı/i,{timeout:15000});service.fault(false);
          await expect.poll(async()=>((await current(actors[0])).session_id)).toBe(session);await actors[0].page.reload();await resumeIfPaused(actors[0],actors);await actors[0].page.getByTestId('game-round').waitFor();
          const beforePlan=await service.plan(session);await service.restart();await expect.poll(async()=>((await current(actors[0])).session_id)).toBe(session);await resumeIfPaused(actors[0],actors);const restored=await current(actors[0]),afterPlan=await service.plan(session);assert.equal(afterPlan.card_id,beforePlan.card_id);assert.equal(afterPlan.round_id,beforePlan.round_id);assert.equal(restored.session_id,session);
          await finishRound(actors[0],actors);await expect.poll(async()=>(await current(actors[0])).state).toBe('completed');await actors[0].page.reload();await expect(actors[0].page.getByTestId('comfort')).toBeEnabled();
          const own=await api(actors[0],base(actors[0])+'/me/preferences');assert.equal(own.comfort,0);return {session_survived_restart:true,localized_card_identical:true,actual_completed:true};
        }catch(error){for(const actor of actors)await diagnose(actor,'failure-localized-'+actor.locale);throw error;}finally{service.fault(false);for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-UI-YESBUT-CONDITION-REPLAY',engine.name(),async()=>{
        const actors=[];try{
          for(const locale of ['en','ru','tr'])actors.push(await actor(browser,locale));const [host,a,b]=actors,invite=await create(host);await join(a,invite,'SYNTHETIC A');await join(b,invite,'SYNTHETIC B');
          for(const actor of actors)await preferences(actor);
          const session=await setupGameUi(host,[a,b],'yes_but',1),snapshot=await service.snapshot(session),plan=await service.plan(session);
          assert.equal((await current(host)).current_round.kind,'generic');for(const actor of [a,b]){await actor.page.getByTestId('pair-accept').click();}await host.page.getByTestId('game-prompt').waitFor();
          const secondary=[a,b].find(actor=>actor.memberId===plan.actors[1]);await secondary.page.getByTestId('game-condition-input').fill('SYNTHETIC OPTIONAL CONDITION');await secondary.page.getByTestId('game-condition-submit').click();
          for(const actor of [a,b])await expect(actor.page.getByTestId('game-current-condition')).toContainText('SYNTHETIC OPTIONAL CONDITION');await expect(host.page.locator('body')).not.toContainText('SYNTHETIC OPTIONAL CONDITION');
          for(const actor of [a,b])await actor.page.getByTestId('action-accept').click();const primary=[a,b].find(actor=>actor.memberId===plan.primary_member_id);await primary.page.getByTestId('game-finish').click();await host.page.getByTestId('game-next').click();await host.page.getByTestId('game-replay').click();
          await expect(host.page.getByTestId('game-start')).toBeEnabled();await host.page.getByTestId('game-start').click();await expect.poll(async()=>(await current(host)).state).toBe('active');const replay=await current(host);assert.notEqual(replay.session_id,session);assert.equal(replay.mode,'yes_but');assert.notEqual((await service.snapshot(replay.session_id)).seed,snapshot.seed);
          return {quiet_public_bilateral:true,private_condition:true,replay_new_session_seed:true};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-04-PRIVATE-CHAT-CONSENT-ACL',engine.name(),async()=>{
        const actors=[];try{
          for(const locale of ['en','ru','tr'])actors.push(await actor(browser,locale));const [host,a,b]=actors,invite=await create(host);await join(a,invite,'SYNTHETIC A');await join(b,invite,'SYNTHETIC B');
          await preferences(host);await preferences(a,4,{[b.memberId]:'crush'});await preferences(b,4,{[a.memberId]:'friendship'});
          const session=await setupGame(host,[a,b],'questions',20);let plan;
          for(let index=0;index<20;index++){plan=await service.plan(session);if(plan.interaction==='pair_private')break;await finishRound(host,[a,b]);}
          assert.equal(plan.interaction,'pair_private','Fixture must reach actual private round');
          for(const actor of [a,b])await actor.page.getByTestId('pair-invitation').waitFor();await expect(host.page.getByTestId('pair-invitation')).toHaveCount(0);await keyboardReach(a.page,'pair-decline');
          await a.page.getByTestId('pair-accept').click();await expect(a.page.getByTestId('pair-chat')).toHaveCount(0);await b.page.getByTestId('pair-accept').click();
          for(const actor of [a,b])await actor.page.getByTestId('pair-chat-input').waitFor();
          const chatPath=base(host)+`/game/${session}/round/${plan.round_id}/chat`;
          await api(host,chatPath,'GET',undefined,404);await a.page.getByTestId('pair-chat-input').fill('SYNTHETIC PRIVATE MESSAGE');await a.page.getByTestId('pair-chat-send').click();await expect(b.page.getByTestId('pair-chat-messages')).toContainText('SYNTHETIC PRIVATE MESSAGE');
          const nativeRequest=b.page.waitForRequest(request=>request.method()==='GET'&&request.url().endsWith(`/round/${plan.round_id}/chat`));
          const native=await b.page.evaluate(async({path,csrf})=>{const response=await fetch(path,{headers:{'x-csrf-token':csrf}});return {status:response.status,body:await response.json()};},{path:base(b)+`/game/${session}/round/${plan.round_id}/chat`,csrf:b.csrf});assert.equal(native.status,200);assert.ok(native.body.messages.some(message=>message.text==='SYNTHETIC PRIVATE MESSAGE'));assert.equal((await nativeRequest).headers().origin,undefined,'Native GET must succeed without forged Origin');
          const badCsrf=await b.page.evaluate(async path=>(await fetch(path,{headers:{'x-csrf-token':'invalid'}})).status,base(b)+`/game/${session}/round/${plan.round_id}/chat`);assert.equal(badCsrf,403);
          await expect(host.page.locator('body')).not.toContainText('SYNTHETIC PRIVATE MESSAGE');await expect(host.page.locator('body')).not.toContainText('crush');assert.equal(host.frames.some(frame=>frame.includes('SYNTHETIC PRIVATE MESSAGE')),false,'Observer WebSocket must not receive chat text');
          await a.page.getByTestId('game-skip').click();for(const actor of [a,b])await expect(actor.page.getByTestId('pair-chat-input')).toHaveCount(0);await api(b,base(b)+`/game/${session}/round/${plan.round_id}/chat`,'GET',undefined,404);
          return {bilateral_consent:true,observer_chat_denied:true,observer_relationship_hidden:true,withdrawal_clears_chat:true};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-06-NOT-A-FRIEND-ALL-MODES',engine.name(),async()=>{
        const actors=[];try{
          const host=await actor(browser),guest=await actor(browser);actors.push(host,guest);const invite=await create(host);await join(guest,invite);await preferences(host,4,{[guest.memberId]:'not_a_friend'});await preferences(guest,4,{[host.memberId]:'crush'});
          for(const mode of ['questions','truth_or_dare']){
            const session=await setupGame(host,actors,mode,5);for(let i=0;i<5;i++){const plan=await service.plan(session);assert.equal(plan.actors.length>1,false,'Blocked pair must never enter plan');await finishRound(host,actors);}assert.equal((await current(host)).state,'completed');
          }
          const room=await api(host,base(host));await api(host,base(host)+'/game/prepare','POST',{mode:'yes_but',round_count:5,players:actors.map(actor=>actor.memberId),expected_rev:room.room_rev,idempotency_key:randomUUID()});
          const available=await api(host,base(host)+'/game/availability');assert.equal(available.available,false,'Pair-only mode must report safe refusal');
          return {modes:3,played_rounds:10,yes_but_safe_refusal:true,forbidden_pair_count:0};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-NEUTRAL-SAFETY-RESET',engine.name(),async()=>{
        const actors=[];try{
          const host=await actor(browser),guest=await actor(browser);actors.push(host,guest);const invite=await create(host);await join(guest,invite);await preferences(host,4,{[guest.memberId]:'crush'});await preferences(guest,4,{[host.memberId]:'friendship'});
          const session=await setupGame(host,actors,'questions',5),before=await service.snapshot(session);await guest.page.getByTestId('game-neutral-reset').click();await expect.poll(async()=>(await current(host)).state).toBe('aborted');
          const own=await api(guest,base(guest)+'/me/preferences'),other=await api(host,base(host)+'/me/preferences');assert.equal(own.comfort,0);assert.equal(other.comfort,4);assert.equal((await service.snapshot(session)).players.find(player=>player.id===guest.memberId).comfort,before.players.find(player=>player.id===guest.memberId).comfort);await expect(host.page.getByTestId('game-resume')).toHaveCount(0);
          return {old_game_aborted:true,own_comfort_zero:true,other_comfort_unchanged:true,frozen_snapshot_unchanged:true};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-IN-PERSON-PRIVATE-NO-CHAT',engine.name(),async()=>{
        const actors=[];try{
          for(const locale of ['en','ru','tr'])actors.push(await actor(browser,locale));const [host,a,b]=actors,invite=await create(host,'in_person');await join(a,invite,'SYNTHETIC IP A');await join(b,invite,'SYNTHETIC IP B');
          await preferences(host);await preferences(a,4,{[b.memberId]:'in_relationships'});await preferences(b,4,{[a.memberId]:'in_relationships'});
          const session=await setupGame(host,[a,b],'questions',20);let plan;
          for(let index=0;index<20;index++){plan=await service.plan(session);if(plan.interaction==='pair_private')break;await finishRound(host,[a,b]);}
          assert.equal(plan.interaction,'pair_private');assert.deepEqual((await service.snapshot(session)).capabilities,[]);
          for(const actor of [a,b])await actor.page.getByTestId('pair-accept').click();for(const actor of [a,b]){await actor.page.getByTestId('private-prompt').waitFor();await expect(actor.page.getByTestId('pair-chat')).toHaveCount(0);}await expect(host.page.getByTestId('private-prompt')).toHaveCount(0);await api(a,base(a)+`/game/${session}/round/${plan.round_id}/chat`,'GET',undefined,404);
          return {context:'in_person',private_moment:true,chat_capability:false,observer_prompt:false};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-STALE-READ-AFTER-NEW-PREPARE',engine.name(),async()=>{
        const actors=[];let release,host;
        try{
          host=await actor(browser);const guest=await actor(browser);actors.push(host,guest);const invite=await create(host);await join(guest,invite);for(const actor of actors)await preferences(actor);
          report.stale_prepare={phase:'initial-A-UI-prepare-start'};const oldSession=await setupGameUi(host,actors,'questions',1);report.stale_prepare={phase:'finish-A',old_session:oldSession};await finishRound(host,actors);await host.page.getByTestId('game-replay').waitFor();
          let captured=false,armed=true,heldSession;const barrier=new Promise(done=>{release=done;});
          await host.page.route('**/game/current',async route=>{if(!armed){await route.continue();return;}armed=false;const response=await route.fetch();heldSession=(await response.json()).session_id;captured=true;await barrier;await route.fulfill({response});});
          report.stale_prepare.phase='hold-actual-current-A';await expect.poll(()=>captured,{timeout:12000}).toBe(true);assert.equal(heldSession,oldSession);report.stale_prepare.phase='prepare-new-B';await host.page.getByTestId('game-mode').selectOption('truth_or_dare');await host.page.getByTestId('game-prepare').click();await expect.poll(async()=>(await current(host)).session_id).not.toBe(oldSession);const next=await current(host);report.stale_prepare={phase:'release-old-A-then-start-B',old_session:oldSession,held_session:heldSession,new_session:next.session_id};release();
          await expect(host.page.getByTestId('game-state')).toContainText(/truth.*dare/i);await expect(host.page.getByTestId('game-start')).toBeEnabled();await host.page.getByTestId('game-start').click();await expect.poll(async()=>(await current(host)).state).toBe('active');assert.equal((await current(host)).session_id,next.session_id);
          return {held_real_backend_response:true,new_session_preserved:true};
        }catch(error){if(host)await diagnose(host,'failure-stale-prepare');throw error;}finally{release?.();for(const actor of actors)await closeContext(actor.context);}
      });
      await run('P05-EXPIRED-CHAT-RETRY-PURGE',engine.name(),async()=>{
        const actors=[];try{
          for(const locale of ['en','ru','tr'])actors.push(await actor(browser,locale));const [host,a,b]=actors,invite=await create(host);await join(a,invite,'SYNTHETIC RETRY A');await join(b,invite,'SYNTHETIC RETRY B');await preferences(host);await preferences(a,4,{[b.memberId]:'friendship'});await preferences(b,4,{[a.memberId]:'friendship'});
          const session=await setupGame(host,[a,b],'questions',20);let plan;for(let i=0;i<20;i++){plan=await service.plan(session);if(plan.interaction==='pair_private')break;await finishRound(host,[a,b]);}assert.equal(plan.interaction,'pair_private');for(const actor of [a,b])await actor.page.getByTestId('pair-accept').click();await a.page.getByTestId('pair-chat-input').waitFor();
          let posts=0;await a.page.route('**/round/*/chat',async route=>{if(route.request().method()==='POST'){posts++;await route.abort('connectionfailed');}else await route.continue();});
          await a.page.getByTestId('pair-chat-input').fill('SYNTHETIC NEVER RETRY AFTER EXPIRY');await a.page.getByTestId('pair-chat-send').click();await a.page.getByTestId('game-retry').waitFor();assert.equal(posts,1);service.tick(6*60*1000);
          await expect(a.page.getByTestId('pair-chat-input')).toHaveCount(0,{timeout:12000});await expect(a.page.getByTestId('game-retry')).toHaveCount(0);assert.equal(posts,1,'Expired text must not be resent');
          return {failed_transport_posts:1,expired_retry_purged:true,old_text_resent:false};
        }finally{for(const actor of actors)await closeContext(actor.context);}
      });
    }finally{if(report.records.some(record=>record.status==='FAIL')){let index=0;for(const context of activeBrowser.contexts())for(const page of context.pages()){try{await page.screenshot({path:pathJoin(output,`failure-${engine.name()}-${index++}.png`),fullPage:true});}catch{/* Original failure remains authoritative. */}}}await closeBrowser(browser);}
  }
  assert.equal(report.records.length,report.versions.length*(selectedCase?1:10));if(!selectedCase||selectedCase==='P05-03-05-09-10-LOCALIZED-GAME'){assert.equal(report.matrix.length,report.versions.length*72);assert.equal(report.native_zoom.length,report.versions.length*9);report.native_browser_zoom='OBSERVED_NATIVE_GE_200';}assert.ok(report.versions.length>0);report.status='PASS';
}catch(error){report.error=error.message;process.exitCode=1;}
finally{try{if(service)await service.close();report.runtime_cleanup='completed';}catch(error){report.status='FAIL';report.runtime_cleanup='failed';report.cleanup_error=error.message;process.exitCode=1;}try{if(xserver)await xserver.close();report.display_cleanup='completed';}catch(error){report.status='FAIL';report.display_cleanup='failed';report.display_cleanup_error=error.message;process.exitCode=1;}try{assertPageErrors(report);}catch(error){report.status='FAIL';report.error??=error.message;process.exitCode=1;}writeFileSync(pathJoin(output,'browser-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({status:report.status,checks:report.records.length,matrix:report.matrix.length,native_zoom:report.native_zoom.length,deferred:report.deferred}));}
