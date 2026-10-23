# METHOD12 actual Chromium case08 — independent diagnosis

**DIAGNOSIS_CONFIRMED: pending action consent expired while the producer completed sequential positive preparation.** The first actor accepted successfully; the second actor never sent an action-accept POST before the round became skipped. The concrete failure is a producer timing/sequencing gap. These bytes show the server and UI closing private permissions at expiry; they do not establish an unsafe product transition, incorrect TD choice, cache authorization bypass or need to extend TTL.

The original result remains **7 PASS / case08 FAIL / 8 NOT_RUN, cleanup PASS**. METHOD12's earlier PASS_METHOD_ONLY accepted its observer/one-click guards, not the feasibility of two complete serial action-consent flows inside the remaining server window. No functional repeat, product edit, producer edit, seed/retry/TTL change occurred during this review.

## Exact evidence

Actual evidence INDEX `bacb33c162d316a2ae7b495a3b2196c1f6f67e32f7840af845286ddc9b24c955`, all45 child hashes/sizes verified. Source1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad/1813, imageff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4; actual before/after inputs equal and runner reports source/producer unchanged. The six production source pins inspected here match that actual source inventory. Verification and an independently derived timeline are in [inputs.json](inputs.json) and [timeline.json](timeline.json).

The source records are `evidence/p05/method12-chromium-preflight-01/run/topic-browser-report.json`, `delivery-metadata.json`, `failure-details.json`, `browser-tests.txt`, and `runner.json`. Timeline JSON gives exact JSON pointers and delivery row IDs. The independent reviewer also viewed `run/chromium-en-failure.png`: round12 remains selected, its private/action panels have cleared, and own Pause/Stop remain visible. Screenshot appearance alone is not the cause oracle.

## Actual sequence

Times below are native Node observer milliseconds, not wire timestamps or React cache instrumentation.

| Observation | Actual evidence |
|---|---|
| Invitations both accepted | EN POST213556.390; TR216090.651, exact receipts |
| TD choice succeeds | EN `game-dare` POST220194.398, receipt verified; target rev27 has pending action |
| New topic succeeds | EN `topic-new` POST227115.323; target rev28 has a fresh pending action, expiry `1970-01-01T00:20:55.653Z` |
| Bilateral topic consent succeeds | EN234972.001 then TR240414.742, exact receipts, rev29/30 |
| Readonly prompt preparation completes | phase17 starts242059.375, both participants READY by247022.636; individual last READY247002.082 |
| First action consent finally dispatched | EN254785.807; exact HTTP200 receipt, rev31. Readiness reports only885.160ms of its conservative private observation lease before the click |
| Remaining action deadline is short | delivery own row1165: request255476.078, server20:54.021, expires20:55.653: only1632ms server-relative, not a fresh30s window |
| Second action POST | **Absent**: exactly one scope=action request in actual phase metadata and exactly one action dispatch event |
| Expiry/reconciliation | next self-actions row1171 observes rev32 at server20:56.088, after action expiry. Final fixture/current round is skipped; all three actors have accept_action=false |

Delivery target rows1046/1049 prove pending action after dare. Rows1070/1078 show the new action expiry after the new topic. Rows1119/1125 still show both actors pending at rev30, with that same expiry. Invitation expiry remains `1970-01-01T00:23:14.470Z`, so it was not the parent invitation expiring here. The first action receipt does not extend the pending deadline for the other actor. Actual live WebSockets remain1 per actor at failure, and this positive case did not inject a transport/source failure.

The stack fails in the second `acceptActionsUi` iteration at `ownUiRound(...,'action-accept')` waiting5000ms for an absent control. The report's last_control still names the successful first EN click because the second iteration never reached click. Reading last_control as a failed EN dispatch would be incorrect.

## Source explanation and independent controls

`packages/relationship-engine/src/consent.ts` fixes pending/action at30000ms. `consentResponse` keeps the original deadline after the first acknowledgement; two timely acknowledgements activate until the parent limit, but acknowledgement at/after deadline is terminal. `apps/api/src/topic-games.ts` begins the TD action only after choice, and candidate replacement creates a new pending action. Its `reconcile` explicitly closes the round as skipped and clears private state when a consent becomes expired. The private UI renders action consent from current target data; skipped scope and false self permissions correctly remove the control.

