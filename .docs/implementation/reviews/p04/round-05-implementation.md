# P04 implementation review — round05

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19T04:06:09+03:00.
Status: **CHANGES_REQUESTED**, one P2 provenance defect below.
Acceptance boundary: **NOT_FINAL_SOURCE_ACCEPTANCE**. HEAD is still accepted P03/main `579ca40a9344fd0af841ff2e2883e394321dfbe7`; P04 remains a dirty working tree before freeze/CI.

Independence: no production, cards, tests, validator or contracts were changed by reviewer. Only this report was written. This round inspected the new authoring revise/CLI changes, updated catalogue validator/bundle loader, revocation ledger/database reconciliation, C2 coverage, related unit/integration sources and gate/development documents. Existing unit results were reported by the implementer; this reviewer did not rerun them in this preliminary round.

## Request revision implementation

The explicit AuthoringLedger.revise operation has the intended successful structure: validate the proposed constraints, BEGIN IMMEDIATE, find the reserved batch, compare the prior request SHA, preserve mode/range/count, replace only the current request and append a REQUEST_REVISED event containing both old and new requests in the same FULL-synchronous transaction. Existing reserved IDs and prior card revisions remain intact. Ordinary reserve retry cannot rewrite constraints. Identical already-applied revise is idempotent, while a different requested revision with a stale expected SHA is rejected. record continues to require sequential changed-card revisions and to enforce the now-current constraints.

The inspected unit scenario covers a conflicting expected SHA, a successful distribution revision on the same IDs, revision3 content and a retained REQUEST_REVISED event. Final coverage should also retain explicit stable-range/mode/count rejection assertions; these guards are present in code.

## Finding

### P04-I10 — P2 — CLI hashes a different read of the request from the one it records

Location: `tools/card-catalog.mjs`, reserve/revise branch.

The command currently invokes the Python batch validator against requestPath, later parses requestPath through load(), and later reads requestPath again to populate request_sha256. A concurrent author/editor can change the file between these reads. The reservation may therefore contain distributions/base/mode parsed from version A while its claimed request SHA belongs to version B; the validator may have read a third version. Explicit CAS does not repair this because its version token is the possibly mismatched byte hash.

Concrete sequence: Python validation succeeds on a valid request; load parses it; the file changes before readFileSync used for request_sha256. The ledger commits the old parsed constraints with the new file's hash. A later operator cannot reproduce the recorded request by opening the file identified by that hash. This is a normal authoring/provenance race rather than a production content-approval bypass, hence P2.

Required correction: take one bounded immutable byte snapshot for the batch request and use those exact bytes for schema/semantic validation, parsing and the stored SHA. Alternatively detect differing before/after hashes and abort before opening/reserving/updating the ledger, while ensuring the parsed snapshot is the validated one. Keep existing actual basepack digest validation. Add a meaningful changed-request/read-snapshot negative or helper-level test plus the successful reserve/revise flow. No IDs, batch row or REQUEST_REVISED event should be committed for a mismatched request snapshot.

draft-check's new snapshotAt already follows the useful byte-snapshot pattern for card files and explicitly rejects directory changes. Apply the same provenance discipline to reserve/revise input rather than weakening hashes or relying on the file name.

## Other final implementation observations

- The packaged bundle loader reconstructs draft→reviewed output from the named signed reviews and compares the complete reviewed cards/manifest. approved-bundles remains empty and source-bound; no external JSON hot-load or production human approval is inferred.
- Mandatory safety is now included alongside editorial/rights/RU/EN/TR/similarity/diversity for all cards; qualified safety remains additional for sensitive content. Ed25519 key type, canonical Base64 signature size/bytes, review chronology, exact draft hashes and full output copying are checked. These checks still require real external identity/competence evidence.
- Catalogue consistency now checks both ledger head and exact withdrawal-row/hash correspondence. Reconciliation rejects a DB/ledger mismatch instead of treating a matching head string alone as proof. Missing/corrupt/truncated/regressed ledger remains fail-closed, including cached packs and old-backup recovery.
- C2 coverage separates interaction counts, private baseline and unavailable capabilities. Supported private contexts need25 shared F/comfort1 baseline cards for the100-round private budget; conditional private_text_chat is explicitly test input, not a production capability. Full candidate category counts inspected are balanced30/category/mode across five categories, so the current450draft set does not silently require a diversity ADR merely to build.
- Existing final HTTP/WS read-only projection, original mutation receipt/session retention and documented safety redaction remain unchanged from the prior limited PASS review. No new concrete serving/ACL/rollback bug was found in this follow-up inspection.
- Technical and full P04 acceptance remain separate in the gate. Reviewed count comes from the application registry; the full gate reconstructs the actual reviewed bundle and tests supported coverage. Dirty development evidence cannot substitute for frozen-source CI, and a technical PASS cannot fabricate missing real human review.

This report is not a final evidence/CI audit. In particular actual run/attempt/job/artifact linkage and independent final review descriptors must be assessed after the source and required CI are frozen. Previous findings I01–I09 remain closed in their inspected revisions; I10 is the only newly opened implementation finding here.

## Inspected file hashes

| File | SHA256 |
|---|---|
| `packages/card-catalog/src/authoring.ts` | `4451d3260b0acef99a714d7fe7ef63641604841fa90e1eedc445c8532ee7a295` |
| `tools/card-catalog.mjs` | `3b7452eef14efaebf1629db9ff66b0fa33e2d07996706a2f12e38eaab55d84f0` |
| `packages/card-catalog/src/catalog.ts` | `8ccb3d79bf187e6430071bb9e3a455b74f68c062ce3cfdfad0b53487235a9dce` |
| `packages/card-catalog/src/coverage.ts` | `43775e747447da32a34bc3fea6f6eb7a0811f9104d28fe1e4e0b613ca79366cc` |
| `packages/card-catalog/src/bundles.ts` | `997d83d94343f64588101cc6eb0d423bd73e3dbc995ec571fd6e0ec1a4535daf` |
| `packages/card-catalog/src/revocations.ts` | `fe0327936cb7ffbfebc058dac13b757d2a69f347545a97a76d63882b4757dfe9` |
| `apps/api/src/catalog.ts` | `8f23969cf33f1bd65e61a9f5c860816924f6a544b8e2790228881183ff106b95` |
| `apps/api/src/games.ts` | `52c63df7f21fb09f8e15f66a78dd91ff10f7645cd0906690e4657636ba0cbe4e` |
| `tools/p04_gate.py` | `12cc5ec7680a3c9428fbc5024f192d5b61854d1ee5bd517be4c88c81397a39d5` |

Open findings: **one P2**, I10. Freeze/CI/final independent acceptance is still required after correction.
