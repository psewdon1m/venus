# P05 topic-map round 01 — CHANGES_REQUESTED

Reviewed at 2026-10-19T15:01:41.260191+00:00 by `/root/p04_evidence_review`; independent of candidate author. This is an excluded candidate evidence/semantic review, not a clean-source runtime proof, human approval or full P05 gate. Source/cards/candidate/manifest were not edited. HEAD observed `b5436cde02dd09aa049ce0103cab58d9642e8c70` is context only; exact candidate inputs below define the review.

## Exact inputs and mechanical results

- Map `5e22dd330f31a23e6c83c8f814c4303ddd4a02d8e9eb15acf3b0abf23923b2ca`; taxonomy `f0d3fc5522262f32d4b831ae8e970e0ca35283cbad6952ed2d6d05bab8c83894`; index `5f4e81426daf593179c6850fa00c58b514e8c7bd611ed07c67f57d675f70f970`.
- All13 candidate files match the before snapshot byte-for-byte. Index12 child descriptors match actual sizes/SHA256. All457 source-witness paths match actual bytes before/after; it is not a whole-tree clean proof.
- All450 IDs/revisions/raw/canonical hashes and all2250 localized field hashes agree with actual cards and corpus. Independently recomputed catalog `5de601019fc8eae1c9491a610984e485e3fedce0d36d3d1326b8a589ee528bd4` and compared all450 current final-history-selection refs; exact current selection carries pack `sha256:c668e4e8514d6acd97904c14937787e2f67af909d4af204252efb05d8a076484`. This task did not rerun FrozenPack construction.
- Original24 checks passed, including18 mutation negatives. Original validator was executed only through report construction in memory, omitting its unconditional candidate report write tail. Five additional malformed-binding negatives were rejected. A known-but-wrong subject assignment intentionally passed the declared mechanical validator: this is its explicit semantic limit, not a new acceptance claim.
- Durable own replay: `python -B .docs/implementation/reviews/p05/topic-map-round-01.mechanical.py` exit0, writes review-owned replay output only. The candidate13 files remained unchanged.

## Findings

### P05-TOPIC-001 (P2) — Apply communication_support to the communication subject, not arbitrary spoken/written output

Q-1015 explicitly asks for a signal inviting a team for tea in RU/EN/TR but lacks communication_support. Q-1129 only asks to write a cosy word/detail yet includes communication_support; Q-1115 only chooses an arbitrary humorous dialogue subject but is also tagged communication. The taxonomy explicitly includes inviting and excludes generic answer/write and arbitrary dialogue without a communication subject. With the communication topic excluded, candidate-only any-tag simulation incorrectly allows Q-1015 and blocks Q-1129/Q-1115. Q-1047 and TD-1117 are positive substantive invitation controls.

Required: Correct classifications or issue a precise justified new taxonomy revision; audit all communication assignments against the subject/procedure distinction. Preserve Q-1115 uncontrolled-topic flag; do not treat it as a guarantee over subsequent free speech.

### P05-TOPIC-002 (P2) — Include actual manufactured object characters in the topic union

YB-1026 tells the story of a postcard that goes on holiday by itself; Q-1063 makes a seed packet speak for future flowers. These manufactured stationery/package characters are explicit across RU/EN/TR but everyday_objects is absent. This is not incidental stationery used to write an answer: the object itself is the character. Excluding everyday_objects would still permit both service prompts.

Required: Add the missing subject tags in a new candidate revision and audit analogous object characters. Keep food on lids/jars contextual rather than assuming all containers are food.

### P05-TOPIC-003 (P2) — Resolve the household-drop classification against the stated nature boundary

YB-1066 asks for sports commentary about a single drop falling from a household tap in all three locales. nature_animals is present although the taxonomy excludes/qualifies a household drop without a natural comparison. No nature comparison appears; the sports-commentary framing supports leisure/humor/creative and tap supports objects. Excluding nature blocks this prompt without a stated natural subject. The wording need not in the taxonomy leaves discretion, but the rationale supplies no exception and the guide calls this a subject taxonomy.

