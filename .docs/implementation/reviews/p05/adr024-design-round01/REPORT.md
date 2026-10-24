# ADR-024 design review — startup, compatibility and rollback

**DESIGN_ONLY_CONSISTENT_WITH_REQUIRED_INTEGRATION_CONTROLS.** Root's original candidate ab17dc01344720159fa8afbf514218fabf928b17b76a2f30078ac78dcd0efa61 plus prospective startup clarification59a0f76fd3855b92eb91903709c909324ba11359602c6504d5e204c08a59faa0 are coherent at this design boundary. No implementation, unit, PostgreSQL, restart or restore PASS is issued. Exact candidates and context snapshots are indexed; no current global inventory proof was attempted after the planned freeze release.

Strict anti-repeat is current-session complete opportunity history including empty opportunities; room-prior semantic content history remains separately preserved and prior-content pair fallback remains a heuristic. Version2 before measurements is appropriate. Old snapshots cannot be reinterpreted as2 or silently skipped; changed RNG outputs are prospective and need fresh source-bound gates.

## Corrected startup applicability

ADR024-D01 P2 in the original candidate is corrected by candidate-round02. The TopicGames method may revoke/quiesce without its catalogue source. Ordinary server still requires compatible released profile/catalog/authority configuration before constructing that method. Existing protocol2 with approved registry empty fails before it; this proves early no-listen only. It does not prove scopes erased, games aborted, DB convergence, maintenance or successful recovery. No synthetic release/profile bypass is introduced.

When compatible prerequisites succeed, startup must await the barrier transaction before listen/admission. Every V2 session loses transient conversation/chat/projection/ref delivery. Active/paused unsupported or corrupt authenticated snapshot headers must abort using row room/session metadata without catalogue calls; snapshot/history ciphertext and host authority roots remain unchanged. Minimal supported header acceptance never grants a prompt: full current source/map/history/auth/final fences remain necessary later.

## Prior-history corruption guard

ADR024-D02 P2 is an acknowledged integration requirement. Current prior() filters snapshot_cipher IS NOT NULL; that alone cannot certify neverstarted. Immutable001_game_state.sql prohibits nullsnapshot for active/paused, so an active-null example is not a valid normal DB path. An aborted/completed started row can nevertheless have nullsnapshot with existing rounds/participants/history under corrupt/partial-restore/operator-damaged data. Filtering it silently would reset semantic history during a later start.

Root agreed to select prior rows when snapshotnonnull OR current_round>0 OR scoped game_rounds/participants/history exists, then require snapshot or return503 TOPIC_HISTORY_UNAVAILABLE. Only demonstrably neverstarted nullsnapshot/no-round/no-participant/no-history drafts may be skipped. All OR subqueries need exact room/session binding and explicit capacity failure. Unsupported/corrupt nonnull prior also fails; no catch-and-continue/history reset. This is an implementation acceptance condition, not a separately reproduced ordinary product bug.

## Required boundary details

- Header reader uses actual snapshot AAD/AEAD and exact supported schema/engine/private/recovery/scope tuple with bounded digest/header types. Check headers before any current_round early continue; active current_round0 is SQL-valid and must not let unsupported revision evade abort. Wrong room/session/AAD cannot mutate another scope. Supported malformed full data still fails closed later; minimal header does not certify catalogue/card/history semantics.
- Snapshot/history chunks and references are preserved byte-for-byte by quiesce; delete only transient kinds/refs. Do not reset exclusions/retirement, provision missing roots or migrate permissions as part of this barrier. Corrupt round bodies can abort without decrypting history. Define crypto/key-unavailable versus malformed-header outcomes explicitly and log only sanitized reason counters; database/lock/capacity errors must propagate to no-listen rather than be swallowed as per-row success.
- Room/session locks, transaction rollback and capacity guards must be tested. A barrier failure cannot emit a success receipt. Repeat startup must never recover old acks/epochs/chat/advice. All supported pairs also lose old process grants. Feature-off must not skip stored-V2 revocation when compatible bootstrap can reach the barrier.
- The upgrade procedure must stop the old API/listeners and drain or terminate old in-flight delivery before a new process quiesces state. A single-host deployment does not by itself prove safe concurrent rolling old/new readers. No such rolling compatibility is approved by this design.

## Realistic rollback and exit

Failclosed unsupported old reader is operational unavailability, not a compatibility migration. Stop new starts, quiesce/revoke private moments, retain monotonic safety and semantic floors, then serve only a reader explicitly compatible with stored revisions. Downgrading cannot revive a previously acknowledged private moment or receive strict-gate compliance by relabelling old proofs. Preserve required historical key material; an unreadable preserved history must block same-room starts until a reviewed compatible path exists.

Experimental close/newroom applies only through an available compatible authorized runtime. With approved0/earlyboot refusal that route is not assumed reachable; no offline retirement command is promised. When available, normal retirement/privacy cleanup and current retention apply, followed by independently created room and fresh entry/18+/preferences. No transfer of private permission/roles or erasure of same-room history to continue playing is allowed. Quiesce preservation does not exempt closed rooms from existing retention rules. External roots/floors remain subject to their explicit monotonic retirement lifecycle.

## Planned verification

report.json lists28 explicit NOT_RUN controls: direct source-unavailable/disabled method cleanup; all header versions/scope/corruption; active0; transient cleanup/preserved bytes/roots; locks/rollback/idempotence; missing/unsupported/corrupt prior versus neverstarted draft; query scoping/capacity; ordinary early prerequisites; compatible pre-listen composition; real distinct-process restart and separately actual restore; rollback/exit/process overlap/retention. Direct SQL doubles cannot prove PostgreSQL locking, ordinary no-listen is not positive quiesce, synthetic method success is not approved release boot, and restart is not restore.

Owner450 HOLD, approved0 and production/DNS/TLS/devices remain unchanged. Root's newly provided excluded boot/history source candidate will receive a separate independent source/explicit-SQL-double review after this design report; future included gates must bind the new bytes.
