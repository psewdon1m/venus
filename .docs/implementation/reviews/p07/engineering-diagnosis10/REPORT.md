# Independent diagnosis10 — real PostgreSQL media/room deadlock

Verdict: STRUCTURAL_CAUSE_CONFIRMED; recommend the single-update fix below. No application code changed. This packet is a minimal actual PostgreSQL lock-graph diagnostic, not a repaired application, Cinema PASS or P07 acceptance.

## Original failure binding

Clean5de418d7ffb6a0198616a78c6774d54beb0b2437 Cinema has31PASS/1FAIL. P09-PENDING-CUTOFF-API-RESTART expected503 after API restart/unconfirmed backend cutoff but received500. The retained safe API log identifies40P01 at reaccept, rooms.js475:127. A tiny readonly inspection of actual retained test imageb73d1f4f... independently mapped that location to await media.retireMember after Rooms.auth had locked its room FOR UPDATE. The local C dist was one line offset and was not used as the final mapping.

## Exact structural cycle

- Reaccept transaction A: Rooms.auth→room SELECT FOR UPDATE; then Media.retireMember→global advisory746826411, which it waits for.
- Watchdog transaction W: takes advisory746826411. On media boot mismatch it first UPDATEs room_media_leases globally. Later pending/retired reconciliation UPDATEs the same lease again in that transaction.
- PostgreSQL16 may require an FK recheck on that second UPDATE even when the FK key is unchanged, because the prior tuple version belongs to the current transaction. The FK check takes FOR KEY SHARE on parent rooms, which conflicts with A's FOR UPDATE. W waits A while A waits W.

The implementation detail is confirmed in the official [PostgreSQL16 RI trigger source](https://raw.githubusercontent.com/postgres/postgres/REL_16_STABLE/src/backend/utils/adt/ri_triggers.c): the current-transaction xmin branch requires an update check before unchanged-key elimination; the parent lookup uses FOR KEY SHARE. This explains why merely searching for an explicit watchdog room FOR UPDATE misses the opposite edge.

## Actual finite diagnostic

One isolated internal Docker network, no host ports or real data. Actual PostgreSQL16.14 image64154d0b...,0.5CPU/256MiB with tmpfs data; Node fixture imageb73d1f4f...,0.5CPU/128MiB, readonly/nonroot/cap-drop/network scoped only to that PG. No credentials/files/volumes created; synthetic trust is confined to the disposable internal network. Entire orchestration completed in about4.8seconds, exit0. Probe source, setup and actual lock/error JSON are included.

Baseline uses the real rooms parent FK and media advisory key, with two real PG transactions and an observer. It first captured W blocked by A on the room; then captured both directions in pg_locks/pg_blocking_pids. PostgreSQL reported40P01: process90 waited ShareLock on transaction737 held by91, while91 waited ExclusiveLock on advisory746826411 held by90. Its error context explicitly contains parent rooms FOR KEY SHARE from the second lease UPDATE. Victim choice differs by scheduling; the original application's victim was reaccept, while this diagnostic chose watchdog. Both are the same cycle.

Two proposed-shape variants first SELECT boot-retiree IDs and only UPDATE those leases once, after simulated backend confirmation. Reaccept still holds the exact same room FOR UPDATE and waits on media; both transactions COMMIT without a cycle. The unconfirmed variant durably stores revoked=true/cutoff_pending=true; confirmed stores revoked=true/cutoff_pending=false. No server deadlock mapping, assertion relaxation, retry or room-lock weakening was used.

## Minimal application proposal

In watchdog boot mismatch, preserve early calls.boot, protected authority clearing and Cinema transport-unavailable handling. Replace only the first global lease UPDATE with a SELECT of ALL revoked_at IS NULL OR cutoff_pending IDs, regardless of epoch/kind/expiry. Merge those boot-retiree IDs into existing allIds before existing expansion/valid filtering/backend removal and the existing final per-lease UPDATE. Each selected lease then receives one final durable revoked/cutoff_pending write based on actual removeBackend confirmation. Already revoked/nonpending rows need no redundant write. Keep protected authority removal before backend and all IDs in failed-cutoff receipts. Do not change Rooms FOR UPDATE to NO KEY UPDATE, exceptions/status mapping, timeouts or generic retries.

The diagnostic proves the minimal relational lock mechanism and candidate SQL shape, not protected-filesystem/backend/application integration. The original PG full lock graph was not retained, so original backend participant IDs cannot be reconstructed; the known request, source shape, actual reproducible cycle and matching FK context support this cause. Implemented application code still needs independent review plus the existing affected Cinema restart case/suite rerun, then clean joint preflight/soak.

Cleanup verified actual labeled containers and network absent after scoped removal; no global prune or unrelated Docker object touched. Reviewer stops after sealing this diagnosis; implementation belongs to the orchestrator/author.
