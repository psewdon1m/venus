# Inactive room lifecycle + trusted aggregate — author handoff

**Component scope only.** This module is not imported by serving routes/server. It does not implement PostgreSQL protocol constraints, DB-lock authentication, epoch revocation, compatibility floor/old-worker quiescence, backup/restore barriers, orphan scanning, retention scheduling or terminal metadata pruning. LIFE002–004 remain integration obligations. The old foundation evidence/report remains unchanged and source-bound to its old bytes.

## Inputs / verification

| Included file | SHA-256 |
| --- | --- |
| `private-topic-ledger.ts` | `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a` |
| `private-topic-ledger.test.ts` | `241def51d56499ccfcedd0125dc89c95865081dff67740b4dbfe767f059e0d8e` |
| `topic-room-lifecycle.ts` | `1e63e055ca3989c2783f0b2debea7d5d2c787d3c63fdaca10895ad23aba9d381` |
| `topic-room-lifecycle.test.ts` | `a774943d9f0f80f3404932b517fa85ac9d28f0cc8c8e284673e99676039948f9` |

Unchanged `security.ts`: `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`.

Both Linux runs use exact image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, only four read-only individual source/test binds, network none, UID1000, read-only root, dropped capabilities, 1CPU/768MiB/PIDs96, and one fresh owned labelled disposable volume. Source/security copies were captured before each launch; actual runtime hashes equal those copies. No build or moving whole-checkout mount. `linux-round-01`: 119PASS/2Windows-onlySKIP. Latest `linux-round-02`: **133PASS/2Windows-onlySKIP**, exit0. Before/after configurations/raw outputs/cleanup are preserved and indexed. Actual post-cleanup queries for both runs returned no labelled containers/volumes. Included files exactly equal latest source copies.

Included strict TypeScript and ESLint exit0. Windows included run: **26PASS/109Linux-onlySKIP**, exit0. Skips do not count as Linux proof.

## API / ordering

`TopicRoomLifecycle` is a retained process manager with a bounded room cache. Its directory resolver is trusted configuration; five distinct pre-provisioned owner-only directories are required. Every operation acquires the room filesystem lock before descriptor/lifecycle/personal operations. Never guess a lock stale. Caller ordering must be: authenticated same PostgreSQL room/advisory transaction lock → room filesystem lock → individual ledger locks. The module's `roomTransactionLockHeld:true` argument is explicitly a trusted precondition, **not proof** that PostgreSQL granted any lock.

- `initializeRoom(roomId,createdAt,proof)`: explicit trusted protocol2 birth before DB commit. Initializes personal and lifecycle chains/witnesses, then publishes an immutable encrypted/authenticated birth descriptor with protocol/room/createdAt/incarnations/pins/capacities. Existing/partial files reject reinitialization. A failed/unknown create may leave an orphan; this module never deletes it based on age.
- `admitMember(...)`: durable encrypted `member_admitted` before DB join publication. Lifelong identity count is exact authenticated aggregate. Default memberLimit128; configurable1…2047. Maximum lifecycle records is `2*memberLimit+2`, reserving each identity's admission+withdrawal and one room terminal record. Limit reached denies a new identity rather than consuming retirement reserve.
- `open(roomId,birth)`: same cached wrapper per room; it never initializes missing files. Every wrapped personal `read/narrow` checks exact room, admitted member, member retirement, room retirement/intent, pins, and current personal floor. The wrapper cannot expose raw lifecycle ledger or another room's personal scope.
- `assertLive/assertMember`: synchronous external final fences. They do not authenticate cookies, offer acceptance, epoch, DB room state or any queued HTTP/WS delivery. Those remain integration checks after awaited IO under the same room ordering.
- `retireMember(...)`: durable `member_retired` before DB/session revocation. RETIRING intent alone does not substitute for the member token; complete room retirement does deny everyone. Same retired identity cannot be admitted again. A new UUID starts empty personal state without claiming identity linkage.
- `retireRoom({operationId,retiredAt},proof)`: publish immutable encrypted/authenticated retirement intent first; its presence denies live access. Retry requires the exact same intent. Fsync intent+directory, then durably narrow `room_retired` in the separate lifecycle chain/witness. Intent alone is not cleanup authority. Domain-derived internal operation IDs separate external request UUIDs across room/member/kind.
- `cleanupPersonal(...,{roomTransactionLockHeld:true,minimumTerminalAgeMs})`: requires both authenticated intent and durable lifecycle terminal state, monotonic process clock and sufficient known terminal age. Validates both personal directories and all remaining files before first unlink; unknown/stale locks/files deny. Unlinks only personal chain/witness, fsyncs each directory, retains authoritative birth/intent/lifecycle metadata. Partial failure is observable and retryable; no recursive deletion or implicit PASS.

The sole foundation source addition is `countExcludedScopes(roomId,topic)`: strict room/topic validation, existing lock→reload→required/process floors, immutable `{incarnation,sequence,count}`. It exposes no owner/topic list. It is a trusted internal aggregate, not an HTTP availability endpoint.

## Evidence / limitations

Latest Linux includes prior67 foundation regressions plus2 aggregate negatives,64 lifecycle cases, fifteen real lifecycle child SIGKILL phases (six birth, five retirement, four cleanup), inherited seven ledger SIGKILL phases and live second-process exclusion. SIGKILL tests first prove stale-lock denial; only their operator, knowing the disposable child terminated, removes that child's lock. They are not stale-lock recovery in the module or hardware power-loss tests.

Fault injection separately covers metadata short write/ENOSPC/rename, six fsync positions, unlink failures and partial cleanup. Real held personal fd loses its link after cleanup while old wrappers and new managers still deny from terminal metadata. Missing/malformed/pin/key/permission/link state closes access. Process floor rejects older metadata state; a trusted larger personal minimum never falls back to a lower marker.

Independent rollback boundaries remain operational preconditions: preserve lifecycle witness and key material outside DB/chain rollback; do not replay the entire host, all witnesses and trusted floors together. Mutable terminal metadata is not silently compacted. An unsuccessful pre-terminal retirement publication is not a completed terminal receipt. Persistent cleanup scheduling, exact finite retention of remaining encrypted metadata, external clock/floor recovery and all actual PostgreSQL races/restore proofs remain unfinished integration. No content approval, full P05/P06 or production claim follows from this component.
