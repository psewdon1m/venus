# P05 private conversation kernel

## 2026-10-19T18:17:36.1858352+03:00 — Task and boundaries

Implement an additive pure private conversation state machine for topic boundaries, renewed bilateral consent, and structured advice opt-in. Owned files: packages/relationship-engine/src/private-conversation.ts, private-conversation.test.ts, and this journal only. No runtime activation, exports, legacy snapshot edits, API, UI, persistence, manifest, or content approval. All fixtures will be synthetic. Candidate taxonomy/map 02 and independent round 02 are context only; the full 450-card catalogue remains human HOLD.

Read .docs/P05_TOPIC_ADVICE_DESIGN.md and existing relationship-engine compiler/test conventions. Plan: immutable deeply frozen state; exact scope and actor pair; pinned vocabulary and candidate proof; topic epochs with bounded attempts and bilateral exact binding; advice opt-in with recipient-safe pending projection; monotonic clock and expiry transitions. Pure kernel cannot itself authenticate external sessions, persist room exclusions across moments, select candidates, or gate an awaited network delivery; integration must supply those fences.

## 2026-10-19T18:24:55.6834937+03:00 — Implemented checkpoint and actual checks

Added the two owned source files. State is immutable and deeply frozen; default topic allow is empty, exclusions are monotonic within this scoped state, all candidate references and labels are validated against explicit supplied pins and vocabulary. Every topic attempt has an internal hash over exact scope, pins, epoch, offer revision, token and full candidate; pending projections expose only topic labels and content-independent opaque token. Full prompt requires both exact acknowledgements. Other question, preference change, decline, expiry or stop remove current grants and revoke structured advice. Topic attempts are capped at three with 5-second spacing and no reused candidate/token/offer ID; declined tags cannot be offered again in the same moment. Advice has exact epoch/topic-offer binding, at most two attempts per direction, explicit recipient opt-in, replacement ID/revision and text erasure on revocation.

Initial module compilation exited 0; first ESLint run exited 1 (no-control-regex on explicit C0 range). Replaced that regex with Unicode Cc/Zl/Zp categories and explicit bidi ranges; no linter disable. First scoped Vitest: 55/55 PASS, module compiler exit 0, lint exit 0. An extra explicit test-file typecheck first exited 1 with TypeScript 6 TS5112 (needed --ignoreConfig); corrected invocation exposed four test helper/readonly typing errors. Those test-only typings were corrected; actual runtime assertions were preserved.

Root early review identified two real requirements: exact ordered actors and delayed advice crossing a replacement topic. Preserved caller actor ordering and now deny reversed scope. Added required advice epoch/topic_offer_id fields and reject a delayed old-epoch send even after the new topic is bilaterally active. Added negative old-ID edit, observed future expiry/no rewind revival, and changed candidate bytes/map pin delivery tests. These are author corrections following root review, not independent gate acceptance.

Final scoped commands (Node v24.22.0, local host, dirty-tree author preflight):
- node node_modules/vitest/vitest.mjs run packages/relationship-engine/src/private-conversation.test.ts: exit 0, 59/59 tests, 18:24:36+03.
- node node_modules/typescript/bin/tsc --ignoreConfig --noEmit --module NodeNext --moduleResolution NodeNext --target ES2023 --strict --noUncheckedIndexedAccess --exactOptionalPropertyTypes --skipLibCheck --types node packages/relationship-engine/src/private-conversation.ts packages/relationship-engine/src/private-conversation.test.ts --pretty false: exit 0.
- node node_modules/eslint/bin/eslint.js packages/relationship-engine/src/private-conversation.ts packages/relationship-engine/src/private-conversation.test.ts: exit 0.

Not implemented/proven: room-global exclusion ledger, persistent restore safety, approved semantic classification, eligible candidate planner V2, persistence, APIs, UI, free-chat semantic enforcement, final asynchronous dispatch fences, C2/fairness or complete topic/advice feature. All source fixtures are synthetic. The candidate02 map remains runtime false and content remains human HOLD. There is no export or runtime activation and legacy engine/index/contracts/snapshots are untouched.

WRITES_FINISHED checkpoint. Root owns subsequent integration, source freeze and manifest; an independent reviewer must inspect this kernel before acceptance. All future writes require coordination with root's actual Docker source freeze.

Exact SHA256 checkpoint:
- private-conversation.ts: fbb3715c6d6c78999594bad1324d372d6e30c89d0e79b147799f1500dac3dbf4
- private-conversation.test.ts: 490829fc144a7c3f21c889a1bb089ac74efb317ec685b65bc89f71176bd8cda9
- P05_TOPIC_ADVICE_DESIGN.md: 581c97fc564ff1a57739f563027b442a12161a044d57bb434007985838165782
- candidate02 taxonomy: 8032941e58350fde347663b9b6cb5c3cee82d179061fe1885e977c2c5fb76d0f
- topic-map-round-02.md: f20dbc90ec4d849ee479714146ccff5ca76860c7d9cd4b884d79fef17ac1d215

## 2026-10-19T18:32:33.1092688+03:00 — Independent finding and authorized fix

Independent kernel-round-01 reports CHANGES_REQUESTED: 41 actual-module probes, 40 PASS / 1 FAIL. P05-KERNEL-001 proves that a delayed content-specific other_question from music can exclude newly accepted food because the command lacks intended epoch/offer binding. Original reviewer files and failing evidence remain unchanged. Waited during root's actual Docker source freeze; root has now explicitly authorized edits to this module/test/journal after the run ended (exit 1, cleanup completed, source unchanged).

Fix scope: require exact original offer/epoch/proposal revision/token for both other-question replacement and topic exclusion. Reject stale/missing intent before mutating a current offer, acknowledgements, preferences or advice. Keep independent unconditional stop as the immediate safety withdrawal. Add pending/active/replaced/expired regressions and correct-intent positive behavior, then rerun scoped checks.

## 2026-10-19T18:33:08.7738480+03:00 — P05-KERNEL-001 correction checkpoint

Changed other_question to require the exact intended offer_id, epoch, proposal_revision and opaque token, for both exclusion and non-excluding replacement. Missing/stale binding returns STALE before current preferences, offer acknowledgements or advice are modified. Generic stop remains unconditional within authenticated exact scope. Normal time advancement/expiry still occurs first; this is required for fail-closed clocks, not consent to replace a new question.

Added nine durable regression cases: delayed old intent with both exclude=true/false against pending, one-ack and accepted new topic with live advice; each binding-field mismatch for pending/active states; missing intent denied while stop works; valid current pending exclusion; expired old intent and later replacement. Assertions compare entire state bytes at the same current clock, proving stale requests do not revoke new acknowledgements/advice or add wrong exclusions.

Actual author dirty-tree scoped preflight at 18:32:57+03: Vitest exit 0, 68/68 PASS; strict TypeScript noEmit including both source and tests exit 0; ESLint exit 0. Original independent round01 FAIL remains preserved. A separate reviewer must rerun and decide the finding closure. No runtime/API/UI/planner/ledger/content activation is claimed.

Exact SHA256:
- private-conversation.ts: 57d33ce1af14b4a3a69979a004a7c7122e529f2420ce99cb678089361120ccfd
- private-conversation.test.ts: cb77d6b23143e75f5df10bdb10f303f80e2871f40c9c7097b5be64104e9dc1db

WRITES_FINISHED after authorized correction; all own writes paused pending root coordination.
