# P04 implementation review — round02

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19, inspection began03:29:28+03:00.
Status: **CHANGES_REQUESTED**. Scope: technical working-tree review, **NOT_ACCEPTANCE**.
Baseline: `main` `579ca40a9344fd0af841ff2e2883e394321dfbe7`.
Candidate: dirty/uncommitted working tree. Source freeze and final source-bound acceptance have not occurred.

Independence: no production, test, validator, contract or content edits by reviewer. Only this report was written. Reviewed changed Games/Rooms/routes, catalogue/authoring/CLI and the implementer's real-PG/HTTPS/WS fixture, runner and current reports. The reviewer inspected the actual test implementation and saved output, but did not independently rerun runtime tests in this preliminary round.

## Resolution of round01

| Finding | Result | Evidence inspected |
|---|---|---|
| P04-I01 missing-ledger bypass | CLOSED in inspected code | Non-synthetic Games installs a default catalogue guard whose pinned read throws CATALOG_LEDGER_REQUIRED; legacy provider cannot bypass it. Attaching the real catalogue replaces that guard once. The missing-ledger test directly exercises a retained pack. This is a deliberately disabled catalogue, not proof that production content is approved. |
| P04-I02 Prepare/Start authority | CLOSED in inspected code | Both Prepare and Start select catalogue.active(c) when attached. Availability is a host-authenticated waiting-draft endpoint, uses the actual planner and returns only generic feasibility; Start builds a fresh snapshot and preflights again. Runtime service constructs legacy provider=null and successfully exercises the catalogue path. |
| P04-I03 stale public WS snapshot | Original race CLOSED, follow-up below | sendGame no longer emits bundle.game directly. It calls dispatchGame under shared global catalogue lock+room lock, rechecks current session/generation/entry acceptance and projects freshly before synchronous enqueue. Actual WS test delays the old socketState bundle, withdraws, resumes and sees aborted/null snapshots. |
| P04-I04 omitted batch constraints | CLOSED for stated mismatch cases | Reservation now retains pack/context/interaction and scope/comfort/stage distributions; record enforces them and persists them in its immutable event body. CLI constructs constraints from the validated original request and records its byte hash. Additional unit negatives/CLI round trip remain implementer's ongoing work and must be included in final evidence. |

## New finding

### P04-I05 — P1 — Final public dispatch performs writes and sends their projection before commit

Location: `apps/api/src/rooms.ts:281–282`, `apps/api/src/games.ts:303–304`, and Games.reconcile/save/bump.

dispatchGame calls `games.socketView(...)` within the final transaction and then synchronously enqueues its result before Rooms.transaction reaches COMMIT. socketView is not a read-only reconstruction: it calls reconcile, which can expire consent, save the round, increment game/room revisions and queue private clear references. socketView can also queue missing references. A consent deadline may cross between the earlier committed socketState and this fresh dispatch, so this write path is reachable during an otherwise ordinary WS tick.

If the final transaction's COMMIT fails, the already transmitted game snapshot can contain game_rev/room_rev values and round state that never committed. After rollback the database has the preceding revision, while clients have already accepted a higher stream_rev. A client can then discard the actual committed snapshot as older, retaining an incorrect state until later mutations catch up. The shared/exclusive fence fixes the stale-revocation race but does not make these uncommitted writes safe to publish.

Required correction: make final public dispatch use a genuinely read-only projection of committed state, as privateDelivery does. Perform any expiry/reconciliation/outbox writes in a separate transaction that commits before the final dispatch read. Keep the final catalogue+room/generation/ACL fence through synchronous enqueue. A clock/deadline check may suppress a stale projection or schedule a later reconciliation, but must not publish transaction-local revision increments. Audit any helper reused by this path for hidden writes.

Regression needed: advance the test clock across a pending consent's deadline between socketState and final public dispatch; inject a real deferred commit failure for a reconciliation write. Assert that no uncommitted higher game/room revision or expired transaction-local state is delivered and that the next successful committed snapshot is accepted. Alternatively enforce the final projector's read-only property directly with PostgreSQL transaction read-only plus a realistic deadline boundary and assert it succeeds or safely withholds delivery. Retain the actual delayed-public-withdrawal test and both private-recipient monotonic-clear regressions.

## Inspected runtime evidence and limits

`.artifacts/p04/runtime-report.json` contains PASS for nine named proofs across eight tests: separate migration, atomic CAS pointer, host-only pre-start shortage, pinned rollback/restart, delayed actual public WS revocation, both private prior-recipient clears, fsynced intent after real deferred DB commit failure, full pg_dump/pg_restore with revived active game aborted by external-ledger replay, and default production missing-ledger rejection. The test source corroborates the specific mechanisms; in particular the restore starts from a genuine earlier active-game checkpoint rather than merely editing rows.

`.artifacts/p04/runtime-runner.json` records isolated scope and completed cleanup, PASS and source_dirty=true. Its source_sha is baseline main because the candidate is uncommitted. This is useful development evidence only; it must be rerun and bound to the final candidate/source identity after fixes. The existing commit-failure test targets catalogue withdrawal; it does not exercise the newly identified dispatch reconciliation/phantom-revision failure.

This report does not close production catalogue/human gates, certify immutable release linkage, or replace the final independent review. No new human blocker is inferred from this code issue.

## Inspected snapshot hashes

| File | SHA256 |
|---|---|
| `apps/api/src/games.ts` | `c2616e40cf7224ea17ee1e4b24a28c95c288f38253dd446b4917c71f09a7337a` |
| `apps/api/src/rooms.ts` | `c03294d2bb6b235531c3bb856a2018c14f2a10c25612f020c675356b37594798` |
| `apps/api/src/room-routes.ts` | `edaa864a909d8861c98ae49871138d659d330cb77c820add5bee5603ca5e32e5` |
| `packages/card-catalog/src/authoring.ts` | `bdf911d3c7e81b2e1fb66aca74f834ce9bd24365b0f28ea72d0c63ea002e9a8d` |
| `tools/card-catalog.mjs` | `2066ffd2bed1124f255bca44a7e21935f9787b0b9a526c94232dc4b691b0ee7f` |
| `.artifacts/p04/runtime-report.json` | `e0971ffdae09abcae0ffa30fd4bca903101b7768305525a1f70c7982b7ee47a7` |
| `.artifacts/p04/runtime-runner.json` | `fb104b92e5e7b54e6afe57b95fefbe138e513eb9b4648b0a5851f10b597f1d83` |

Open implementation findings: **one P1**, P04-I05. Four round01 findings are closed for this inspected snapshot; later source changes require fresh review.
