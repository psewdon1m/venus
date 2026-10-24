# P04 independent preflight — NOT_ACCEPTANCE

Date: 2026-10-19. Reviewer: `/root/p04_gate_preflight` (independent review agent).
Inspected baseline: `579ca40a9344fd0af841ff2e2883e394321dfbe7` (`main`, accepted P03 delivery).
Status: **NOT_ACCEPTANCE**. This report identifies implementation scope and acceptance obligations; it does not certify a P04 candidate, run P04 tests, approve content, or close EXIT-P04.

Independence: reviewer authored no production code, tests, validators, contracts or catalogue. Only this report was written. Concurrent P04 changes by other agents are outside this baseline review.

## Sources inspected

- `.docs/10_IMPLEMENTATION_PLAN.md` §8, dependency table and common gate rules.
- `.docs/09_CARD_AUTHORING_AND_AUTOMATION.md` §§1–15.
- `.docs/contracts/card.schema.json`, `card-batch.schema.json`.
- `.docs/implementation/USER_DECISIONS.md`, `.docs/adr/ADR-006-age-content.md`.
- `tools/validate_cards.py`, `validate_card_batch.py`, `build_card_pack.py`, `check_stage_history.py`.
- `packages/card-catalog/src/index.ts`, relationship engine `pack.ts`, `engine.ts`, `types.ts`, existing engine tests.
- `apps/api/src/games.ts`, `rooms.ts`, `game-routes.ts`, `app.ts`.
- `.github/workflows/ci.yml`, `.docs/05_CI_QUALITY_AND_RELEASES.md`.
- `C:\Temp\venus-p04-preparation.md` (prospective planning only, not evidence of an implemented capability).
- `.artifacts/p03/delivery/merge-api-error.txt` (actual saved HTTP 405: “8 of 8 required status checks are cancelled.”).

## Baseline findings

1. P03 already implements exact whole-session `preflight` before Start writes participants/snapshot/active state. Reuse this algorithm rather than inventing a weaker card-count estimate. `prepare` presently does not expose shortage before Start. A preview remains advisory: Start must reevaluate committed current setup, offer, membership, capabilities, pack and revocations.
2. `FrozenPack.load` already enforces schema, policy/card hashes, reviewed status outside explicit synthetic mode, role parity, context/consent guards and expanded text render budgets. The production catalogue package is still an availability=false placeholder. Games production provider remains absent; capability list is currently empty.
3. Existing Python catalogue dedupe only examines RU, keyed by mode, with combined functional fields. It misses EN/TR-only and cross-mode/cross-side duplicates. It excludes generic Yes-But responder boilerplate, which should remain an explicit exception rather than making all responders unique filler.
4. Existing batch validation checks input shape and collisions against a supplied directory; it does not durably reserve IDs, coordinate concurrent reservations or validate output distributions. It compares the source manifest's stated digest without independently recomputing its payload digest.
5. Python structural checks are weaker than the actual runtime loader for control/bidi characters and expanded placeholder budget. A Python PASS alone is not proof that a production pack can load.
6. P03 public common-support intentionally excludes min_comfort>0, pair scopes above acquaintance and physical/going-away public cards. Private cards additionally need stage>=3, proper consent/capabilities and a sufficiently large F/comfort1 baseline for the private budget. Coverage must identify these rule exclusions; do not weaken the engine or mislabel every unavailable sensitive public combination as a catalogue hole.
7. Games caches immutable pinned packs. A revocation design must explicitly invalidate serving eligibility despite cached pack bytes and delayed HTTP/WS/outbox reconstruction. Existing offline `quiesce()` deletes game state and is unsuitable as a complete live-revocation mechanism by itself.

## Minimal complete technical scope

