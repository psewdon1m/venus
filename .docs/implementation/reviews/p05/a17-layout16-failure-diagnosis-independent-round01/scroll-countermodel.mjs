import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {measureOwnerText,assertTextMeasurement} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16/real-text-probe.mjs';
import {absoluteBudget} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16/probe-policy.mjs';
const actual=JSON.parse(readFileSync('C:/.projects/venus/.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-v2-layout-2869c29ddbd2/layout-report.json','utf8')).real_text_observations[0];
const report={},order=[];let geometryReads=0,ownedClone=false,physicalEndIssued=false;
const page={locator(selector){assert.equal(selector,'h1');return{first(){return{async click(){order.push('heading-click');}};}};},keyboard:{async press(key){assert.equal(key,'Control+End');physicalEndIssued=true;order.push('physical-Control+End');}},async evaluate(fn,arg){
 if(fn.name==='installText'){ownedClone=true;order.push('clone');return{paragraphs:arg.rendered_parts.length};}
 if(fn.name==='textGeometry'){assert(ownedClone&&physicalEndIssued);geometryReads++;order.push('geometry-intermediate');return structuredClone(actual.geometry);}
 if(fn.name==='domAudit'){order.push('audit');return structuredClone(actual.audit);}
 if(arg===undefined)return{x:0,y:1377};ownedClone=false;order.push('cleanup');return undefined;
}};
await assert.rejects(measureOwnerText({page,locale:'ru',profile:'w320',budget:absoluteBudget(1000),report,save(){}}),e=>e.code==='ERR_ASSERTION'&&e.actual===false&&e.expected===true);
assert.equal(geometryReads,1);assert.equal(report.real_text_observations.length,1);assert.equal(report.real_text_observations[0].status,'FAIL');assert.equal(report.real_text_observations[0].cleanup,'PASS');assert.equal(ownedClone,false);
// An explicitly synthetic reachable endpoint of the same unobscured text; not an actual browser sample.
const syntheticSettled={...actual.geometry,last_line_bottom:500,bottom_reachable:true,scroll_top:actual.geometry.scroll_top+actual.geometry.last_line_bottom-500};assertTextMeasurement(syntheticSettled,'w320');
console.log(JSON.stringify({status:'PASS_EXACT_HELPER_SINGLE_SAMPLE_COUNTERMODEL_NOT_NATIVE_SCROLL_DIAGNOSIS',observed_failure_reproduced_in_inert_model:true,geometry_reads_before_failure:geometryReads,reachable_later_endpoint_would_pass:true,order,actual_scroll_mechanism:'UNKNOWN_NOT_SIMULATED_AS_FACT',APP_defect_established:false,browser_launches:0,Docker_allocations:0,real_input_events:0}));
