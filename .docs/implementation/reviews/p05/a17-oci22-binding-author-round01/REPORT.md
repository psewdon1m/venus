# A17 OCI22 literal binding author report

AUTHOR_READY_FOR_INDEPENDENT_BINDING_REVIEW; no native run, active ACK, or acceptance claim.

Producer: `.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22`.
Producer INDEX SHA256: `4eb65767cada3f8a3ee10533535c67a56ac9cc45431e7d72c2bc385efd97cec2`.

This is a literal tuple binding derived from OCI21 INDEX `7045afa7d30ea2e1f94eb6c0efcaa54cb83b00cc65f05a636a726ca645487596`, independently reviewed by `12be809d9b1092b7903b5b65812872106bc8baafeda87c9071c1d5b3e9eb6ff4`. All 40 recursive MJS remain byte-exact OCI21, including its diagnostics, all 14 oracles, host context close, phase/whole deadlines (120 s/900 s), quotas, rates, fixtures, and teardown. The OCI21-to-OCI20 browser inverse is explicitly LF-normalized; this binding introduces no new EOL change.

Actual root receipts were awaited before creating this binding. The exact A17 tuple is:

| Input | Identity |
|---|---|
| Source freeze14 | `93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d` /1871 files |
| Clean Git source revision | `3abad03309ebd19f04fc0b61532627a5188d855c` |
| OCI current A (test image) | `sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2` |
| Test receipt14 SHA256 | `80cdcce2693859be3fbb0cf88c5e6f4826b113fa002e7e923250281ae8d47e82` |
| Ordinary production image (metadata qualification only) | `sha256:40d92552d7ee12eacb4d945c4f7920efc4b31dee7a4a712d2e0d93ff54935bdd` |
| Production receipt14 SHA256 | `60c1386a075f581c78b0f711b3fff015941db129c012e4892fd02ceb67365ec3` |
| Unchanged previous B4 | `sha256:62602920f998e1e971d3f8f9dd55c706217e4e00a50bcee2d056cbf6d94c8903` |

Only four existing producer metadata files changed: BINDING.json, ROOT_RUN_ACK_TEMPLATE.json, actual-image-maps.json, and included-inputs.json. OPERATIONAL_REVISION22.json was added; INDEX.json was regenerated. Historical revisions, receipts, prior failure records, and readonly-pin files remain inherited history. The new operational revision identifies the current actual receipts and parent review; historical files do not assert new A17 probes.

The A critical map was rebuilt from the actual receipt's 69 compiled files, seven SQL files, three UI files and two PG files (81 total), preserving the 64-base-plus-five-additional split. All 69 compiled backend files, SQL and PG match A16. The JavaScript asset's content remains `18645659151dc2d9c1d5e2ae0b5e13b65b0f90f8864a5f5ec75e8c00cef1bf32`; its filename changed, and CSS/HTML changed. The critical map uses the new actual filenames and hashes. B4 image, its 78-file critical map, compiled/additional maps, policies and known-not-GA qualification are unchanged. Production metadata's 40-character clean Git source revision is kept separate from the 64-character source identity.

Cold verification: all 1871 materialized source files match freeze14; all 40 MJS match OCI21; index files/hashes match; receipt IDs, full critical-map contents, B4 preservation and all false authority fields match. Checks02 exited 0. The first checker exited 1 because WindowsPath case-insensitive ordering differed from a case-sensitive expected list; the corrected checker compares the exact sorted filename set. No product or producer correction was needed, and checks01 remains preserved. A focused cold control rejected the unauthorized template and retained all 14 original IDs (exit 0). The unchanged driver --describe returned NOT_RUN with zero DB connections/Docker allocations (exit 0). No native run or APP import occurred.

Fresh independent tuple/source authority and an exact root ACK remain necessary before one actual OCI22 attempt. Previous OCI failures remain FAIL; this packet does not establish rollback success, layout/real470/browser-matrix acceptance, production readiness, or full P05 PASS. Owned writes COMPLETE_STOP after freeze.
