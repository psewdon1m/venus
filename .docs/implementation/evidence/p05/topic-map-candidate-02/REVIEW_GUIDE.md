# P05 topic-map candidate 02 — corrections after independent round 01

**CANDIDATE_AGENT_CLASSIFIED_PENDING_INDEPENDENT_AND_HUMAN_REVIEW.** Owner review450 remains **HOLD**. `approved:false` and `runtime_eligible:false` remain on all candidate documents. This directory does not activate a map or alter runtime, production registry, card bytes, historical proofs, source manifest or stage status.

Candidate 01 and its independent CHANGES_REQUESTED report are preserved. `lineage.json` pins all 13 original file hashes, the review MD/JSON hashes, the prior map and the new map/taxonomy. It records all 45 changed card classifications. The 13 topic IDs and localized labels remain stable; taxonomy revision 02 clarifies boundaries. Every new digest is recomputed and pinned. Exact card revisions and raw/canonical hashes are unchanged for all 450 entries.

## Corrections and audit scope

P05-TOPIC-001 is addressed by separating a communicative subject from answer procedure. Q-1015's invitation signal gains communication; Q-1129 and Q-1115 lose it. The same boundary was revisited across the full 450-card reading and manual notes: arbitrary clock-hand, instrument, jar-lid, typography and inner-character dialogue is not automatically communication/support. Explicit invitations, greetings, thanks, refusal, applications, announcements, CV self-presentation, interpersonal accounts and communication wording/style remain substantive subjects. A YesBut proposal wrapper or responder consent template never adds this subject by itself. New exact-card positive and negative controls exercise both old and new responder templates and TD dare-side speech acts.

P05-TOPIC-002 is addressed beyond the two reported examples. Q-1063's seed packet and YB-1026's holidaying postcard gain objects; so do substantive manufactured books, tea-bag character, weather container, glass dome, door/curtain, sign/craft and negated fence/sign scene constraints where omitted. A concrete manufactured object used as character, substantive image, container or physical feature is distinguished from a postcard/caption/note merely serving as answer medium. Food is still contextual: YB-1029's jars/lids are objects without an automatic food tag, whereas YB-1054's saucepan/lid carry food and objects.

P05-TOPIC-003 is addressed with an explicit water boundary: YB-1066's domestic tap drop loses nature and retains objects, humour, leisure and creative expression. TD-1064's everyday drip sound is not nature. TD-1130's unspecified transparent water drop remains conservative natural-water imagery under the clarified definition. Q-1133 explicitly includes a rustling leaf, so nature does not depend on guessing where its alternative drop came from. A lemonade sea is not automatically natural water. These distinctions have positive and negative regression controls.

The reviewer also identified fiction/metaphor ambiguity. Q-1031 weekday patterns, Q-1039 tune/waiting simile, Q-1041 song/door/room metaphor and Q-1130 ordinary imagined bun no longer automatically imply an impossible story world. All four retain an explicit editorial-review flag. Literal impossible object-agent stories, such as a postcard taking its own holiday, remain fiction. **No creative-expression tags were removed**, and no tags were relaxed to manufacture a viable private pool.

The original author read all 2250 actual RU/EN/TR fields during candidate 01, including both TD sides and both distinct YesBut responder templates. All those source bytes are unchanged. This follow-up revisits the three requested boundaries across that entire reading and the per-card notes; changed/control examples were reread against current localized source text on all sides. `boundary-audit.json` identifies all 450 references, exact field hashes, subject rationale and decisions. It does not pretend that mechanical hash checking is semantic review or that a second qualified translator review occurred. The current localized corpus includes all actual text for independent review.

## Tests and read-only verification

`validation-report.json` is an explicit new receipt from this candidate. It covers 450 unique current references, 2250 field hashes, known nonempty topic/family IDs, all source bindings, the historical catalog digest, unchanged candidate 01, source-family references, pending flags and the mixed-visibility proposal. There are **34 check groups**, comprising the original 24 checks, lineage/audit binding, semantic controls and eight semantic mutation checks. The **78 semantic controls** include the independent round 01's 13 expected judgments plus new author-defined positive/negative examples; their exact source text, card hash and rationale are preserved in `semantic-controls.json`.

Eighteen malformed binding mutations and eight known-wrong subject mutations are rejected. The latter include all six original mismatches plus additional arbitrary-book dialogue and travelling-book object regressions. Semantic controls are explicit editorial expectations tested in an in-memory candidate policy simulation, **not a runtime selector test or independent/human approval**. They improve regression detection without pretending to prove all 450 meanings automatically.

The new validator is read-only by default and with `--check`. A receipt is created only by explicit `--output` to a new file directly in this directory. Existing files and destinations outside this directory are refused before execution; no frozen receipt is overwritten. `validator-mode-checks.json` records actual no-write/default/check behaviour, existing-receipt refusal, outside-directory refusal and unchanged original candidate hashes.

```text
python -B .docs/implementation/evidence/p05/topic-map-candidate-02/validate_candidate.py --check
python -B .docs/implementation/evidence/p05/topic-map-candidate-02/validate_candidate.py --output .docs/implementation/evidence/p05/topic-map-candidate-02/new-review-receipt.json
```

The explicit-output example must use a filename that does not already exist. Packaging is reproducible with `build_candidate.py`, but reviewers should use `--check`; the builder is an authoring tool that rewrites candidate outputs. Candidate 01's scripts and receipts were not edited.

## Usability observations and unresolved decisions

Creative expression is still on 375/450 cards and 118/150 private cards. Excluding it leaves these **raw candidate counts**:

| Mode | Private references remaining | Context split |
|---|---:|---|
| Questions | 28 | 15 in-person, 13 online |
| Truth/Dare | 0 | None |
| YesBut | 4 | 2 in-person, 2 online |

These counts precede runtime eligibility, history, pair/comfort/stage restrictions, other exclusions and the proposed five mixed-family removals. They are a usability warning, **not viable-session/C2 coverage**. A future implementation must show truthful safe-empty behaviour; it cannot promise all modes remain playable or silently weaken a person's choices.

All 21 source semantic concerns remain bound to 37 exact active references. The other 413 IDs are explicit identity placeholders, not proof of semantic distinctness. Reviewing actual cross-mode/session repetitions remains open; neither complete ID coverage nor an absence of exhaustive 101025-pair comparisons closes that gate. Inactive original IDs are not transferred to replacement IDs automatically.

P04-SEM-17/18 retain the proposal to exclude **all five current members** (`YB-1113`, `YB-1126`, `TD-1005`, `YB-1005`, `YB-1133`) unconditionally from a new separately versioned repertoire. Public selection must not change because of hidden private history. This remains a proposal with new coverage/fairness/privacy proof required; historical pack bytes were not modified.

Q-1115 remains open-ended and cannot confer a controlled vocabulary on a subsequent chosen topic. TD-1132 Turkish written-note wording and YB-1072 Turkish lunar-flower wording still require qualified review. Four metaphor/fiction judgments have explicit added editorial flags. All entries retain independent and human RU/EN/TR/editorial review requirements. No professional translation, rights or content approval is asserted.

Static prompt tags do not control participant free speech or arbitrary YesBut conditions. New condition/topic wording requires its own reviewed policy and a fresh exact bilateral consent. No NLP filter or runtime enforcement is introduced here. To withdraw this work, ignore candidate 02; there is no deployed state to roll back. Any activation must be separately versioned, tested and independently gated.
