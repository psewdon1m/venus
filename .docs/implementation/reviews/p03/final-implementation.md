```venus-review
{
  "reviewer_id": "/root/p03_final_implementation",
  "source_sha": "8b6101bfeb54b00d789b58e046907af4e783cef8",
  "source_identity_sha256": "0f01d8fc1feb4b61ea2f91a2cf6f630616b7ee997beb328a2654338bc1b53964",
  "scopes": ["implementation", "evidence"],
  "status": "PASS",
  "open_findings": []
}
```

# P03 · independent implementation and evidence review

Reviewer: `/root/p03_final_implementation`. Date: 2026-10-18. **PASS for the frozen P03 implementation/evidence review scope; no open findings.** Complete source-bound runtime/statistical evidence and all eight CI jobs have now been checked. The reviewer authored no production implementation, test, measurement protocol, gate validator or acceptance registry. Only this reviewer's derived reports were edited. The stage registry remains under the executor's control and still requires the other independent review and final gate verification.

## Exact source and review scope

HEAD and an independently recomputed `tools/stage_inventory.py` identity match the exact source and inventory above. Production `apps/api` and `packages/relationship-engine` bytes are unchanged from the earlier inspected14482d2 source. The intervening implementation diff contains the Linux rollback fixture, M3 measurement-only diagnostics/validator, their tests and corresponding documentation. The reviewer checked that narrow diff separately.

Read scope covers the P03 plan and normative Relationship Engine/CONTRACTS; ADR-015/016 and P03_DEVELOPMENT; requirement coverage and prior negative reviews; actual resolver/eligibility/planner/snapshot and pack admission; encrypted Games persistence/model, SQL/migrations, HTTP actor/participant/host authorization, consent revisions/time bounds and WS dispatch. M3 diagnostic source and its independent counter reconciliation were also inspected.

For the available packet, the reviewer independently verified22 declared companion hashes, source identity, raw protocol/input descriptor hashes and matching preregistered tagged input bytes. All four complete measurement reports preserve exact source before/after, clean flags, executed-input before/after hashes and the original descriptor. The reviewer independently called the read-only `validate_statistics` on the whole packet: raw counts, session prefixes, caps, holdout scores/AUC/confidence bounds and all declared cells pass. Review files and derived evidence are excluded from implementation identity; this does not authorize changing runtime or measurement inputs during a run.

## Checks actually executed or inspected

Independently executed after the final8b6101b freeze: engine/consent/Games-model/private-delivery/M3-diagnostic Vitest files, **5 files / 34 tests PASS**, Node24.22.0, start22:04:41. The implementation identity remained unchanged afterwards. These include exhaustive36 directed combinations and comfort/context/stage guards, golden replay, consent lower bounds, template expansion, private Yes, But responder preservation, the no-await dispatch deadline boundary, per-session cap and alternative-pair negative regressions. No Docker workload or full statistical corpus was rerun by this reviewer.

Inspected exact-source local evidence records lint/type/build/schema/i18n/docs checks,42 JavaScript and89 Python tests, four effective corruption fixtures, nine OCI smoke checks, P02 regression20 tests/22 proof records and P03 real PostgreSQL/HTTPS/WS19 tests passing. Disposable runner cleanup completed. The OCI image configuration ID is `sha256:89d92f80a2bcc566a528df1cc94773c8e662419c3a82b67f0cbe41de90cabf1f`; this is not a signed registry-release digest. The inspected OCI runtime is UID1000, unprivileged, read-only root filesystem, all capabilities dropped and no-new-privileges, with read-only secret mounts.

