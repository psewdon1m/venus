# P04 implementation review — round01

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19T03:24:32+03:00.
Status: **CHANGES_REQUESTED**. Scope: technical implementation review, **NOT_ACCEPTANCE**.
Baseline: `main` `579ca40a9344fd0af841ff2e2883e394321dfbe7`.
Candidate: uncommitted, dirty working tree; no immutable candidate SHA exists. Findings apply to the file snapshots identified below, not to later concurrent edits.

Independence: reviewer changed no production code, tests, validator, contracts or authoring material. This report is the only write in this review round. Read-only inspection covered card-catalog catalog/authoring/json/coverage/revocations, API catalog/migration and changed Rooms/Games/server, CLI, relevant existing routes and new unit tests. Runtime tests were still being authored by the implementer. No test execution or acceptance claim is made here. Known draft quantity/human-review blockers are intentionally not reported as code defects.

## Findings

### P04-I01 — P1 — Missing ledger configuration silently removes the withdrawal checks

Location: `apps/api/src/server.ts:26` and `apps/api/src/games.ts:54`.

Catalog is attached only when `CATALOG_REVOCATION_LEDGER_FILE` is truthy. Otherwise startup reports healthy after the schema probe, while `Games.pack()` uses optional `this.catalog?.assertPinned(...)` and can serve a retained pinned pack without ledger or withdrawal reconciliation. A null provider only prevents preparing/starting new games; it does not protect games restored from an earlier DB backup. In particular `/game/current` uses safety access and does not require the currently configured offer, so the production offer=null boundary does not prevent this retained-game read.

Concrete trigger: restore a database containing an active/paused session and its `game_packs` row, omit the catalogue ledger environment variable, then read current game using a still-valid room session. No catalogue consistency/withdrawal check is executed. A card withdrawn after that backup can be served again.

Required correction: production serving must fail closed whenever a required catalogue ledger is absent or unreconciled. Require/provision an operator-owned ledger explicitly, or provide a narrowly specified disabled-catalogue mode that also prevents all retained-game content projection. Do not auto-create an empty ledger during startup/restore. Cover real startup without this variable, missing/corrupt ledger, and restored retained sessions; health and reads must reflect the fail-closed state.

### P04-I02 — P1 — Prepare and Start select different catalogue authorities

Location: `apps/api/src/games.ts:104` versus `apps/api/src/games.ts:117`.

Start now uses `catalog.active(c)` when attached, but Prepare still uses the original `this.provider()`. With the actual production construction `new Games(rooms,()=>null)` and a valid reviewed active catalogue, Prepare always throws PACK_UNAVAILABLE, so the active-pointer path cannot begin a game. A stale non-null legacy provider has the converse problem: Prepare can authorize availability against content unrelated to the active pointer or reconciliation state.

Required correction: use the same catalogue-aware source inside the transaction for Prepare and Start, preserving explicit synthetic test support without a production fallback bypass. Connect the pre-start safe-availability result to the actual preparation flow; the exported helper by itself is not a pre-start user-visible shortage check. Start must still reevaluate independently. Positive test must attach a catalogue and set legacy provider=null, then Prepare+Start successfully against the active digest; negative tests switch/null/withdraw the pointer between preview and Start.

### P04-I03 — P1 — Public WS card snapshots leave the revocation fence before enqueue

Location: `apps/api/src/room-routes.ts:98–102`, called from lines120/128; `apps/api/src/rooms.ts:274` and transaction commit at line42.

The new global shared lock protects projection inside `socketState`, but the method commits and releases it before `sendGame` enqueues `bundle.game` directly with `socket.send`. Unlike private delivery, the public path has no final reconstruction/recheck under a serving fence. Another process may acquire the exclusive catalogue lock, withdraw the card and return successfully after socketState's commit but before this older public snapshot is enqueued. The old payload can then redisplay an unsafe public card after the withdrawal operation completed, even if the later periodic snapshot eventually clears it.

Required correction: reconstruct/check and synchronously enqueue public game content under a shared catalogue+room/ACL fence as well, or an equivalent proven dispatch mechanism that invalidates stale bundles. Do not merely add a check before the earlier socketState commit. Audit the same response boundary for HTTP game-content reads; it must have a clear linearization policy and must not enqueue known stale revoked content.

