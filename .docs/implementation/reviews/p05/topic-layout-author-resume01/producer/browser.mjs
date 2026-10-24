/** New actual V2 layout entrypoint. It never executes or modifies the historical16-case producer. */
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium,firefox,webkit} from 'playwright';
import {runtime} from './runtime.mjs';
import {sceneDriver} from './scene-driver.mjs';
import {expectedCells,geometries,assertCell,assertMatrix} from './matrix.mjs';
import {absoluteBudget,bounded,sweepBudget,safeFailure} from './probe-policy.mjs';
import {display,launch,native200,resetNative} from './x11.mjs';
import {measureRole,screenshotBudget,assertSafeMetadata,activateSafety} from './measure.mjs';
const engines={chromium,firefox,webkit};
export async function main(){
 assert.equal(process.platform,'linux');assert.equal(process.env.VENUS_P05_LAYOUT_RUN,'1','ROOT_LAYOUT_RUN_ACK_REQUIRED');assert.equal(process.env.VENUS_P05_ISOLATED_FIXTURE,'1');
 const engine=process.env.P05_LAYOUT_ENGINE,locale=process.env.P05_LAYOUT_LOCALE;assert(engines[engine]);assert(['ru','en','tr'].includes(locale));
 const output=process.env.P05_ARTIFACT_DIRECTORY??'/artifacts';mkdirSync(output,{recursive:true});
 const cells=expectedCells().filter(c=>c.engine===engine&&c.locale===locale),report={schema_version:1,scope:'ACTUAL_V2_LAYOUT_SHARD_NOT_FULL_STAGE',status:'FAIL',engine,locale,records:cells.map(c=>({...c,status:'NOT_RUN'})),page_errors:[],page_errors_overflow:false,request_metadata:[],keyboard_actions:[],cleanup:'NOT_RUN',full_matrix:false,real_devices:false,production_approval:false,synthetic_fixture_only:true};
 const path=join(output,'layout-report.json'),save=()=>{writeFileSync(path,JSON.stringify(report,null,2)+'\n');assertSafeMetadata(path);};
 const screenshots=screenshotBudget();let service,xserver,owned,driver,error;
 save();
 try{
  service=await runtime(output);report.fixture=service.fixture;xserver=await display();
  const declarations=JSON.parse(readFileSync('node_modules/playwright-core/browsers.json','utf8')).browsers;report.toolchain={node:process.version,playwright:JSON.parse(readFileSync('node_modules/playwright/package.json','utf8')).version};
  const ordered=[...new Set(cells.map(c=>c.scene))];
  for(const scene of ordered)for(const native of [false,true]){
   report.phase={scene,native,stage:'setup'};save();
   const group=report.records.filter(c=>c.scene===scene&&c.native===native);assert(group.length);
   owned=await launch(engines[engine],xserver);const version=owned.browser.version();assert.equal(version,declarations.find(d=>d.name===engine).browserVersion,'PINNED_BROWSER_VERSION_MISMATCH');report.browser_version=version;
   driver=sceneDriver({browser:owned.browser,service,report,save,viewport:native?null:{width:1440,height:900}});
   const prepared=await bounded(absoluteBudget(180000),'real-scene-setup',()=>driver.prepareScene(scene,locale));
   const budget=absoluteBudget(sweepBudget(scene)),measurements=new Map();
   try{
    if(native)for(const {actor}of prepared.roles)measurements.set(actor,await native200(actor.page,xserver,budget));
    for(const row of group){
     const started=performance.now();report.phase={scene,native,stage:'measurement',cell:row.id};row.status='RUNNING';row.roles=[];save();
     if(!native){const geometry=geometries.find(g=>g.id===row.geometry);for(const {actor}of prepared.roles)await bounded(budget,'resize-own-role',()=>actor.page.setViewportSize({width:geometry.width,height:geometry.height}));}
     for(const role of prepared.roles)await measureRole(role,scene,prepared.fixture,row,{budget,xserver,output,screenshots,nativeMeasurement:measurements.get(role.actor),onObservation:value=>{row.roles.push(value);save();}});
     row.protocol=2;row.real_ui=true;row.reduced_motion=row.roles.every(r=>r.audit.reduced_motion);row.horizontal_overflow=row.roles.some(r=>r.audit.horizontal_overflow);row.hidden_scroll_trap=row.roles.some(r=>!r.focus_in_viewport);row.viewport=row.roles[0].audit.viewport;row.native_measurement=native?measurements.get(prepared.roles[0].actor):null;row.native_role_measurements=native?prepared.roles.map(r=>({role:r.role,...measurements.get(r.actor)})):[];row.elapsed_ms=performance.now()-started;row.sweep_elapsed_ms=budget.elapsed();row.sweep_budget_ms=budget.ms;row.clock_or_expiry_override=false;
     // Native keyboard activation occurs at 200%; verified reset precedes cell PASS.
     if(native){report.keyboard_actions.push(await activateSafety(prepared,{budget,xserver,native}));save();for(const {actor}of prepared.roles)await resetNative(actor.page,xserver,measurements.get(actor),budget);row.native_role_measurements=prepared.roles.map(r=>({role:r.role,...measurements.get(r.actor)}));}
     row.status='PASS';assertCell(row);save();
    }
    if(!native){report.keyboard_actions.push(await activateSafety(prepared,{budget,xserver,native}));save();}
   }catch(e){const row=group.find(r=>r.status==='RUNNING');if(row){row.status='FAIL';row.failure=safeFailure(e);}throw e;}
   finally{if(native)for(const {actor}of prepared.roles){const m=measurements.get(actor);if(m&&!m.reset_verified&&!actor.page.isClosed())await resetNative(actor.page,xserver,m,absoluteBudget(5000));}await driver.closeScene();driver=null;await owned.close();owned=null;}
  }
  report.matrix=assertMatrix(report.records,{engine,locale});assert.equal(report.page_errors.length,0);assert(!report.page_errors_overflow&&!report.observer_error&&!report.request_metadata_overflow);report.status='PASS';
 }catch(e){error=e;report.failure=safeFailure(e);report.status='FAIL';const a=driver?.actors().find(a=>!a.page.isClosed());if(a)try{const name='failure-dom-only.png';await a.page.screenshot({path:join(output,name),fullPage:false,timeout:5000,mask:[a.page.getByTestId('room-invite'),a.page.getByTestId('join-invite')]});report.failure_screenshot={file:name,diagnostic_only:true,capture:screenshots.accept(join(output,name))};}catch(captureError){report.failure_screenshot_error={name:captureError.name};}}
 finally{
  const cleanup=[];
  for(const [name,operation]of [['scene',()=>driver?.closeScene()],['browser',()=>owned?.close()],['runtime',()=>service?.close()],['display',()=>xserver?.close()]])try{await bounded(absoluteBudget(15000),'cleanup-'+name,operation);}catch(e){cleanup.push({component:name,name:e.name});}
  report.cleanup=cleanup.length?'FAIL':'PASS';report.cleanup_failures=cleanup;if(cleanup.length)report.status='FAIL';report.screenshots=screenshots.summary();save();
 }
 if(error||report.status!=='PASS')process.exitCode=1;console.log(JSON.stringify({scope:report.scope,status:report.status,engine,locale,cells:report.records.filter(r=>r.status==='PASS').length,cleanup:report.cleanup}));return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await main();
