# ADR-016 · P03 progressive evidence and retained unsuccessful attempts

Status: ACCEPTED_TECHNICAL_BEFORE_M3_CORPUS. Stage: P03. This records technical gate obligations under U-004; it grants no content/legal/public-release approval.

## Evidence gap

EXIT-P03 requires every RE-001…018. RE-016 includes actual progressive distributions by stage. M2 recorded global pair shares, G/F and inference, but did not record the measured private eligibility/progression distribution, per-session cap or alternative-pair decisions. The fixed sampler probabilities and source inspection alone cannot replace that evidence. The independent final evidence reviewer corrected an earlier nonblocking interpretation before acceptance.

M2 source14482d2 remains unaccepted. Its local quality, OCI and runtime tests passed; Linux CI failed on permissions in the rollback test fixture. Partial statistical sections were interrupted and retained in `../implementation/evidence/p03/attempt-14482d2/`. Neither the preregistration tag nor historical failed reports are overwritten.

## Decision

M3 retains algorithm RE-1.P03-M1, policy RE-1, the exact M1/M2 seed strings, profiles, samples, sampler probabilities, classifiers and numerical thresholds. It adds independent observation of the unchanged production planner: stage/eligibility/interaction/comfort distributions in168cells, raw per-session private proposal counts, zero early-private and cap violations, and last-private-pair alternative decisions with explicit no-alternative exceptions. An observer computes candidate availability before anti-repeat/recovery/branch selection and never feeds a decision to the planner.

Availability before and after the fixed session cap are distinct denominators. A proposed round is not evidence of accepted consent, message delivery or performed physical action. Late observed frequency may plateau or fall because of cap/card exhaustion; no unconditional stage4>stage3 threshold is invented. The report exposes these restrictions. Recovery probability0.35 is not described as empirically estimated without a separate measurement.

The exact protocol, runner, diagnostic observer, public renderer, fixtures and policy inputs are committed and hashed before the M3 corpus. A separate immutable preregistration tag is used. Gate validation rejects partial/probe/dirty/changed-source evidence and inconsistent raw histograms, sessions or counter denominators. Any later measured-input change requires another preregistration revision.

## Linux rollback fixture

The accepted P02 image runs as UID1000. A host-created0600 ledger can belong to a different Linux CI UID. The test uses a project-owned private Docker volume with explicit Linux ownership/group permissions and supplemental group access; it preserves the host ledger0600. A network-disabled initializer only prepares that test volume. The app remains nonroot. Retained logs/ExitCode and explicit cleanup preserve the first failure instead of masking it with a404 after automatic removal. The volume and container are removed only by exact project-scoped names.

This is a test-environment fix. Production permissions, core schema and the engine algorithm are unchanged. The source is frozen again and the complete required checks are repeated before EXIT-P03.
