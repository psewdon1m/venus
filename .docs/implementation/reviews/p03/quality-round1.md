# P03 · independent quality/protocol pre-freeze review · round 1

Reviewer: `/root/p03_quality_review`. Status: **CHANGES_REQUIRED_BEFORE_MEASUREMENTS; NOT EXIT-P03 PASS**. Review basis: preregistration commit `c653a260993743971d436e8a2793b8a5d222a63a`, tag `p03-m1-preregistered-20261018`, and mutable implementation observed during review. This is a preliminary static review; it does not certify a final source identity, completed PostgreSQL integration or statistical measurements. No Docker commands or statistical simulations were run by this reviewer.

Reviewed scope: implementation-plan P03, normative 08 and P00 implementation contracts, ADR-015 and independent entry review, machine measurement protocol, production selector/consent/pack validation, Games persistence/projections/routes, synthetic fixture and existing unit tests. Statistical runner, real-DB P03 tests and final stage gate are explicitly still being implemented; their absence is a pending obligation, not an unexpected regression.

## Findings

| ID | Priority | Finding and concrete consequence | Required resolution |
| --- | --- | --- | --- |
| P03-Q-01 | High / before first measurement | Inference `sizes=3+(index%6)` and `mode=index%3` alias the two axes: N3/N6 always questions, N4/N7 truth_or_dare, N5/N8 yes_but. Twelve N×mode cells never occur. An implementation leaking in an omitted cell can pass the pooled classifier. | Separate axes before the first measurement, declare strata and retain train/holdout seed separation. Report the covered cells and limitations explicitly. |
| P03-Q-02 | High / before first measurement | Exchangeable fairness protocol has only `in_person`, mixed modes and a single aggregate gap; entry review requests per N/mode/context measurements. Opposite biases in different modes can cancel. A pooled inference AUC also cannot rule out a deterministic channel confined to a small subgroup. | Preregister per-stratum diagnostics/criteria and minimum sample/denominator handling, include online or justify and separately verify its equivalent behavior. Structural deterministic-channel failures must block regardless of pooled AUC. |
| P03-Q-03 | Medium / before first measurement | GF has a paired seed design but no precise CI formula; sampler protocol omits actual public/general stage choice `[.2,.4,.6,.6]`, exact conditional normalization and history counting. Its 95% branch is history-downweighted, not literally uniform. This leaves room for alternative implementations after seeing results. | Freeze a premeasurement addendum/new protocol revision with exact formulas and source/pack hashes, retain original prereg tag. Threshold lower95%CI>1 remains unchanged. |
| P03-Q-04 | High / transport regression | `CONTRACTS.md` §7 promises the `/round/finish` and `/response kind=finish` forms the same scoped idempotency. `Games.finish` uses `game_finish`, whereas `Games.response` uses `game_response`. A completed finish retried through the other alias reaches `canFinish` and rejects `ROUND_NOT_ACTIVE` rather than replaying the prior result. | Normalize the two aliases to one operation and normalized request before idempotency lookup; add authenticated cross-alias retry in both directions, with changed-body/key negatives. |
| P03-Q-05 | Medium / measurement implementation obligation | A feature extractor using only `RoundPlan`/`AuditProjection` or public `actors` undercounts actual observer information. `games-model.ts` leaves questions-solo `actors=[]`, but localized text identifies P1. Generic round state, response state, repeated game revision/stream metadata and timing are also observable. | Use an explicitly declared public-transcript adapter, include all declared observer features or justify exclusions; separately test recursive transport fields, text roles and deterministic timing/state/size channels. Do not describe one fixed LDA probe as a universal privacy proof. |

## Statistical method recommendations fixed before results

For paired GF opportunities let `X_i` indicate the affected pair selected in the G run and `Y_i` the same pair in the matched F run, with identical opportunity seed/pool. Use sample means `pG,pF` and unbiased sample variances/covariance `sG²,sF²,sGF`. The delta-method variance for `log(pG/pF)` is `(sG²/pG² + sF²/pF² - 2*sGF/(pG*pF))/n`. Report raw 2×2 paired outcome counts, ratio, standard error and `exp(log(ratio) ± 1.96*SE)`. Zero denominator/count or nonfinite variance must not become PASS through an undocumented continuity correction. This is a proposed explicit paired formula, not a measured outcome.

The actual option probability, after hard filters, interaction-type gates and anti-repeat/recovery, is `.95*r(o)/sum(r) + .05*r(o)*w(o)/sum(r*w)` where `r(o)=1/(1+sum(history appearances of its actors))`, pair `w` is the original class weight and other `w=1`. History currently counts distinct `[primary_member_id,...actors]` for every committed round, including group/solo primary. Fix these details, stage gates, RNG derivation and recovery/fallback order in preregistration.

Hanley–McNeil normal CI is an approximate diagnostic for the declared fixed held-out classifier. Declare positive class, tie treatment, coefficient/orientation selection from training only and exact SE formula. Do not choose score orientation or thresholds from holdout. Pooled normal approximation with many tied scores is not a proof against nonlinear or deterministic attacks. Independent structural assertions and honest per-stratum coverage remain mandatory.

## Positive observations and remaining gate obligations

The static selector enforces the 36-cell resolver, comfort/context/stage/capability guards, X veto, immutable/version-pinned snapshots, unused-card filtering and deterministic seed replay. Private pair budget counts committed proposals and excludes consecutive identical private pairs when an unused admissible alternative exists. Public common-support restriction does not silently rewrite interaction type. Production pack loading rejects synthetic drafts unless a server-controlled synthetic permission is explicitly enabled; production reviewed registry is still absent by design until P04.

Consent code has two scopes, exact deadline checks, own-actor acknowledgements, proposal revision invalidation and refusal terminality. Static code inspection alone does not establish transaction/race behavior. The complete EXIT-P03 still requires production-engine RE-001…018 mapping, ≥70000 session evidence with separate refusals/completions, independent assertions for each of15 invariants, actual authenticated HTTP/WS/DB races and immutable snapshot tests, migration/restore/quiesced rollback, and a final bound review. Selector-only assertions cannot independently certify runtime consent, host ACL, room closure or real-world action nonperformance invariants.

No final PASS or source-bound JSON approval is issued in this preliminary report. After fixes and clean candidate/evidence freeze, repeat the independent review against exact source SHA/identity and archived results.

Observed SHA256 identities (mutable files may change after this review):

| Input | SHA256 |
| --- | --- |
| Machine protocol | `f9dd0c023c25f2393e10e50e4eb7b920ffd171f7843bc18d3739193dd75b4406` |
| Production engine.ts | `be84b979418c56e17066b0c1788ec985f869a99ab38c2c77ad3daa84657c3d8a` |
| Games implementation | `7a2db8f1c015a91875372549136c4f758a5eeb849f6b259553ab070873b1d031` |
| Synthetic fixtures | `2aafb7bf856a6cef9499924a9439f44e9f62665ea4078805d696566308a114dd` |
