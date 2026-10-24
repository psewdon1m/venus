import assert from 'node:assert/strict';
import {assertKeyboard,safeFailure} from '../../../../../.artifacts/p05-pilot-bundle-source15/.artifacts/p05/venus-v2-layout-5dbf0e43c54f/producer/probe-policy.mjs';
const synthetic={controls:[{id:'synthetic-control',focus_visible:true,in_viewport:false,not_occluded:true,focus_contrast_unresolved:false,focus_contrast_ratio:4}],truncated:false};
let caught;try{assertKeyboard(synthetic,['synthetic-control']);}catch(error){caught=error;}
assert(caught?.message==='KEYBOARD_FOCUS_OUTSIDE:synthetic-control');
const safe=safeFailure(caught);assert.equal(safe.code,'KEYBOARD_FOCUS_OUTSIDE');assert.equal(safe.source_module,'probe-policy');assert(!JSON.stringify(safe).includes('synthetic-control'));
console.log(JSON.stringify({status:'PASS_FINITE_POLICY_DIAGNOSTIC_CONTROL_NOT_ACTUAL_TARGET',safe_failure:safe,raw_target_suffix_retained:false}));
