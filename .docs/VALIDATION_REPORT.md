# Venus · Documentation Package Validation Report

**Package revision:** 1.0.0 · **validation date:** 2026-10-18 · **evidence type:** local documentation tests (NOT product deployment/release evidence).

## Verified checks

| Check | Status | Method / evidence |
|---|---|---|
| Required documentation paths | PASS | `python tools/check_docs.py` finds root README, orchestrator, nine numbered specs, schemas, tools |
| Local Markdown links and moodboard images | PASS | same script; all locally controlled links resolve |
| Author-provided images | PASS | 10 PNG assets compared byte-for-byte against conversation attachments and hashed in `assets/references/source-map.json` |
| Supplied normative snapshots | PASS | Part 04/05/12 compared byte-for-byte with original attachments, hashes in `source-snapshots/source-hashes.json` |
| Card JSON Schema | PASS | `Draft202012Validator.check_schema()`; 12 draft JSON files successfully checked |
| Card deterministic meta/policy validation | PASS | `python tools/validate_cards.py .docs/examples/cards` → 12 valid drafts, no errors |
| Relationship weight table | PASS | `python tools/check_relationship_policy.py` → complete symmetric 6×6, negative edge veto, increasing canonical relationship weights, progression bounds |
| Negative card validation tests | PASS | `python -m unittest discover -s tools -p 'test_*.py' -v` → 13 contract tests: locales, consent, contact context, private channel, malformed payload, missing review, stable IDs |
| Obsolete room capacity (2–5) | PASS | Project specs use up to 8; old v0.2 remains outside this new package |
| ZIP internal files | PASS after archive verification | `python tools/verify_manifest.py`, `FILE_MANIFEST.sha256`, sorted/relative archive members; no `../` or absolute paths |

## Explicit non-claims / blocks before production

- The package documents the target architecture; **there is no implemented Venus application, deployed LiveKit, tested VPS, native Android/iOS publisher, or licensed music catalog** in this artifact.
- The **12 included example cards are drafts** (`status=draft`), not ≥300 production-approved cards. The public Games release gate requires at least **100 human-reviewed/published cards per mode** plus filtered-pool tests.
- Full correctness of directed graph privacy, consent, fairness, RTC quality and mobile audio requires **actual code plus integration/E2E/device tests**. Static policy validation is not runtime verification.
- Only Part 04, 05, 12 of central Exocortex documentation were provided. Their immutable copies retain upstream relative links to Part 00/01/03/06/07/09/11/13 and supporting documents **not included**. The docs validator deliberately excludes those immutable snapshots from local-link validation; see `source-snapshots/README.md`.
- Real production DNS, Nginx vhosts, TLS/SNI, WS, UDP, secrets, external media licensing and host updater capabilities are `NOT_RUN` and must be verified during deployment readiness. An immutable verified release is distinct from deployment readiness.
- Operator role versus multi-user guest rooms may require formal `DIV-VENUS-001` approval under central Part 00. Do not assume generic single-operator contract can be silently modified.

## Reproducibility

```sh
python -m pip install -r tools/requirements.txt
python tools/check_docs.py
python tools/check_relationship_policy.py
python tools/validate_cards.py .docs/examples/cards
python -m unittest discover -s tools -p 'test_*.py' -v
python tools/verify_manifest.py
# With production card catalog present, separately run:
python tools/validate_cards.py content/cards --release --minimum 100
```

`FILE_MANIFEST.sha256` lists all files (except itself) to detect extraction corruption/accidental edits. This is **not** a cryptographic release signature and does not authenticate the publisher. Live production uses the Part 04/05 signed manifest protocol independently.
