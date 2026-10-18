# Independent P03-M3 premeasurement readiness review

Reviewer: `/root/p03_final_evidence`. **READY FOR PREREGISTRATION FREEZE; NOT EXIT-P03 PASS.** This review concerns mutable premeasurement files based on HEAD14482d2. A matching descriptor, clean commit and new immutable M3 tag still have to be created before final runs. The reviewer authored no runtime, diagnostic, protocol or acceptance-validator code and executed no statistical corpus or Docker workload.

## Normative correction and retained attempt

The earlier interrupted-candidate review correctly withheld acceptance for failed required CI and incomplete measurements. Its nonblocking interpretation of absent progressive counters is corrected here: EXIT-P03.1 incorporates every RE-001…018, and document08 §16 RE-016 expressly requires measured progressive distributions. Fixed source probabilities and global pair shares alone do not establish actual progression. M3 supplies this missing evidence without changing the production sampler. Preserve M1/M2 tags, interrupted M2 reports, failed CI and prior reviews; M2 remains NOT_ACCEPTED.

## Reviewed conformance

- Production engine, policy, synthetic fixture, public transcript adapter and production public renderer have no byte changes from the M2 preregistration tree. The measurement-runner diff adds revision/binding metadata, passive diagnostics and a declared nondegeneracy assertion; M1/M2 seed strings, profile derivation, sample counts, sampler decisions, training/holdout separation, classifier and original numerical CI/fairness thresholds remain unchanged.
- The diagnostic observer does not consume random draws, mutate snapshots or feed decisions to the planner. It observes every successfully selected proposal, including prefixes of safely refused sessions. Counts do not imply delivered invitations, accepted actions or physical performance.
- It retains all168 N/mode/context/stage rows, including zero-round rows; reports interaction and min-comfort histograms, private availability before/after the session cap, and raw per-session proposal counts. The unused-card and common-private-pool eligibility calculation precedes anti-repeat, recovery and stochastic branches. Original hard-guard checks and the15-invariant/runtime-evidence split remain intact.
- Anti-repeat uses the most recent private pair even when public rounds intervene. A different unordered pair must have an unused admissible private option and remaining private budget; identical choices with such an alternative are violations. Sole-pair exceptions are explicit. Session private proposals are bounded by ceil(.25*total_rounds), and stages1/2 have zero private proposals.
- In every exchangeable fairness N/mode/context cell, stages3+4 together must have both eligible opportunities and actual private selections. This closes the all-private-zero false PASS. It does not require stage4>stage3 or equality to .22/.4: fixed caps and exhaustion may reduce late availability. Small non-gating probes do not claim this full-corpus condition.
- The validator independently derives stage round totals from declared session seeds, round profiles and selected prefixes. Every fairness stage/cell must contain2000*5=10000 rounds. Per-cell and global private totals reconcile with sessions; refusal seeds and prefixes remain separately matched. Histograms, cap and anti-repeat denominators are checked. N2 repetition counts and exchangeable N>=3 alternative choices reconcile with per-session counts.
- A concrete review finding was closed before freeze: fairness K was initially independent of progressive pair-interaction totals, permitting contradictory raw denominators in a rehashed positive fixture. The validator now requires K to equal the same cell's pair_public+pair_private counts, D=2K and the sum of individual invitation counts; the corrected fixture and false-K negative test exercise that relation.

## Independently executed checks

`npm test -- tools/p03-measurements.test.ts`: **9/9 PASS**. These small tests cover diagnostic accounting and rejection of excess private proposals, early private proposals and repetition with an unused alternative; no final corpus was run.

`python -B -m unittest discover -s tools -p test_p03_gate.py -v`: **6/6 PASS**,12.046s. Negative cases include consistent zeroing of late private counts, excess session cap, moved stage totals with unchanged global totals, false-K with otherwise self-consistent fairness counts, partial/probe/dirty/source changes, missing strata, insufficient samples, explicit decoder, false AUC/gap and zero GF denominator.

## Freeze and acceptance boundary

Generate the M3 descriptor from these exact final bytes, commit/tag descriptor and inputs together, and enforce the existing tagged-byte, clean-source, fresh-build and before/after identity checks. No final acceptance is issued before all four complete statistical sections, successful required protected CI, actual PostgreSQL/HTTP/WS evidence and source-bound final reviews. Subsequent measured-input changes require the declared revision process; failed/partial runs remain retained.

Recovery .35 is source-inspected; no dedicated empirical estimate or CI is claimed. Fixed linear inference and finite decoder probes do not establish universal privacy. Synthetic lifecycle/timing and observer limitations remain explicit. Human reviewed catalogue P04 and actual offer/public entry/private chat P05 remain outside this review.

Reviewed SHA256 identities:

| Input | SHA256 |
| --- | --- |
| M3 protocol | `1525bbb8fef882626ee5839e45433a0e9120d26c751f959124df19201ad58678` |
| Measurement runner | `37ed8430ffebb5122e9718e87633db6d74b9b611fd3f12b729e16655882ffb5d` |
| Planner diagnostic observer | `510f57cad8e1628e004607cefce9b6baa4e6ec12336d102524dcd05e8720cd1d` |
| Public transcript adapter | `3243e41d56412b851b1b56452ade3e25f137914e10c8399f23eee45c0efdaefc` |
| P03 gate validator | `7ad40576f09a8db9f44b373377cdac8d9c4fdbdf1c3bc86bd321dcee1b65e432` |
| Acceptance negative tests | `5267c4074cd725de8bf947ddca0f3dfe6242f5bd4e644db62a9f245e033851a5` |
