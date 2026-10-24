# Independent P06 Security/Privacy repeat — round02 source portion

Status: SOURCE_ONLY_HOLD_ACTUAL_GATE_EVIDENCE_PENDING. Independent nonauthor reviewer. No new blocking findings. Prior round01 remains unchanged. This is not pre-sign or full stage PASS.

Input: frozen normal clone C:/.projects/venus/.artifacts/p06-clean-source01, HEAD412b7e3f94b84ac094127d13f32c52aaa8d62896; freeze03 core bb7ed1fc354e8ffb018493e4bb11b0cadff87e90e52165da15326639c57163b9,1942 files. Read-only Git diff and source inspection; no tests, Docker actions, remote actions or source/Git mutations by reviewer.

SEC01 CLOSED_FOR_SOURCE_AND_COMPONENT_PROOF: engine.mjs:38 now reruns install preflight before ensureImage/initialize/start on explicit install recovery. Persistent rejection keeps serving closed and original install error. Relevant regression exercises disk rejection, repeated recovery with zero initialize/start calls, then recovery after conditions corrected.

SEC02 CLOSED_FOR_SOURCE_AND_COMPONENT_PROOF: published schema version/tag patterns now decode to one regex escape per dot (two total backslashes for the two version separators). Relevant regression checks fixture manifest version/tag, service tag and rejection of wildcard separators. Source acceptance is supported by actual existing unit05 receipt; reviewer executed no tests.

E01 CONFIRMED: candidate health receives expected manifest before HEALTH_VERIFIED/commit. Explicit recovery of finished COMMITTED/RECOVERED_A closes serving before expected runtime identity check, and opens only after success. Wrong-identity regression proves rollback to A and closed gate on later failed verification.

E02 CONFIRMED: explicit recover checks active job while holding executor lock, then removes only exact job UUID plus .dump.tmp/.vbackup.tmp; regular/non-symlink/single-link/current-owner/mode0600 requirements precede unlink and directory fsync. Unrelated temp is retained; symlink negative regression is present. This adds no automatic restore or glob cleanup.

Reviewed all freeze03 implementation deltas: exact release-input fixture ownership, narrow Dockerfile contexts and CI-policy expected job list. The packaging changes do not alter consumer/operator/executor trust boundaries. Consumer1000 still has no Docker/operator credentials; operator1002 still receives narrow UDS only; executor1001 with Docker daemon remains explicit trusted TCB, with production dedicated/rootless isolation deferred. Global/topic ledgers remain outside DB backup, pre-serving reconciliation and fail-closed authority remain in scope. No new blocker confirmed from these deltas.

Read and SHA256-bound root evidence .docs/implementation/evidence/p06/fast-preflight02/INDEX.json (09989959e993612824ed905e8dee527c828eb12239a1e3cb923046852b148d29). Unit05 logs report26PASS0FAIL0SKIP, exit0; lint03 exit0. All six exact input hashes in that index match frozen clone bytes. This is component proof only; fullquality02 and real Docker A/B/PG restore/fault/ledger/Chromium actual results await orchestrator exact-evidence handoff.

Real signing owner approval/protected environment and actual service publication remain separate. No service-signing success inferred from fixture keys. Production/DNS/TLS/mobile/external backup-copy remain deferred. Card470 temporary local-pilot acceptance and450HOLD unchanged. P07 not reviewed or started.
