from pathlib import Path
s=Path('.artifacts/p05-private-batch-observer-review-round01/probes.mjs').read_text(encoding='utf-8')
replacements={
"../p05-private-batch-observer02/private-batch-observer.mjs":"../p05-private-batch-observer03/private-batch-observer.mjs",
"assert(!s.ready&&s.parts.own&&s.parts.target&&s.parts.conversation&&s.parts.chat&&s.reason==='SCOPE_MISMATCH')":"assert(s.ready&&s.complete&&s.parts.own&&s.parts.target&&s.parts.conversation&&s.parts.chat)",
"assert(!failed.ready&&failed.reason==='SCOPE_MISMATCH')":"assert(failed.ready)",
"assert(!s.ready&&s.parts.own&&s.parts.chat)":"assert(s.ready&&s.parts.own&&s.parts.chat)",
"assert(states.every(s=>!s.ready&&s.reason==='SCOPE_MISMATCH'))":"assert(states.every(s=>s.ready))",
"return{bothRejected:true}":"return{bothReady:true}",
"assert(own);assert.equal(own.value.round_actions.private_text,'PRIVATE_PROJECTION_CANARY');assert(JSON.stringify(emitted).includes('PRIVATE_PROJECTION_CANARY'))":"assert.equal(own,undefined);assert(!JSON.stringify(emitted).includes('PRIVATE_PROJECTION_CANARY'))",
"rawUnexpectedPrivateNestedFieldEmitted:true":"rawUnexpectedPrivateNestedFieldEmitted:false",
"clock=4500;await part(a,'chat',v);assert(!o.snapshot(a).ready)":"clock=4500;await part(a,'chat',v);assert(o.snapshot(a).ready)",
"unnecessaryObserverOrderingDelay:5200":"firstReachedBeforePhaseDeadline:true",
".artifacts/p05-private-batch-observer-review-round01/probes.json":".artifacts/p05-private-batch-observer-review-round02/probes.json",
"PASS_FINDING_REPRODUCED":"PASS_CLOSED_FINDINGS"
}
for a,b in replacements.items():
 assert a in s,a
 s=s.replace(a,b)
s=s.replace('late_node_current_body_fresh_complete_batch_false_rejected','late_node_current_body_fresh_complete_batch_now_ready').replace('late_new_revision_body_rejects_legitimate_transition','late_new_revision_body_accepts_legitimate_transition').replace('late_current_after_all_parts_never_reconciles_that_batch','late_current_after_all_parts_reconciles_that_batch').replace('two_headless_actors_same_body_interleaving_rejects_both','two_headless_actors_same_body_interleaving_accepts_both').replace('unvalidated_projection_emits_raw_nested_payload_before_rejection','invalid_projection_does_not_emit_raw_nested_payload').replace('unnecessary_second_fresh_cycle_exceeds_existing_8s_phase','first_corrected_batch_ready_within_existing_8s_phase')
Path('.artifacts/p05-private-batch-observer-review-round02/probes.mjs').write_text(s,encoding='utf-8')