[Eight independent source controls](source-controls.json) PASS, exit0. They transpile exact current consent source and exact API close/reconcile/beginAction method AST text. They verify30s policy, no deadline extension from first acknowledgement, second late acknowledgement rejection, two timely acknowledgements activating without extending policy, pre-expiry round preservation, expiry causing skipped/private clear, active action surviving its old pending deadline, and action beginning only after TD choice. DB writes/presence/encryption-AAD are explicitly inert boundaries; this is cold source behavior, not an actual API/DB/browser authorization proof.

The actual delivery rings document172 HTTP and432 WS older-row evictions. The retained latest target/own transitions, exact mutation receipts and final fixture agree on this cause. No exact internal application cache state or exact server transaction-end timestamp is claimed. Conservative observer leases must not be equated to the server action deadline.

## Minimal recommended METHOD13 fix

Keep all sixteen identities and original topic prompt/no-preview/recipient assertions. Preserve disconnect, held-response, native6300ms expiry tail, original5000ms content matchers, seeds, room/session bounds and production source exactly. Change only positive action-consent preparation and add its finite controls.

1. Replace repeated `coherentGame → ownUiRound → mutationClick(normalPrivateReady) → coherentGame` for each actor with **one shared absolute8000ms action preparation phase**. Each actual participant obtains normalPrivateReady with the exact session/round and minRev propagated from the last successful receipt; it still requires the complete ordinary batch, correct own permission and actual DOM. One exact POST/UUID/receipt and one click per actor remain mandatory.
2. Do not reuse an earlier rev30 ticket after the first actor commits rev31. The second actor must reobserve its complete current batch at least rev31 within that same original phase. The first acknowledgement does not grant a new8s budget or extend the server deadline. Partial/expired/unavailable own permissions must fail without click retry.
3. For known fresh positive case08, call that helper immediately after the unchanged `acceptTopics(f)` and before `actionAndFinish`'s diagnostic target reads. This mirrors existing positive case05. `actionAndFinish` then follows its existing strict preaccepted branch: both actual target projections active/own accepted, correct IDs/revisions/expiry, fresh own finish permission, no finish for peers, exact finish receipt and final completed state. This moves duplicate target/coherence work after both acknowledgements without dropping its assertions. Apply the same pattern to a freshly changed positive YB action where needed; preserve the conditional change itself and fresh bilateral topic consent.
4. Review the exact derivative as a new method, then perform a new actual run. Static acceptance or this diagnosis does not predict a PASS; resource/HTTP latency can still expose a real availability issue. Keep the original FAIL immutable and no reselection/reseed/TTL relaxation to obtain PASS.

Required new finite controls: one shared phase without reset; exact session/round/minRev propagation; rev31 second-actor reobservation; expired or partial permission fails; exactly two separate ordinary POSTs/UUID receipts and at most one click per actor; failed first acknowledgement prevents the second; actual both-active target/own finish assertions remain; original case identities, negative bodies and expiry tail byte comparison. The full candidate needs another independent reviewer. This reviewer authored the separate layout candidate and must not accept that layout implementation.

No production fix is justified by this failure alone. A broader UX discussion about overlapping topic/action consent lifetimes or observed service latency is separate from this minimal producer repair; changing the timing contract requires a source revision/ADR and its tests rather than disguising the current failure.

## Preserved reviewer attempts

Initial read-only filename guesses were corrected using rg --files. Python analysis attempt01 failed on Windows cp1252 decoding of UTF-8 RU text; explicit UTF-8 then passed. Two source-probe attempts exposed missing VM bindings for the declared fake DB AAD boundary and real node:crypto randomUUID; final eight controls passed. Earlier attempt notes overstated the number of checks reached; authoritative final count is eight, not nine. Source scripts and notes are retained; no failed attempt was an observed product defect.
