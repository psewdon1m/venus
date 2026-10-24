# Independent diagnosis: corrected-source METHOD18 actual03

**DIAGNOSIS_COMPLETE_PREDICATE_MISMATCH_REPRODUCED_ACTUAL_FAIL_PRESERVED.** No new product defect is proved by this packet. Case06 still failed; the result is5 PASS/1 FAIL/10 NOT_RUN, cleanup PASS. No Docker/browser rerun, product edit or producer edit was performed by this reviewer.

All49 frozen children of actual INDEX `68987282f74c5bae68322ae6e4662dca571f7bc391e8c0b78fbd55ff37d2e2cf`,40 archived/original raw pairs,1823 identical before/after source entries and10 producer pins verify. Exact source is `aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee`; image `sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5`. The frozen dirty-source qualification and historical failures remain unchanged.

The failing step is replacement advice submission after editing the accepted advice and filling SYNTHETIC ADVICE TWO. Game revision36, round14 and round state remain active; EN/TR are the private actors and RU is an outsider. The final model snapshot is observer cycle48, own/target/conversation200, chat absent, no accepted batch, no body error or overflow. No second offer_advice POST was sent. The last committed mutation is the earlier recipient advice-accept, with an exact200 receipt.

## HTTP and cycle evidence

Chat did not return an error. EN chat responses555/575/591 are all200, active, with the exact production chat validator true and no domain error. The delivery observer's HTTP cycle73/74/75 IDs are a separate counter from private observer batch46/47/48.

| Observation | Native ms |
|---|---:|
| Edit preparation READY, observer46 |119221.4|
| Filled input preparation READY, observer46 |119361.8|
| Existing accepted lease deadline |119934.5|
| New offer preparation starts |119393.0|
| Next EN own request begins, delivery74 |119406.8|
| Delivery74 target completes200 |120509.5|
| Delivery74 conversation completes200 |121496.9|
| Delivery74 chat completes200 valid |122611.4|
| Next EN own request, delivery75 |124271.3|
| Offer preparation deadline |127301.6|
| Delivery75 chat completes200 valid |127627.3|

The final `chat:null` therefore means the last accumulating batch had not received its final chat by the deadline. It is not evidence of a chat HTTP failure. A prior complete valid chat arrived well before the deadline. Individual own→chat durations around2.6–3.4s are below the5s local permission lease, yet ordinary sequential batches can leave gaps after the previous lease expires.

## P05-BROWSER18-ACCEPTED-LEASE-001 (P2, test predicate)

The exact frozen observer `private-batch-observer.mjs:51` unconditionally sets `s.accepted=null` and clears its model whenever an ordinary own GET starts. Its snapshot uses only the new accumulating batch. In contrast, actual `TopicGamesPanel` begins a same-scope refresh with `cache.issue()`/`cache.bind(s)` (`topic-games-panel.tsx:40–43`); these operations do not clear an already accepted, unexpired same-scope `TopicCache`. There has been no new response/denial, credential change, revocation or scope transition at request start.

The finite `lease-counterexample.mjs` executes the real pinned observer and real production TopicCache source with synthetic DTOs. Both first accept a complete valid batch with expiry6000ms. At5500ms, an ordinary same-scope own GET begins without any response: production cache remains visible with500ms left, while the observer becomes BATCH_INCOMPLETE with no accepted cycle and zero lease. At6000ms the production cache still expires normally. This reproduces the predicate mismatch without extending TTL or bypassing authority. It does not observe the application's actual cache.accept or React state in the recorded browser run.

In actual03, the corresponding new own request starts about528ms before the prior accepted lease deadline, immediately after successful edit/fill preparation. The extra submit preparation therefore discards a potentially valid pre-existing presentation window and waits for another batch. The actual panel's250ms clock effect explicitly clears adviceText/editing when the real lease is not visible (`topic-games-panel.tsx:55`). By failure, advice-offer is disabled while advice-edit is enabled, consistent with invalid/cleared draft text after the wait. Actual final text/editing values and per-iteration DOM decisions were not captured, so this draft-loss chain remains an inference, not a direct observed field-value proof. No evidence supports a consent-expiry, server paused state, bad chat status or application authorization denial in this failure.

## Minimal correction and required negative boundaries

Keep the new accumulating observer batch separate from the last accepted complete batch. Starting a same-scope ordinary refresh must not alone destroy the accepted unexpired model. A snapshot may use the still valid accepted batch until its original deadline, a compatible newer complete acceptance, or an explicit scope/transport/revocation/authority invalidation. Never combine parts from two batches. Preserve absolute phase deadlines, minimum250ms, intended-input checks, exact one-click/one-receipt behavior, bounded pending/body/record capacities and all16 scenario assertions. Do not refill inputs, retry mutations, extend leases or change application consent behavior to obtain a PASS.

Independently review the forthcoming producer correction, including new own-response permission denial/shorter expiry so an older positive permission cannot override newer negative authority facts; explicit game/epoch/scope/WS invalidation; late old responses; rejected/malformed/overflowed batches; and ordinary expiry. This is a narrow correction to the existing readiness predicate. A new actual run requires root ACK after that method review. Actual03 and earlier FAILs must remain immutable. This diagnosis does not claim full browser or P05 acceptance, human card approval, r4 text UI coverage or production/device evidence.

Safe per-response timeline and exact source copies are included. Independent audit and source-state counterexample both exited0; no new functional workload was run. Writes COMPLETE.
