import assert from 'node:assert/strict';
import {safeError} from 'file:///C:/.projects/venus/.artifacts/p05-pilot-bundle-source04/.artifacts/p05-compatible-rollback-producer09/bound-profile.mjs';
function first(){const own=undefined;return own.actors;}
function second(){const own=null;return own.state;}
let a,b;try{first();}catch(e){a=e;}try{second();}catch(e){b=e;}
assert.notEqual(a.stack,b.stack);assert.deepEqual(safeError(a,'A1'),safeError(b,'A1'));assert.deepEqual(safeError(a,'A1'),{name:'TypeError',code:null,phase:'A1'});
console.log(JSON.stringify({status:'CONFIRMED_DISTINCT_NATIVE_CAUSES_COLLAPSE_TO_SAME_SAFE_ERROR',historical_failure_reproduced:false,Docker_RUN:false,raw_messages_or_stacks_emitted:false}));
