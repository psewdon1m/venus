# P05 authenticated retirement recovery and metadata cleanup — independent round 02

**COMPONENT_PREFLIGHT_PASS.** No confirmed implementation defect in these inactive file primitives. This reviewer changed no included source. Full P05/P06, real PostgreSQL authorization/order, retention scheduling, restore and deployment gates remain open.

## Exact reviewed inputs

Five copies were frozen before the first run and matched the included files after both runs:

| File | SHA-256 |
| --- | --- |
| `topic-room-lifecycle.ts` | `5562b552e0f3d2fa113627bdd7dce14b7b406e13c66caf8e5c88fcf6b594748e` |
| `topic-room-lifecycle.test.ts` | `696d98fb68948678d371b11e2c65bd6926d40d2e1d47781b293c065c45bbaf38` |
| `private-topic-ledger.ts` | `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a` |
| `private-topic-ledger.test.ts` | `241def51d56499ccfcedd0125dc89c95865081dff67740b4dbfe767f059e0d8e` |
| `security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

Round01 remains an immutable historical result for its older module/test bytes. Its recovery obligation LIFE-RECOVERY-01 is now implemented at the component boundary by `retirementStatus`; actual application recovery still requires integration proof.

## Fresh independent execution

[Independent suite](lifecycle-round02/independent.test.ts), SHA-256 `03d3ead6488949caaec12b5a02728fa9d86ee6422bfc72078b92118b5042991a`: **42 passed, 0 failed, 0 skipped, actual Linux exit0**. [Raw output](lifecycle-round02/tests.txt), all frozen inputs, runner, actual inspections and [evidence index](lifecycle-round02/index.json) are retained.

- A fresh manager authenticates the original persisted intent after an interrupted close. Changed operation UUID or close time rejects; exact original retry completes retirement. Intent alone denies access but cannot authorize cleanup. Status is frozen and is a retirement classification, not a readiness grant.
- Member-containing personal and lifecycle chain/witness files disappear. Retained terminal has the exact room-only field set; retirement and terminal contain no member IDs or topic IDs. Birth retains the shared taxonomy vocabulary, not per-member settings or exclusions. All three retained descriptors contain no member identity list. An actual held fd remains readable with nlink0 while old wrappers and cold managers deny access; this does not claim crypto erasure of memory or backups.
- Cleanup requires real durable retirement, empty personal directories, sufficient age and process clock monotonicity. Both lifecycle files and directories are validated before any unlink. A hardlink, symlink, unsafe mode or extra second-directory file leaves the first lifecycle chain intact.
- Published terminal binds exact ciphertext bytes and lengths for remaining lifecycle files. Changed chain or witness blocks cleanup before either deletion. Partial deletion can retry without deserializing the absent counterpart. Restored old live metadata cannot override independent terminal authority; only exact bound final file bytes may be removed on retry.
- Missing/corrupt intent or terminal and invalid terminal structure, time or capability reject. An authenticated re-encryption with identical semantic terminal body is rejected by the retained manager's immutable-byte floor; a cold manager may authenticate it but still grants no live/member access. This is not a claim to withstand an attacker holding all encryption/authentication keys.
- Eight separately injected terminal/unlink fsync failures and five explicit short-write/ENOSPC/rename/first-unlink/second-unlink failures yield no successful cleanup receipt. Fresh authenticated retry remains closed and completes cleanup safely.
- **Seven actual child SIGKILL probes**, separate from syscall injection, cover retirement rename, durable room retirement, terminal sync/rename/directory sync and each lifecycle-file unlink. Each first proves stale room-lock denial; only the disposable test operator, after observed SIGKILL/death, removes that child's lock. Fresh status recovers exact original intent, followed by successful retirement and cleanup. No automatic stale-lock guessing was added or inferred.

Actual image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5; UID1000, network none, read-only root, four individual read-only frozen source/probe binds, owned labelled writable state volume, capabilities dropped, no-new-privileges, 1CPU/768MiB/PIDs96. No moving checkout mount or Docker socket. Runtime inspections and actual post-cleanup label queries prove no remaining owned containers/volumes for either reviewer attempt.

## Retained unsuccessful attempt

[Attempt01](lifecycle-round02/attempt01/tests.txt) exited1 with **41PASS/1FAIL** on the same implementation. The reviewer incorrectly prohibited taxonomy topic IDs even in the birth descriptor's shared vocabulary. The failing output proves the field is exactly the public vocabulary; it does not show a per-member preference leak. Only the reviewer assertion changed: exact common vocabulary is allowed in birth, while terminal/intent must contain no topic IDs and all descriptors forbid member IDs. The failed probe, raw output, runner, inspections and cleanup are preserved under `attempt01`; included implementation bytes were not edited.

## Author evidence inspected separately

All **20** indexed author files in `ledger-preparation-01/agent/lifecycle-02/linux-round-02` match recorded sizes and SHA-256. Actual inspected image, exit0, isolation, in-container five hashes and copied sources match the reviewed inputs. Raw result is **189PASS/2Windows-onlySKIP**. This is inspected author execution, not an additional independent rerun or part of the reviewer's42 count. Author kill probes and syscall cases remain separately identified in its raw output. Actual owned author label queries are empty. Windows/type/lint claims remain author evidence; Windows skips do not prove durability.

## Remaining integration obligations

LIFE001 gains bounded durable room-only terminal publication plus member-metadata cleanup, and LIFE-RECOVERY-01 gains an authenticated recovery API. Actual scheduling, main-store≤24h cleanup, bounded≤7d retained metadata prune/backup barrier, operator lock recovery and orphan handling are unproved. No scanner or automatic terminal prune exists here.

LIFE002–004 still require real protocol/birth database invariants and authenticated adapters, the same advisory/transaction ordering, final HTTP/WS/session/epoch fences after awaited IO, withdrawal/session revocation, old-worker quiescence, compatibility floor and full backup/restore tests. A boolean `roomTransactionLockHeld:true` is a trusted caller precondition, not DB-lock authentication.

Birth/intent/terminal authorities and keys must be independently preserved from database and chain rollback; simultaneous rollback of all host authorities/witnesses/trusted floors is outside the model. A retained process manager is required for in-process floors. SIGKILL and injected ENOSPC/fsync faults do not prove physical power loss or a truly full filesystem. No production, DNS/TLS, human approval of450 cards or full-stage acceptance follows.
