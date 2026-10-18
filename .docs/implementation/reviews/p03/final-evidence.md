```venus-review
{"reviewer_id":"/root/p03_final_evidence","source_sha":"8f3405d9ef1397c6adcd9f7aba42a5fd7382ef9b","source_identity_sha256":"63a3b972c49214e52c6136204506969c4b35e99bb13b98887e7517fa5e47678a","scopes":["implementation","evidence"],"status":"PASS","open_findings":[]}
```

# Independent final P03 implementation and evidence review · 2026-10-19

**PASS for the exact8f candidate; open findings:0.** Reviewer authored no production runtime, protocol, diagnostic observer or acceptance-validator code. This report and its hash-bound JSON sidecar are the only files changed by this final review. The original8b signed review remains preserved in immutable history tag `p03-m3-proof-timeout-20261019`.

## Candidate and preregistration

Measured source: `8f3405d9ef1397c6adcd9f7aba42a5fd7382ef9b`. Included implementation identity: `63a3b972c49214e52c6136204506969c4b35e99bb13b98887e7517fa5e47678a`. The actual Git tree, frozen inventory and current included source agree.

The only included change from the previous proof candidate is the CI measurement job ceiling60→120 minutes. All15 M3 raw inputs, production engine, fixture, public renderer, seed derivation, profiles, sample sizes, classifier and numerical thresholds remain byte-identical to preregistration tag `p03-m3-preregistered-20261018`. This execution-budget change does not alter the statistical design. Original M1/M2/M3 tags and unsuccessful attempts remain retained.

The previous8b technical PASS is historical. Its later proof commitbc55 failed protected delivery when inference reached125/126 cells before the60-minute job limit; seven other jobs passed. That failure is recorded rather than relabeled. Every artifact accepted here was freshly produced for8f in CI39166967939. No Windows execution or old8b report is presented as a fresh8f run.

Reviewed scope includes EXIT-P03 and RE-001…018/15 invariants, P00 contracts, ADR015/016, selector/eligibility/snapshot/consent/pack/projection code, Games persistence/routes and room dispatch integration, test sources, acceptance validators, M3 protocol/input descriptor, original reviews and the complete fresh evidence packet. Earlier static implementation conclusions remain applicable to the unchanged runtime and are corroborated by fresh actual runtime tests.

## Fresh CI and provenance

Live read-only GitHub API independently confirmed run **39166967939**, official `.github/workflows/ci.yml`, exact8f head, completed/success and all eight required jobs successful in that one run. No failed/cancelled jobs from another run were combined. The current main protection independently matches exact eight required checks from app15368, strict checking, PR review, conversation resolution, enforced admins and disabled force pushes/deletion.

All eight archives were independently checked through the complete chain: API artifact digest equals downloaded ZIP SHA256; ZIP members are unique; exact path/size/hash manifests equal the receipts; extracted report bytes and every copied artifact member match. All32 copied provenance files equal their original collection files, with21 archive-member copies independently matched. Actual job logs have separate copied-file hashes and source/run/job provenance; they are not claimed to be ZIP members.

| Artifact | Actual API artifact ID |
| --- | --- |
| negative-gates |12150927958 |
| container-smoke |12150823525 |
| p02-integration |12150528128 |
| p03-integration |12150713927 |
| M3 invariants |12151967503 |
| M3 fairness |12151169325 |
| M3 GF |12152156956 |
| M3 inference |12152203435 |

Gate descriptors, screenshots, runtime companions, input inventory, coverage, protocol/descriptor and artifact provenance hashes were checked. Fresh report metadata consistently records8f/identity63, clean source before/after, an actual forced CLI build before runtime imports, unchanged executed-input hashes and all preregistered bytes. The collector/assembler provenance and terminal-helper guard findings were corrected and independently closed before final review. Full candidate validation also occurs before VERIFIED coverage is published.

## Implementation and actual tests

Fresh quality logs confirm **42 JS and89 Python tests PASS**, with four negative controls. Fresh OCI smoke has9/9 checks, P02 regression20 tests/22 proof records, and actual PostgreSQL/HTTPS/WS P03 integration19/19. Runner cleanup completed. The image/version/Compose/log records remain bound to the exact candidate rather than inherited from8b.

The implementation maintains exact36-case resolution, hard eligibility guards, immutable policy/pack/seed/player snapshots, deterministic replay, unused-card selection and bounded private proposals. Common-support public repertoire excludes incompatible sensitive public cards without rewriting interaction types. Production unreviewed-pack admission remains fail-closed.

Fresh runtime evidence covers concurrent start/duplicate advance, active/paused settings locks, host/actor/outsider ACL, separate invitation/action acknowledgements, proposal revision invalidation, clock boundaries, decline races, committed-decline dispatch fencing, stale-recipient clearing, public/private HTTP/WS projections, both finish aliases, pinning across restart/locale/spectator/provider changes, version/pool refusal, SQL identity scope, transport versus safety resume, identity non-substitution, stop/leave/close, encrypted restore and quiesced previous-image rollback.

