# P04-r2 full draft candidate

DRAFT ONLY:450 active entries,150 per mode,0 reviewed. Original owner decision remains HOLD pending review of this full changed-hash candidate. This folder does not publish or activate Games and grants no rights/editorial/translation approval.

The candidate copies378 active cards from the verified frozen partial R2.21 copied entries have explicit follow-up revisions;357 retain exact frozen bytes.72 new replacement IDs were reserved before materialization: Q1151–1173, TD1151–1173, YB1151–1176. TD1158 and TD1161 then received revision2 grammar repairs. Old71 MOVE_TO_RULES IDs and quarantinedYB1148 remain outside active issuance; they persist in original sources and authoring history.

Current final catalog digest: `5de601019fc8eae1c9491a610984e485e3fedce0d36d3d1326b8a589ee528bd4`.
Current draft pack digest: `sha256:c668e4e8514d6acd97904c14937787e2f67af909d4af204252efb05d8a076484`.

Use the current [final history selection](../../implementation/evidence/p04/review-450-full-coverage/authoring/final-history-selection.json), [final event export](../../implementation/evidence/p04/review-450-full-coverage/authoring/full-after-export-final.json) and [card map](../../implementation/evidence/p04/review-450-full-coverage/final-card-map.json). The earlier history-selection.json/full-after-export.json and full-check-01 are preserved superseded pre-grammar outputs; they are not current admission inputs. Semantic-cluster dispositions are author proposals awaiting independent/human review, not automated proof of originality.

Reproduce checks from repository root with fresh output paths:

```text
python -B tools/validate_cards.py .docs/content/p04-r2-full/cards --report .artifacts/catalog-r2-check/schema.json
node tools/card-catalog.mjs draft-check .docs/content/p04-r2-full/cards .artifacts/catalog-r2-check/full-check
python -B .docs/content/p04-r2-full/test_full_candidate.py --coverage-dir .artifacts/catalog-r2-check/full-check --report .artifacts/catalog-r2-check/content-history-tests.json
```

The helper uses packaged original450/frozenpartial source bytes, the read-only original-ledger backup and owned final authoring database/export. It does not need a Windows path or original host .artifacts SQLite. Actual host-original-ledger immutability is a separately captured authoring/source witness. Root's final Docker run is the current required execution environment; host checks remain preflight and are preserved as such.

C2 uses the actual planner and full1–100 round grid for sizes2–8/both meeting contexts. Default capability report must show in-person private baseline25 and explicit online CAPABILITY_UNAVAILABLE. Conditional private_text_chat report must show25 in both contexts. All modes retain100 neutral C0/S1 public-surface cards and30 per category. Token duplicate/similarity checks do not replace human semantic, rights and RU/EN/TR competence review.
