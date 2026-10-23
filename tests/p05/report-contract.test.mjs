import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,cpSync,rmSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {validateBrowserReport,validateSelfActionsReport,assertPageErrors,selection} from './report-contract.mjs';
import {reportFixture} from './report-controls-fixture.mjs';
import {windowInventory} from './window-inventory.mjs';
test('X11 genuinely empty query is distinct from transient BadWindow with partial output',async()=>{
  const observations=[];let calls=0;const ids=await windowInventory(()=>{calls++;if(calls===1)throw Object.assign(new Error('query failed'),{status:1,stdout:'111\n222',stderr:'X Error BadWindow X_QueryTree'});return '111\n222\n333';},row=>observations.push(row),{wait:async()=>{}});
  assert.deepEqual(ids,['111','222','333']);assert.equal(calls,2);assert.equal(observations[0].transient_bad_window,true);
  assert.deepEqual(await windowInventory(()=>{throw Object.assign(new Error('no matches'),{status:1,stdout:'',stderr:''});}),[]);
});
test('X11 inventory fails after bounded BadWindow retries and on non-transient failures',async()=>{
  let calls=0;await assert.rejects(windowInventory(()=>{calls++;throw Object.assign(new Error('race'),{status:1,stderr:'BadWindow X_QueryTree'});},()=>{},{attempts:3,wait:async()=>{}}));assert.equal(calls,3);
  await assert.rejects(windowInventory(()=>{throw Object.assign(new Error('daemon'),{status:1,stderr:'Cannot open display'});}));
  await assert.rejects(windowInventory(()=>{throw Object.assign(new Error('partial'),{status:1,stdout:'123',stderr:''});}));
});
test('independent normative fixture has 30 unique cases,216 layouts,27 native observations',()=>{const r=reportFixture();assert.equal(r.records.length,30);assert.equal(r.matrix.length,216);assert.equal(r.native_zoom.length,27);assert.equal(validateBrowserReport(r),true);});
for(const [label,mutate] of [
  ['missing engine',r=>r.versions.pop()],['duplicate engine',r=>r.versions[2]=r.versions[0]],['unknown case',r=>r.records[0].id='P05-FAKE'],['missing case',r=>r.records.pop()],['duplicate case',r=>r.records[1]=r.records[0]],['failed record',r=>r.records[0].status='FAIL'],
  ['missing layout',r=>r.matrix.pop()],['duplicate layout',r=>r.matrix[1]=r.matrix[0]],['wrong actual viewport',r=>r.matrix[0].actual_baseline_viewport.width=999],['missing native',r=>r.native_zoom.pop()],['duplicate native',r=>r.native_zoom[1]=r.native_zoom[0]],['unmeasured native',r=>r.native_zoom[0].after.dpr=1],['native reset absent',r=>r.native_zoom[0].reset_verified=false],['shared process',r=>r.native_zoom[0].separate_browser_process=false],['main zoom leaked',r=>r.native_zoom[0].main_viewport_after.dpr=2],['wrong toolchain',r=>r.toolchain.playwright='other'],['runtime cleanup incomplete',r=>r.runtime_cleanup='failed'],['display cleanup incomplete',r=>r.display_cleanup='failed'],['pageerror',r=>r.page_errors.push({name:'Error',message:'CONTROL APP ERROR'})],['error overflow',r=>r.page_errors_overflow=true],['missing overflow witness',r=>delete r.page_errors_overflow]
  ,['native reused main room',r=>{const row=r.native_zoom.find(row=>row.screen==='active');row.native_scene.room_id=row.source_scene_before.room_id;}],['native altered main game',r=>{const row=r.native_zoom.find(row=>row.screen==='active');row.source_scene_after={...row.source_scene_before,state:'paused'};}],['native inactive scene',r=>{r.native_zoom.find(row=>row.screen==='active').native_scene.round_state='skipped';}]
  ,['native reused main identity',r=>{const row=r.native_zoom.find(row=>row.screen==='lobby');row.native_scene.member_id=row.source_scene_before.member_id;}]
])test('receipt rejects '+label,()=>{const r=reportFixture();mutate(r);assert.throws(()=>validateBrowserReport(r));});
test('targeted and full receipts cannot interchange',()=>{assert.throws(()=>validateBrowserReport(reportFixture('firefox','P05-18-EXPLICIT')));assert.throws(()=>validateBrowserReport(reportFixture(),{engine:'firefox',selectedCase:'P05-18-EXPLICIT'}));});
test('pageerrors acceptance rejects both actual errors and overflow independently',()=>{assert.throws(()=>assertPageErrors({page_errors:[{message:'control'}],page_errors_overflow:false}));assert.throws(()=>assertPageErrors({page_errors:[],page_errors_overflow:true}));});
test('caller selection overrides inherited narrowing',()=>{const s=selection([],{P05_ENGINE:'firefox',P05_CASE:'P05-18-EXPLICIT'});assert.equal(s.env.P05_ENGINE,'all');assert.equal(s.env.P05_CASE,'');});
function wrapper(control,args=[]){
  const dir=mkdtempSync(join(tmpdir(),'venus-p05-report-control-')),file=join(dir,'control.json'),trace=join(dir,'trace.json');writeFileSync(file,JSON.stringify({...control,trace}));
  try{
  const child=spawnSync(process.execPath,['--import',pathToFileURL(resolve('tests/p05/wrapper-control-preload.mjs')).href,resolve('tools/p05-browser.mjs'),'--allow-dirty',...args],{cwd:dir,encoding:'utf8',env:{...process.env,P05_REPORT_CONTROL:file,P05_ENGINE:'firefox',P05_CASE:'P05-18-EXPLICIT'},timeout:30000});
  assert.equal(child.error,undefined);const start=child.stdout.split('\n').filter(Boolean).map(line=>JSON.parse(line)).find(row=>row.phase==='starting');assert.ok(start,child.stderr);
  const receipt=JSON.parse(readFileSync(join(start.output,'runner.json'),'utf8')),calls=JSON.parse(readFileSync(trace,'utf8'));
  assert.equal(dirname(dirname(dirname(resolve(start.output)))),resolve(dir),'Wrapper output must remain inside the exact owned control cwd');
  const retainedRoot=resolve('.artifacts/p05-reporter-controls');mkdirSync(retainedRoot,{recursive:true});const retained=mkdtempSync(join(retainedRoot,'control-'));cpSync(start.output,join(retained,'wrapper-output'),{recursive:true,errorOnExist:true,force:false});
  writeFileSync(join(retained,'isolated-reporter-control.json'),JSON.stringify({isolated_control_only:true,no_docker_executed:true,receipt_kind:'SYNTHETIC_WRAPPER_CONTROL_NOT_DOCKER_PROOF',args,child_exit:child.status,calls},null,2));return {child,receipt,calls:calls.calls};
  }finally{assert.equal(dirname(resolve(dir)),resolve(tmpdir()));assert.ok(dir.startsWith(join(tmpdir(),'venus-p05-report-control-')));rmSync(dir,{recursive:true,force:true});}
}
test('actual wrapper refuses narrowed inner report despite Docker success and inherited selectors',()=>{const result=wrapper({report:reportFixture('firefox','P05-18-EXPLICIT')});assert.equal(result.child.status,1);assert.equal(result.receipt.status,'FAIL');assert.equal(result.receipt.full_browser_matrix,true);assert.match(result.receipt.error,/selection differs/);const run=result.calls.find(row=>row.args.includes('run'));assert.deepEqual(run.selection,{engine:'all',selected_case:''});});
test('actual wrapper accepts correctly requested targeted report',()=>{const result=wrapper({report:reportFixture('firefox','P05-18-EXPLICIT')},['--engine=firefox','--case=P05-18-EXPLICIT']);assert.equal(result.child.status,0);assert.equal(result.receipt.status,'PASS');assert.equal(result.receipt.full_browser_matrix,false);});
test('actual wrapper rejects forged full PASS missing matrix cells',()=>{const r=reportFixture();r.matrix=[];const result=wrapper({report:r});assert.equal(result.child.status,1);assert.match(result.receipt.error,/Layout matrix coverage mismatch/);});
test('actual wrapper rejects pageerror even if inner status says PASS',()=>{const r=reportFixture();r.page_errors=[{message:'CONTROL'}];const result=wrapper({report:r});assert.equal(result.child.status,1);assert.match(result.receipt.error,/App pageerrors/);});
for(const kind of ['owned','inspectUnconfirmed','wrongOwner','removeFailed'])test('actual probe timeout cleanup: '+kind,()=>{
  const result=wrapper({probeTimeout:true,...(kind==='owned'?{}:{[kind]:true})},['--probe']);assert.equal(result.child.status,1);assert.equal(result.receipt.status,'FAIL');assert.equal(result.receipt.cleanup,kind==='owned'?'completed':'failed');
  const run=result.calls.find(row=>row.args[0]==='run'),name=run.args[run.args.indexOf('--name')+1];assert.match(name,/^venus-p05-[a-f0-9]{12}-probe$/);assert.ok(result.calls.some(row=>row.args[0]==='container'&&row.args[1]==='inspect'&&row.args[2]===name));
  const removals=result.calls.filter(row=>row.args[0]==='container'&&row.args[1]==='rm');assert.equal(removals.length,['owned','removeFailed'].includes(kind)?1:0);if(removals.length)assert.equal(removals[0].args.at(-1),name);
});