Authorization precedes idempotency replay. Private outbox entries contain references, and WebSocket reconstruction/enqueue is fenced by the same room lock as revocation with final clock checks. The earlier request-deadline/private responder/finish alias findings remain resolved. Rollback preserves identities/preferences and does not revive consent. The accepted P02 image's default host-close503 without an offer is explicitly retained; a synthetic adapter used to exercise its close path is not production offer approval.

The15-invariant interpretation remains honest. Per-plan guards and locale checks are directly simulated. I05/I06/I08/I10/I13 additionally require the actual consent/ACL/clock/dispatch/lock/pinning/privacy tests. I14 explicitly has0 pure-planner checks and is supplied by real room-close wipe/revoke and restore-ledger reconciliation. I12 proves production rejection of draft/unreviewed packs; it does not grant human content approval. Timeout never establishes physical performance.

## Independently recomputed statistics

The source-bound statistical validator passed all four complete gating sections. Independent calculations also recomputed fairness raw counts/denominators and gaps, GF covariance/ratio/both bounds, and all129 inference AUC/SE/both-CI metrics from201600 stored held-out score values. These values include scores from cell and pooled models, not201600 independent held-out sessions.

| Section | Verified fresh result |
| --- | --- |
| Invariants |70000 distinct declared sessions,10000 per N2…8;3467600 selected rounds;15 invariant records,0 violations;439703 private proposals |
| Safe refusal |1836 exact retained seed/prefix records: N2=1684,N3=150,N4=2,N5…8=0;68164 completed sessions |
| Fairness |42 cells,84000 sessions,1680000 rounds; worst aggregate share gap0.0066011441983≤0.02; max individual session share0.5 |
| GF |1000000 paired opportunities; both32906/G-only333/F-only0/neither966761; ratio1.010119735002735;95% CI[1.0090279052580886,1.0112127461737674] |
| Inference FG/FM/GM |42 cells each,100 training/400 holdout observations per class/cell, independently trained pooled models; worst cell upper CI0.571442450937/0.579647274065/0.605316318205≤0.65 |

All168 progressive rows reconcile with raw session seeds, selected prefixes and exact stage totals. Private proposals are0 at stages1/2. Fairness stage3 has92626 private proposals and stage4 has162557; eligibility before/after cap is distinguished. Every exchangeable late cell has actual eligible opportunities and private selections. Per-session cap and conditional anti-repeat assertions have zero violations; N2 sole-pair exceptions are explicit. No unconditional stage4>stage3 or empirical recovery0.35 CI is claimed.

GF uses the preregistered paired covariance without pseudo-count substitution. Inference recomputation uses tie-aware Mann–Whitney AUC and the declared interval, with finite scores, all126 declared cells, no recorded deterministic decoder and training-only orientation. Pooled AUCs are0.504730185303/0.502954257015/0.498124991142.

Fresh raw report SHA256:

- invariants: `7c5e5ee1a0b0d6a2940b63b7a408236a4ef409a94ed015b75649d75b71b10910`
- fairness: `4656836a46c5c6b6d197d0437dedf4082dc420465503f21cc08aaff7f4df863b`
- GF: `fddfccddc6b053542f5f310ce36baeb187c3d9bbda74b39ec0ee6379b1bf7514`
- inference: `8b5e36ff9b337c1d49392315f1b567e1d7bb065fd7662897e8da7fbe5725e4f7`

## Acceptance, delivery and limits

A complete validator call on an in-memory PASSED candidate verified source/CI/runtime/OCI/statistical obligations. Before attaching final reviews, its sole error was the expected requirement for two independent implementation/evidence reviews. This report supplies one; the parent performs aggregated acceptance after attaching both. No circular prerequisite of an already-accepted gate is imposed.

Protected proof-commit CI and PR merge are subsequent delivery facts, not claimed by this technical PASS. The reviewed delivery scheme retains original proof/8f ancestry under `p03-proof-20261019`, then records actual proof CI/PR merge/main identities in the annotated `p03-accepted-20261019` tag on the actual merged main commit. Its annotation continues the stage journal without another tree mutation or a CI bypass. Future Git verification needs fetched proof history; a tree-only ZIP is not a standalone Git object database.

Fixed linear probes, approximate confidence intervals and finite decoder checks do not establish universal privacy. Their scope is the declared public observer, synthetic all-accept lifecycle/timing, fixed names/locale and common-support profiles; participant-owned auxiliary information, arbitrary classifiers and human conduct remain outside that diagnostic. Hard veto/comfort/context/capability exclusions remain observable.

Synthetic chat capability does not enable a production feature. Approved catalogue and human content/rights/tri-locale review remain P04; actual offer/public entry and full G1 UX/private chat remain P05. Server-side encryption/ACL is not E2EE. Public release and physical execution are not authorized. Per the user's explicit steering, complete protected delivery of P03 and then **STOP; P04 NOT_STARTED**.
