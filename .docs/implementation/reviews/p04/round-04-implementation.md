# P04 implementation review — round04

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19T03:49:03+03:00.
Status: **IMPLEMENTATION_PREFLIGHT_PASS** in the limited HTTP/final-dispatch compatibility scope below.
Acceptance boundary: **NOT_FINAL_SOURCE_ACCEPTANCE**; not EXIT-P04 acceptance or approval of production content.
Baseline HEAD remains `579ca40a9344fd0af841ff2e2883e394321dfbe7`. Candidate is still dirty; final source freeze and gate-artifact work are pending.

Independence: reviewer edited no production code, tests, validator, contracts or authoring content. Only this new report was written. This round inspected the actual HTTP routes/delivery helper, Games final projectors/receipt handling, Rooms authorization and relevant contract supplement/runtime tests/evidence. Test execution was not independently repeated by this reviewer in this preflight round.

## Round03 findings resolved

| Finding | Result and observed correction |
|---|---|
| I06 stop/abort response contract | CLOSED. Routes return Games.stop's original scalar MutationResult directly, without a catalogue-dependent follow-up view. The real HTTPS regression checks exact response keys and replay equality after preparing another session. The stop implementation itself performs no pack projection, so an unavailable catalogue does not introduce an acknowledgement read dependency. |
| I07 original mutation/session replay | CLOSED. Advance/pause/resume retain the returned persisted GameView and call dispatchHttpReceipt. That dispatcher validates the original body.session_id, its pinned pack and the referenced card revision; it never substitutes the latest room game. The stored idempotency body remains unchanged. Actual HTTPS replay of an old pause after stop/new-session prepare is deep-equal to the original response. |
| I08 hidden final authorization writes | CLOSED. Final HTTP View/Target/Receipt use access with allowInactive=true, followed by an explicit non-null-slot guard. Authorization no longer invokes reserve/emit. The real PostgreSQL update-rejection trigger plus inactive-member dispatch test denies without enqueue, member update or slot resurrection. |
| I09 terminal action-state retrieval | CLOSED in inspected code. The action branch permits terminal game/round state, skips card/snapshot projection, requires the current round's authorized actor and computes expiry using pure reconcileConsent. It returns the actor's scalar ActionConsentState, without reopening consent or sending a prompt/condition. Other targeted content retains active-state/snapshot/consent checks. |

The P04 supplement explicitly documents the narrow transport safety-redaction exception: if the original public card cannot safely be returned because of withdrawal/current ACL/dependency failure, current_round becomes null while original receipt metadata stays unchanged. The encrypted cached result is not overwritten. Thus a successful committed mutation remains an acknowledgement and a later retry cannot silently become another session. This is a justified documented compatibility choice; consumers must treat a mutation receipt as the result of that operation and use GET current/WS for current state.

## Dispatch behavior checked

- Public and private content is synchronously enqueued under the final shared catalogue/room authorization fence. Raw HTTP JSON retains no-store, content type/length, nosniff, referrer and CSP headers. No asynchronous serializer or onSend hook intervenes between the final read and raw.end.
- publicDelivery remains a committed-state read-only projector; no reconcile/save/bump/queue path was reintroduced. Exact consent expiry suppresses the current round without fabricating a higher revision.
- dispatchHttpTarget uses read-only authorization, current actor membership and final clock checks. The terminal scalar-action exception is separate from actual card/prompt/condition eligibility.
- dispatchHttpReceipt returns content-free/generic receipts directly. Public receipts revalidate the original pack/card under the fence. A failure conservatively redacts text rather than inventing a failure of the already committed mutation; a single-delivery guard prevents a second send following an already enqueued receipt/commit error.
- stop/abort, start and other scalar mutation acknowledgements contain no card text and do not need a catalogue text projection after commit.

No additional concrete implementation blocker was found in this limited follow-up scope. I01–I09 are closed across their inspected revisions; historical CHANGES_REQUESTED reports remain intact.

## Evidence inspected and remaining acceptance work

Actual runtime code and reports show eleven tests with thirteen named PASS proofs. Newly inspected proofs include mutation receipt replay and read-only final authorization; prior actual HTTPS/public+private WS delayed-withdrawal, both private clears, PostgreSQL read-only expiry, CAS pointer, commit-failure durable intent and full older-backup restore/reconcile remain present. The runner records forced runtime build, isolated scope, completed cleanup and unchanged before/after identity `20bb70236092d76f29f834f081c8f7391c620bf932bdad0cd817e120d894fe43`, explicitly source_dirty=true.

These are development-tree proofs. Final acceptance must bind the complete frozen implementation/source identity to fresh required checks, all P04 evidence, independent final reviews and honest external gate status. This report does not approve later gate-validator changes, assert complete final CI evidence or certify the independent human catalogue/rights/localization requirements. A terminal action-state regression covering a stopped/expired offer is useful final coverage for the repaired branch; code resolution here is based on the explicit inspected branch and inherited semantics.

## Snapshot hashes

| File | SHA256 |
|---|---|
| `apps/api/src/games.ts` | `52c63df7f21fb09f8e15f66a78dd91ff10f7645cd0906690e4657636ba0cbe4e` |
| `apps/api/src/game-routes.ts` | `4466f64c6c64f88036202a7273a9e2f1a80d26ffaf92247841535b62d659aa2a` |
| `apps/api/src/http-delivery.ts` | `961e95a02c1df9663c260b39c29af434ed23b85b21d369a4c89c5cf68986d220` |
| `apps/api/src/rooms.ts` | `46edbc8dc60e6a93f50da89b55d57caeb9bfd368ad861e018dc10af53e6364a1` |
| `.docs/contracts/p04-catalog-supplement.v1.json` | `c68605a6ef5381074d334a003f0e01ff44faa823e1d89ed29346210176d190cf` |
| `tests/p04/runtime.integration.test.mjs` | `c89cdc381b92a35788d6c3a68781a9c2f72aa8857f830c272db929da6d35f54d` |
| `.artifacts/p04/runtime-report.json` | `f76a61d3462f0f3b475d3b5fa921ae8ae132faf021c577d9dd31f8b78980fc07` |
| `.artifacts/p04/runtime-runner.json` | `1b2444ba147e6b1c27627e184213d185fa1910d604d80725fdccbf287bd51869` |

Open implementation findings in this follow-up scope: **zero**. Result remains limited **IMPLEMENTATION_PREFLIGHT_PASS / NOT_FINAL_SOURCE_ACCEPTANCE**.
