```venus-review
{"reviewer_id":"/root/p03_final_evidence","source_sha":"8b6101bfeb54b00d789b58e046907af4e783cef8","source_identity_sha256":"0f01d8fc1feb4b61ea2f91a2cf6f630616b7ee997beb328a2654338bc1b53964","scopes":["implementation","evidence"],"status":"PASS","open_findings":[]}
```

# Independent final P03 implementation and evidence review

**Decision: PASS for this exact technical candidate; open findings:0.** This reviewer authored no production implementation, diagnostic observer, measurement protocol or acceptance-validator code. Review was read-only except this review and its hash-bound sidecar. The parent must attach both independent final reviews and execute the final acceptance validator; this review does not itself mutate the stage acceptance record.

Reviewed source: `8b6101bfeb54b00d789b58e046907af4e783cef8`. Included implementation identity: `0f01d8fc1feb4b61ea2f91a2cf6f630616b7ee997beb328a2654338bc1b53964`. The current included files match the frozen inventory and tested Git tree. M3 descriptor inputs match all15 current and preregistered tagged byte hashes. The M3 tag and descriptor existed before all four final runs. Reports preserve clean source, forced compilation before runtime imports, protocol/pack identities, and unchanged before/after source and executed-input hashes.

## Scope, retained findings and contracts

Read scope includes implementation-plan EXIT-P03, document08 and P00 implementation contracts, M1/M2/M3 protocols and reviews, ADR015/016, production selector/eligibility/snapshot/consent/pack/projection code, Games service and migration stream, room dispatch integration, runtime test sources, acceptance validators and bound final evidence. The original frozen contracts remain unchanged; additions are versioned separately. Current effective coverage explicitly supersedes historical M2 planning labels and NOT_RUN entries without rewriting their frozen history.

The unsuccessful14482d2 attempt remains retained. Its required Linux CI rollback fixture failed and partial statistical sections were interrupted; those results were never promoted to acceptance. The subsequent test-harness permission/diagnostic fix preserves production nonroot operation. The initially absent progressive evidence was a real RE-016 gap, as corrected in the premeasurement review. M3 added passive counters/assertions before the new corpus; production algorithm, original numerical thresholds, seed families, profiles, fixture and public-transcript observer were preserved. No hidden seed selection, completed failed statistical result or threshold relaxation was found.

The pre-freeze verifier findings are resolved: consistent all-private-zero results fail the late-eligible nondegeneracy check; session seeds/prefixes independently determine all168 stage totals; cap and private totals reconcile per session and cell; fairnessK must equal progressive pair-interaction counts,D=2K and raw invitation counts. Six Python acceptance tests and nine small diagnostic JS tests were independently executed during preregistration review, including these negative cases. Final review ran no additional corpus or Docker workload.

## Implementation and actual runtime evidence

The source implements the exact36-case resolver, immutable/version-pinned snapshot, comfort/context/stage/capability guards, unused-card selection, bounded private proposals and deterministic replay. Public common-support restriction preserves original interaction types; sensitive incompatible public cards are excluded rather than silently reclassified. Production draft-pack admission remains fail-closed.

Current scope authorization precedes idempotency replay. Invitation and action have separate bilateral acknowledgements, proposal revisions and deadlines; terminal refusal cannot reopen a proposal. Private outbox entries contain references. Reconstruction and synchronous WebSocket enqueue occur while holding the room lock shared with revocation, with fresh session/generation/member/actor/version/deadline checks. Stale references produce targeted clears, including previous recipients after advance. The final no-await time fence covers the previously reported invitation/action dispatch-boundary defect.

Bound PostgreSQL/HTTPS/WS evidence contains **19/19 P03 checks PASS**: concurrent start/duplicate advance; active/paused setting locks; host/actor/outsider ACL; condition revision invalidation; exact clock boundaries; committed-decline dispatch barrier; old-recipient clear; private HTTP/WS projection; both finish aliases; pack/restart/locale/spectator pinning; unsupported-version and safe-pool refusal; SQL scope; both serialized and concurrent decline races; transport versus safety resume; stop/leave/close; identity non-substitution; restore and rollback. Both runner records report completed cleanup.

The independent invariant interpretation remains precise:

| Invariants | Evidence boundary |
| --- | --- |
| I01–04,I07,I09,I15 | Per-selected-plan guards, exhaustive/golden tests, production localized renderer and separate safe refusals |
| I05–06 | Planner and pure consent checks plus actual two-scope actor ACL, deadline, private transport and dispatch tests |
| I08 | Immutable snapshot plus real locked settings, safety stop, reconnect and pinning tests |
| I10,I13 | Actual nonactor-host/forged-actor denial, generic room projection and private HTTP/WS checks |
| I11 | Timeout expires/skips consent; no physical action performance is inferred |
| I12 | Production loader rejects synthetic/unreviewed content; human content approval remains P04 |
| I14 | Explicitly0 pure-planner checks; real room-close revoke/wipe and external-ledger restore reconciliation supply the required evidence |

