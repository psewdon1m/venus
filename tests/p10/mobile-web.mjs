/** Finite mobile-web checks reused by P07's real room/browser fixture.
 * Desktop browser emulation does not qualify phones, OS keyboards or hardware.
 */
/* global document, window, navigator, getComputedStyle */
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

export const mobileViewports=Object.freeze([
 {width:320,height:568},{width:360,height:640},{width:390,height:844},
 {width:430,height:932},{width:640,height:360},{width:844,height:390},
 {width:768,height:1024},
]);
const languages=['ru','en','tr'];

async function containment(page){
 const result=await page.evaluate(()=>{
  const width=document.documentElement.clientWidth;
  const controls=[...document.querySelectorAll('button,input,select,textarea,summary')].filter(element=>element.getClientRects().length&&getComputedStyle(element).visibility!=='hidden');
  const outside=[],small=[];
  for(const element of controls){
   const rect=element.getBoundingClientRect(),id=element.getAttribute('data-testid')??element.tagName.toLowerCase();
   if(rect.left< -1||rect.right>width+1)outside.push({id,left:rect.left,right:rect.right});
   const target=element.matches('input[type=checkbox]')?element.closest('label'):element;
   const box=target?.getBoundingClientRect();
   if(!box||box.width<43||box.height<43)small.push({id,width:box?.width??0,height:box?.height??0});
  }
  return {width,document_width:document.documentElement.scrollWidth,controls:controls.length,outside,small,viewport_height:window.innerHeight};
 });
 assert(result.controls>10,'Real room controls must be present');
 assert(result.document_width<=result.width+1,'Mobile document overflows horizontally');
 assert.deepEqual(result.outside,[],'Room controls must stay horizontally reachable');
 assert.deepEqual(result.small,[],'Controls or their checkbox labels must retain44px touch targets');
 return result;
}

async function inviteKeyboardAndTouch(page){
 const invite=page.getByTestId('room-invite'),copy=page.getByTestId('copy-room-invite');
 await expect(invite).not.toHaveValue('');
 await copy.focus();await page.keyboard.press('Shift+Tab');await expect(invite).toBeFocused();
 assert(await invite.evaluate(element=>element.tabIndex>=0&&element.readOnly),'Manual invitation surface must be normally focusable and read-only');
 await page.keyboard.press('Tab');await expect(copy).toBeFocused();
 await invite.tap();
 assert(await invite.evaluate(element=>document.activeElement===element&&element.selectionStart===0&&element.selectionEnd===element.value.length),'Touch selects the entire read-only invitation');
 return {native_tab_order:true,touch_select:true,manual_surface_read_only:true};
}

async function modalCheck(page){
 await page.getByTestId('close-room').tap();
 const dialog=page.locator('dialog[open]');await expect(dialog).toBeVisible();
 const detail=await dialog.evaluate(element=>{const rect=element.getBoundingClientRect();return {left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom,width:window.innerWidth,height:window.innerHeight,scroll_height:element.scrollHeight,client_height:element.clientHeight};});
 assert(detail.left>=-1&&detail.right<=detail.width+1&&detail.top>=-1&&detail.bottom<=detail.height+1,'Close dialog must fit the current viewport');
 await dialog.getByTestId('confirm-close').scrollIntoViewIfNeeded();await expect(dialog.getByTestId('confirm-close')).toBeInViewport();
 await dialog.locator('button').first().tap();await expect(dialog).not.toBeVisible();
 return {...detail,confirm_reachable:true,cancel_preserves_room:true};
}

/** The existing touch context opens one bounded entry page, without entering a
 * ninth room identity or changing any current room/member state. */
export async function checkMobileEntry({context,origin}){
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.name));
 try{
  await page.setViewportSize({width:320,height:568});await page.goto(origin);
  const adult=page.getByTestId('adult18'),offer=page.getByTestId('accept-offer'),create=page.getByTestId('create-room'),join=page.getByTestId('join-room');
  await expect(adult).toBeVisible();await expect(offer).toBeVisible();
  await expect(create).toBeDisabled();await expect(join).toBeDisabled();
  await offer.tap();await expect(offer).toBeChecked();await expect(create).toBeDisabled();await expect(join).toBeDisabled();
  const portrait=await containment(page);await adult.tap();await expect(adult).toBeChecked();
  await expect(create).toBeEnabled();await expect(join).toBeEnabled();
  await page.setViewportSize({width:640,height:360});const landscape=await containment(page);
  await adult.focus();await expect(adult).toBeFocused();await page.keyboard.press('Space');
  await expect(adult).not.toBeChecked();await expect(create).toBeDisabled();await expect(join).toBeDisabled();
  assert.deepEqual(errors,[]);
  return {portrait,landscape,adult_and_offer_independently_required:true,touch_checkbox:true,keyboard_withdrawal:true,room_created:false,physical_devices:false};
 }finally{await page.close();}
}

async function populatedModules(page){
 await expect(page.getByTestId('game-state')).toBeVisible();
 await expect(page.locator('.game-card')).toBeVisible();
 for(const id of ['calls-leave','calls-microphone','calls-camera','cinema-stop','presentation-stop','presentation-page-image'])await expect(page.getByTestId(id).first()).toBeVisible();
 await expect(page.getByTestId('calls-microphone')).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('calls-camera')).toHaveAttribute('aria-pressed','true');
 await page.waitForFunction(()=>{
  const audio=document.querySelector('[data-testid="music-panel"] audio'),images=[...document.querySelectorAll('[data-testid="presentation-page-image"]')],cinema=document.querySelector('[data-testid="cinema-video"]');
  return audio&&!audio.paused&&audio.readyState>=2&&images.length>0&&images.every(image=>image.complete&&image.naturalWidth>0)&&cinema?.srcObject?.getVideoTracks().some(track=>track.readyState==='live')&&cinema.srcObject.getAudioTracks().some(track=>track.readyState==='live');
 });
 return {active_game_card:true,music_playing:true,pdf_decoded:true,presentation_live_controls:true,cinema_live_controls:true,calls_active_controls:true};
}

