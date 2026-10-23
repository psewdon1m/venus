# Independent A17 browser23 case09 diagnosis

**DIAGNOSIS_COMPLETE_NATIVE_FAIL_RETAINED. P2 method-preparation gap confirmed; an application defect or the exact native409 subtype is not proved.** Original browser acceptance remains FAIL:8 cases PASS,09 FAIL,10–16 NOT_RUN. Worker/outer cleanup PASS and all three owned-resource inventories empty. No rerun, APP/method/ACK edit or native query was made.

The exact A17 source/image and activated ACK bind this actual. Inputs-before/after equal freeze14/1871/source `93221ba4...`; all saved producer pins equal both saved and working producer23. Root wrapper, image ID and source-binding review `8810dede...` match. Original failure logs, reports, passive metadata, source/producer hashes and root exit1 are retained in this packet or RAW-PINS. Other raw screenshots/harness/input/producer files are pinned in place; no compose environment or private response body is published here.

The failing action is the RU secondary actor's **second** condition edit in the YesBut private encounter, session/round fixed, round17. Initial condition edit, bilateral topics and both action accepts already returned200. `browser.mjs:236:395` calls `mutationClick(...game-condition-submit.../condition)`; `request-emission.mjs:43` asserts exact200 and receives409. The emitted request is observed at159923.237734ms within its prepared private deadline163698.157388ms; dispatch was real, not a missing click, lease expiry or timeout. Intended-value preparation passed. The exact response code is recorded only as null/**unlisted=true**, not as an allowlisted enum. Exact request expected_rev is not recorded.

Saved ordering establishes the missing preparation premise:

| Saved event | Revision/state |
| --- | --- |
| RU first action accept exact receipt |40 |
| EN second/final action accept exact receipt |41 |
| acceptActionsUi phase completes at159792.339174ms |Final minRev41; phase READY |
| RU condition request at159923.237734ms |Only131ms after that phase |
| RU last retained page current/self-actions |40/pending, propose_condition=true |
| Captured authoritative fixture |41/active, correct secondary/round |
| First retained RU game.snapshot41 |160210.132825ms, after dispatch |
| First retained RU current41 response |160322.237195ms, after dispatch |

These native times describe this interval only. Passive metadata is a bounded tail (HTTP5/WS398 ring evictions, not work/conversation overflow); diagnostics COMPLETE, pending0/errors0, no body/validator/WS-parse failures. No missing-history or whole-attempt timing claim follows.

The concrete source gap is that `acceptActionsUi` returns `{minRev}` after both exact receipts and **host/backend** `coherentGame`, without waiting for the secondary actor's page to observe the final revision. Case09 discards the return and immediately calls `fillPrivate`/`mutationClick`. `normalPrivateReady` defaults its minimum to that actor's `lastGameView`; the recorded readiness can therefore be internally coherent at40 while the peer has committed41. In contrast, the initial condition path calls `ownUiRound` against a fresh coherent fixture, and advice flows explicitly prepare after their exact receipt revision. The private observer correctly labels its result model-only/cache_accept_observed=false; READY is not proof of post-peer-commit React freshness.

Source `topic-games-panel.tsx:92` serializes `expected_rev:game.game_rev`; server `topic-games.ts:167` calls the revision guard before the condition mutation, and that guard at87 rejects mismatches with REVISION_CONFLICT/409. Expected_rev40 against41 is therefore a strong explanation consistent with every retained event. **It is an inference:** `last_ui_game`/self-actions are passive GET projections (`browser.mjs:101`), not direct React generation/state acknowledgement; neither the actual sent expected_rev nor raw409 code was retained. The error whitelist omits REVISION_CONFLICT and also omits other server409 codes. Do not claim an observed native REVISION_CONFLICT, exact request40, an APP memo regression or CSS cause. No room/actor/control mismatch is evident; actual input/type/handler bytes are unchanged and the dispatch succeeded.

Smallest justified correction: keep the final consent receipt minRev and require the **same secondary actor/session/round at or above that revision before condition editing/submission**, using the existing coherent/own-UI/private-readiness mechanisms. Carry that known minimum through the existing bounded field and dispatch preparation rather than replacing it with an older passive observation. Preserve intended text, native click, exact200/receipt correlation, fresh-consent/private-clear assertions, all16 cases, existing absolute preparation and whole-run bounds. No sleep, virtual clock, auto-retry/resample, accepted409, timeout increase, injected revision or new framework is justified. A tiny allowlisted expected_rev/REVISION_CONFLICT diagnostic could make a future failure decisive, without recording bodies; it is not evidence that this subtype occurred here.

This is a confirmed fixture precondition omission sufficient to make case09's positive200 expectation unqualified at the observed revision40. It does not exonerate every application path or convert this actual FAIL to PASS. Review the minimal method change independently, then root may authorize one fresh complete browser attempt on the same frozen APP. Layout's current browser prerequisite remains held until the accepted method actually passes.

Own read-only audit exit0. Two ad-hoc metadata inspection mistakes (dict route used as Counter key, nullable payload_scope treated as object) were corrected only in read-only queries; no source or evidence changed. Writes STOP.
