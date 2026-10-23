# P05 topic ledger — independent round 01

**COMPONENT_PREFLIGHT_PASS.** No confirmed implementation finding in this bounded inactive foundation. This is a dirty-tree component review, not clean-source acceptance or a full P05/P06 gate.

The reviewer did not author the module. Included code was read only. Frozen module SHA-256 is `52655c6ed3f3754bc403e8f4c9d7610e1c487d2a4c8ccab175f958612622a284`; author tests `6fe653ed0478361ca4184c82bd6cef1d782ff298d52dd2e61e5c74dd7241275b`; unchanged security `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25`. Actual frozen copies are retained in [evidence](ledger-round-01/index.json). Included hashes were equal before and after review.

## Independent execution

New reviewer probes: **24 passed, 0 failed, 0 skipped, exit 0**, actually executed in Linux on image `sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0`. Probe SHA-256 `d743f20a06ff11ea7c974fafe9335f8fc243ab85d152b87cd4a8aa09f0f2e747`. Raw [output](ledger-round-01/tests.txt), exact probe, bootstrap, snapshots, Docker inspections and cleanup receipts are retained. This is not a rerun relabelled as independent tests.

- Verified the actual syscall order: exclusive lock directory sync; chain append and sync; recovery chain sync; witness temporary write and sync; rename; witness directory sync; lock removal and chain directory sync before receipt.
- Interleaved three room/member scopes, checked per-owner revision versus global sequence, current stricter exact-replay union, global operation-ID mismatches and bounded exhaustion without losing read/replay.
- Constructed an authenticated same-sequence divergent branch and confirmed the existing process digest floor denies it. A cold instance with all trusted floors rolled back cannot detect complete rollback, as explicitly documented.
- Recovered several complete unwitnessed narrowing records across owners and verified exact durable witness advancement. Independently injected recovery fsync and rename faults: no acknowledgement, no permissive fallback, subsequent valid recovery retains the stricter union.
- Tested malformed authenticated canonical envelopes, duplicate outer keys, trailing NUL, noncanonical base64, wrong MAC domain, oversized inputs and three partial-tail lengths. Rejections preserve the corrupt bytes; no truncation into permission.
- Tested failed initialization remains unusable and cannot silently be reinitialized; tested immutable projections and input mutation after commit.
- Actually SIGKILLed separate child processes after chain sync and witness rename. Both leave a lock that denies entry. Only after confirmed child death did the disposable test operator remove that lock; recovery retained the stricter exclusion. These are two real kills, separate from injected syscall failures.

The test container used UID 1000, no network, read-only root, all capabilities dropped, no-new-privileges, 1 CPU, 768 MiB, 96 PIDs, temporary cache, three read-only frozen file binds and one fresh labelled volume. No Docker socket or moving checkout bind. A separate read-only unmounted image reader independently verified the image's `security.ts` bytes. Container and volume removal was guarded by ownership labels and terminal state. Subsequent actual Docker listings show no resources for the author round03, reviewer run or image-reader labels.

## Author evidence inspected separately

All **18** indexed files of `ledger-preparation-01/agent/linux-round-03` matched their recorded byte lengths and hashes. Actual Docker inspection pins the expected image, isolation settings, UID and exit 0. Its in-container source hashes equal the installed frozen module/test/security. Its raw result is **67 passed / 1 Windows-only skipped**. These author tests were inspected, not independently rerun or added to the reviewer's 24-test total. The tests include seven actual child-kill phases and live second-process lock denial; host unit checks and TypeScript/lint are author evidence only.

Original round01 startup failure and round02's unarchived older source bytes are honestly documented in the handoff. Neither is used as an exact-source acceptance proof. Current round03 has actual copies and is the applicable proof.

## Security and integration assessment

Code review found fixed 24 KiB canonical authenticated outer records, fixed 1 KiB witness and fixed 16 KiB AES-GCM payload. Domain-separated scope/MAC/AAD and exact pin/chain/revision/union checks cover the scoped codec. Parsing and allocation are bounded. File and directory owner/mode, no-symlink, single-link and descriptor identity checks, exclusive no-stale-guess locking, required external floor plus process floor, and durable witness recovery enforce the claimed Linux boundary. Read failures and syscall failures throw rather than returning a cached permissive view. Scope/operation/topic values remain encrypted; public sizes reveal record count, not the excluded topic.

No live API/DB adapter, readiness path, migration or export activates this module. Root must still authenticate ownership, retain per-room instances and required floors, durably narrow before DB publication, merge exclusion unions, revoke epochs, enforce final delivery fences, preserve keys/witness outside rollback and implement lifecycle/deletion/retention before activation. Those are unimplemented integration obligations, not claims closed by this component review. A malicious global administrator or arbitrary code executing with the same UID can bypass this model; simultaneous rollback of the entire host and every trusted witness/floor is explicitly outside it. No real PostgreSQL restore, disk-full hardware, host power-loss, production or complete stage proof follows.

All review writes are excluded reports/probes and the reviewer's own journal. Source manifests and other agents' journals were not edited.