/** Called only when P07 has an actual active, consented private conversation.
 * submit({actor,text}) must submit via the real UI and verify receipt by the
 * other authorized participant. The viewport reduction approximates available
 * space; it is deliberately not reported as an actual OS keyboard test.
 */
export async function checkMobileCompose(actor,{submit,inputTestId='pair-chat-input',sendTestId='pair-chat-send'}={}){
 assert.equal(typeof submit,'function','Actual chat submit/authorized receipt verifier is required');
 const page=actor.page,previous=page.viewportSize(),text='SYNTHETIC mobile private message';
 try{
  await page.setViewportSize({width:390,height:360});
  const input=page.getByTestId(inputTestId),send=page.getByTestId(sendTestId);
  await expect(input).toBeVisible();await input.tap();await input.fill(text);
  await expect(input).toBeFocused();await send.scrollIntoViewIfNeeded();await expect(send).toBeInViewport();
  const layout=await containment(page);await submit({actor,text});
  return {viewport:{width:390,height:360},layout,actual_consented_chat:true,actual_authorized_receipt:true,space_reduction_only:true,os_keyboard_tested:false};
 }finally{if(previous)await page.setViewportSize(previous);}
}

/** No runtime, context, database, capture or media transport is created here.
 * actors[0] must be the host in a hasTouch context, with an active game/card,
 * playing music, a decoded live PDF, live Cinema and joined audio/video Calls.
 * setLocale(actor,locale) selects the actual application language and waits for
 * its authoritative room update. record(id,operation) owns PASS/FAIL reporting.
 * composeChat, when supplied, runs a real chat proof; absent means NOT_RUN.
 */
export async function runMobileWebChecks({actors,setLocale,record,screenshotDirectory,composeChat}){
 assert(Array.isArray(actors)&&actors.length===8,'Reuse the existing eight independent room contexts');
 assert.equal(typeof setLocale,'function');assert.equal(typeof record,'function');
 const actor=actors[0],page=actor.page,previous=page.viewportSize(),priorLocale=await page.locator('html').getAttribute('lang'),matrix=[];
 const qualification={scope:'desktop_browser_mobile_web_emulation',physical_devices:false,os_keyboard:false,hardware_audio_video:false,production:false};
 assert(await page.evaluate(()=>navigator.maxTouchPoints>0),'Mobile checks require an actual hasTouch browser context');
 if(screenshotDirectory)await mkdir(screenshotDirectory,{recursive:true});
 try{
  await page.bringToFront();
  await record('P10-WEB-LAYOUT-LOCALES',async()=>{
   for(const locale of languages){
    await setLocale(actor,locale);await expect(page.locator('html')).toHaveAttribute('lang',locale);
    for(const viewport of mobileViewports){
     await page.setViewportSize(viewport);await expect(page.getByTestId('room-shell')).toBeVisible();
     matrix.push({locale,viewport,modules:await populatedModules(page),...await containment(page)});
    }
   }
   assert.equal(matrix.length,21);
   return {matrix,qualification};
  });
  await record('P10-WEB-TOUCH-KEYBOARD-SAFEAREA',async()=>{
   await setLocale(actor,'en');await page.setViewportSize({width:320,height:568});
   const invite=await inviteKeyboardAndTouch(page);
   const safe=await page.evaluate(()=>({viewport:document.querySelector('meta[name=viewport]')?.getAttribute('content'),rules:[...document.styleSheets].flatMap(sheet=>{try{return [...sheet.cssRules].map(rule=>rule.cssText);}catch{return [];}}).join('\n'),padding:getComputedStyle(document.querySelector('main')).padding}));
   assert.match(safe.viewport??'',/viewport-fit=cover/);assert.match(safe.rules,/safe-area-inset-left/);assert.match(safe.rules,/safe-area-inset-bottom/);
   assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:[,.\s]|$)/.test(safe.viewport),'Browser zoom remains enabled');
   await page.setViewportSize({width:640,height:360});const modal=await modalCheck(page);await containment(page);
   await page.setViewportSize({width:360,height:640});await containment(page);
   return {invite,modal,orientation_change:true,safe_area_rules_present:true,computed_padding:safe.padding,nonzero_hardware_insets_tested:false,qualification};
  });
  if(composeChat)await record('P10-WEB-PRIVATE-COMPOSE',()=>composeChat({actors,checkMobileCompose,qualification}));
  return {matrix_cells:matrix.length,private_compose:composeChat?'EXECUTED_BY_REAL_CHAT_FIXTURE':'NOT_RUN',qualification};
 }catch(error){
  if(screenshotDirectory)try{await page.screenshot({path:path.join(screenshotDirectory,'p10-mobile-failure.png'),fullPage:false});}catch{/* Preserve the original failed check. */}
  throw error;
 }finally{
  if(previous)await page.setViewportSize(previous);
  if(priorLocale&&languages.includes(priorLocale))await setLocale(actor,priorLocale);
 }
}
