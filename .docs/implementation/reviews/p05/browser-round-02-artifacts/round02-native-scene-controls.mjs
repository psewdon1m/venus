import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateBrowserReport} from '../../tests/p05/report-contract.mjs';
const base=JSON.parse(fs.readFileSync('.artifacts/p05/venus-p05-c0031ac43299/browser-report.json','utf8'));
const scope={engine:'firefox',selectedCase:'P05-03-05-09-10-LOCALIZED-GAME'},controls=[];
assert.throws(()=>validateBrowserReport(base,scope),'Older targeted report lacks newly mandatory identity fields');controls.push({label:'Older targeted report without member IDs rejected by current contract',status:'PASS'});
for(const row of base.native_zoom)if(row.screen!=='entry'){row.native_scene.member_id='SYNTHETIC_NATIVE_'+row.locale+'_'+row.screen;row.source_scene_before.member_id='SYNTHETIC_MAIN_'+row.locale;row.source_scene_after.member_id=row.source_scene_before.member_id;}assert.equal(validateBrowserReport(base,scope),true);controls.push({label:'Explicit synthetic fixture with distinct identity witnesses accepted',status:'PASS'});
for(const [label,mutate] of [
 ['Native uses main member',row=>row.native_scene.member_id=row.source_scene_before.member_id],
 ['Native member witness missing',row=>delete row.native_scene.member_id],
 ['Native uses main room',row=>row.native_scene.room_id=row.source_scene_before.room_id],
 ['Native uses main session',row=>row.native_scene.session_id=row.source_scene_before.session_id],
 ['Native game inactive',row=>row.native_scene.state='paused'],
 ['Native round inactive',row=>row.native_scene.round_state='skipped'],
 ['Main source game inactive despite invariant equality',row=>{row.source_scene_before.state='paused';row.source_scene_after.state='paused';}],
 ['Main source round inactive despite invariant equality',row=>{row.source_scene_before.round_state='skipped';row.source_scene_after.round_state='skipped';}],
 ['Main round replaced during native',row=>row.source_scene_after.round_id='INDEPENDENT_REPLACED_ROUND'],
 ['Main card changed during native',row=>row.source_scene_after.card_id='INDEPENDENT_REPLACED_CARD'],
 ['Source baseline omitted',row=>{delete row.source_scene_before;delete row.source_scene_after;}],
 ['Native room not marked isolated',row=>row.isolated_fixture_room=false]
]){const r=structuredClone(base);mutate(r.native_zoom.find(row=>row.screen==='active'));assert.throws(()=>validateBrowserReport(r,scope),label);controls.push({label,status:'PASS'});}
const output={schema_version:1,isolated_control_only:true,no_docker_or_x11_executed:true,method:'Synthetic mutation controls derived from older targeted shape, with explicitly synthetic member witnesses; not actual current Docker evidence',source_sha256:createHash('sha256').update(fs.readFileSync('tests/p05/report-contract.mjs')).digest('hex'),controls};fs.writeFileSync('.artifacts/p05-browser-review/round02-native-scene-controls.json',JSON.stringify(output,null,2));console.log(JSON.stringify({controls:controls.length,pass:controls.length,fail:0,source_sha256:output.source_sha256}));

