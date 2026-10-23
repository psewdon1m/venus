# P04 implementation review — round03

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19, inspection completed03:44:15+03:00.
Status: **CHANGES_REQUESTED**. Preliminary technical review, **NOT_ACCEPTANCE**.
Baseline: `579ca40a9344fd0af841ff2e2883e394321dfbe7` (accepted main/P03).
Candidate: dirty working tree before the subsequent HTTP compatibility fixes. The inspected runtime runner binds development identity `cda0e430b75810b561f319ebf07c1c6d7ad218bf54dbde29ce1a02c4ffb99e97`; its baseline source_sha is not a commit containing this P04 work.

Independence: reviewer wrote no production code, tests, validators, contracts or content. Only this report was added, after the implementer confirmed the active quality/negative-hash window had completed. No existing evidence or journal was altered. Later concurrent fixes are not certified by this snapshot report.

## Closed finding

**P04-I05: CLOSED.** Games.publicDelivery now uses a separate read-only projector with row/current lock=false where the outer caller holds the room fence. It contains no reconcile/save/bump/queue. At consent expiry it suppresses current_round without inventing a higher revision. The actual PostgreSQL BEGIN READ ONLY + shared-catalogue-fence test at the exact expiry boundary verifies projection and unchanged persisted game revision. Rooms.dispatchGame uses this projector, rechecks session/generation/acceptance and synchronously enqueues under the final shared fence.

The new raw HTTP enqueue pattern (`reply.hijack`, explicit equivalent security headers, synchronous writeHead/end) is suitable for retaining this final enqueue fence. A final read may safely be followed by a commit failure only when it genuinely projected previously committed data and made no transaction-local changes. The issues below concern callers and response semantics, not a need to return to asynchronous unfenced content delivery.

## Findings in the inspected HTTP implementation

### P04-I06 — P1 — Stop/abort replace the acknowledged mutation result with GameView

Location: `apps/api/src/game-routes.ts`, stop/abort route loop.

The route discards Games.stop's committed `{rev, request_id}` and calls sendView, which returns GameView. The immutable base OpenAPI stop operation requires MutationResult, and the accepted P03 abort supplement likewise requires MutationResult. These are different response shapes, not interchangeable encodings.

The additional post-commit projection can also fail after a successful safety stop: the member may have left or the final view may require an unavailable catalogue. The caller then receives an error despite the already acknowledged operation in the database; retry no longer simply returns the retained original receipt. Stop/abort need no catalogue text in their response at all.

Required correction: return the original persisted scalar MutationResult directly for both safety-stop aliases. It contains no card/prompt text and needs no content re-projection. Verify exact schema/body and same-key replay, including changed offer, missing-catalogue/ledger and an already-terminal game. Do not make a successful safety acknowledgement depend on a subsequent content read.

### P04-I07 — P2 — Advance/pause/resume discard stored idempotent responses and may return another session

Location: `apps/api/src/game-routes.ts`, advance and pause/resume handlers; Games.dispatchHttpView uses the latest room game.

The mutator correctly stores/replays its result, but the route discards it and dispatches a fresh view of the latest game in the room. Replaying the same advance/pause/resume after another operation therefore returns different state/revision/body; after a new session is prepared it can return an entirely different session_id. The accepted P03 contract and implementation use scoped idempotency with retained result bodies, and existing same-key concurrent-advance tests only catch a narrow case where the latest view happens to remain unchanged.

Required correction: preserve the original operation receipt and exact session association. If final catalogue/ACL revalidation requires withholding unsafe card text, define and document a narrow safety-redaction exception while retaining receipt metadata and the original stored body. Do not silently replace a stored response with the room's newest session. A versioned separate receipt contract is another option, but would require explicit contract/client changes. Test replay after another round and after a different session, plus withdrawal/removal between mutation commit and final delivery. A redacted acknowledgement must not imply the mutation rolled back.

### P04-I08 — P1 — Final HTTP authorization can reserve a slot and publish uncommitted state

Location: `apps/api/src/games.ts`, dispatchHttpView/dispatchHttpTarget; `apps/api/src/rooms.ts`, auth/access.

Both final HTTP methods call Rooms.access with allowInactive=false (explicitly for View, implicitly for Target). That authorization helper is not read-only: if the member's slot is null it calls reserve, updates member state and emits a new room revision/outbox event. This may become reachable if a member becomes inactive between the earlier committed phase and the final delivery transaction. Enqueue then occurs before COMMIT, recreating the phantom-revision/rolled-back-reactivation problem addressed by I05, although publicDelivery itself is now read-only.

Required correction: final delivery authorization must never reactivate/reserve or emit. Use a dedicated read-only ACL check, or suppress reactivation via allowInactive=true and explicitly reject null-slot/removed/invalid grants as appropriate. Any intended reactivation must happen in the earlier separately committed phase. Preserve the final catalogue+room lock through synchronous enqueue. Test the slot-null boundary and a commit failure; no member/room/outbox writes may result from the final projector/authorization path.

### P04-I09 — P2 — Final targeted action-state projection rejects supported terminal states

Location: `apps/api/src/games.ts`, dispatchHttpTarget's unconditional active-game and pending/active-round requirements.

Accepted Games.readTarget intentionally calls target with active=false for kind=action and returns ActionConsentState before snapshot/pack checks. That scalar state supports stopped/expired/completed/declined values, including after a paused/terminal game. The new final dispatcher unconditionally requires active game, active/pending round and snapshot/pack access for every kind. Thus an authorized actor's previously valid terminal action-state read succeeds in the first phase but is rejected by the second phase.

Required correction: preserve the existing action-state retrieval semantics using an authorized read-only projection separate from card/prompt projection. It must not expose another actor's acknowledgements or revive consent and must keep normal actor/session authorization. Test action-state GET after expiry, decline, pause and stop/abort, and distinguish this scalar status from forbidden private prompt/condition content after revocation.

## Evidence reviewed

Inspected actual updated runtime test/isolated server code and saved runner/report: nine tests, eleven named PASS proofs, including actual delayed HTTPS public and private reads held before final delivery, withdrawal, then aborted/null public response and denied private prompt. Security-header assertions cover the raw HTTP path. Existing private recipient clears remain monotonic; real deferred PostgreSQL withdrawal commit fault and full pg_dump/pg_restore remain present.

The current runner explicitly records forced runtime build, source_dirty=true, source_identity_before=after and source_unchanged=true. This usefully establishes a stable development tree. It does not cover the mutation-result/idempotency/hidden authorization-write cases above and does not replace final frozen-source evidence. Tests were inspected, not rerun independently in this review round.

## Snapshot identifiers

| File | SHA256 |
|---|---|
| `apps/api/src/games.ts` | `c848d1fd4e16b1a587a42b8fc09b66ba9ea36981db4c856a979e390c896d5fe9` |
| `apps/api/src/game-routes.ts` | `1936aab17800352b38d81bb238620891873e727f596efa98207517ddbd948c08` |
| `apps/api/src/http-delivery.ts` | `961e95a02c1df9663c260b39c29af434ed23b85b21d369a4c89c5cf68986d220` |
| `apps/api/src/rooms.ts` | `46edbc8dc60e6a93f50da89b55d57caeb9bfd368ad861e018dc10af53e6364a1` |

Open findings in this snapshot: I06/I08 (P1), I07/I09 (P2). I01–I05 have been addressed in their respective reviewed revisions. The implementer has already described planned fixes for I06–I09; these require a separate fresh check, not a retrospective PASS of this report. Full EXIT-P04/human content approval remains outside this technical review.
