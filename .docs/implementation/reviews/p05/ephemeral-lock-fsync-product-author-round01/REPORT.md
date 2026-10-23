# Ephemeral mutex directory synchronization - author handoff

AUTHOR COMPLETE; nonauthor review, real Linux filesystem tests and same-budget actual N4 remain required.

Actual owned A11 profile index b0b3faf4dd1faa5ca9c78a3884401b0b5e2ddf2735f013bb04660780bc0671ad measured native fsync at 74.367% of sampled wall time. This addresses a verified repeated read path; whole-run cause and improvement are unmeasured. Quiet A11 N4 still failed the original 600s deadline; its FAIL remains.

Only PrivateTopicLedger.locked and TopicRoomLifecycle.locked change in production: their temporary-mutex create/unlink directory sync calls are removed (four calls). Exclusive O_CREAT|O_EXCL|O_NOFOLLOW, mode/owner/link checks, opened directories, inode/device comparison, close/unlink order and stale-lock refusal remain. Mutex is exclusion, not durable authority; directory fsync adds no live O_EXCL exclusion. Crash can leave or resurrect a stale lock (including an unsynced unlink), requiring explicit operator recovery; automatic stale recovery remains forbidden. Availability after crash is not guaranteed.

ADR-023 lines9,23,27 require file/directory durability for persisted birth/ledger/witness and retirement before deletion. Those explicit barriers remain: ledger initialization file + chain directory + witness publication; append file + authenticated repair file + witness file/directory; room birth/retirement/terminal file/directory publication; file/directory durability reassertion before retirement acknowledgement or destructive cleanup; personal and lifecycle unlink directory barriers. No data publication depends on wrapper lock fsync.

Portable test invokes real production private methods with controlled syscall/metadata boundaries: baseline RED4 failed/6 passed; corrected10 PASS. No-sync read/exception, stale/busy, replaced inode, exclusive/no-follow and retained file/rename/directory publication checks. This is not native filesystem durability proof.

All existing Linux SIGKILL, stale/second-process locks, path/owner/link fences, publication phase faults and cleanup tests remain. Fsync fault ordinals now enumerate actual data barriers: ledger4; metadata retirement4; terminal/unlink6. New Linux tests assert zero barriers on consistent authenticated reads, full append4, combined retirement8, terminal/unlink6. Combined lifecycle test wires both metadata and ledger controls; old metadata fault cases intentionally observe metadata only.

Host six-file regression148 PASS/185 LinuxSKIP; API source typecheck0; changed-file lint0. API tsconfig excludes tests. Linux aggregate countExcludedScopes fixture signature was corrected during source inspection before handoff; skipped tests cannot establish native PASS. Native exact three-file suite is required before final candidate acceptance. Packet preparation01 hit cp1252 UnicodeEncodeError and was corrected with explicit UTF8; no test/app failure hidden.

No schema/API/wire/engine/RNG/clock/TTL/rate/query timeout change. Roll back the two lock wrappers without migration. Remaining: independent durability review, native Linux three-file suite including real SIGKILL/process tests, immutable candidate/image, one same-method N4 under original600s with no heavy concurrency. No Docker executed by author; no socketView/cache change. No stage, production or speedup PASS.
