# METHOD08 actual export failure — independent diagnosis

Verdict: **CHANGES_REQUIRED_METHOD_ONLY**. The actual run remains **NOT_ACCEPTED / exit 1**. Two actionable P2 defects in failure handling are established by source review and bounded counterexamples. The exact original Windows/Python exception is **unrecorded** and cannot honestly be recovered from the retained evidence. No restart, retry, Docker call, volume access, cleanup or write to the failed prefix was performed by this reviewer.

## Exact actual evidence

Root ACK SHA `9e7c9f229b9d61a38666efd346e2f4870f0f90162e3c599ae4bc36ab493ba797` authorizes owner `a2a6f0422ae6d811953ed137afa7b496`, container `venus-r100-v3-7da46d477970`, volume `venus-r100-v3-7da46d477970-output`. Restored source is exact `1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad` / 1813 files, rebuilt image `sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f`. The actual frozen packet INDEX `8e6de2acca7ef3e336fd32170d9ccc318d4e89b2bf4888aec8608378c6637d0f` and all 143 children verify; prior method review INDEX `e46158ab5d6e36f5fa633e95c9f40c19f4672f6f341d29cc935ab8fb1fae4977` and its 13 children verify. All 107 prepared input mappings also verify.

Relative to the retained root `.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970`:

- `control/receipts/worker-terminal.json`: worker exit 0, `NON_GATING_FIXED_R100_DIAGNOSTIC_COMPLETE`, 100 rounds, wall time 45044.905558 ms, empty stderr. Worker inspect confirms stopped, exit 0, no OOM.
- `control/receipts/native-inventory.json`: 104 files were inspected before export. This is not a verified host export or accepted statistics RUN.
- `archive/` is empty. Python stage failed before a tar was retained; root stdout contains only the first 256 characters of its traceback, ending at package line 93 (`guard.partition(...).write(...)`). The exception type/reason at the end of the traceback was discarded.
- `control/live/host-space.json`: counter 812, available 156443181056 bytes, allowed true, no capacity fault. `host-space-next.json`: counter 816, same space, allowed true, no capacity fault. Both are retained. They are not proof of current advancing supervision.
- Last phase is EXPORT; supervisor ACK is EXPORT counter 206 / supervisor counter 808. No watchdog state or terminal file exists. Root terminal records supervisor exit 1, status null, missing CLEANUP ACK, retained volume/prefix and exportVerified false.

The exact read-only native allocation helper succeeds on this actual empty archive. Archive path is 100 characters, tar path 118, package path 123. This is negative evidence against the proposed path-length explanation; no path-limit fault has been established.

## METHOD08-ACTUAL-R01-001 — P2: supervisor writer failure escapes its failure handler

`inputs/next/r100-v3-watchdog.mjs` lines 33, 42–44 and 66 use one `host-space-next.json` for every atomic publication. `rawAtomic` requires that temporary path to be absent, writes it, then renames it. If rename throws after creation, the temporary file remains. The main catch proceeds to stop the owner-scoped worker and calls `guardedAtomic` for watchdog-state; this enters the same writer and throws on the retained temporary file outside the original protected loop. The supervisor exits without its failure-state/terminal transport.

An exact-module cold VM control injects a single rename EPERM: one rename attempt, one inert owner-stop Docker stub, retained temp, uncaught `assert(!existsSync(guardTemp))`, no state file, no terminal file and no terminal IPC event. The happy control writes a terminal normally. The VM relocates module imports/exports and excludes the CLI; the supervisor function body and its writer/catch predicates are unchanged.

Independently, a real Windows read handle that denies delete causes Node rename to fail with `EPERM`, errno `-4048`, and leaves the source temporary file. That establishes a real platform mechanism consistent with the retained pair. **It does not establish that an actual Python reader caused this run's failure, or that its original errno was EPERM.** The source defect and loss-of-diagnostics class are proven; the original trigger remains unknown.

Required new revision: make publication exceptions latch a fail-closed IO fault and disable further filesystem publications through that failed writer; retain the owned temporary file rather than blindly deleting it. Perform bounded owner-validated stop where possible and emit a terminal/failure IPC record independently of the failed disk writer, with exit 1 and retained-prefix status. A top-level boundary must also capture exceptions arising during stop/report/terminal handling. Never suppress the IO/capacity failure, claim terminal persistence, accept the run, or restart the worker. No blind IO retry is needed for this correction.

## METHOD08-ACTUAL-R01-002 — P2: first errors are discarded before the outer terminal

`inputs/next/r100-v3-launcher.mjs` line 49 spawns the supervisor with stdout and stderr ignored. Line 53 limits Python stage traceback evidence to its first 256 characters; the actual exception suffix is absent. A subsequent assertion failure can therefore erase the first exception, and the remaining root terminal cannot distinguish Windows IO, guard sample freshness or another package failure.

The exact Python guard cold replay with retained static counter812 refuses before tar creation with `HOST_OUTPUT_STOP_NOT_ACCEPTED:SUPERVISOR_SAMPLE_STALE`. This is an explicitly synthetic replay after supervision stops; it is one compatible package error, **not** a recovered actual reason. It demonstrates why inventing the missing traceback suffix would be wrong.

Required new revision: bounded supervisor diagnostic IPC plus bounded stderr capture with explicit overflow/unavailable flags, and a bounded structured Python failure envelope carrying exception class and allowlisted guard reason/OS errno, stage/phase and whether the error is primary or secondary. Preserve the first failure, attach subsequent failures separately, and keep stdout terminal fail-closed when stderr capture overflows or final IPC is unavailable. Infrastructure-only metadata must avoid secrets/raw worker data. Capture errors in new artifacts or terminal transport, never append to this failed prefix after supervision stopped.

## Verification and next gate

Eight diagnosis controls PASS: five Python controls, two exact-supervisor VM controls, one actual-terminal negative control. Real provenance verification also passes. All final commands exit 0:

- `.venv/Scripts/python.exe -B .docs/implementation/reviews/p05/topic-method08-actual-export-diagnosis-round01/cold-controls.py`
- `C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe .docs/implementation/reviews/p05/topic-method08-actual-export-diagnosis-round01/supervisor-controls.mjs`
- Same Node `terminal-rejection.mjs` in this packet: actual exit1/status NOT_ACCEPTED is correctly rejected; missing receipts are passed as null, not synthesized.
- Same Python `verify-provenance.py` in this packet: 143 actual evidence children, 13 prior review children, 107 input mappings and real restored1813 source verify.

Two initial control harness errors are preserved in attempt01 logs: the Python assertion expected INITIAL_ADVANCE_MISSING, but the exact guard first emits SAMPLE_STALE at the floating time boundary; the Node VM initially passed a host-realm config object to strict deepEqual and failed before supervisor execution. The harness now uses the actual observed guard code and parses config in the VM realm. Product/producer code was never changed.

Root should implement a new immutable method revision addressing both defects, run finite writer/IPC/exception/privacy controls, and obtain independent review before a fresh authorized run. Include injected rename/write failure, residual temp, failure while stopping/reporting, Python envelope, missing IPC, bounded stderr overflow and normal terminal controls. Preserve actual08 FAIL and its retained native volume until a separately authorized, verified forensic export/cleanup. A successful worker100/100 alone does not close R100, the layout matrix or P05.