function selfActionsFixture(){return {schema_version:1,suite:'P05_SELF_ACTIONS',synthetic_fixture_only:true,status:'PASS',runtime_cleanup:'completed',checks:[{id:'P05-SA-CONTROL-EXECUTED',status:'PASS'}]};}
test('self-actions component receipt requires actual nonempty unique checks and matching scope',()=>{
  assert.equal(validateSelfActionsReport(selfActionsFixture()),true);
  for(const mutate of [r=>r.schema_version=2,r=>r.suite='OTHER',r=>r.synthetic_fixture_only=false,r=>r.status='FAIL',r=>r.runtime_cleanup='failed',r=>r.error='CONTROL ERROR',r=>r.checks=[],r=>r.checks.push(r.checks[0]),r=>r.checks[0].status='FAIL',r=>r.checks[0].id='UNKNOWN']){
    const receipt=selfActionsFixture();mutate(receipt);assert.throws(()=>validateSelfActionsReport(receipt));
  }
});
test('actual self-actions wrapper selects the fixed service suite without claiming browser matrix',()=>{
  const result=wrapper({selfActionsReport:selfActionsFixture()},['--self-actions']);
  assert.equal(result.child.status,0);assert.equal(result.receipt.status,'PASS');assert.equal(result.receipt.self_actions_only,true);assert.equal(result.receipt.full_browser_matrix,false);
  const run=result.calls.find(row=>row.args.includes('run'));assert.deepEqual(run.args.slice(-4),['browser','node','--test','tests/p05-self-actions/integration.mjs']);
});
test('actual self-actions wrapper rejects missing or empty component receipt despite a browser PASS',()=>{
  const missing=wrapper({report:reportFixture()},['--self-actions']);assert.equal(missing.child.status,1);assert.equal(missing.receipt.status,'FAIL');assert.match(missing.receipt.error,/self-actions-report\.json/);
  const empty=selfActionsFixture();empty.checks=[];const result=wrapper({selfActionsReport:empty},['--self-actions']);assert.equal(result.child.status,1);assert.match(result.receipt.error,/executed checks missing/);
});
test('actual failed service test process cannot be overridden by its PASS receipt',()=>{
  const result=wrapper({selfActionsReport:selfActionsFixture(),suiteExit:1},['--self-actions']);assert.equal(result.child.status,1);assert.equal(result.receipt.status,'FAIL');assert.match(result.receipt.error,/Docker command failed, exit 1/);
});
test('self-actions rejects conflicting modes and unused browser selectors before creating resources',()=>{
  for(const extra of [['--chat'],['--catalog'],['--probe'],['--engine=firefox'],['--engine=all'],['--case=P05-18-EXPLICIT']]){
    const child=spawnSync(process.execPath,[resolve('tools/p05-browser.mjs'),'--self-actions',...extra],{encoding:'utf8',timeout:10000});
    assert.equal(child.status,1);assert.equal(child.stdout,'');assert.match(child.stderr,/Choose one test mode|does not accept browser selectors/);
  }
});
