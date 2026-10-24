# P05: candidate subject map for the exact 450-card draft

**CANDIDATE_AGENT_CLASSIFIED_PENDING_INDEPENDENT_AND_HUMAN_REVIEW.** No card is approved, no runtime is changed, and original owner review450 **HOLD** remains. This is an excluded evidence input for the next implementation, not a release map, clean-source application proof or full P05 PASS.

All 450 current draft cards were read individually in RU/EN/TR: Questions question, both Truth/Dare sides, and YesBut proposal plus responder. YesBut has two exact responder templates per locale, with 124 and 26 members; both describe the consent/condition/stop procedure rather than another bounded subject. The manual per-card topic choices and content rationale are in `classification-notes.tsv`. The builder only packages those choices and validates references; it does not classify by keywords or copy `category` into topics.

The candidate has **13 topics, 450 exact entries, 445 multi-tag entries and 2250 localized source fields**. Every entry pins card revision, canonical SHA256 and raw file SHA256. Canonical hashing follows the existing RE-1 algorithm: NFC string values, recursively sorted object keys and preserved array order. The raw and canonical hashes also match the historical final card map and final history selection. `source-witness.json` records the actual input bytes before and after packaging. Its scope is those inputs, not the whole concurrent worktree.

## Files and reproduction

| File | Purpose |
|---|---|
| `taxonomy.candidate.v1.json` | RU/EN/TR labels and explicit inclusion/exclusion boundaries; all labels remain candidate translations |
| `private-topic-map.candidate.v1.json` | Exact references, union topic tags, semantic IDs, per-card rationale, localized field hashes and unresolved flags |
| `semantic-families.candidate.v1.json` | Exact source-family references, explicit unproven identity placeholders and mixed-visibility resolution proposal |
| `localized-review-corpus.json` | Unmodified source texts beside candidate tags/rationale for independent and human review |
| `classification-notes.tsv` | Individually authored assignments; shorthand legend is in taxonomy |
| `source-witness.json` | Hash-bound read inputs and before/after identity |
| `validation-report.json` | 24 mechanical checks, including 18 rejected mutations; no semantic or language approval |
| `build_candidate.py`, `validate_candidate.py` | Reproducible packaging and mechanical binding checks; writes stay in this directory |

From repository root, using the configured Python environment:

```text
python -B .docs/implementation/evidence/p05/topic-map-candidate-01/build_candidate.py
python -B .docs/implementation/evidence/p05/topic-map-candidate-01/validate_candidate.py
```

Actual execution used `.venv/Scripts/python.exe` because a bare `python` executable was absent from PATH. Both scripts exited 0. Validation result is **PASS_MECHANICAL_CANDIDATE_BINDING_ONLY**. Negative mutations cover missing/duplicate/unknown cards, revision and both hash drifts, unknown/empty/duplicate topics, unknown family, missing locale or TD side, changed locale-field hash, false approval/runtime eligibility, removing owner HOLD, removing pending-review flags and taxonomy digest drift. These are checks of the candidate artifact; they do not exercise application behaviour.

## Subject decisions requiring review

The eight starting terms were a proposal, not a pre-existing taxonomy. This candidate retains leisure, food/drink, places/travel, music/sound, absurd fiction, friendship and personal boundaries, then adds creative expression, everyday objects, nature/animals, humour/wordplay, communication/support and personal experience. No explicitly romantic or sexual subject was identified in the exact revised draft, so a romance term was not inferred merely from a private pair. Qualified editorial review still needs to confirm that judgement.

Topic union includes every side and every localized example. Q-1102 includes leisure, creative/book content and food because cooking is one option. Q-1110 includes music, friendship and creative expression. TD-1033 includes food because its dare requests a food comparison, even though its truth asks about shapes/textures. TD-1070 includes both support preference and the shared-snack dialogue. The absence of a topic from one side never cancels its presence on another. Mandatory “if you wish”, invitation/acceptance and stop boilerplate do **not** make all 450 cards boundary topics. Conversely an actual invitation, advice-permission or privacy question can be a communication/boundary subject. Personal pace in YB-1168 is not music; aesthetic taste in TD-1172 is not food. These are semantic readings, not word matches.