| Component | Required behavior / concrete evidence |
|---|---|
| Bounded authoring batches | Schema+policy+source-catalog hashes; atomic durable ID range reservation; same batch/hash idempotent, same identity/different input conflicts; output count/IDs/mode/distributions checked; no user preferences in requests. Preserve revision/state history and structured rejection/quarantine. |
| Review ledger and package | Exact immutable card/revision/text+metadata hash, batch/upstream hashes, reviewer identity/competence/date, separate editorial/safety/rights/RU/EN/TR decisions, near-duplicate dispositions and source references. Trusted approval operation distinct from agent generation. Changes invalidate prior approval. Machine-checked approval structure is not proof that a human actually supplied it. |
| Catalogue-wide validation | CARD-001…015 over every candidate file, runtime `FrozenPack` dry-load, deterministic NFC canonical hashes, ID/revision/pack/policy consistency, complete three-locale fields and role parity, no partial publish. Originals and prior revisions retained. |
| Similarity/diversity | Hard normalized exact duplicate failures in RU/EN/TR across IDs/modes and functional sides; explicit responder-boilerplate exception. Turkish-aware casing tests. Deterministic near-duplicate queue with rationale/thresholds and hash-bound human dispositions. Per-mode category share and meaningful interaction/context/stage/comfort variety; human semantic originality cannot be replaced by a template counter. |
| Engine coverage | Actual `eligible` predicate for supported mode×context×size2…8×stage1…4×comfort0…4×resolved J/F/G/M/S/R; X negative pair tests. Distinguish rule-unreachable, missing capability, content shortage and supported cells. Count unique cards, not actor permutations. Include actual runtime capabilities and proposed future profiles as separately labelled inputs. |
| Session feasibility | Real `preflight`/planner simulations, each mode/context/N2…8 neutral comfort0 completes20 with no repeated card ID. YB all-pairs-X refuses before Start; X still permits appropriate group/solo Q/TD. Requested rounds1…100 only accepted if complete safe plan exists. Generic pre-start shortage without exposing private edges/classes/card choices; Start rechecks. |
| Bundle/publication | Full deterministic manifest plus review/coverage evidence, exact source/schema/policy and service-release binding; immutable image/bundle content, not untrusted network JSON. Atomic single-digest active pointer with trusted operator boundary, audit and compare-and-swap/concurrent-operation handling. No valid human-approved bundle means fail-closed production provider and null pointer. |
| Rollback/revocation | Pointer switch to a verified compatible non-revoked previous bundle only. Existing safe pinned sessions keep exact digest/revision. Revoked unsafe revision cannot be served or silently replaced; terminate/skip affected active tasks under explicit policy, withdraw consents and clear prior private recipients monotonically. Revocations survive restart and restore of an older DB backup. Corrupt/missing required durable ledger fails closed. |
| Regression/provenance | Meaningful unit+real PostgreSQL+HTTPS/WS tests, old-image rollback with quiescing where needed, immutable P00 inputs, accepted P01/P02/P03 historical validations, source-bound P04 report and independent agent reviews. Every failed round retained. |

The shared/exclusive advisory transaction fence proposed in the preparation memo is a plausible implementation, not a mandated architecture. If used, acquire the global shared/exclusive lock before room locks; never upgrade a held shared lock; lock multiple rooms in deterministic order. Online revocation must preserve per-member stream revisions and enqueue clears before discarding old recipient references. Durable revocation intent must be reconciled before readiness following an interrupted DB commit or old-backup restore. Prove the chosen alternative with actual concurrent serving/revocation tests.

## Required negative and failure tests

1. Duplicate/reserved ID, overlap in concurrent batches, same batch different base/hash, interrupted reservation/retry; no reused IDs or partial output adoption.
2. Wrong actual source-manifest hash, altered policy/schema, mismatched distributions/count/range; malformed/duplicate-key/nonfinite/oversized input yields controlled rejection.
3. Missing Turkish dare, role mismatch or malformed token, wrong participant count; online hug, missing private capability, wrong context/stage/comfort/bilateral flags; bidi/control text and expanded render overflow.
4. Agent self-asserted reviewed/original_verified, example-origin card, missing review dimension/competent identity/date, approval for stale text or metadata, mixed revisions; production loader cannot use synthetic/draft fixtures or a test override.
5. EN/TR-only normalized duplicate, RU cross-mode and TD side duplicate, Turkish dotted/dotless I, near-duplicate unresolved/rejected decision, excessive category share without accepted exception. Reused generic responder is not a functional duplicate by itself.
6. Meaningfully unsafe content with falsely low-risk metadata goes to editorial/safety rejection or pending review. Neither lexeme absence nor schema PASS may become automatic human clearance. Explicitly test fixed prewritten YB condition and neutral-truth/unsafe-dare cases as unresolved/rejected editorial fixtures.
7. Empty/short safe pool; 20 unique IDs cannot be manufactured from participant permutations; 1…100 complete-plan boundary. All-X YB fails before active snapshot/participants; group/solo remains possible where allowed.
8. Prepare succeeds then membership/preferences/offer/pack/revocation changes: Start reevaluates and rejects when newly unsafe. Preview never exposes hidden pair class, actual eligible card IDs/count by private profile, or individual refusal reason.
9. Wrong pack/card/hash/policy/image/review evidence; incompatible or revoked rollback target; stale pointer CAS; concurrent publish; interruption between bundle persistence and pointer commit; no partially active pack.
10. New sessions use B after switch, existing safe A session replays exact A; rollback A does not mutate safe B sessions. Revoke a card already cached/selected/pending/actively consented and suppress delayed public/private delivery; no hidden replacement.
11. Real cross-process/cross-room concurrent revoke vs Start/advance/HTTP/WS dispatch: no stale post-revoke enqueue after the trusted operation returns. Prior recipients get higher-revision generic clears on live connection/reconnect; consent cannot be reused.
12. Ledger-write failure, DB-commit failure, crash/restart and restore pre-revocation backup; no resurrection. Old runtime rollback is only enabled after appropriate quiescing and external ledger preservation; additive catalogue migrations do not pretend to be supported by old Games generation checks.

