# Standalone Docker quality · Independent review round 03

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T12:56:50.137966+00:00. **CHANGES_REQUESTED**, stage_acceptance=false. Scope: new full-quality Docker runner, its producer and pinned Python/Node check image. Working tree is dirty; this report does not accept frozen source or a stage.

## SG-002 · P2 · Timeout loses partial execution evidence

`tools/docker-quality.mjs` helper command() throws immediately when spawnSync returns error. Thus docker build/run never reaches raw log persistence, although the spawn result contains partial stdout/stderr. Failure stays fail-closed, but the raw failing attempt is lost, contrary to journal/evidence requirements and particularly harmful for the bounded20-minute subprocess timeout.

Independent reproduction runs the unchanged whole wrapper with isolated fake spawnSync and in-memory writes (no real Docker mutation): build-timeout writes FAIL report but omits build.txt; run-timeout writes FAIL report but omits quality.txt. Both fake results contain distinct partial stdout/stderr witnesses. Positive control writes both logs and PASS; required owned-volume cleanup error produces FAIL/cleanup FAILED.

Required fix: preserve command result until partial raw outputs and bounded error/signal/exit metadata are saved; then fail. Ordinary checked commands may continue to throw. Preserve these failed attempts, repeat isolated fault cases and run actual full suite only after coordinated source freeze.

## Other observations and actual runtime check

Pinned Node/Python base images, hashed pip lock, npm ci, explicit linux/amd64 platform, nonroot UID1000, network none, read-only rootfs/Git bind, capability drop, no-new-privileges and owned writable workspace volume are coherent. The outer runner checks host cleanliness before/after, inner producer checks Git head/cleanliness and included-source identity before/after actual npm quality; receipt paths are an explicit finite list. Final stage acceptance is deliberately absent.

Actual local built dependency image `3e54a8cf449d` probed in an owned --rm container, read-only/network-none/nonroot: Python3.12.14, Node24.22.0, npm11.19.1, Git2.39.5, ssl/sqlite3/bz2/lzma/ctypes/jsonschema imports PASS, UID1000. Container absence independently confirmed after exit. First reviewer attempt used nonexistent default tag; second incorrectly assumed unrequired PyYAML dependency. These are harness mistakes, not implementation failures; final corrected required-runtime probe exit0. Raw failed PyYAML and corrected outputs preserved. No foreign container or volume was removed.

## Limits

No final Docker quality suite was run by this reviewer: sources are still dirty and content author is active. This review does not accept full P04/P05/P06, human card approval, media implementation or production readiness. SG-001 remains resolved from round02. Final source identity and immutable test outputs must be verified after freeze.
