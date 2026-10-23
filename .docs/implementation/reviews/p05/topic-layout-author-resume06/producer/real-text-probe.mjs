/** Owner-card typography only. No API/cache/consent/auth state is supplied or changed. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {domAudit} from './dom-audit.mjs';
import {bounded,assertObservation} from './probe-policy.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex'),fixtureBytes=readFileSync(new URL('./real-text-fixture.json',import.meta.url));
assert.equal(sha(fixtureBytes),'720ad0e0eda52f589d08d5e29e8051aa4e76024b5523ddee49f3cbfd8dbe4113','REAL_TEXT_FIXTURE_PIN_MISMATCH');
export const textFixture=JSON.parse(fixtureBytes);
export const textRows=locale=>textFixture.rows.filter(r=>r.locale===locale);
/** Exact production tag/class topology for the two prompt surfaces, not React state. */
/* global document,window,getComputedStyle */
export function installText(row){
 if(document.querySelector('[data-venus-owner-text-probe]'))throw Error('TEXT_PROBE_ALREADY_PRESENT');
 const main=document.querySelector('main');if(!main)throw Error('PRODUCTION_MAIN_REQUIRED');
 const host=document.createElement('section');host.className='games-panel panel';host.dataset.venusOwnerTextProbe='1';
 const card=document.createElement(row.surface==='private'?'section':'article');card.className=row.surface==='private'?'private-panel':'game-card';
 let surface=card;if(row.surface==='private'){surface=document.createElement('section');card.append(surface);}
 row.rendered_parts.forEach((text,i)=>{const p=document.createElement('p');if(i===0)p.className='game-prompt';p.textContent=text;surface.append(p);});
 host.append(card);main.append(host);return {paragraphs:row.rendered_parts.length};
}
export function textGeometry(renderedParts){
 const host=document.querySelector('[data-venus-owner-text-probe]');if(!host)throw Error('TEXT_PROBE_MISSING');
 const paragraphs=[...host.querySelectorAll('p')],last=paragraphs.at(-1),rect=last.getBoundingClientRect();
 const clipped=paragraphs.some(p=>{const r=p.getBoundingClientRect();for(let a=p;a&&a!==document.documentElement;a=a.parentElement){const s=getComputedStyle(a),b=a.getBoundingClientRect();if(['hidden','clip'].includes(s.overflowY)&&(r.top<b.top-2||r.bottom>b.bottom+2))return true;}return p.scrollWidth>p.clientWidth+2||p.scrollHeight>p.clientHeight+2;});
 return {paragraphs:paragraphs.length,text_matches:paragraphs.length===renderedParts.length&&paragraphs.every((p,i)=>p.textContent===renderedParts[i]),text_lengths:paragraphs.map(p=>p.textContent.length),css_zoom:getComputedStyle(document.documentElement).zoom,width:window.innerWidth,height:window.innerHeight,dpr:window.devicePixelRatio,document_scroll_width:document.documentElement.scrollWidth,document_client_width:document.documentElement.clientWidth,clipped,last_line_bottom:rect.bottom,bottom_reachable:rect.bottom>0&&rect.bottom<=window.innerHeight+2,scroll_top:document.scrollingElement.scrollTop};
}
export function assertTextMeasurement(value,profile,nativeMeasurement=null){
 assert.equal(value.css_zoom,'1');assert.equal(value.text_matches,true);assert.equal(value.clipped,false);assert.equal(value.bottom_reachable,true);assert(value.document_scroll_width<=value.document_client_width+2);assert(value.paragraphs>0&&value.text_lengths.every(n=>Number.isSafeInteger(n)&&n>0));
 if(profile==='w320'){assert.equal(value.width,320);assert.equal(value.dpr,1);}else{assert.equal(profile,'native200');assert(nativeMeasurement?.x11_keyboard&&nativeMeasurement.isolated_browser);assert(Math.abs(value.dpr/nativeMeasurement.before_dpr-2)<=.02);assert(value.width<=nativeMeasurement.before_width/1.9);}
}
export async function measureOwnerText({page,locale,profile,budget,report,save=()=>{},nativeMeasurement=null}){
 assert(['w320','native200'].includes(profile));const selected=textRows(locale);assert(selected.length>0);report.real_text_observations??=[];
 for(const row of selected){
  budget.check();const record={id:row.id,locale,profile,status:'RUNNING',scope:'PRESENTATION_ONLY_OWNER_R4_NOT_AUTH_API_CONSENT',card_id:row.card_id,card_revision:row.card_revision,field:row.field,surface:row.surface,raw_sha256:row.field_sha256,rendered_parts_sha256:row.rendered_parts_sha256,fixture_sha256:sha(fixtureBytes),native_measurement:nativeMeasurement};report.real_text_observations.push(record);save();
  const before=await bounded(budget,'text-backup',()=>page.evaluate(()=>({x:window.scrollX,y:window.scrollY})));
  let primary=null;try{
   const installed=await bounded(budget,'text-clone',()=>page.evaluate(installText,row));assert.equal(installed.paragraphs,row.rendered_parts.length);
   await bounded(budget,'text-physical-scroll-focus',()=>page.locator('h1').first().click());await bounded(budget,'text-physical-scroll-end',()=>page.keyboard.press('Control+End'));
   const geometry=await bounded(budget,'text-geometry',()=>page.evaluate(textGeometry,row.rendered_parts)),audit=await bounded(budget,'text-existing-dom-audit',()=>page.evaluate(domAudit));record.geometry=geometry;record.audit=audit;save();assertTextMeasurement(geometry,profile,nativeMeasurement);assert.equal(audit.locale,locale);assertObservation(audit);record.status='PASS';save();
  }catch(error){primary=error;record.status='FAIL';save();}
  finally{try{await bounded(budget,'owned-text-cleanup',()=>page.evaluate(({x,y})=>{const nodes=[...document.querySelectorAll('[data-venus-owner-text-probe]')];if(nodes.length>1)throw Error('EXACT_TEXT_OWNER_REQUIRED');nodes[0]?.remove();window.scrollTo(x,y);if(document.querySelector('[data-venus-owner-text-probe]'))throw Error('TEXT_PROBE_CLEANUP_FAILED');},before));record.cleanup='PASS';save();}catch(cleanupError){record.cleanup='FAIL';record.status='FAIL';save();primary??=cleanupError;}}
  if(primary)throw primary;
 }
}
export function assertTextRows(rows,locale){
 const expected=textRows(locale),ids=expected.map(r=>r.id);assert.equal(rows.length,expected.length*2);assert.equal(new Set(rows.map(r=>r.id+'/'+r.profile)).size,rows.length);
 for(const wanted of expected)for(const profile of ['w320','native200']){const row=rows.find(r=>r.id===wanted.id&&r.profile===profile);assert(row);assert.equal(row.status,'PASS');assert.equal(row.cleanup,'PASS');assert.equal(row.scope,'PRESENTATION_ONLY_OWNER_R4_NOT_AUTH_API_CONSENT');assert.equal(row.locale,locale);assert.equal(row.card_id,wanted.card_id);assert.equal(row.card_revision,wanted.card_revision);assert.equal(row.field,wanted.field);assert.equal(row.surface,wanted.surface);assert.equal(row.raw_sha256,wanted.field_sha256);assert.equal(row.fixture_sha256,sha(fixtureBytes));assert.deepEqual(row.rendered_parts_sha256,wanted.rendered_parts_sha256);assertTextMeasurement(row.geometry,profile,row.native_measurement);assertObservation(row.audit);}
 assert(rows.every(r=>ids.includes(r.id)));return {scope:'OWNER_R4_REPRESENTATIVE_TYPOGRAPHY_ONLY',logical_fields:expected.length,stress_measurements:rows.length,all470_visual:false,all470_static_budget:'SEPARATE_INHERITED_PILOT147',actual_authorization:false};
}