The inspected GitHub Actions packet is completed run [39156750574](https://github.com/psewdon1m/venus/actions/runs/39156750574), exact head8b6101b, conclusion success. All eight jobs are completed/successful: quality, container-smoke, p02-integration, p03-integration, and the four invariants/fairness/GF/inference jobs. Main protection is strict, enforces admins and PR/conversation/linear-history requirements, disallows force pushes/deletion, and requires all eight declared checks from app15368.

The reviewer also checked the four raw Linux CI statistical artifacts against their index hashes and exact source identities, then compared every nested result to the corresponding complete local result excluding only `elapsed_seconds`: all four match exactly. The retained [CI artifact index](../../evidence/p03/ci-measurements/index.json) has SHA256 `c46f8e254f9e1f700e6a36d98c2b21d1b4a48b31764b8a9c7c9096de73112ed9`; inference artifact12149102219 is from the completed run above. This supplements successful job labels with the actual measured data.

## Implementation and prior-finding closure

- Consent permission requires current active state, exact authenticated actors, two acknowledgements, server activation/last-ack lower bounds and strict expiration. Invitation and action are different proposals; changing a pending Yes, But condition raises revision and clears both action acknowledgements. Duplicate/stale acceptance cannot extend a deadline, and terminal scopes do not reopen.
- Actor, game-participant and host authority are distinct and checked before idempotency replay. A nonactor host cannot accept or read for the pair. SQL membership/actor FK chains, immutable identity rows and deferred exactly-two consent rows prevent cross-room/player substitution. Both finish forms normalize to one scoped operation. Safety stop/decline remains usable without a compatible snapshot or current offer acceptance.
- Snapshot, policy/algorithm, pack digest and random seed are pinned before round1 and encrypted with resource-bound AAD. Active/paused settings are locked; locale/name rendering and spectators do not modify selection. Unknown pinned versions and empty safe pools fail closed. Production has no reviewed pack provider, and unsupported online private capability is masked.
- The outbox stores references rather than secret prompt/condition text. Current authenticated generation, offer acceptance and exact game/round state are checked under the room lock shared by revocation. Payload reconstruction uses committed encrypted state; a final no-await clock check precedes synchronous enqueue while the lock is held. Real DB prepared-reference/revoke tests and deterministic awaited-read deadline regressions cover the original stale-delivery findings. Old-recipient references become targeted clears across rapid round changes.
- Public private-round projections remain generic without private card IDs, actors or reasons. Private Yes, But preserves both reviewed instruction fields with one-pass substitution. Pack admission bounds worst-case192-codepoint Unicode-name expansion and combined/alternative text fields before play; text is not silently truncated to pass transport/storage limits.
- Transport loss, leave, pause, stop, timeout and room close revoke scopes; reconnect cannot revive old consent or bypass a safety pause. Restore preserves pinned ciphertext/identity/preferences while current ledger and expiry revoke access before serving. New same-name participants cannot substitute for pinned departed UUIDs.

## Rollback and the retained failed attempt

The earlier14482d2 attempt remains [INCOMPLETE](final-implementation-14482d2-interrupted.md), with Linux CI18/19 failure and interrupted partial measurements retained in the evidence directory. The final fixture fixes the actual Linux ledger ownership issue in its own Docker volume: UID12345/GID12346 mode0660, accepted runtime still UID1000 with supplemental group12346. The host0600 ledger and production permissions are not weakened. Sanitized logs/state survive until explicit removal; cleanup preserves the primary failure and targets only the exact owned container/volume. The ledger is copied back before candidate resume.

The real rollback proof stops the candidate API, invokes trusted local quiesce, removes round/consent/outbox data and active snapshots, then runs the exact accepted P02 image against the upgraded additive schema. Core identities/preferences remain unchanged; returning to P03 leaves old games aborted and creates a new seed without inherited consent. The P02 default offer-disabled host-close503 is explicitly recorded; the separate old-close200 exercise uses an openly synthetic offer bootstrap and does not claim public legal approval. Final source local19/19 and Linux CI p03-integration success close the previous fixture failure.

## Preregistered measurements and final evidence

The complete invariants report is independently source/hash-bound; its70,000 sessions (10,000 per size2..8), raw prefixes/stage distributions and per-session caps were checked through `validate_progressive`. It records3,467,600 selected rounds and zero violations. There are1,836 explicitly retained safe refusals:1,684 atN2,150 atN3 and2 atN4; these are not misreported as completed sessions. All15 invariant records remain distinct. In particular, I14 has zero pure-planner checks and explicitly requires actual runtime evidence: the authenticated PostgreSQL/HTTP/WS room-close, restore/ledger and revoke tests supply that proof. I05/I06/I08/I10/I12/I13 likewise retain their declared runtime dependencies; a synthetic selector or consent probe alone does not establish host ACL, secret delivery, human content review or physical performance.

The reviewer independently checked the complete fairness report's42 size/mode/context cells and84,000 raw session records, recomputed K/D count consistency and every aggregate player gap, and executed the read-only progressive validator. All pass. Maximum aggregate share gap is0.0066011442 (0.6601 percentage points), below0.02; per-session individual invitation share is at most0.5 using D=2K. N2 necessarily gives each player0.5 and cannot promise partner variety.

The168 progressive rows reconcile to1,680,000 selected rounds,420,000 per stage. Private proposals are0 in stages1/2,92,626 in stage3 and162,557 in stage4. Corresponding post-cap eligible-round denominators are0/0/420,000/406,219. These are selected proposals, not delivered invitations, bilateral acceptance or physical action. Per-session private caps, justified no-alternative repeats and zero forbidden alternative-pair repeats reconcile with raw session data. Conditional availability and exhaustion remain visible rather than being hidden by pooled totals.

The complete matched GF report is independently source/hash-bound and its paired raw counts were rechecked through `verify_gf`:1,000,000 opportunities, both32,906, G-only333, F-only0 and neither966,761. The ratio is1.0101197350, with covariance-aware95%CI[1.0090279053,1.0112127462]; the lower bound exceeds1. The narrow declared first-round/common-pool opportunity profile does not establish a universal frequency advantage or intimacy permission.

The complete source-bound inference report passes independently recomputed score/AUC/CI checks for126 cells and three separately trained pooled classifiers. Worst cell95%CI upper bounds are FG0.5714424509, FM0.5796472741 and GM0.6053163182, all below0.65. Pooled AUCs are respectively0.5047301853/0.5029542570/0.4981249911, with16,800 held-out observations per class in each comparison; no declared exact single-feature deterministic decoder was found. Fixed public-channel profiles, all-accept synthetic timing and the finite classifier/decoder families remain explicit limits, rather than a claim about every observer or arbitrary social behavior.

`P03-FINAL-EVIDENCE-PENDING` is **CLOSED**: all four full local statistical sections, matching raw Linux results and eight successful exact-source CI jobs are verified. Source SHA and implementation identity remain unchanged; pending technical decisions are empty. An in-memory gate-report copy with status`PASSED` passed runtime/statistical/source/CI checks; the only expected validation error at this pre-assembly checkpoint was the absent pair of final review references. No false stage acceptance was written. This independent report now supplies one of those final PASS references; the executor must bind both reports and run the assembled gate.

## Limits

This technical review does not approve a production catalogue, actual offer or public G1 launch. Human reviewed-content gates remain P04; actual offer/public entry, full game UI and private chat remain P05. Synthetic diagnostics and fixed linear inference probes are limited to their preregistered profiles/public-channel assumptions; they do not establish universal social privacy, physical presence/performance, E2EE or safety against arbitrary participant conduct.
