# P09 independent security repeat — round02

**CHANGES_REQUIRED; stage HOLD.** Exact review source: `ba039f8731a053de030199394e754a5589e57431`, compared with round01 `1bf51346ffb95f533ec64f10a16d9c503d78132e`. No reviewer tests/Docker/API calls were run. This report records the immutable source, not subsequent author corrections.

## Improvements verified in source

Additive migration002 introduces per-lease `cutoff_pending`; original001 is unchanged. Active-or-pending retirement reconciles RemoveParticipant/DeleteRoom again, and GC excludes pending rows. Unknown stop scope/release ID errors replace false success. Ordinary persistent-failure stop/release/reaccept paths have materially improved. However, pending durability still has the restart gap below, so S09-01 is not fully closed.

S09-02's closed-admission branch is implemented: the API authenticates the internal HMAC before a dedicated prepare call, keeps consumer barriers intact, retires protected authority and sockets, and performs maintenance PG updates. Supervisor confirms old-child quiescence, launches a new child, actually probes empty ListRooms, and keeps running/RTC disabled until normal authority polling succeeds. Same-preparation probes do not extend the grace; expiry/cutoff remains bounded. Its internal health program is exercised by the new test source, rather than replacing the component with an always-success fixture. Open-admission health was missed and creates S09-03.

## S09-01 residual — restart drops unconfirmed cutoff receipts (P2)

`apps/api/src/media.ts:31,117,123` and `:90–98`.

Although normal GC now excludes pending rows, `bootGate()` unconditionally clears every `cutoff_pending` before confirming any old-child termination. `watchdog()` also clears it solely on a changed reported boot UUID. An epoch rotation retires authority; it does not prove an existing SFU process stopped. Supervisor itself changes its boot UUID before quiesce has succeeded.

Trigger: establish an unconfirmed retirement (admin and quiesce unavailable), retain the media child, restart API, then reaccept while the backend remains unavailable. Boot has marked leases revoked and removed pending receipts; `retireMember` sees no active-or-pending row and returns true, permitting200 without a new cutoff check. Receipt rows also become eligible for GC. The same hazard exists when a changed boot report is not backed by confirmed old-child termination.

Minimum fix: retain pending cutoff across API boot and an unverified boot change. Clear it only on a positive backend-removal/old-child-quiescence receipt, such as confirmed prepare, or equivalent verified reconciliation. Add the restart-between-failed-operation-and-retry step to the existing targeted negative; no new DDL/framework is needed. Do not weaken the established startup epoch/grant invalidation.

## S09-03 — v3 normal open-gate preflight now always fails (P2)

`tools/venus-operator/driver.mjs:38,80–83`; `apps/api/src/media.ts:35–36`; engine preflight ordering.

v3 `healthy()` always invokes closed-only `/internal/v1/media/prepare`. Existing-installation preflight calls healthy while current A is still serving; the gate closes only later in the update flow. `prepareDelivery` correctly rejects this open state409, so a healthy v3 installation cannot pass ordinary update/preflight. This is a concrete lifecycle regression from the readiness correction.

Minimum fix: authenticate and check current media readiness read-only when the gate is open; use destructive prepare only when closed. Keep v2 behavior and all consumer fences. Verify open-gate success does not retire a lease or restart the child, while open media failure is rejected; retain the closed-gate negative/positive tests. Author accepted S09-03 and proposed this split; no newer implementation is accepted here.

## S09-04 — delayed old lease release revokes a newer scope (P2)

`apps/api/src/media.ts:90–93,100`.

Author-reported and independently source-confirmed. Release selects the caller's exact old lease, then calls `retireLocked(room,member)` without that lease filter. That query selects all current leases for the member. A delayed release for a retired lease can therefore revoke a newer lease/scope; when the newer row is a publisher, expansion also terminates that current upstream room's viewers. This defeats the UI's resource-generation ownership across asynchronous teardown.

Minimum fix: scope release retirement to the requested lease. A publisher release may expand only to the requested row's own upstream scope, never whichever newer publisher happens to exist for the member. Whole-room/member safety hooks should retain their deliberately broader behavior. Add the existing-source regression old delayed release versus new active scope. The author is implementing it after this audited source.

## Relevant coverage and actual status

The current integration source adds closed-gate unauthorized/failed-admin prepare checks, actual embedded operator program success/failure, repeated release/reaccept under injected persistent admin+quiesce failures, lease expiry, refreshed-token rejection, pending join versus close, Games/admission coexistence and a stricter watchdog deadline. It does not yet cover the open-gate readiness path, receipt preservation across API restart, or old-release/new-scope isolation described above. Explicit stop retry should remain among the retirement checks as well.

Parent reports the exact ba039 run passed maintenance preparation/operator negative, actual1+7 capture, four-path ACL and Games/admission, then failed the unchanged normal A/V target at approximately125ms versus120ms. This is a progress handoff, not independently audited frozen actual evidence. The full run is not accepted as PASS, and later lifecycle/restore cases must not be inferred executed. No new AV threshold, complete test framework or historical P05/P06 rerun is requested. Future correction to a shared video+audio MediaStream requires new exact source and relevant actual evidence.

No full P09, signed v3 delivery, physical-device, public-network, rights or final P07 PASS is granted. Historical rounds and failures remain immutable. Inputs pin exact Git blobs; subsequent author edits require another review. Only this reviewer's journal and this new review directory were written. COMPLETE_STOP after final hashing.
