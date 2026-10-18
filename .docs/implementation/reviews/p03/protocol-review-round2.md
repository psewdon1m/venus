# P03-M2 · independent premeasurement protocol review · round 2

Reviewer: `/root/p03_quality_review`. Scope: read-only review of preliminary findings Q01/Q02/Q03/Q05 and proposed `p03-measurement-protocol-v2.json`. **Not EXIT-P03 PASS; measurements have not been certified.** The reviewer authored the separate finish-alias/render-budget fixes and does not independently approve that code here. No statistical or Docker runs were performed for this review.

Observed protocol SHA256: `d4f321e6d42de2716b1813060d49eaceeb49625dd83d65c551cfde8867a8f708` (mutable proposal, before tag).

## Resolved at protocol-design level

- **Q01:** Explicit independent sampling of all36 size×mode×context inference cells removes the original N/mode modular aliasing. Report must enumerate the complete cell set, rather than infer coverage from a total sample count.
- **Q02:** All42 fairness cells and all36 inference cells have per-cell criteria; pooled cancellation is explicitly disallowed. Online private-chat capability is accurately confined to synthetic simulation. Per-cell holdout400/class and pooled14400/class increase the declared diagnostic coverage; the AUC upper bound0.65 and fairness gap0.02 are unchanged. N/A cannot certify an expected nondegenerate stratum.
- **Q03:** Paired GF indicators, sample covariance, delta-method log-ratio CI, raw2×2 counts and zero-count handling are now explicit. The unchanged criterion is lower95%CI strictly greater than1. Sampler interaction branches, option-mixture normalization, history counting and RNG domain are substantially specified.
- **Q05:** The observer model now includes public text roles, generic state, response/choice/revision metadata, lengths and time. The proposal names the production projection adapter, per-cell and pooled training, fixed orientation and structural blockers independent of AUC. Linear-probe/CI limitations are explicit and appropriate.

These statements concern protocol design only. They do not claim that the still-being-implemented runner follows that design, that structural transport tests have passed, or that runtime privacy is established.

## Remaining details to fix before the first measurement

| ID | Required clarification | False-PASS/audit risk |
| --- | --- | --- |
| P03-M2-R01 | Pin exact fixture identity and generated canonical synthetic pack digest before execution, through this protocol or a versioned companion manifest bound to a clean premeasurement commit/tag. Do the same for the final generator/transcript/feature implementation if it is completed after the protocol tag. | Merely recording the pack/source digest in the result does not itself show which corpus was fixed before results existed. A source-bound premeasurement record prevents undeclared fixture/feature tuning. |
| P03-M2-R02 | Specify the exact random-profile generator: seed encoding, player/edge index strings, SHA digest extraction and reduction to comfort/labels, explicit/default edges, and how player UUID ordering relates to the target first unordered pair. A frozen implementation reference+hash is sufficient. | `SHA256 seed:player/edge gives comfort%5 and label%6` admits several distinct corpora. Equal descriptive seed prefixes alone do not reproduce the70000 profiles or exhaustive comparisons. |
| P03-M2-R03 | Freeze the lifecycle policy, metadata generation, exact feature names/order and normalization, including treatment of missing/zero counts, timing, byte lengths and solo-role recovery. A frozen runner/adapter source reference is sufficient; do not select features from measured holdout. | A descriptive list leaves room to omit inconvenient observer channels or normalize away a subgroup signal. A synthetic adapter must distinguish generated lifecycle/timing from actual HTTP/WS observations; it cannot certify real timing by assumption. |
| P03-M2-R04 | State explicitly why inference excludes N2: an unselected room observer does not exist with two participants. Separately document that targeted-participant inference from its own invitations/prompts is outside this diagnostic and remains subject to structural ACL/secret-field checks. | Without this scope statement a report might overstate the N3..8 unselected-observer result as all-observer/all-group-size privacy. |

No threshold relaxation is recommended. R01–R03 may be resolved by one additional frozen premeasurement implementation/input manifest and matching runner validation; they do not require copying source code into the JSON. Preserve P03-M1 and this initial review; any later changed algorithm/profile/threshold follows the stated new-revision policy.

## Implementation checks for the eventual evidence review

The statistical runner must enforce exact cell sets and sample counts, finite values, expected class balance, disjoint train/holdout seeds and training-only orientation. It must not silently drop refusals, missing cells or failed classifier evaluations. Declare a narrow numerical roundoff tolerance for GF variance before clamping tiny negative values; a materially negative/nonfinite variance cannot yield PASS. Keep paired raw counters so the reported CI is independently recomputable.

The Hanley–McNeil formula and tie-aware Mann–Whitney AUC are specified sufficiently for equal class counts in this design. Approximate CI and a fixed LDA diagnostic do not replace deterministic-channel inspection. The structural tests must inspect the complete declared transport/text/state/role/length surface, not merely search the selector's audit object for forbidden field names.

The runner and transcript adapter appeared near the end of this review while explicitly still being written. A brief static read identified these concrete conformance fixes for the author before freeze:

- `rawPolicy` currently names `.docs/contracts/relationship-policy.json`, whereas the normative file is `relationship-policy.v1.json`; this prevents execution rather than causing a statistical PASS.
- Inference seed field order is comparison/size/mode/context/class in the runner, but comparison/class/size/mode/context in the protocol. Make one exact derivation authoritative before freezing it.
- The pooled metric currently pools raw scores from separately trained stratum classifiers, whereas the protocol requires an independently trained pooled classifier. Scores from different models have different scales/offsets. The declared midpoint intercept is also absent; it does not change within-cell AUC but matters to the interpretation of raw-score pooling. Train the declared pooled model on pooled training samples and evaluate pooled holdout samples without holdout calibration.
- `aucCI` should reject nonfinite input scores explicitly. A finite rank-based AUC does not prove all classifier inputs/scores were finite.
- Final execution currently validates the protocol tag but does not assert a clean worktree or bind ignored compiled `dist` modules to the recorded source. Final evidence needs explicit clean-source validation and a fresh, source-bound build or immutable build/input manifest covering the actual executed modules. A source SHA alone cannot rule out stale ignored JavaScript.

These are observations of unfinished files, not a claim that the completed runner has failed a measurement. Repeat read-only conformance review against the frozen implementation/input manifest before treating measured results as gate evidence. Final EXIT-P03 still needs its separate bound review.
