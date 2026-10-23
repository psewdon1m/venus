/** One inert error-projection control: no browser, X11, Docker or APP execution. */
import assert from 'node:assert/strict';
import {safeFailure} from '../../../../../.artifacts/p05-pilot-bundle-source12/.artifacts/p05-v2-layout-producer-resume11/probe-policy.mjs';
let observed;
try {assert.equal(2,1,'EXACT_V2_WINDOW_REQUIRED');}
catch(error){observed={safe_projection:safeFailure(error),literal_first_line:error.message.split('\n')[0],multiline_message:error.message.includes('\n')};}
assert.deepEqual(observed.safe_projection,{name:'AssertionError',code:'ASSERTION_OR_OPERATION_FAILED'});
assert.equal(observed.literal_first_line,'EXACT_V2_WINDOW_REQUIRED');
assert.equal(observed.multiline_message,true);
console.log(JSON.stringify({status:'PASS_INERT_NAMED_ASSERTION_PROJECTION_LOSS_REPRODUCED',...observed,native_run:false,APP_edits:false}));
