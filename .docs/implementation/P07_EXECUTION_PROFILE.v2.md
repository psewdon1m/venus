# P07 — execution profile revision 2

2026-10-25, declared before retry03 and first soak. Inherits every workload, duration, CPU, memory, quality, admission and recovery condition of [revision 1](P07_EXECUTION_PROFILE.md). Only the joint browser fixture PID/thread limit changes from1024 to2048. This is not a production service limit or a reduction in client isolation.

Revision1 failed before the first room assertion in both retained preflights. Round02 measured pids.events max47, pids.current969 after crash, pids.max1024; Chromium reported pthread_create EAGAIN. Memory peak1986273280 bytes under6442450944, oom/oom_kill0, noCPUthrottling. Thus the narrow correction provides thread headroom to the required eight independent Chromium processes; CPU12/RAM6GiB and observed acceptance thresholds remain unchanged. No earlier FAIL becomes PASS.

Proof: evidence/p07/preflight-round02/failure-diagnostics.json. Rollback: revert fixture pids_limit and host declared-profile field; revision1 remains available and its observed failure remains recorded. Runtime tests must name revision2 and exact source.
