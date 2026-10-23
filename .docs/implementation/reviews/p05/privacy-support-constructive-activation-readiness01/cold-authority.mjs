import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateMatchedAuthority} from 'file:///C:/.projects/venus/.artifacts/p05-privacy-support-constructive01/host.mjs';
import {producerPins} from 'file:///C:/.projects/venus/.artifacts/p05-fixedrange-host03.mjs';
const root='C:/.projects/venus/',read=p=>fs.readFileSync(root+p),sha=b=>createHash('sha256').update(b).digest('hex');
const a=JSON.parse(read('.artifacts/p05-privacy-support-constructive-root-pending01.json'));
const args=[read('.artifacts/p05-privacy-support-constructive01/binding.json'),read('.artifacts/p05-privacy-support-constructive01/PREREG.json'),read('.docs/implementation/reviews/p05/privacy-matched-support-method-independent-round02/INDEX.json'),producerPins(a.producer_root),producerPins(a.range_producer_root),sha(read('.artifacts/p05-privacy-support-constructive01/host.mjs'))];
assert.throws(()=>validateMatchedAuthority(a,...args));
// In-memory fixture only. No active authority file is generated; main is never called.
const prospective={...structuredClone(a),status:'ROOT_RUN_ACK',no_actual_approval:false,issued_at:'SYNTHETIC_NOT_AUTHORITY',resource_window:'SYNTHETIC_UNENFORCED_OPERATOR_METADATA'};
assert.deepEqual(validateMatchedAuthority(prospective,...args),a.range);
assert.throws(()=>validateMatchedAuthority({...prospective,method_review_sha256:'0'.repeat(64)},...args));
console.log(JSON.stringify({status:'PASS_COLD_AUTHORITY_BRANCHES_ONLY',pending_rejected:true,in_memory_fixture_validated:true,wrong_review_rejected:true,host_main_called:false,authority_written:false,native_models:0,Docker:0,execution_authority:false}));
