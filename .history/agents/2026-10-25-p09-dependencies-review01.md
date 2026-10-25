# P09 dependency review01

- Reviewer: /root/contract_review
- Started UTC: 2026-10-25T01:35:26.0331779+00:00
- Scope: independent dependency/source/license/advisory subgate at implementation2c7c8c4f; actual runtime/fullP09 exit excluded.
- Inputs: root AGENTS, P09_MEDIA/ADR036/transport-entry01; clean source and W lock/node_modules; pinned LiveKit upstream as needed.
- Owned outputs only: .docs/implementation/reviews/p09/dependency-round01/{REPORT.md,INPUTS.json,INDEX.json} and this journal.
- No root index/source/registry/manifest/app/test mechanism or other-journal changes; no full or long tests.

## 2026-10-25T01:36:35.4570203+00:00 — source and package inspection
- Read AGENTS/P09_MEDIA/ADR036/transport entry and exact W package manifests/lock. Direct SDK versions pinned2.23.0/2.19.2; separate protocol1.52.1/1.51.0 and jose6.2.13/5.10.0 are real resolved entries.
- Dockerfile copies only upstream /livekit-server into Node Debian final image; upstream Alpine packages do not automatically enter final image. Binary Go closure and final Debian/Node inventory require distinct evidence. No server LICENSE/NOTICE copy found in the inspected Dockerfile.
- Read-only GitHub official security pages show no published project advisories; this is not CVE clearance for transitive/OS dependencies. Exact upstream NOTICE/Dockerfile read through web.
- Investigation mistakes preserved: initial rg included the whole .artifacts tree, produced excessive truncated output and native1 (one absent path); narrowed immediately to exact files. Later directory read of absent ROOT .docs/implementation/evidence/p09 emitted path-not-found; no app/test failure or modification. Avoided any secret/config/runtime reads.

## 2026-10-25T01:41:33.6850733+00:00 — npm bytes/advisory/license results
- Exact source2c7c8c4f230aa9cbba6925ed5c8daa5784dab4e9 read via optional-locks-disabled path-specific Git show/rev-parse in W; package-lock/API/Web/Dockerfile bytes match captured original W inputs. Root Git/index never invoked.
- Derived18 lock nodes (17runtime + installed @types peer); all18 official npm tarballs match SHA512 lock integrity and all their installed regular file bytes. No package scripts or extraction/install executed. One initial @types check was INCOMPLETE because verifier assumed package/ prefix; actual DefinitelyTyped dom-mediacapture-record/ prefix handled safely, corrected to PASS.
-26 primary HTTPS observations succeeded, including18 exact package@version global GitHub-advisory queries and3 repository lists; no returned published advisory entries. This does not cover Go binary or final OS CVEs.
- Buf protobuf1.10.1 root Apache source pinnedc75ab...; version.txt points protobuf27.0, exact commit a978b75794a6ce4547c9db08a115c458d9190934/LICENSE supplies BSD3 text sha6e5e1173...; precise mapping sent to orchestrator.
- Read-only docker image inspect could not find upstream pin or supplied fixture07c43... in desktop-linux; no pull/container start/build performed. Empty Env:DOCKER_HOST/CONTEXT enumeration returned native1 (absence), not test failure. Binary module inventory and production OS scan remain pending.
- Orchestrator reports uncommitted notices remediation and dirty runtime fixes after initial source; not relabeled accepted at original source.

## 2026-10-25T01:43:19.9367687+00:00 — final verdict / COMPLETE_STOP
- Status: HOLD_DEPENDENCY_CLOSURE_NOT_PASSED at immutable2c7c8c4f230aa9cbba6925ed5c8daa5784dab4e9. npm18tarballs/SHA512/installed bytes PASS,18primary exactversion queries return no entries; no claim of Go/OS or CVE-free acceptance.
- Open DEP01 original server/browser notices, DEP02 actual Go binary and final Node Debian dependency/license/advisory inventory, DEP03 binary-source provenance verification or explicit trusted-upstream qualification. New W notices/runtime fixes reported by orchestrator not accepted as original source.
- Exactprotobuf upstream mapping and full18node inventory delivered to orchestrator. Original image lookup unavailable on reviewer desktop-linux; no image/container state mutation. Runtime/P09/P07 NOT_RUN here.
- No app tests/build/install/long statistics or source/test mechanism changes. Owned root review files and this journal only; root Git index, registries/manifest and other journals untouched.
- Final content hashes: REPORT.md=cb5f4b2c353347a308369162e27780de1b909af2377511c56ccd75aaf5c9984e; INPUTS.json=b2c7ea98581281f0f8c7f06c492c2dc8fe34aed087ab822e3c1db79a12aa3cd4
- Last remaining write INDEX.json with hashes; then COMPLETE_STOP. Orchestrator copies bundle to W.