Broad creative-expression classification affects 375/450 cards and 118/150 private cards; absurd fiction affects 290/450 and 66/150 private cards. This is a deliberate conservative union candidate, with usability consequences: excluding a broad subject may leave a small or empty permitted pool. Review should refine boundaries where appropriate before freezing a usable taxonomy. Empty pools must remain safe-empty in the future implementation. These counts do not justify silently dropping a tag or widening a user's exclusions.

All entries remain pending independent subject review and qualified human editorial/RU/EN/TR review. Specific additional flags are preserved:

- **TD-1132 / Turkish:** `küçük nota` in a sentence about putting a word into a tiny written note could be understood as musical notation rather than a written message. Confirm intended wording with a qualified Turkish reviewer. Music remains a topic in either interpretation; this is not permission to edit the frozen card here.
- **YB-1072 / Turkish:** `ay çiçeği` for lunar flowers may need lexical confirmation against a familiar flower expression. The RU/EN intent is fictional lunar gardening. Candidate nature/fiction tags remain conservative; the localization is not declared approved.
- **Q-1115:** asking the pair to choose a neutral humorous-dialogue topic is open-ended. “Neutral” does not constitute a controlled vocabulary. The service must not inherit guaranteed topic boundaries for a subsequent arbitrary selected subject.

The map describes the service prompt, not all possible participant replies. Free text may introduce additional subjects. YesBut's responder can propose a free-form condition; future condition/topic changes need their own reviewed policy and a new exact bilateral consent. This static map cannot guarantee the semantics of arbitrary user wording. No filter or NLP implementation is introduced here.

## Semantic families: explicit remaining work

All **21 original semantic concerns** are retained as source lineage; **37 active exact references** match current revision and canonical hash. Empty historical families and inactive original IDs remain visible, and are not assigned to replacement IDs by numbering or lineage alone. Some original descriptions no longer literally describe the changed active cards. The existing group is therefore a conservative unresolved editorial concern, not a new assertion that the revised content is identical or different.

The remaining **413 cards receive `P05-CAND-SINGLE-<id>` identity placeholders**, with `SINGLETON_PLACEHOLDER_CROSS_CARD_SIMILARITY_UNPROVEN`. These are references for review, **not** proven semantic families, not proof of originality and not enough to close cross-mode/session/pair repeat gates. Exhaustive review of 101025 possible pairs was not performed. Every source concern also remains unresolved. Promotion must not interpret complete identifier coverage as complete semantic review.

The immediate review work includes repeated motifs and requested outcomes across current revisions: changing/ending a conversation; fictional thanks/support; book/letter/punctuation dialogues; names for musical/nature imagery; friends' shared walks or celebrations; personal quiet/pace, observing versus performing, and disclosure/hidden-meaning metaphors. Shared theme alone does not prove the same semantic task. Conversely a changed object alone does not prove distinctness. Reviewers should compare actual requested actions and interaction/visibility, including both TD sides, rather than automatically merge all cards under one topic.

For **P04-SEM-17 and P04-SEM-18**, propose unconditionally excluding **all five current members** from a **new versioned topic-enabled repertoire**: `YB-1113`, `YB-1126`, `TD-1005`, `YB-1005`, `YB-1133`. This candidate does not implement exclusion. The exclusion must not depend on whether a hidden private event occurred. Removing only a public half after a private event creates an observable history decoder. A future differentiated-family alternative needs new semantic review and a new digest. Historical pack/card bytes remain untouched, and a new repertoire requires new coverage/fairness/privacy proofs.

## Promotion and rollback boundary

Independent agents must review candidate semantics, locale consistency, optional examples, all-side union, family gaps and mixed-visibility handling. Human content/rights/language approval remains separate and cannot be manufactured by a mechanical check. All map/taxonomy/family artifacts have `approved:false` and `runtime_eligible:false`. Unknown refs/hashes/topics/locales or unresolved required reviews must fail closed in a future promotion path.

No runtime reader, selector, migration, API, UI, production registry, manifest, immutable snapshot, historical evidence or human status was modified by this task. Withdrawing this candidate requires ignoring this evidence directory; there is no active deployment to roll back. Any later activation must be a separately versioned implementation with its own tests and independent gates.
