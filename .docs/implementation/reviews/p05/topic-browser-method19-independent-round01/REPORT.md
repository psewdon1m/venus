# Independent METHOD19 review: corrective repeat required

**FINDING_P2_NO_RUN.** The intended unchanged-lease correction is justified by actual03 diagnosis `5214a92a…`, but METHOD19 has an actionable false-ready fence defect. No Docker/browser run was performed. Author METHOD19 remains immutable.

**P05-METHOD19-OWN-RESPONSE-FENCE-001 (P2): accepted fallback survives newer own-response faults and can resurrect after a newer denial.** The snapshot fallback considers only whether the current pending batch has an own part or HTTP_REJECTED. The retained accepted batch is never retired on receipt of newer own authority. Three independent finite controls using the exact frozen observer reproduce:

1. A newer own HTTP200 body contains invalid JSON. Body parsing fails, body_errors becomes1, but own remains null. Snapshot returns old positive READY.
2. A newer own response.body() rejects. Again body_errors1 and old positive READY.
3. A valid newer own200 response denies offer_advice. Snapshot initially blocks on incomplete new batch. Starting another ordinary own request creates an empty pending batch, and the same old positive accepted batch becomes READY again. The valid negative authority has therefore been reversed without a newer positive response.

`own-body-fault-counterexamples.mjs` prints the safe snapshots and exits1 on the expected fail-closed assertions. All three still have the same scope and unexpired old lease; the defect is not TTL expiry. A per-pending-batch response-arrived flag alone addresses immediate body faults but resets on the following request and does not by itself prevent the third case.

Minimum correction: preserve the accepted batch only until a newer own response arrives. At that synchronous response boundary, permanently retire the previous accepted batch (or keep an equivalent persistent authority floor), including malformed/rejected bodies. A complete fresh batch may become accepted normally. Do not reset the production model's deadline/epoch floors merely to revive a prior grant; do not mix parts across batches. Preserve explicit revocations, scope/WS changes, pending/body limits, original lease/deadline/min250ms, and single mutation/receipt assertions. Repeat malformed body, body-read failure, valid denial followed by another refresh, and their post-fault refresh forms, plus the existing positive refresh-start counterexample. This is one narrow correction, not new framework scope.

The15 author child hashes,10 declared runtime pins and source/image bindings were inspected; only private-batch-observer changes among runtime modules. The intended two expressions and nine other helper bytes are consistent with the declared scope. The author's nine current controls repeat PASS; they do not cover the persistent denial reversal or own-body failures. Earlier55 controls are inherited with their existing frozen qualifications rather than claimed as newly run by this reviewer. Operational outer binding remains non-authorized; no method/operational PASS is issued while this finding is open.

The reviewer retained a PowerShell inline-generation parser error and a failed patch-context attempt separately from the actual counterexample failure. The generator then used an owned Python file; no product or producer bytes were edited. Writes COMPLETE. Await additive METHOD20 author handoff for the bounded repeat.
