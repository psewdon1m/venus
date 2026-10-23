# Inactive authenticated retirement recovery / member-metadata cleanup

**Author component handoff; independent review still required.** Previous133PASS author proof and lifecycle round01 independent report are preserved on their exact old bytes. This extension does not activate serving routes or close P05/P06 integration gates.

## Exact inputs and actual results

| File | SHA-256 |
| --- | --- |
| `topic-room-lifecycle.ts` | `5562b552e0f3d2fa113627bdd7dce14b7b406e13c66caf8e5c88fcf6b594748e` |
| `topic-room-lifecycle.test.ts` | `696d98fb68948678d371b11e2c65bd6926d40d2e1d47781b293c065c45bbaf38` |
| unchanged `private-topic-ledger.ts` | `cae3c755f17ba41522f72c5d65d798b7973e76639478e5eed0b6f04a5195f29a` |
| unchanged ledger test | `241def51d56499ccfcedd0125dc89c95865081dff67740b4dbfe767f059e0d8e` |
| unchanged `security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |

Latest `linux-round-02`: **189PASS/2Windows-onlySKIP**, exit0; prior133 regressions plus56 extension cases. `linux-round-01` historical188PASS/2SKIP remains unchanged; final run adds a direct cleanup-age/process-clock regression and source-comment clarification. Each run captured all five source copies **before** launch and records in-container exact hashes. Image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`, Node24.22.0/Vitest5.0.5, four individual read-only source/test binds, UID1000/read-only/networknone/capdrop/1CPU/768MiB/PIDs96, fresh owned labelled volume. No moving checkout mount/build. Raw output, configurations, source copies and actual cleanup EMPTY receipts are indexed. Included files equal latest tested copies.

Included TypeScript/ESLint exit0; included Windows26PASS/165Linux-onlySKIP exit0. Windows skips do not prove durability.

## Additive APIs

`retirementStatus(roomId,birth)` returns a frozen union:

```ts
{state:'live'}
// or
{state:'retiring'|'retired', retiredAt:number, operationId:string}
```

It authenticates immutable birth, original persisted intent and lifecycle/terminal authority under the room filesystem lock. It provides original values for a fresh process to retry `retireRoom`; adapters must use these values rather than a new timestamp. It works after partial personal cleanup and after partial/all lifecycle-file cleanup. `live` is a retirement classification, **not** readiness/admission proof. Missing a previously required intent is corruption: `retireRoom` does not recreate it from guessed current time when lifecycle retirement or terminal authority already exists.

`cleanupRetiredMetadata(roomId,birth,{roomTransactionLockHeld:true,minimumTerminalAgeMs})` requires authenticated durable retirement, original intent, sufficient terminal age and process-clock floor. The boolean remains a trusted caller precondition, not DB-lock authentication. Both personal directories must be empty first. No unknown/stale locks/files are removed.

Before deleting member-containing lifecycle files, it publishes an immutable padded encrypted/authenticated `terminal` file with separate AAD/MAC domain. The terminal binds protocol2, room, both incarnations, taxonomy/policy pins, original retiredAt/operationId, final lifecycle sequence and exact ciphertext chain/witness SHA256+size. It has **no member IDs, per-member topics, reasons, prompt/advice/history or owner lists**. Those ciphertext hashes reveal no owner list and let retry recognize an exact remaining file without deserializing its missing counterpart.

Ordering: validate real lifecycle `room_retired` + intent + personal absence → validate both remaining metadata files → full terminal write → file fsync → rename → directory fsync → reauthenticate/re-fsync terminal → validate both file capabilities → chain unlink+directory fsync → witness unlink+directory fsync. A partially published existing terminal is re-fsynced before destructive retry. Wrong hashes, permissions, links or extra files deny before the first unlink. Partial failure remains observable and retryable.

Cached room contexts now lazy-open the lifecycle driver. Authenticated terminal is checked first; status/cleanup after missing files never attempts a permissive missing-ledger fallback. Every normal live/member/old-wrapper path denies terminal authority. Observed terminal/intent disappearance or ciphertext change denies the retained manager. A cold manager missing terminal plus required lifecycle files also fails closed. Preserved terminal dominates restored older live metadata, while cleanup rejects the mismatched file bytes.

## Scope of evidence and remaining work

New actual process-kill probes cover two crash→fresh-status→exact-original-retry recoveries and all eight terminal-publication/member-file-unlink boundaries. They add to prior15 lifecycle and7 foundation actual-kill cases. Each first proves stale-lock denial; only the disposable test operator, after confirmed child death, removes that child's room lock. Injected shortwrite/ENOSPC/rename/unlink/eight fsync positions are separately named syscall controls. These are not hardware power-loss or actual full-disk proofs.

Tests directly verify that member-containing service chain/witness files disappear, retained birth/intent/terminal fields contain no member identity list or personal topics, and held fds remain readable with nlink0 while all application wrappers deny permission. This is **not crypto erasure** of held memory, keys, external snapshots, backups or already delivered content.

The birth/intent/terminal authority directory and keys must be independently preserved from DB and personal/lifecycle-chain rollback. Replaying the entire host and every independent authority/witness/trusted floor together is outside the model. The module retains only room-level terminal metadata after cleanup; it does not automatically prune that metadata. Root's future scheduler must invoke cleanup before the primary retention deadline under real authenticated DB ordering, then apply the separate bounded≤7d terminal metadata prune/backup barrier. No scanner, recursive delete, orphan age guess, PostgreSQL race/restore, old-worker quiescence, compatibility floor, full backup pipeline, production or human content approval claim follows from this component.
