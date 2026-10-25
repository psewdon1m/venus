# P09 dependency/source subgate — round 01

Reviewer: `/root/contract_review`, independent nonauthor. Date: 2026-10-25 Europe/Istanbul; retrieval timestamps and exact byte identities are in INPUTS.json.

**HOLD_DEPENDENCY_CLOSURE_NOT_PASSED.** The npm resolution and installed bytes below are verified. Original-source redistribution omissions and actual binary/final-image inventory gaps prevent a complete dependency/license/advisory PASS. This is not a runtime verdict, not P09 exit and not P07 acceptance. Implementation/testing may continue; dependency closure still requires the bounded follow-up below.

## Exact scope

Reviewed original implementation `2c7c8c4f230aa9cbba6925ed5c8daa5784dab4e9`, not subsequent dirty fixes. Read-only path-specific Git show confirms package-lock, API/Web manifests and Dockerfile match the captured bytes. W lock SHA-256: `76b51e7a0daa4695bad1b349d32ca5564216cfa1e2fbd236cbc446b0183fee3b`; it also matches the clean-source lock. Root AGENTS, P09_MEDIA, ADR-036 and transport-entry01 define the reviewed obligations. No root index operation or source/test mechanism modification occurred.

Pins: LiveKit server 1.13.10, source `e5655ac20267fa5005dccaf3f0e3bfc3ea688c07`, amd64 manifest `sha256:e96a42b8623f738919a3f2006d433aeb19d0f3c67ce11eb986ea20e2cf65fbf5`; livekit-client 2.23.0 and livekit-server-sdk 2.19.2. A digest fixes image content identity; it alone does not attest the binary was built from that source. Source Dockerfile requests a pinned Go builder and CGO-disabled build, but those instructions are not actual embedded binary metadata.

## Findings

| ID | Severity / state | Required disposition |
|---|---|---|
| P09-DEP-01 | P1, OPEN against original 2c7 source | Original production Dockerfile copies `/livekit-server` but not its upstream LICENSE/NOTICE. Complete, reachable browser-distributed SDK/dependency notices are also not established at that revision. Include pinned license/copyright/NOTICE texts in the new image/distribution and browser assets, including protobuf's Apache **and** BSD portions, and verify the built bytes at a new exact source. Orchestrator has reported remediation in W; it is not accepted here as part of 2c7. |
| P09-DEP-02 | P2, INCOMPLETE mandatory inventory | No inspectable current LiveKit binary/build-info inventory or actual final-image OS/Node dependency/advisory report was supplied/available during this review. Obtain exact binary SHA/build metadata/module replacements plus license closure, and a digest-bound final-image OS/Node inventory with dated advisories/disposition. Source go.mod/go.sum and npm results cannot substitute for it. |
| P09-DEP-03 | P2, provenance qualification pending | Record binary-to-source/build provenance/signature verification or explicitly retain the trusted-upstream-binary qualification; do not call the source pin a verified reproducible build. Bind subsequent inventories and scans to the actually shipped binary and final image digest. |

No known vulnerability was inferred solely from an old version or an unscanned package. These are specific distribution/inventory/proof gaps. They must not disappear behind an overall green runtime report.

## npm: actual resolved and installed closure

Resolution uses lockfile v3, including nested copies and the installed peer. **18 distinct path/version nodes = 17 runtime dependency nodes plus one installed type peer**; unique package names and node count differ because protocol and jose each have two versions. For every node, independently fetched its official registry tarball, recomputed SHA-512 SRI against package-lock, and compared every tarball regular-file byte to the installed W copy: **18/18 PASS, zero byte mismatches**. No package code, lifecycle scripts, installation or tests were run. No tar entries were extracted. INPUTS.json records tarball hashes, counts, URLs, package metadata and license-file hashes.

| Package | Resolved version | Declared license |
|---|---|---|
| livekit-client | 2.23.0 | Apache-2.0 |
| livekit-server-sdk | 2.19.2 | Apache-2.0 |
| @livekit/mutex | 1.1.1 | Apache-2.0 |
| @livekit/protocol | 1.52.1 and nested 1.51.0 | Apache-2.0 |
| @bufbuild/protobuf | 1.10.1 | Apache-2.0 AND BSD-3-Clause |
| events | 3.3.0 | MIT |
| jose | 6.2.13 and nested 5.10.0 | MIT |
| loglevel | 1.9.2 | MIT |
| machina | 7.0.1 | MIT |
| rxjs | 7.8.2 | Apache-2.0 |
| sdp | 3.2.2 | MIT |
| sdp-transform | 2.15.0 | MIT |
| tslib | 2.8.1 | 0BSD |
| typed-emitter | 2.1.0 | MIT |
| webrtc-adapter | 9.0.6 | BSD-3-Clause |
| @types/dom-mediacapture-record (type peer) | 1.0.22 | MIT |

The two protocol versions are actual resolved entries, not automatically a compatibility defect; runtime compatibility remains the targeted test's responsibility. The type peer is not a browser runtime JavaScript payload. This graph covers the new SDK dependency closure, not all pre-existing Venus dependencies, dev tooling, Go modules or OS packages.

## License text provenance and delivery

