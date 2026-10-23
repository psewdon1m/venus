import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateBrowserReport} from '../../tests/p05/report-contract.mjs';
const root='.docs/implementation/evidence/p05/browser-matrix-preflight-01',r=JSON.parse(fs.readFileSync(root+'/browser/browser-report.json','utf8'));
assert.equal(validateBrowserReport(r,{engine:'all',selectedCase:null}),true);assert.equal(r.records.length,30);assert.equal(r.matrix.length,216);assert.equal(r.native_zoom.length,27);assert.equal(r.page_errors.length,0);assert.equal(r.page_errors_overflow,false);
assert.equal(r.steps.filter(row=>row.status==='FAIL').length,0);
const active=r.native_zoom.filter(row=>row.screen==='active');assert.equal(active.length,9);
for(const engine of ['chromium','firefox','webkit']){
 const group=active.filter(row=>row.engine===engine);assert.equal(new Set(group.map(row=>row.source_scene_before.room_id)).size,1);assert.equal(new Set(group.map(row=>row.source_scene_before.session_id)).size,1);assert.equal(new Set(group.map(row=>row.source_scene_before.card_id)).size,1);assert.equal(new Set(group.map(row=>row.source_scene_before.round_id)).size,1);
}
const allMainMembers=new Set(r.native_zoom.filter(row=>row.source_scene_before).map(row=>row.source_scene_before.member_id));
for(const row of r.native_zoom.filter(row=>row.native_scene)){assert.ok(!allMainMembers.has(row.native_scene.member_id));assert.deepEqual(row.source_scene_after,row.source_scene_before);}
for(const row of r.keyboard){assert.ok(row.attempts>0&&row.attempts<=120);assert.equal(row.events.length,row.attempts);assert.ok(row.events.every(event=>event.type==='keydown'&&!event.default_prevented));assert.ok(/^\d+$/.test(row.after_os_focus));}
const probeText=fs.readFileSync(root+'/probe/browser-probe.txt','utf8'),probe=JSON.parse(probeText.slice(probeText.indexOf('{')));assert.equal(probe.status,'PASS');assert.deepEqual(probe.browsers.map(row=>row.engine),['chromium','firefox','webkit']);assert.ok(probe.browsers.every(row=>row.executed));
const pins={};for(const file of ['tools/p05-browser.mjs','tests/p05/browser.mjs','tests/p05/report-contract.mjs','tests/p05/report-contract.test.mjs','tests/p05/window-inventory.mjs','.docs/P05_TESTING.md','package.json'])pins[file]=createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pairScenes=r.localized_setup.filter(row=>row.interaction==='pair_public').map(row=>({engine:row.engine,context:row.context,requires_action_consent:row.requires_action_consent,action_before:row.action_before.length,action_after:row.action_after.length,state:row.after.state,round_state:row.after.current_round?.state}));
assert.ok(pairScenes.some(row=>row.context==='main'));assert.ok(pairScenes.some(row=>row.context.startsWith('native:')));
const result={status:'PASS',actual_caller_contract:true,groups:r.records.length,layout:r.matrix.length,native:r.native_zoom.length,keyboard:r.keyboard.length,page_errors:r.page_errors.length,page_errors_overflow:r.page_errors_overflow,versions:r.versions,zoom_percent_by_engine:Object.fromEntries(['chromium','firefox','webkit'].map(engine=>[engine,[...new Set(r.native_zoom.filter(row=>row.engine===engine).map(row=>row.actual_zoom_percent))]])),distinct_native_main_identities:true,source_scene_invariance:true,same_main_localized_card:true,actual_pair_scenes:pairScenes,nominal_probe_all3:true,source:pins,visually_inspected:['chromium-ru-active-native-controls.png','firefox-ru-active-native-controls.png','webkit-en-active-native-controls.png'],scope:'DIRTY_DOCKER_PREFLIGHT_ONLY_NOT_FULL_P05'};
fs.writeFileSync('.artifacts/p05-browser-review/final-report-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
