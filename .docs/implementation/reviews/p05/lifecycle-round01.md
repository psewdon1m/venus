# P05 count + room lifecycle — independent component round 01

**COMPONENT_PREFLIGHT_PASS.** No confirmed safety defect in the bounded inactive file primitives. This does not close the lifecycle design's integration obligations or full P05/P06. The reviewer wrote no included code.

## Exact scope

Frozen included inputs, equal before/after review:

| File | SHA-256 |
| --- | --- |
| private-topic-ledger.ts | `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a` |
| private-topic-ledger.test.ts | `241def51d56499ccfcedd0125dc89c95865081dff67740b4dbfe767f059e0d8e` |
| topic-room-lifecycle.ts | `1e63e055ca3989c2783f0b2debea7d5d2c787d3c63fdaca10895ad23aba9d381` |
| topic-room-lifecycle.test.ts | `a774943d9f0f80f3404932b517fa85ac9d28f0cc8c8e284673e99676039948f9` |
| security.ts | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

All five copies were saved before testing. Historical ledger review remains tied to its old `52655…` bytes. Comparing the frozen old and current ledger source confirms the sole change is `countExcludedScopes`; the new source still needs this fresh proof rather than inheriting old PASS by name.

## Independently executed evidence

New reviewer suite [independent.test.ts](lifecycle-round01/independent.test.ts), SHA-256 `60d289423e1c732f7e899449193488fc6c511658ed758575e3f4b96a9a123819`: **34 passed, 0 failed, 0 skipped, exit 0** in actual Linux Docker. [Raw output](lifecycle-round01/tests.txt), frozen copies, bootstrap, inspections and cleanup are retained in [index](lifecycle-round01/index.json).

- At member limits 1, 2 and 4, exhausting admissions never consumes the reserved capacity for every member withdrawal and room retirement. Withdrawn identities remain counted and cannot be readmitted; room terminal append succeeds at the bound.
- Personal incarnation is a reserved owner and cannot consume admission. Domain-separated operations permit the same external request UUID across real identities and kinds without cross-scope replay. Aggregate count is exact, immutable, minimal `{incarnation,sequence,count}`, bound to room/topic and protected by process/required floors; no owner list is exposed.
- Retired member is denied through old wrappers and cold managers while another admitted member remains live. New anonymous identities have empty personal exclusions, with no human-identity linkage claim.
- Durable published retirement intent denies live reads but alone cannot authorize cleanup. Exact original retirement input completes the terminal lifecycle append. Removing observed intent or rolling metadata back does not reopen the retained manager.
- Independent metadata short-write, ENOSPC and rename faults produce no successful receipt or cleanup authority. Six retirement metadata fsync positions, three cleanup directory-sync positions and both unlink paths were separately faulted; completed terminal authority remains effective and repeat cleanup is safe.
- Birth/intent hardlinks and an unsafe second personal directory/file are rejected before the first personal unlink. Directory aliases, owner modes, stale-looking room locks, wrong room/pins and too-high trusted personal floors deny access.
- A genuinely held Linux fd remains readable after unlink and has nlink=0. That byte availability grants no permission: old wrappers and fresh managers deny via retained terminal metadata. Birth/retirement/lifecycle authority is retained.
- Three **actual child SIGKILL** probes hit retirement rename, durable room terminal and first personal unlink. Each first proves stale-lock denial; only the disposable operator after confirmed child death removes that lock. Terminal access denial and safe completion/retry are then verified. These real kills are distinct from injected syscall controls.
- Fixed record sizes and ciphertext absence of room/member/topic/retirement field values were checked directly.

Actual image: `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`; Node v24.22.0; Vitest v5.0.5. UID1000, network none, read-only root, dropped capabilities, no-new-privileges, 1CPU/768MiB/PIDs96, temporary cache, four individual read-only frozen source/probe binds and one fresh labelled owned volume. No Docker socket or moving checkout mount. The inherited runner's raw descriptor lists only two primary binds; `runtime-bind-audit.json` records all four actual inspected binds transparently. Both author runs and the reviewer run have zero remaining labelled containers/volumes by actual post-cleanup Docker queries. Cleanup mutations were guarded by ownership labels and stopped state.

## Author evidence independently inspected

All **20** indexed files in `ledger-preparation-01/agent/lifecycle-01/linux-round-02` match their recorded hashes and sizes. Actual inspected image/exit/isolation and the in-container five hashes match the frozen installed inputs. Author result: **133 passed / 2 Windows-only skipped**, exit0, comprising 69 foundation and 64 lifecycle cases. Raw output contains 15 lifecycle actual-SIGKILL successes, seven foundation actual-SIGKILL successes and one live second-process exclusion success. These are inspected author executions, not rerun or added to the reviewer's 34-test count. Host26PASS109skip/types/lint remain author evidence; Windows skips are not durability proof.

## Design obligations: partial progress, not full closure

**LIFE001 has a proved bounded component implementation:** immutable authenticated encrypted retirement intent, durable separate lifecycle room-retired record/witness, sync ordering, read/member fences and controlled personal-file unlink. Intent alone never authorizes destructive cleanup. This is independent of the older DeletionLedger. Scheduling, terminal metadata finite retention/pruning and P06 replay barriers are not implemented by this primitive.

**LIFE002 remains open:** immutable DB birth/protocol invariants, actual authenticated adapter, external nonpersonal compatibility floor, old-worker quiescence and supported restore/launcher. A trusted `roomTransactionLockHeld:true` is not evidence of PostgreSQL ownership. No actual PG transaction/restore or old-image test ran here.

**LIFE003 remains open at integration:** actual shared advisory lock, orphan/create race handling, final HTTP/WS epoch/room/session fences and synchronous terminal recheck after awaited IO. The filesystem room lock and freshly checked wrappers provide the primitive boundary only. No age-based orphan deletion exists.

**LIFE004 remains partly open:** durable member retirement token is implemented and independently denies old/new wrappers. Actual DB/session revocation-before-admission, retention addendum for room-local encrypted exclusion evidence after leave, finite remaining-metadata retention, restored sessions and full application withdrawal proofs remain absent.

**Additional recovery obligation LIFE-RECOVERY-01:** `retireRoom` requires the exact original immutable operation UUID and retiredAt. The independent intent-only probe proves that changing retiredAt from 40000 to 40001 rejects with RETIREMENT_CONFLICT; retrying the original succeeds. After process crash plus DB rollback, the adapter must recover that original durable intent or retain the exact request/time outside the rolled-back transaction. The manager currently has no public trusted intent-read/recovery method. Hardcoded timestamps in component tests do not prove application recovery. Root and author were notified. This is an explicit unresolved integration obligation, not a reproduced permission leak or a claim that autonomous close/maintenance can already recover.

Preserving witness/key material outside DB rollback and retaining manager instances are preconditions. Replaying the entire host and all witnesses/trusted floors together is outside the model. Injected ENOSPC is not actual full-disk hardware; SIGKILL/syscall success is not host power-loss proof. No production, human content approval, complete retention service, backup pipeline, or complete stage acceptance follows.