Server Apache license SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30` and NOTICE `6d0f7c5e0deb284362296c5da110dd353831da2e67ca77cb5abc051b951b0fac` were independently re-fetched from the [pinned server source](https://github.com/livekit/livekit/tree/e5655ac20267fa5005dccaf3f0e3bfc3ea688c07). Redistribution needs the applicable license and attribution/NOTICE, with modifications identified where required; source attribution is not replaced by merely saying the server is Apache-licensed. Preserve MIT copyright/license and BSD notices/conditions/disclaimer for the packages actually shipped. Make browser notices available alongside the browser distribution; copies hidden only in server node_modules do not establish delivery to browser recipients. Copying the unmodified server binary does not make all its linked third-party components Apache.

The protobuf npm tarball has no full root license file despite its composite license declaration. Precise upstream mapping found independently:

- Protobuf-ES v1.10.1 resolves to source tree `c75ab9154ce5475ef7768c1995a9b38d53b229e1`. Its [root Apache LICENSE](https://raw.githubusercontent.com/bufbuild/protobuf-es/c75ab9154ce5475ef7768c1995a9b38d53b229e1/LICENSE) has SHA-256 `6da19f017fad6716cbc9c938972ebee29957c295b8a4d51060dfb03da51d8502`.
- Its [upstream version.txt](https://raw.githubusercontent.com/bufbuild/protobuf-es/c75ab9154ce5475ef7768c1995a9b38d53b229e1/packages/upstream-protobuf/version.txt) specifies **27.0** (SHA-256 `7b01c549928398a045692f24bcac7803b348524cdd76f21265b02984b2ba556a`). The adjacent source describes use of the upstream proto definitions.
- Protocol Buffers v27.0 resolves to `a978b75794a6ce4547c9db08a115c458d9190934`. Its [BSD-3-Clause LICENSE](https://raw.githubusercontent.com/protocolbuffers/protobuf/a978b75794a6ce4547c9db08a115c458d9190934/LICENSE), 1,732 bytes, SHA-256 `6e5e117324afd944dcf67f36cf329843bc1a92229a8cd9bb573d7a83130fea7d`, is the version-linked BSD text to accompany the Apache text. A guessed LICENSE.BSD path is unnecessary. This provenance was sent to the orchestrator; no app files were authored by the reviewer.

Codecs/content rights and trademark permissions are separate from copying OSS license texts; this report approves none of those external rights.

## Image/binary inventory and advisory coverage

The production Dockerfile takes **only the server binary** from the pinned upstream stage and places it into pinned `node:24.22.0-bookworm-slim@sha256:a5f4366e834695d5f363b920c104953a535d3a9864d1bdf74566a0ebe01daee5`. Thus the final OS inventory is **Debian/Node**, not the upstream Alpine image. The source upstream Dockerfile's Alpine packages/APK upgrade are not evidence about the final Node image. The binary's embedded Go toolchain/modules/replacements remain a separate inventory. Source go.mod (hashed) has module github.com/livekit/livekit-server and Go 1.26.0 plus LiveKit replacements; this is not a list proven linked into the binary.

Read-only Docker lookup in the reviewer's desktop-linux daemon could not find the pinned upstream image or orchestrator-supplied fixture image `sha256:07c43eae677c94bfd32f12b5883535545e5f16caa2ea526e6e3f2be958b18d4d`. Only the previous P08 browser-cache image was visible under the P09 name filter. No image was pulled/saved, no container started, and no Docker state changed. Orchestrator states the initial clean build failed before the new final image and a later browser fixture is running; a fixture's OS scan would in any case not qualify the production image.

At the recorded UTC retrieval times, primary GitHub API queries for **all 18 exact npm package@version nodes** returned HTTP 200, complete empty advisory arrays (no next page). Official repository advisory lists for [server](https://github.com/livekit/livekit/security/advisories), [browser SDK](https://github.com/livekit/client-sdk-js/security/advisories) and [Node SDK](https://github.com/livekit/node-sdks/security/advisories) also returned no published entries. These are bounded observations, **not a CVE-free verdict**. Unpublished issues, Go stdlib/module forks, final Debian/Node/OpenSSL packages and an actual binary/image SBOM scan are not covered. Refresh the exact-artifact check before release/final dependency acceptance, retain findings/dispositions, and avoid widening the claim based on empty npm results.

## Follow-up and limits

At the corrected new source: verify complete image/browser license assets and their provenance/index, collect actual binary hash/build info plus a matching Go license/advisory closure, and collect the final production-image OS/Node inventory/advisory result. Bind them to the new exact commit/image; preserve this original-source HOLD. No reason to rerun unrelated gameplay suites or long statistics for this subgate. P09 runtime/media/revoke/AV and final P07 remain independent pending gates.

Research errors remain in the journal: an initial overly broad artifact text search was truncated and immediately narrowed; the initial DefinitelyTyped prefix assumption was corrected without extraction; absent directories/image lookups were not called application test failures. All successful npm/advisory/byte checks are described separately from those failed inspection attempts. Only REPORT.md, INPUTS.json, INDEX.json and the reviewer's journal were written. After hashes: **COMPLETE_STOP**.