Regression: pause public delivery after a bundle is projected, perform a real PostgreSQL exclusive withdrawal from another transaction/process, resume delivery and assert the old card is never enqueued. Verify initial connection and ticker update, both actor/public group content, and monotonic generic cleared/aborted projection. Keep the private final-fence tests. This is a synchronization proof obligation even when a single-process unit test happens to enqueue without an observable scheduling gap.

### P04-I04 — P2 — Recorded batch output is not checked against the actual reserved request

Location: `packages/card-catalog/src/authoring.ts:7,23–26,36–42`; `tools/card-catalog.mjs` reserve/record commands.

The reservation stores only batch/mode/range/count/base digest/request hash/author identity. The full batch request validated by the CLI is discarded. `record()` checks cardinality, IDs, mode, batch identity and non-example origin, but cannot check the requested meeting contexts, interactions, comfort/stage/scope distributions, pack_id or other batch constraints. A fully valid card batch with the wrong distribution is accepted and permanently recorded despite its request hash pointing to different constraints. The CLI's record command also does not reload/hash-check that original request.

Concrete example: reserve a two-card questions batch requesting comfort0 for both cards; record the reserved IDs as otherwise valid pair-private comfort1/stage3 cards. The current predicate accepts them because analyze checks card validity, not the missing requested distribution. Equivalent mismatches work for online-only versus in_person-only output or the intended interaction scope.

Required correction: retain or require the exact immutable validated request and independently verify its hash, then validate recorded output against all applicable requested constraints/distributions. Preserve idempotence and immutable revision history; define when an intentional revised request requires a new batch/revision. Add negative tests for each distribution/context/interaction/pack mismatch and actual request-tampering, plus one conforming positive CLI round trip. Do not silently infer the original constraints from generated output.

## Snapshot hashes

SHA256 of inspected files sampled at the timestamp above (later changes require a fresh review):

| File | SHA256 |
|---|---|
| `apps/api/src/server.ts` | `491a6759d346226beaf1c8e78a779063defd3a6c1feaa01a54687c760c8fed0b` |
| `apps/api/src/games.ts` | `08a0f69edaae7610a3ed12f76e0648c684db555e8f04db10cb6cb82df98e99ee` |
| `apps/api/src/rooms.ts` | `8d23fd01d6160f8ac3ce843389dc71466841ad1dff1f1b8b1a8e4ddc2ae0e3c1` |
| `apps/api/src/room-routes.ts` | `320c564fbacda56731f140d9578bd576d1e827614513ed75019345d6bbcdd67a` |
| `packages/card-catalog/src/authoring.ts` | `6763dd2a93c8bdc2724ff4cb2fe26d9d1caafc6a9cf4d70fbd9a296e1e74c91f` |
| `packages/card-catalog/src/catalog.ts` | `dfd6d6f19ca05e2eaa526cdbf0afc2bf65e5d9d02c8407c6b04bf4858c7daf71` |
| `packages/card-catalog/src/coverage.ts` | `8bfc148bc35be47b184460f0ce0b977ee2ddd1d21c9716cda112153134f7f713` |
| `packages/card-catalog/src/revocations.ts` | `a1b6ab3be18058b1ee13f6d8467611e704f7e2f11c236b6563ae07d6a9d6bd95` |
| `packages/card-catalog/src/json.ts` | `29696fb93143404a0e455fa2a779d02dee5fc35cd4a8096c1843383874b71d81` |
| `apps/api/src/catalog.ts` | `6793451a01ef59c70eff7051ba6c1e0dc9cf897c02a90df7b0ddb3b6afe97878` |
| `tools/card-catalog.mjs` | `a362bc7bbefc3b682829a67cd45dde8884f14cdc95320a7d91a1f8707d7334f5` |

## Recheck required

Four open findings (three P1, one P2). After fixes, rerun meaningful unit+real PG/HTTP/WS regressions and request an independent new review tied to the resulting immutable candidate/source identity. Neither this report nor technical fixes imply human catalogue approval or EXIT-P04 acceptance.
