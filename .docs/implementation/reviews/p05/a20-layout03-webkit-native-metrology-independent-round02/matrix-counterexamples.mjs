import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const P='C:/.projects/venus/.artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-03/';
const {assertCell,expectedCells}=await import(pathToFileURL(P+'matrix.mjs'));
const {inertCell}=await import(pathToFileURL(P+'inert-report-fixture.mjs'));
const {assertNativeScale}=await import(pathToFileURL(P+'probe-policy.mjs'));
const clone=x=>JSON.parse(JSON.stringify(x));let checks=0;
const cell=inertCell(expectedCells().find(c=>c.engine==='webkit'&&c.locale==='ru'&&c.scene==='private_active'&&c.native));
const metrology={engine:'webkit',browser_version:'27.2',nominal_zoom_percent:200,measured_zoom_percent:207.36000537872314,native_zoom_metrology:'WEBKIT_27_2_FIRST_SUPPORTED_207_36',after_dpr:2.0736000537872314,after_width:308};
Object.assign(cell.native_measurement,metrology);for(const m of cell.native_role_measurements)Object.assign(m,metrology);assertCell(cell);checks++;
for(const key of ['native_measurement','native_role_measurements'])for(const override of [{engine:'chromium',after_dpr:2,measured_zoom_percent:200},{browser_version:'27.1'},{browser_version:'28.0'},{nominal_zoom_percent:207.36},{measured_zoom_percent:200},{after_dpr:2,measured_zoom_percent:200},{after_dpr:2.074,measured_zoom_percent:207.4},{after_dpr:2.073,measured_zoom_percent:207.3},{css_zoom:'2'},{reset_verified:false},{x11_keyboard:false},{isolated_browser:false}]){const bad=clone(cell);if(key==='native_measurement')Object.assign(bad[key],override);else Object.assign(bad[key][1],override);assert.throws(()=>assertCell(bad));checks++;}
const primary=clone(cell);primary.native_measurement.engine='firefox';assert.throws(()=>assertCell(primary));checks++;
assert.throws(()=>assertNativeScale(cell.native_measurement,'chromium'));checks++;
console.log(JSON.stringify({status:'PASS_INDEPENDENT_EXISTING_ORACLE_COUNTEREXAMPLES_ONLY',checks,native_runs:0,APP_changes:0,full_stage_PASS:false}));
