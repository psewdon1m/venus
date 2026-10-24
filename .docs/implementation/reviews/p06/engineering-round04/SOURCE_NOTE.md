# P06 Engineering/QA round04 — interrupted recovery cause

Status: **SOURCE_ONLY_HOLD / P06-E06 CONFIRMED**. Bounded read-only review only; no tests/runtime/Docker/source mutations. No final/pre-sign PASS.

Input: clean clone `C:/.projects/venus/.artifacts/p06-clean-source01`, HEAD `e80bd9f449673ebd5910b7ca4cb1932151404d8e`, declared core `f3c678de940991a3155a4a5f850a6bf912c5d108c343a66b82950325ed73ee80`/1942 freeze10. Observed empty git status. Bounded hashes of engine, P06 plan, fixed recovery profile and phase-kill fixture match freeze10 inventory.

## E06 — original interruption absent from backed-up explicit recovery (P2)

`tools/venus-operator/engine.mjs:38` invokes recoverLocked directly when a nonterminal job has backup. The ordinary run catch at33 records FAILED/original_error, and pre-backup fallback at38 supplies EXECUTOR_INTERRUPTED, but this durable-backup explicit-recovery branch does neither. A process death after BACKUP_DURABLE, MUTATION_STARTED, CANDIDATE_STARTED or HEALTH_VERIFIED can therefore end as RECOVERED_A or RECOVERY_FAILED with original_error absent/null. Recovery outcome is recorded; the interruption that necessitated it is not retained as a separate cause.

PLAN-P06-FAULTS explicitly requires original error preservation separately from rollback outcome. Recovery profile phase_fault_outcome states those are distinct, and measurements_required includes job/events and original error. OPS-08 reinforces separation. This is a concrete metadata/traceability defect, not a data-recovery failure claim.

Before backed-up explicit recovery, durably record the observable interruption when original_error is absent, including the prior interrupted phase. Existing FAILED transition with original_error EXECUTOR_INTERRUPTED is a suitable small implementation; the plan does not mandate that exact transition name. Preserve an already recorded original error and never mark terminal COMMITTED/RECOVERED_A health verification as an interruption. Production recovery can infer an unfinished executor job, not the underlying death cause, so do not invent SIGKILL as its proven cause; SIGKILL belongs only in actual test-producer evidence.

Relevant existing durable-phase assertions plus a bounded interruption metadata unit can establish the correction. Preserve original error both when recovery succeeds and when it fails; no new framework or unrelated P05/full-corpus/UI rerun is requested. Actual08 is in progress and has not been accepted as final proof here. Earlier E03/E04/E05 fixes and coverage await separate actual proof/final review.
