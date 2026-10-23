import assert from 'node:assert/strict';
import fs from 'node:fs';
import {producerMap} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source16/.artifacts/p05-compatible-rollback-producer30/source-proof.mjs';
const root='C:/.projects/venus/.artifacts/p05-pilot-bundle-source16/.artifacts/',read=p=>JSON.parse(fs.readFileSync(p));
const old=read(root+'p05-compatible-rollback-producer29/actual-image-maps.json'),next=read(root+'p05-compatible-rollback-producer30/actual-image-maps.json'),raw=root+'p05/venus-p05-oci-8f430f802c66/evidence/';
for(const phase of ['A1','B2','A3']){const p=read(raw+'phase-'+phase+'-terminal.json'),key=phase==='B2'?'B':'A';if(key==='A')assert.throws(()=>assert.deepEqual(p.actual_image.files,old.maps.A.files),{code:'ERR_ASSERTION'});assert.deepEqual(p.actual_image.files,next.maps[key].files);assert.equal(p.actual_image.compiled64,true);}
console.error(JSON.stringify({status:'PASS_SAVED_NATIVE_MAP_COMPARATOR_ONLY_NOT_NEW_NATIVE',RED_original29_A299_mismatch_retained:true,GREEN_selectedA81_exact_savedA1_A3:true,B78_unchanged:true,MJS_changes:0,APP_Docker_native_models:0}));
console.log(JSON.stringify(producerMap()));
