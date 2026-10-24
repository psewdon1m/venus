/** Existing ACK/profile validators only; no main runner or allocation. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateAck} from '../../../../../.artifacts/p05-ordinary-real470-probe06/outer.mjs';
import {profiles,negativeProfiles} from '../../../../../.artifacts/p05-ordinary-real470-probe06/probe.mjs';
const manifest=JSON.parse(readFileSync(new URL('../../../../../.artifacts/p05-cohorts06-a16-acks01/MANIFEST.json',import.meta.url)));
let positive=0,negative=0;
for(const row of manifest.cohorts){const ack=JSON.parse(readFileSync(row.path));validateAck(ack);const p=profiles(ack.cohort);assert.equal(p.length,7);assert.deepEqual(p.map(v=>v.N),[2,3,4,5,6,7,8]);positive+=p.length;negative+=negativeProfiles(ack.cohort).length;}
assert.equal(positive,42);assert.equal(negative,2);
console.log(JSON.stringify({status:'PASS_EXISTING_SIX_COLD_ACK_VALIDATIONS_NO_ALLOCATION',cohorts:6,profiles:positive,rounds:positive*20,YB_negatives:negative}));
