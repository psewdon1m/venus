# Local Linux Docker profile for exact signed release

This supplements the immutable source/runbook; it is a bounded test-profile declaration, not a new implementation or an acceptance result. PLAN-P06-INSTALL requires a disposable local Linux Docker profile. A privileged isolated Docker daemon represents infrastructure authority; app UID1000 and executor UID1001 remain unprivileged. No host socket, host bind mount or public daemon port is provided. No production/DNS/TLS/device claim.

Docker Desktop29.1.3/containerd2.2.0 exact release export failed and remains a documented limitation, not repaired or made PASS by this profile. Incomplete archives must continue to fail closed. All generic backup/restore/offline/monotonic-ledger obligations remain mandatory. No source code or historical contract is changed.
