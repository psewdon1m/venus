/** Actual page measurements, real Tab traversal and bounded safe screenshots. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {statSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {domAudit,focusAudit,visibleTargets} from './dom-audit.mjs';
import {bounded,assertFreshScope,assertObservation,assertKeyboard,ownControlRequirements} from './probe-policy.mjs';
import {windowFor,nativeScreenshot} from './x11.mjs';
export function screenshotBudget(){let bytes=0,count=0;return {accept(path){const b=statSync(path).size;assert(b<=3*1024*1024,'SCREENSHOT_FILE_BUDGET');const raw=readFileSync(path);assert.equal(raw.subarray(0,8).toString('hex'),'89504e470d0a1a0a','SCREENSHOT_PNG_REQUIRED');bytes+=b;count++;assert(bytes<=4*1024**3&&count<=1836,'SCREENSHOT_TOTAL_BUDGET');return {bytes:b,sha256:createHash('sha256').update(raw).digest('hex'),total_bytes:bytes,count};},summary(){return {bytes,count};}};}
export async function assertSceneProjection(page,scene,role,budget){
 const visible=async id=>assert(await bounded(budget,'scene-'+id,()=>page.getByTestId(id).isVisible()),'SCENE_PROJECTION_MISSING:'+id),absent=async id=>assert.equal(await page.getByTestId(id).count(),0,'SCENE_FORBIDDEN_PROJECTION:'+id);
 if(scene==='entry'){for(const id of ['adult18','accept-offer','create-name','join-name'])await visible(id);return;}
 if(scene==='setup'){for(const id of ['room-shell','comfort','topics-save'])await visible(id);return;}
 if(scene==='public_questions'){await visible('game-prompt');await absent('private-prompt');return;}
 if(role==='observer'){for(const id of ['pair-invitation','topic-conversation','private-prompt','structured-advice','pair-chat','game-condition-input','game-dare'])await absent(id);return;}
 if(scene==='private_active'){for(const id of ['private-prompt','structured-advice','pair-chat','advice-text'])await visible(id);}
 else await absent('private-prompt');
 if(scene==='private_offer'){await visible('topic-conversation');await visible('topic-accept');assert(await page.getByTestId('topic-accept').isEnabled());}
 if(scene==='truth_dare_choice'){if(role==='primary'){await visible('game-dare');await visible('game-truth');}else{await absent('game-dare');await absent('game-truth');}}
 if(scene==='yes_but_condition'){if(role==='secondary'){await visible('game-condition-input');await visible('game-condition-submit');assert(await page.getByTestId('game-condition-submit').isEnabled());}else await absent('game-condition-input');}
}
/** Positive preparation only; forbidden projections fail every native RAF sample. */
/* global document,getComputedStyle */
export async function prepareSceneProjection(page,scene,role,required,budget){
 let positive=[],forbidden=[];
 if(scene==='entry')positive=['adult18','accept-offer','create-name','join-name'];
 else if(scene==='setup')positive=['room-shell','comfort','topics-save'];
 else if(scene==='public_questions'){positive=['game-prompt'];forbidden=['private-prompt'];}
 else if(role==='observer')forbidden=['pair-invitation','topic-conversation','private-prompt','structured-advice','pair-chat','game-condition-input','game-dare'];
 else{
  if(scene==='private_active')positive=['private-prompt','structured-advice','pair-chat','advice-text'];else forbidden.push('private-prompt');
  if(scene==='private_offer')positive.push('topic-conversation','topic-accept');
  if(scene==='truth_dare_choice'){if(role==='primary')positive.push('game-dare','game-truth');else forbidden.push('game-dare','game-truth');}
  if(scene==='yes_but_condition'){if(role==='secondary')positive.push('game-condition-input','game-condition-submit');else forbidden.push('game-condition-input');}
 }
 positive=[...new Set([...positive,...required])];
 await bounded(budget,'positive-scene-preparation',async()=>{
  const handle=await page.waitForFunction(({positive,forbidden})=>{
   for(const id of forbidden)if(document.querySelectorAll('[data-testid="'+id+'"]').length)throw Error('SCENE_FORBIDDEN_PROJECTION:'+id);
   return document.visibilityState==='visible'&&positive.every(id=>{const element=document.querySelector('[data-testid="'+id+'"]');if(!element)return false;const style=getComputedStyle(element),rect=element.getBoundingClientRect();return style.visibility!=='hidden'&&style.visibility!=='collapse'&&rect.width>0&&rect.height>0;});
  },{positive,forbidden},{polling:'raf',timeout:budget.remaining()});
  await handle.dispose();
 });
}
function failedKeyboardProjection(result,targets){
 const id=targets.find(id=>{const r=result.controls.find(r=>r.id===id);return !r||!r.focus_visible||!r.in_viewport||!r.not_occluded||r.focus_contrast_unresolved!==false||!(r.focus_contrast_ratio>=3);});if(id===undefined)return null;
 const sample=result.controls.find(r=>r.id===id),ids=new Set(['adult18','accept-offer','create-name','join-name','join-invite','comfort','submit-preferences','topics-save','topic-allow-creative','game-neutral-reset','game-stop','game-pause','game-skip','topic-other','topic-other-exclude','topic-decline','pair-accept','pair-decline','conversation-stop','action-accept','action-withdraw','game-finish','game-dare','game-truth','game-condition-input','game-condition-submit','advice-input','pair-chat-input','offer-topic-creative']),number=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=10000000?v:null,flag=v=>typeof v==='boolean'?v:null;
 return {schema_version:1,diagnostic_only:true,sample_kind:'ORIGINAL_FIRST_FOCUS_SAMPLE',control:ids.has(id)?id:'OTHER',first_sample_present:Boolean(sample),truncated:flag(result.truncated),focus_visible:flag(sample?.focus_visible),in_viewport:flag(sample?.in_viewport),not_occluded:flag(sample?.not_occluded),focus_contrast_unresolved:flag(sample?.focus_contrast_unresolved),focus_contrast_sufficient:sample?Number.isFinite(sample.focus_contrast_ratio)&&sample.focus_contrast_ratio>=3:null,rect:Object.fromEntries(['left','top','right','bottom','width','height'].map(k=>[k,number(sample?.rect?.[k])])),viewport:Object.fromEntries(['width','height'].map(k=>[k,number(sample?.viewport?.[k])])),scroll:{top:number(sample?.scroll_top),left:number(sample?.scroll_left)}};
}
function persistFailedKeyboard(result,targets){
 const projection=failedKeyboardProjection(result,targets);if(!projection)return;const bytes=Buffer.from(JSON.stringify(projection)+'\n');assert(bytes.length<=4096,'METADATA_BUDGET_EXCEEDED');writeFileSync(join(process.env.P05_ARTIFACT_DIRECTORY??'/artifacts','keyboard-first-failure.json'),bytes,{flag:'wx'});
}
export async function keyboard(page,targets,xserver,budget,alreadyForeground=false,onCheckpoint=()=>{}){
 assert(targets.length>0,'NO_EXPECTED_KEYBOARD_CONTROLS');if(!alreadyForeground)await windowFor(page,xserver,budget);onCheckpoint('KEYBOARD_HEADING');await bounded(budget,'content-heading-focus',()=>page.locator('h1').first().click());
 const records=new Map();let attempts=0;
 for(;attempts<120&&targets.some(id=>!records.has(id));attempts++){onCheckpoint('KEYBOARD_TAB');await bounded(budget,'physical-tab',()=>page.keyboard.press('Tab'));onCheckpoint('KEYBOARD_FOCUS');const value=await bounded(budget,'actual-focus',()=>page.evaluate(focusAudit));if(value&&targets.includes(value.id)&&!records.has(value.id))records.set(value.id,value);}
 const result={controls:[...records.values()],tab_events:attempts,truncated:targets.some(id=>!records.has(id))};try{persistFailedKeyboard(result,targets);}catch{/* Preserve the original keyboard assertion if diagnostic persistence fails. */}assertKeyboard(result,targets);return result;
}
export async function measureRole({role,actor},scene,fixture,cell,{budget,xserver,output,screenshots,nativeMeasurement,onObservation=()=>{},onCheckpoint=()=>{}}){
 const started=performance.now();budget.check(); const traceEnabled=scene==='public_questions'&&cell.geometry==='smallheight'&&['primary','other'].includes(role);let traceHandle=null,traceKeys=null,traceInstallFailed=false;
 if(traceEnabled)try{traceHandle=await bounded(budget,'diagnostic-install-readonly-events',()=>actor.page.evaluateHandle(()=>{
  const rows=[],listeners=[],allowed=new Set(['adult18','accept-offer','create-name','join-name','join-invite','comfort','submit-preferences','topics-save','topic-allow-creative','game-neutral-reset','game-stop','game-pause','game-skip','topic-other','topic-other-exclude','topic-decline','pair-accept','pair-decline','conversation-stop','action-accept','action-withdraw','game-finish','game-dare','game-truth','game-condition-input','game-condition-submit','advice-input','pair-chat-input','offer-topic-creative']);let overflow=false;
  const label=target=>({testID:target instanceof HTMLElement&&allowed.has(target.getAttribute('data-testid'))?target.getAttribute('data-testid'):'OTHER',tag:target instanceof HTMLElement&&['BUTTON','INPUT','SELECT','TEXTAREA','MAIN','H1','A','BODY','DIV','SECTION','SPAN','LABEL'].includes(target.tagName)?target.tagName:target===window?'WINDOW':target===document?'DOCUMENT':'OTHER'});
  const record=(phase,event)=>{if(rows.length===512){overflow=true;return;}try{const target=event.target,main=document.querySelector('main'),propKey=main?Object.getOwnPropertyNames(main).find(k=>k.startsWith('__reactProps$')):null,props=propKey?Object.getOwnPropertyDescriptor(main,propKey)?.value:null;rows.push({sequence:rows.length,phase,type:['keydown','keyup','focusin','focus','blur'].includes(event.type)?event.type:'OTHER',key:event.key==='Tab'?'Tab':event.type==='keydown'||event.type==='keyup'?'OTHER':null,isTrusted:event.isTrusted,defaultPrevented:event.defaultPrevented,target:label(target),active:label(document.activeElement),documentHasFocus:document.hasFocus(),visibility:document.visibilityState,targetHTMLElement:target instanceof HTMLElement,targetEqualsActive:target===document.activeElement,targetOwnDocument:target?.ownerDocument===document,mainContainsTarget:Boolean(main&&target instanceof Node&&main.contains(target)),mainReactPropsPresent:Boolean(props),mainOnFocusType:typeof(props?Object.getOwnPropertyDescriptor(props,'onFocus')?.value:undefined),mainOnKeyUpType:typeof(props?Object.getOwnPropertyDescriptor(props,'onKeyUp')?.value:undefined)});}catch{rows.push({sequence:rows.length,phase,type:'READONLY_RECORD_FAILED'});}};
  for(const type of ['keydown','keyup','focusin'])for(const capture of [true,false]){const fn=e=>record(capture?'DOCUMENT_CAPTURE':'DOCUMENT_BUBBLE',e);document.addEventListener(type,fn,capture);listeners.push([document,type,fn,capture]);}
  for(const type of ['focus','blur']){const fn=e=>record('WINDOW',e);window.addEventListener(type,fn);listeners.push([window,type,fn,false]);}
  return {rows,get overflow(){return overflow;},detach(){for(const[target,type,fn,capture]of listeners)target.removeEventListener(type,fn,capture);}};
 }));}catch{traceInstallFailed=true;}
 try{
onCheckpoint('FOREGROUND');await windowFor(actor.page,xserver,budget);onCheckpoint('FRESH_SCOPE');
 let required=[];if(fixture)for(;;){budget.check();try{assertFreshScope(actor.lastGameView,fixture,performance.now());required=ownControlRequirements(actor.lastSelfActions,fixture,actor,performance.now());break;}catch{await delay(Math.min(25,budget.remaining()));}}
 onCheckpoint('POSITIVE_DOM_PREPARATION');await prepareSceneProjection(actor.page,scene,role,required,budget);
 onCheckpoint('INITIAL_PROJECTION');if(fixture){assertFreshScope(actor.lastGameView,fixture,performance.now());required=ownControlRequirements(actor.lastSelfActions,fixture,actor,performance.now());}
 for(const control of required)assert(await bounded(budget,'required-own-control',()=>actor.page.getByTestId(control).isVisible()),'OWN_PERMITTED_CONTROL_MISSING:'+control);
 await assertSceneProjection(actor.page,scene,role,budget);
 onCheckpoint('MEASUREMENT');
 onCheckpoint('CLOCK_BEFORE');const clockBefore=await bounded(budget,'native-clock-before',()=>actor.page.evaluate(()=>({wall:Date.now(),elapsed:performance.now()})));
 onCheckpoint('DOM_AUDIT');const audit=await bounded(budget,'dom-audit',()=>actor.page.evaluate(domAudit));
 assert.equal(audit.locale,actor.locale,'ACTUAL_DOCUMENT_LOCALE_MISMATCH');
 const isPrivate=['private_offer','private_active','truth_dare_choice','yes_but_condition'].includes(scene);let cross_private_leak=false;
 onCheckpoint('PRIVATE_OBSERVER_GUARD');if(isPrivate&&role==='observer'){for(const id of ['pair-invitation','topic-conversation','private-prompt','structured-advice','pair-chat'])if(await actor.page.getByTestId(id).count())cross_private_leak=true;assert(!cross_private_leak,'OBSERVER_PRIVATE_LEAK');}
 onCheckpoint('TARGETS');const targets=await bounded(budget,'own-visible-targets',()=>actor.page.evaluate(visibleTargets)),keys=await keyboard(actor.page,targets,xserver,budget,true,onCheckpoint);
 if(traceEnabled)traceKeys=keys;
 onCheckpoint('CAPTURE');const file=cell.id.replaceAll('/','-')+'-'+role+'.png',path=join(output,file);
 if(nativeMeasurement)await nativeScreenshot(actor.page,xserver,nativeMeasurement,path,budget);else await bounded(budget,'masked-screenshot',()=>actor.page.screenshot({path,fullPage:false,mask:[actor.page.getByTestId('room-invite'),actor.page.getByTestId('join-invite')],timeout:Math.max(1,budget.remaining())}));
 const capture=screenshots.accept(path);
 onCheckpoint('CLOCK_AFTER');const clockAfter=await bounded(budget,'native-clock-after',()=>actor.page.evaluate(()=>({wall:Date.now(),elapsed:performance.now()}))),clock_elapsed=clockAfter.elapsed-clockBefore.elapsed,normalClock=clock_elapsed>=0&&clockAfter.wall>=clockBefore.wall&&Math.abs(clockAfter.wall-clockBefore.wall-clock_elapsed)<250;
 const outcome={role,visible:true,focus_visible:keys.controls.every(c=>c.focus_visible),keyboard_reached:true,focus_in_viewport:keys.controls.every(c=>c.in_viewport&&c.not_occluded),own_scope_matches:true,required_own_controls:required,cross_private_leak,control_names_nonempty:audit.named_controls,contrast_failures:audit.contrast_failures,contrast_unresolved:audit.contrast_unresolved,normal_ui_clock:normalClock,clock:{before:clockBefore,after:clockAfter},evidence_file:file,targets,keyboard:keys,audit,capture,elapsed_ms:performance.now()-started};
 onCheckpoint('FINAL_PROJECTION');
 // Evidence is saved before any strict assertion so legitimate failures remain inspectable.
 onObservation(outcome);assert(normalClock,'UI_CLOCK_DISCONTINUITY');assertObservation(audit);await assertSceneProjection(actor.page,scene,role,budget);if(fixture)assertFreshScope(actor.lastGameView,fixture,performance.now());budget.check();return outcome;
 }finally{
  if(traceEnabled)try{
   const trace=traceHandle?await bounded(budget,'diagnostic-dump-readonly-events',()=>traceHandle.evaluate(value=>{const result={rows:value.rows,overflow:value.overflow};value.detach();return result;})):{rows:[],overflow:false};
   const safe={scope:'ONE_REAL_APP_READONLY_FOCUS_TRACE_DIAGNOSTIC_NOT_GATE',role,scene:'public_questions',geometry:'smallheight',cap:512,installFailed:traceInstallFailed,...trace,original_first_samples:traceKeys?.controls??null};
   const bytes=Buffer.from(JSON.stringify(safe)+'\n');assert(bytes.length<=512*1024,'DIAGNOSTIC_METADATA_CAP');writeFileSync(join(output,'public-'+role+'-focus-events.json'),bytes,{flag:'wx'});
   try{const raw=readFileSync(join(output,'keyboard-first-failure.json'));if(raw.length<=4096)writeFileSync(join(output,'public-'+role+'-original-first-failure.json'),raw,{flag:'wx'});}catch{/* Preserve original failure and sample writer. */}
  }catch{/* Diagnostic collection never replaces the original outcome/failure. */}finally{try{if(traceHandle)await traceHandle.dispose();}catch{/* Original outcome preserved. */}}
 }
}
export function assertSafeMetadata(outputFile){const b=readFileSync(outputFile);assert(b.length<=25*1024*1024,'METADATA_BUDGET_EXCEEDED');}
export async function activateSafety(prepared,{budget,xserver,native}){
 const {scene,roles,fixture}=prepared;
 if(scene==='entry'||scene==='setup'){
  const actor=roles[0].actor,id=scene==='entry'?'adult18':'topic-allow-creative',before=await actor.page.getByTestId(id).isChecked();
  await keyboard(actor.page,[id],xserver,budget);await bounded(budget,'keyboard-space',()=>actor.page.keyboard.press('Space'));assert.equal(await actor.page.getByTestId(id).isChecked(),!before);
  return {scene,native,kind:'Space-checkbox',control:id,actual_toggle:true,status:'PASS'};
 }
 const control=scene==='public_questions'?'game-pause':scene==='private_offer'?'topic-decline':scene==='private_active'?'topic-other':scene==='truth_dare_choice'?'game-dare':'game-condition-submit';
 const own=roles.find(r=>scene==='yes_but_condition'?r.role==='secondary':scene==='truth_dare_choice'?r.role==='primary':true);
 const candidates=scene==='public_questions'?roles:[own];let selected;
 for(const role of candidates)if(await role.actor.page.getByTestId(control).isVisible()&&await role.actor.page.getByTestId(control).isEnabled()){selected=role;break;}
 assert(selected,'KEYBOARD_SAFETY_ACTION_UNAVAILABLE');const {actor}=selected;assertFreshScope(actor.lastGameView,fixture,performance.now());
 await keyboard(actor.page,[control],xserver,budget);
 const suffix=scene==='public_questions'?`/api/v2/rooms/${actor.room}/game/${fixture.session}/pause`:`/api/v2/rooms/${actor.room}/game/${fixture.session}/round/${fixture.plan.round_id}/${scene==='truth_dare_choice'?'choice':scene==='yes_but_condition'?'condition':'conversation/commands'}`;
 const kind=scene==='private_offer'?'respond_topic':scene==='private_active'?'other_question':null;
 const pending=actor.page.waitForResponse(response=>new URL(response.url()).pathname===suffix&&response.request().method()==='POST'&&(!kind||response.request().postDataJSON()?.kind===kind));pending.catch(()=>{});
 await bounded(budget,'keyboard-enter',()=>actor.page.keyboard.press('Enter'));const response=await bounded(budget,'keyboard-exact-receipt',()=>pending);assert.equal(response.status(),200);const receipt=await bounded(budget,'keyboard-receipt-json',()=>response.json()),request=response.request().postDataJSON();assert.equal(receipt.schema_version,2);assert(/^[a-f0-9]{8}-[a-f0-9-]{27}$/.test(request.request_id??''));assert.equal(receipt.request_id,request.request_id);assert(Number.isSafeInteger(receipt.game_rev));
 if(scene==='private_offer')assert.equal(request.decision,'decline');if(scene==='private_active')assert.equal(request.exclude_current_topics,false);if(scene==='truth_dare_choice')assert.equal(request.side,'dare');if(scene==='yes_but_condition')assert.equal(request.text,'SYNTHETIC LAYOUT CONDITION');
 return {scene,native,role:selected.role,control,kind:'Enter-exact-HTTP-receipt',status:response.status(),receipt_matches:true,game_rev:receipt.game_rev};
}
