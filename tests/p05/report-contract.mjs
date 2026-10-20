/** Evidence acceptance, not evidence generation. A valid receipt still requires its actual run artifacts. */
import assert from 'node:assert/strict';
export const engines=['chromium','firefox','webkit'];
export const cases=['P05-18-EXPLICIT','P05-01-CAPACITY-IDENTITY','P05-03-05-09-10-LOCALIZED-GAME','P05-UI-YESBUT-CONDITION-REPLAY','P05-04-PRIVATE-CHAT-CONSENT-ACL','P05-06-NOT-A-FRIEND-ALL-MODES','P05-NEUTRAL-SAFETY-RESET','P05-IN-PERSON-PRIVATE-NO-CHAT','P05-STALE-READ-AFTER-NEW-PREPARE','P05-EXPIRED-CHAT-RETRY-PURGE'];
export const localizedCase='P05-03-05-09-10-LOCALIZED-GAME';
export function selection(args,inherited={}){
  const engine=args.find(arg=>arg.startsWith('--engine='))?.slice(9)??'all';
  const selectedCase=args.find(arg=>arg.startsWith('--case='))?.slice(7)??null;
  assert.ok(engine==='all'||engines.includes(engine),'Unknown browser engine');
  assert.ok(selectedCase===null||cases.includes(selectedCase),'Unknown browser case');
  return {engine,selectedCase,env:{...inherited,P05_ENGINE:engine,P05_CASE:selectedCase??''}};
}
export function assertPageErrors(report){
  assert.ok(Array.isArray(report.page_errors),'Missing app pageerror capture');
  assert.equal(report.page_errors.length,0,'App pageerrors were captured; inspect diagnostics');
  assert.equal(report.page_errors_overflow,false,'App pageerror capture overflowed or is incomplete');
}
/** A component receipt establishes its executed checks, never full browser/stage coverage. */
export function validateSelfActionsReport(report){
  assert.equal(report.schema_version,1,'Self-actions report schema mismatch');
  assert.equal(report.suite,'P05_SELF_ACTIONS','Self-actions report suite mismatch');
  assert.equal(report.synthetic_fixture_only,true,'Self-actions fixture scope missing');
  assert.equal(report.status,'PASS','Self-actions suite did not pass');
  assert.equal(report.runtime_cleanup,'completed','Self-actions runtime cleanup incomplete');
  assert.equal(report.error??null,null,'Self-actions report contains an error');
  assert.ok(Array.isArray(report.checks)&&report.checks.length>0,'Self-actions executed checks missing');
  const ids=report.checks.map(row=>row?.id);
  assert.ok(ids.every(id=>typeof id==='string'&&/^P05-SA-[A-Z0-9-]+$/.test(id)),'Self-actions check ID invalid');
  assert.equal(new Set(ids).size,ids.length,'Self-actions check IDs duplicate');
  assert.ok(report.checks.every(row=>row.status==='PASS'),'Self-actions checks did not all pass');
  return true;
}
function exact(rows,expected,key,label){
  assert.ok(Array.isArray(rows),label+' missing');
  const actual=rows.map(key);assert.equal(new Set(actual).size,actual.length,label+' duplicate entries');
  assert.deepEqual([...actual].sort(),[...expected].sort(),label+' coverage mismatch');
}
export function validateBrowserReport(report,{engine='all',selectedCase=null}={}){
  const expectedEngines=engine==='all'?engines:[engine],expectedCases=selectedCase?[selectedCase]:cases;
  assert.ok(expectedEngines.every(value=>engines.includes(value))&&expectedCases.every(value=>cases.includes(value)),'Invalid requested report scope');
  assert.equal(report.status,'PASS');assert.equal(report.error??null,null);
  assert.equal(report.synthetic_fixture_only,true);assert.equal(report.production_approval,false);assert.equal(report.desktop_linux_engines_only,true);
  assert.equal(report.selected_engine,engine,'Inner engine selection differs from caller');assert.equal(report.selected_case,selectedCase,'Inner case selection differs from caller');assert.equal(report.full_suite,!selectedCase,'Inner suite selection differs from caller');
  assert.deepEqual(report.toolchain,{node:'v24.22.0',npm:'11.19.1',playwright:'1.64.1'});
  assert.equal(report.runtime_cleanup,'completed');assert.equal(report.display_cleanup,'completed');assertPageErrors(report);
  exact(report.versions,expectedEngines,row=>row.engine,'Engine versions');assert.ok(report.versions.every(row=>typeof row.version==='string'&&row.version.length>0),'Actual browser version missing');
  exact(report.records,expectedEngines.flatMap(value=>expectedCases.map(id=>value+':'+id)),row=>row.engine+':'+row.id,'Case results');assert.ok(report.records.every(row=>row.status==='PASS'),'Failed case result');
  const matrixExpected=[],nativeExpected=[],matrixSizes=[[320,568,1],[375,667,1],[768,768,1],[1024,768,1],[1440,900,1],[1920,1080,1],[667,375,1],[320,568,2]];
  if(expectedCases.includes(localizedCase))for(const value of expectedEngines)for(const locale of ['ru','en','tr'])for(const screen of ['entry','lobby','active']){
    nativeExpected.push([value,locale,screen].join(':'));for(const size of matrixSizes)matrixExpected.push([value,locale,screen,...size].join(':'));
  }
  exact(report.matrix,matrixExpected,row=>[row.engine,row.locale,row.screen,row.width,row.height,row.css_zoom].join(':'),'Layout matrix');
  for(const row of report.matrix){assert.equal(row.status,'PASS');assert.equal(row.keyboard_focus,true);assert.equal(row.reduced_motion,true);assert.equal(row.horizontal_overflow,false);assert.deepEqual(row.actual_baseline_viewport,{width:row.width,height:row.height,dpr:1,cssZoom:'1'});}
  exact(report.native_zoom,nativeExpected,row=>[row.engine,row.locale,row.screen].join(':'),'Native zoom');
  for(const row of report.native_zoom){
    assert.equal(row.status,'PASS');assert.equal(row.separate_browser_process,true);assert.equal(row.reset_verified,true);assert.equal(row.physical_keyboard_x11,true);
    assert.equal(row.before.dpr,1);assert.equal(row.before.cssZoom,'1');assert.equal(row.after.cssZoom,'1');assert.ok(Number.isFinite(row.after.dpr)&&row.after.dpr>=1.99,'Native zoom DPR not measured');
    assert.ok(row.before.innerWidth>0&&row.after.innerWidth>0&&row.after.innerWidth<=row.before.innerWidth/1.9,'Native zoom did not reflow');assert.ok(row.after.scrollWidth<=row.after.innerWidth+2,'Native zoom overflow');
    assert.equal(row.actual_zoom_percent,Math.round(row.after.dpr/row.before.dpr*10000)/100);assert.deepEqual(row.main_viewport_after,row.main_viewport_before);assert.equal(row.main_viewport_before.dpr,1);
    assert.deepEqual(row.source_scene_after,row.source_scene_before,'Native probe changed the main room/game state');
    if(row.screen==='entry'){assert.equal(row.isolated_fixture_room,false);assert.equal(row.native_scene,null);assert.equal(row.source_scene_before,null);}
    else{assert.equal(row.isolated_fixture_room,true);assert.ok(row.native_scene?.room_id&&row.source_scene_before?.room_id);assert.ok(row.native_scene.member_id&&row.source_scene_before.member_id);assert.notEqual(row.native_scene.member_id,row.source_scene_before.member_id,'Native fixture reused the main identity');assert.notEqual(row.native_scene.room_id,row.source_scene_before.room_id,'Native fixture reused the main room');if(row.screen==='active'){assert.equal(row.native_scene.state,'active');assert.equal(row.native_scene.round_state,'active');assert.equal(row.source_scene_before.state,'active');assert.equal(row.source_scene_before.round_state,'active');assert.ok(row.native_scene.session_id&&row.source_scene_before.session_id);assert.notEqual(row.native_scene.session_id,row.source_scene_before.session_id);}}
  }
  assert.equal(report.native_browser_zoom,nativeExpected.length?'OBSERVED_NATIVE_GE_200':'NOT_RUN');
  return true;
}