Keep runtime fixture approvals explicitly synthetic/test-only and isolate temporary stores. A positive test of ledger verification is not a reviewed production card.

## External human blockers and completion boundary

- **Mandatory blocker:** at least100 distinct original reviewed cards in EACH of3 modes, with real independent editorial/safety/originality-rights and competent RU/EN/TR checks tied to exact bytes. No such real review evidence exists in the inspected baseline. The12 examples and600 P03 synthetic drafts do not satisfy this.
- **Mandatory human dispositions:** substantial-similarity/near-duplicate cases and semantic/cultural/role equivalence, naturalness and usable three-locale rendering. Automated near-duplicate scoring may assist but not approve these.
- **Sensitive-card boundary:** qualified human safety review is mandatory for romantic/physical content. U-003/ADR-006 already fixes explicit18+ and offer acceptance; do not reopen that choice or treat declaration as proof of safe prose. A deliberately neutral first catalogue may avoid using sensitive cards, but must transparently record unavailable scope and cannot fabricate required diversity/coverage.
- **Other public dependency:** actual production offer/version/hash approval remains separate for P05/public entry; a pack pipeline cannot authoritatively approve the owner's offer by itself.

Prepare a concrete bounded draft catalogue and review bundle before asking for real reviewers/approvals. Record specific missing decisions/evidence and keep independent autonomous technical/preparatory work moving. EXIT-P04 must remain BLOCKED/NOT_PASSED until mandatory human evidence exists; a technical sub-gate PASS must use an explicit limited name and cannot authorize dependent EXIT-P05. P06 preparatory work and other independent research allowed by the plan remain distinguishable from stage acceptance.

## CI duplicate-event correction

Current workflow starts for both `push(feature/**)` and `pull_request(main)` using the same repository+source-branch concurrency group with cancel-in-progress=true. They run identical required names against the exact same head and can cancel one another. The saved P03 actual merge error confirms cancelled required checks were a real delivery obstruction, not a hypothetical optimization concern.

Recommended minimal correction: **CI push branches=[main]; pull_request branches=[main]**. Preserve all eight existing required job/context names, official Actions identity, strict branch protection, pinned actions/read-only permissions, exact PR head checkout/fetch-depth0, full sample sizes and120-minute measurement budget. Add P04 job(s) explicitly where needed; do not replace required jobs with success stubs or exclude necessary paths. This aligns the normal-PR/push-main trigger model already stated in `.docs/05_CI_QUALITY_AND_RELEASES.md`; tag/release obligations remain separate and must not be claimed implemented by this one correction.

Consequences and checks:

- Feature branches without a PR no longer receive remote CI. Run local checks, then open a PR for the source candidate; future PR pushes trigger synchronize checks. Do not require a cancelled feature-push run as P04 acceptance evidence.
- Static regression should parse actual workflow and verify event scope, eight required names and exact-head checkout; no accidental job/path skip. Verify actual new PR run provenance and the live required-check bindings before protected merge.
- Keeping the current source-branch concurrency group deduplicates obsolete PR heads and does not collide with push-main. Distinct source branches remain independent. Cancelled OLD-head attempts are retained, never relabelled as fresh candidate evidence.
- Adding event name to concurrency alone prevents cancellation but retains duplicate expensive same-name checks on one SHA and does not solve the underlying duplicated workload. Disabling cancellation globally also retains duplicates; neither is preferred.
- Do not delete historical cancelled runs, bypass protections or synthesize statuses. Record full run/attempt/job/artifact bindings and archive actual bytes as in P03.

No implementation or test execution was performed as part of this preliminary review. Final acceptance must inspect the actual new candidate SHA, source identity, test evidence and human evidence independently.
