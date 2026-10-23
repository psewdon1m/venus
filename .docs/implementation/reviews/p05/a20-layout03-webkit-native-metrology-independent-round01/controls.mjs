import assert from 'node:assert/strict';
import {assertNativeZoom,assertNativeScale} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-03/probe-policy.mjs';
import {assertTextMeasurement} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-03/real-text-probe.mjs';
const base={css_zoom:'1',before_dpr:1,after_dpr:2,before_width:640,after_width:320,scroll_width:320};let checks=0;
assertNativeZoom(base);checks++;
for(const engine of ['chromium','firefox']){assertNativeZoom({...base,engine});checks++;assert.throws(()=>assertNativeZoom({...base,engine,after_dpr:2.0736}));checks++;}
const wk={...base,engine:'webkit',browser_version:'27.2',nominal_zoom_percent:200,after_dpr:2.0736000537872314,after_width:308,scroll_width:309,native_zoom_metrology:'WEBKIT_27_2_FIRST_SUPPORTED_207_36',measured_zoom_percent:207.36000537872314};assertNativeZoom(wk);checks++;
for(const ratio of [1.728,1.99,2,2.02,2.06,2.073,2.074,2.09,2.5]){assert.throws(()=>assertNativeZoom({...wk,after_dpr:ratio,measured_zoom_percent:ratio*100}));checks++;}
for(const override of [{browser_version:'27.1'},{engine:'chromium'},{nominal_zoom_percent:207.36},{native_zoom_metrology:'EXACT_200'},{css_zoom:'2'},{before_dpr:2},{after_width:640},{scroll_width:311},{measured_zoom_percent:200}]){assert.throws(()=>assertNativeZoom({...wk,...override}));checks++;}
assert.throws(()=>assertNativeScale(wk,'firefox'));checks++;
const geometry={css_zoom:'1',text_matches:true,clipped:false,bottom_reachable:true,document_scroll_width:309,document_client_width:308,paragraphs:1,text_lengths:[10],width:308,dpr:wk.after_dpr};
const measurement={...wk,x11_keyboard:true,isolated_browser:true};assertTextMeasurement(geometry,'native200',measurement,'webkit');checks++;
assert.throws(()=>assertTextMeasurement(geometry,'native200',measurement,'chromium'));checks++;
assert.throws(()=>assertTextMeasurement({...geometry,dpr:2},'native200',measurement,'webkit'));checks++;
assert.throws(()=>assertTextMeasurement({...geometry,clipped:true},'native200',measurement,'webkit'));checks++;
console.log(JSON.stringify({scope:'MINIMAL_INERT_METROLOGY_COUNTEREXAMPLES_NOT_NATIVE_GATE',status:'PASS',checks}));
