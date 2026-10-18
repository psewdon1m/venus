# P03-M2 · independent final premeasurement review · round 3

Reviewer: `/root/p03_quality_review`. Scope: read-only conformance review of the proposed M2 protocol, `tools/p03-measurements.mjs`, `tests/p03/public-transcript.mjs` and their small diagnostic tests. **This is premeasurement readiness review, not EXIT-P03 PASS or approval of any measured outcome.** No corpus, Docker workload or final statistical run was executed by this reviewer. The separate finish/render-budget code authored by this reviewer is outside this independent scope.

## Conformance findings resolved

- All42 Cartesian size2…8 × mode × context cells are independently sampled for fairness and each inference comparison. The classifier receives100 training and400 holdout observations per class per cell, and independently trained pooled4200/16800 observations per class. Round-count distributions match between classes. Train and holdout seed strings are disjoint and have the protocol's exact field order.
- Random-profile seed encoding, SHA256 byte extraction/modulo, directed-edge explicit flags, canonical participant ordering, target pair, declared capabilities, lifecycle and feature serialization are now explicit in exported `measurementDesign`. Public feature names/order are derived reproducibly from the canonical pack. `measurementInputs` pins raw source identities, exact canonical pack/manifest digest and feature-name digest before execution.
- Paired GF counts and covariance implement the declared delta-method log-ratio CI; lower95%CI must exceed1. Zero counts fail rather than receive a continuity substitute. Hanley–McNeil CI and tie-aware Mann–Whitney AUC match the declared formulas for the balanced diagnostic design. Diagonal LDA uses unbiased within-class variances, midpoint intercept and training-only orientation; pooled training is genuinely independent rather than pooling differently scaled cell scores. AUC/LDA input guards reject nonfinite values.
- The adapter uses the production public-round renderer, recovers a solo primary from visible text, includes ordered role/pair counts, public-card histogram, generic stage/state, response/choice/revision/count/size features and exact normalization. Its all-accept, fixed-tick lifecycle, fixed names/locale and exclusion of real network/human behavior are declared. These synthetic assumptions do not certify production timing, human refusal behavior or private transport ACL.
- Final source/protocol/input descriptor checks compare preregistered tagged bytes; raw executed artifacts and before/after source/input identities are recorded. Changed measured source or inputs turn the result into FAIL. Section-specific diagnostic PASS is not a complete P03 gate; the eventual stage validator must require every mandatory section and real authenticated runtime evidence.

## Corrections and final readiness conditions

The earlier round2 recommendation to exclude N2 was based on conflating selected game players with total room membership. It is corrected here: a room can contain two selected players plus an unselected spectator, so N2 belongs in the public-observer diagnostic. Conversely, at selectedN8 a separate ninth room member is impossible. Describe N8 as a participant's **public-channel-only view**, excluding its own secret edges/private frames from this particular probe; unselected-spectator wording applies only when room capacity permits. The diagnostic does not claim privacy against all auxiliary information possessed by a selected participant.

One concrete fresh-build guard issue was reported and **resolved before freeze**: top-level forced compilation executes only for the CLI entry point, while exported `main()` could formerly be called after import for a non-probe run and still report that forced compilation had occurred. The revised code sets `buildWasActuallyForced` only after successful forced compilation and requires `invokedAsMain && buildWasActuallyForced` for every final call before corpus execution. This reviewer independently invoked imported `main(['--section=gf'])` and confirmed `FINAL_REQUIRES_FRESH_CLI_BUILD` before any corpus or output directory; the negative check passed. No final statistical result was produced through that path.

The corrected observer-scope wording is present in both protocol and `measurementDesign`. Create the descriptor from these exact final input bytes, commit/tag the descriptor and matching implementation, and execute the existing fail-closed preregistration checks. The descriptor/tag do not yet exist in this mutable review snapshot; this is an explicit required freeze step, not permission to bypass them. No threshold, sample-size criterion or first failed measurement may be changed silently after freeze.

## Limits retained for final gate assessment

The finite single-feature exact-value decoder and fixed linear classifier are declared probes, not universal inference proofs. Common-support structural checks and separate real HTTP/WS/state/ACL tests remain necessary. Invariant I14 is explicitly not testable in a pure selector; other runtime invariants carry referenced-evidence obligations. Safe refusals are counted separately with seeds/completed prefix; zero violations does not mean every synthetic profile completed. Original reviewed-content/human/legal gates remain separate.

**Readiness decision: READY FOR PREREGISTRATION FREEZE.** Formulas, stratum coverage, seed derivation, feature adapter and input-binding design are suitable for preregistration without threshold relaxation. The fresh-build invocation guard and observer-scope correction are verified above. Final execution still requires the descriptor/commit/tag binding. No EXIT-P03 PASS is issued.

Final reviewed input SHA256 identities:

| Input | SHA256 |
| --- | --- |
| M2 protocol | `32b11234a7b2b8c897390349e3a101f95f63ccc570a03065e9965dedf7020f67` |
| Runner | `8a90085edbc84cc705e58bce8536793f37b46a802dc8e1991e27f2ba5fdb4cf3` |
| Public transcript adapter | `3243e41d56412b851b1b56452ade3e25f137914e10c8399f23eee45c0efdaefc` |
