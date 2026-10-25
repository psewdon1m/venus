# P09 independent security repeat — round03

**CHANGES_REQUIRED.** Source: `5ababf57fc26b325a88964806aa8d15da8208639`, compared with immutable round02 `ba039f8731a053de030199394e754a5589e57431`. Scope is the existing finding cycle and its new regression coverage. No reviewer Docker/tests/API/network execution or source changes. Actual clean run is active per handoff; no completed runtime/stage PASS is assumed.

## Source fixes confirmed

- **S09-01:** API boot and unknown SFU boot now preserve existing `cutoff_pending` and add pending for previously active rows using old-row values. Epoch change no longer fabricates a termination receipt. Normal expired/invalid protected leases now trigger actual backend removal/quiescence and persist its result; pending rows remain excluded from GC. New start commits an unconfirmed retirement and returns503 instead of issuing another scope. Existing tests add persistent fault state across API restart, repeated reaccept, explicit stop/release retry and lease expiry. Closed in source for the previously reported receipt-loss paths; exact runtime proof remains pending.
- **S09-02/S09-03:** authenticated readiness chooses a read-only supervisor health/current API epoch check when admission is open. Closed admission uses the existing retire/quiesce/new-empty-child prepare path; consumer barriers remain intact. Driver requires `ready:true` for v3 and retains v2 checks. Existing test source probes open health with active Cinema and asserts the child boot and live state remain unchanged. Closed in source for the app-only-health/open-gate409 defects; runtime proof remains pending.
- **S09-04 partial:** release now filters the requested lease and expands a publisher only to its stored upstream scope, avoiding the ordinary old-release/new-lease selection error. The state-update issue below still prevents closure.

## Remaining S09-04 — old pending publisher still ends current Cinema state (P2)

`apps/api/src/media.ts`, `retireLocked` state UPDATE (line96 in reviewed source).

The selected lease/upstream scope is now exact, but the member-scoped publisher retirement still executes:

`UPDATE room_cinema_state SET state='ended', ... WHERE room_id=$1`

without requiring the current Cinema row to match that selected upstream scope.

Reachable sequence: an old publisher is retired with confirmed cutoff; a new scope becomes live; a delayed old release encounters admin+quiesce failure, setting that old row `cutoff_pending=true`; after recovery its retry selects and removes only the old scope correctly, but the unconditional room-id state update ends the newer Cinema scope. Subsequent current-lease gateway/watchdog checks then reject that newer scope. This is the same stale resource ownership defect under a failure/retry path, not a request to broaden the module.

Minimum correction: for member/lease-scoped publisher retirement, restrict the Cinema state UPDATE to the selected publisher upstream scope(s). Keep deliberately room-wide retirement broad. Extend the existing old-release/new-scope case with failed old release503, recovery, old retry200, then assert the new scope remains live. The author has accepted exactly this correction; it is not part of the reviewed source and is not accepted as tested here.

## Coverage and qualification

Read the new open-readiness/autoplay, old-release/new-scope, repeated stop/release/reaccept, persistent-fault restart, expiry and pending-join cases. The ordinary old-release case currently lacks the failed-release/recovered-retry step above. Fault injection stays in the explicitly owned test server and persists across restart; production functions execute their real PG/authority transitions. This source assessment does not relabel failure injection as an actual network outage.

The frontend combines subscribed audio/video into one media element and common publisher stream while keeping generation-owned teardown and capture. Playback success is no longer unconditionally written after subscriber connect, so the existing blocked/retry state is not immediately overwritten. AV acceptance and autoplay behavior still require the exact actual result; thresholds have not been waived. No neighboring mechanism audit or new test framework is requested.

The active clean C run `.artifacts/p05/venus-p05-8fb1e503adef` is progress context only. There is no independently audited final packet in this source round. Final P09 acceptance requires the corrected source and relevant completed proof. P07, public network/NAT/TURN/DNS/TLS, physical devices, professional rights and a new signed release remain unaccepted; immutable0.0.1 has no P09 claim.

Historical reports/FAILs are preserved. Only the reviewer's own journal and this review directory were written. Exact immutable Git blob inputs are adjacent. COMPLETE_STOP after final hashes.