Required: Remove nature for this source or explicitly revise and justify a consistent water/household-drop boundary before promotion. Audit similar drops separately; do not silently redefine all water as nature under the existing digest.

The exact source text, topic sets and raw/canonical card hashes are preserved in `topic-map-round-01.semantic-probe.json`. The independent `semantic-probe.py` reproduces six candidate selection mismatches plus seven positive controls, exit0 meaning the observations reproduced. This is an in-memory simulation of the candidate's proposed any-excluded-tag-blocks rule, **not an implemented runtime selector test**. Its semantic expected values are explicit reviewer judgments from the source text, not an NLP oracle or counts-only test.

## Multi-tag and private-pool implications

445/450 multi-tag rows do not prove subject coverage. Actual combinations such as music+friendship (Q-1110), optional food+leisure (Q-1102), food on TD dare only (TD-1033) and music-not-personal-pace (YB-1168) were inspected. A creative output method is legitimately allowed by this candidate's stated definition; its high frequency alone is not a defect. It does mean the owner-facing label and future semantics must be explicit: creative_expression covers task form as well as subject, whereas communication_support explicitly excludes arbitrary dialogue/procedure. These two dimensions must not be inferred as equivalent.

The map tags creative_expression on375/450 and118/150 private cards. Excluding it leaves32 private refs: Questions28 (in_person15/online13), Truth/Dare0, YesBut4 (2/2). These are raw candidate counts before eligibility, history, five mixed-family removals or any other exclusions; they are not viable-session/C2 proof. Future activation must test truthful safe-empty/choice UX and exact-profile coverage, without promising all modes remain playable or weakening exclusions. The large fiction category also deserves a boundary audit: Q-1031 patterns, Q-1039/1041 musical metaphors and Q-1130 an ordinary imagined bun are tagged absurd_fiction although the wording says fairy tales/impossible inventions. These are an explicit editorial ambiguity to resolve, not a fabricated claim that every metaphor assignment is conclusively wrong.

## Semantic-family and locale boundaries

21 source concerns/37 active refs bind to exact current revision/canonical tuples; inactive originals are not assigned to replacement numbers. All413 identity placeholders remain explicitly cross-card-similarity-unproven. This is a remaining honest limit, **not a demand for absolute originality or101025 human comparisons** and not a replacement for the actual21-cluster plus cross-mode/session gate obligations.

Mixed P04-SEM-17/18 retains a proposal to exclude all five current members (YB-1113,YB-1126,TD-1005,YB-1005,YB-1133) unconditionally from a new separately versioned repertoire. The current pack is not modified. No public exclusion may depend on a hidden private-history event; any future change needs its own coverage/fairness/privacy tests.

All450 English cards were read on all actual sides:750 fields, including150 YB responder fields. Additionally26 selected cards were read in RU/TR on every side:40 fields each, totaling830 unique fields manually read. All2250 fields were mechanically bound, but1420 RU/TR fields were **not manually read by this reviewer**. Exact read IDs/fields/hashes are in `manual-read-scope.json`. This is neither a qualified human translator review nor a certification of all2250 meanings. The source snippets supporting every finding were read in all three locales.

Q-1115 remains uncontrolled/open-ended; its neutral wording cannot guarantee a later selected topic or participant reply. TD-1132 Turkish küçük nota and YB-1072 ay çiçeği flags remain unresolved. Music remains explicit in TD-1132 regardless of the note ambiguity; lunar gardening intent remains clear in RU/EN but the Turkish lexical choice needs qualified review. Responder consent boilerplate must not make every YB card a communication/boundary topic. Free-form conditions and replies require their own policy and cannot inherit static-map guarantees.

## Scope and next round

Owner HOLD, approved:false, runtime_eligible:false, pending independent/human flags are intact. No original450/partial379/current450 bytes, runtime, production registry, source manifest or stage status changed. Correct in a **new candidate-02 directory**, preserve candidate-01 and this report, then rerun binding tests and independent semantic regressions against exact bytes. No full P05 PASS, production readiness, human rights/language approval, or runtime enforcement is accepted here.