Accepted P02 regression has22/22 proof records, OCI smoke9/9 and clean quality/negative checks PASS on this source. The previous P02 image is identified by its accepted source. Rollback stops the API before trusted quiescence, clears active Games scopes, preserves core identity/preferences, and returns without reviving consent. Its default unavailable-offer host-close503 is explicitly recorded; old close under a synthetic offer adapter is not misrepresented as production approval.

## Independently recomputed measurements

Every section is a complete gating M3 run rather than a probe. Raw statistical records, stage histograms, session counts and seed prefixes were checked independently; the source-bound statistical validator also passed all four sections.

| Section | Recomputed result |
| --- | --- |
| Invariants |70000 distinct declared sessions,10000 per N2…8;3467600 selected rounds;15 invariant records,0 violations;439703 private proposals |
| Safe refusals |1836 retained separately with exact prefixes: N2=1684,N3=150,N4=2,N5…8=0;68164 completed sessions |
| Fairness |42 cells,84000 sessions,1680000 rounds; worst aggregate share gap0.0066011441983≤0.02; max individual session share0.5 |
| GF |1000000 paired observations; counts both32906/G-only333/F-only0/neither966761; ratio1.010119735002735;95% CI[1.0090279052580886,1.0112127461737674] |
| Inference FG/FM/GM |42 cells each plus three separately trained pooled models; all129 AUC/SE/CI metrics recomputed from201600 stored score values; worst cell upper CI0.571442450937/0.579647274065/0.605316318205≤0.65 |

Fairness stage1/2 have zero private proposals. Stage3 has92626 private proposals from420000 eligible-after-cap decisions; stage4 has162557 from406219 eligible-after-cap decisions across420000 rounds. All42 late cells are nondegenerate. Per-session private counts never exceed5 in the20-round fairness profile. Anti-repeat records show427450 decisions with alternatives,148176 private choices with alternatives, zero violations and24906 justified sole-pair exceptions. No unconditional stage4>stage3 or empirical recovery0.35 CI is claimed.

GF covariance and both confidence bounds were recomputed from the paired2×2 counts without pseudo-count substitution. Inference recomputation used tie-aware Mann–Whitney AUC and the declared Hanley–McNeil interval. All126 cells have the declared100 training and400 held-out observations per class, disjoint seed families and no recorded deterministic decoder. Pooled AUCs are0.504730185303/0.502954257015/0.498124991142; training-only orientation and independent pooled training were source-reviewed.

All four raw Linux results from the same successful CI run exactly equal local results after excluding **only** `elapsed_seconds`. Verified artifact IDs: invariants12148846051,fairness12147848934,GF12148635853,inference12149102219. Index source/run identities and file hashes match. This is cross-platform reproducibility of the declared diagnostics, not an additional independent statistical sample.

## Protected CI and final gate boundary

GitHub run **39156750574** is completed/success for this exact source. All eight required jobs succeeded in that one run: quality,container-smoke,p02-integration,p03-integration and the four measurement sections. No cancelled or failed jobs from other runs were mixed in. Main protection requires these exact eight checks from GitHub app15368, strict checking, enforced admins, PR review and conversation resolution, with force pushes/deletion disabled.

All gate-packet descriptors were checked. A complete validator call on an in-memory `status=PASSED` copy verified source/CI/runtime/OCI/statistical obligations; the sole remaining error before review attachment was the expected requirement for two independent final implementation/evidence reviews. This report supplies one such review. The authoritative acceptance record remains the parent's final bound gate report after attaching both reports and validating it.

## Limits retained

Fixed linear probes, approximate confidence intervals and finite single-feature decoder checks do not prove universal privacy. Their observer model covers declared public-channel data, synthetic all-accept lifecycle/timing, fixed names/locale and common-support F/G/M profiles. Participant-owned auxiliary information, human conduct and arbitrary classifiers are outside that diagnostic. Hard veto/comfort/context/capability exclusions remain observable.

Synthetic private-chat capability does not enable the product feature. Production approved catalogue, actual offer/public entry, complete consumer Games UI/private chat and human content/rights/RU-EN-TR review remain P04/P05 obligations. Encryption is server-side at rest with scoped transport ACL, not E2EE. This technical P03 PASS does not authorize public release, physical execution or later-stage gates.
