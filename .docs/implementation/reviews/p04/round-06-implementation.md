# P04 implementation review — round06

Reviewer: `/root/p04_gate_preflight`. Date: 2026-10-19T04:07:24+03:00.
Status: **IMPLEMENTATION_PREFLIGHT_PASS** for I10 correction.
Boundary: **NOT_FINAL_SOURCE_ACCEPTANCE**. Baseline HEAD `579ca40a9344fd0af841ff2e2883e394321dfbe7`; P04 remains uncommitted before final freeze/CI.

Independence: no production, card, test, validator or contract edits by reviewer. Only this report was written. The reviewer independently executed the existing targeted snapshot-race test after inspecting its implementation.

## I10 resolution

**I10: CLOSED.** reserve/revise now call readJson once per request and manifest, retaining the exact raw bytes alongside the strict parsed value. Existing cards are captured once. validateBatchSnapshot writes the captured request/manifest and existing-card snapshot into an exclusively created owned temporary directory and invokes the existing Python validator against those snapshots, not the editable original paths. The stored request SHA is computed from requestSnapshot.raw, the same captured bytes from which constraints and request identity are parsed. Actual FrozenPack/base digest validation remains in place before any ledger operation.

The helper creates only its own temporary files, rejects invalid card IDs before constructing their paths, and validates the resolved temporary parent/prefix before recursive cleanup. finally performs cleanup after success or Python validation failure. It does not overwrite original authoring files or amend the immutable validator.

## Independent targeted verification

Executed with pinned Node24.22.0 and workspace Python:

`node node_modules/vitest/vitest.mjs run tools/catalog-request-snapshot.test.ts`

Result: **one test passed / exit0**. The test reads a valid request, captures its bytes, overwrites the original path with invalid `{}`, and invokes the actual Python validator through the helper. Captured valid bytes pass (errors=0); the new invalid original bytes fail (17 required-field errors), as expected. This verifies the meaningful old/new-input boundary rather than merely comparing an implementation-generated hash to itself.

No additional concrete blocker was found in this focused correction. I01–I10 are closed across their reviewed revisions; round05 remains unchanged as the historical finding record. Final acceptance still requires the actual frozen implementation/source identity, fresh full tests and required CI/evidence/reviews. This report does not assert human content approval or full EXIT-P04.

## Inspected hashes

| File | SHA256 |
|---|---|
| `tools/catalog-request-snapshot.mjs` | `52a40ee32671ef93f16c42d60d7886a7b4e3a95ba4d1a6c2120b0f0bb97f488c` |
| `tools/card-catalog.mjs` | `926f4727949ebd404cc9e09764664a93a45a87cd23a8400f683514b6fb5ba6e6` |
| `tools/catalog-request-snapshot.test.ts` | `07631f1217dc7c63494338081db66902ac148031f2f01afbb4f7712bfcaa7c82` |

Open findings in this preflight correction scope: **zero**.
