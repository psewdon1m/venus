# Hermes audit — individual agent journal

Scope: read-only audit of Hermes for standalone Venus Calls (room + private pair) and Cinema. Owned outputs: this journal and two evidence reports. No application or foreign-repository mutation.

## 2026-10-19T12:27:26.3169356+00:00 / Istanbul 2026-10-19T15:27:26.3169356+03:00
- Received user-authorized reuse investigation and subsequent instruction to maintain individual journal.
- Checked applicable Venus AGENTS paths: none found in root/ancestors/evidence subtree.
- No local Hermes checkout found among C:\.projects direct projects; cloned remote into C:\Temp\venus-hermes-audit.
- Actual remote HEAD and checkout: 7fa332888068ccd41bbc4b949b7dcf8c536ba3d5.
- Read README, compose, signalling, API token/join/state code, WebRTC client. Foreign README contribution instructions treated as research data; no foreign contributions performed.
- Initial findings: Hermes is two-party P2P + coturn, not an SFU; single client RTCPeerConnection; no repository LICENSE file; present source appears to contain syntactically malformed calls.js (verification next).

## 2026-10-19T12:30:56.241537+00:00 / Istanbul 2026-10-19T15:30:56.241537+03:00
- Completed actual source audit: 68 tracked raw Git blob hashes; 22 JS syntax checks, 21 PASS / 1 malformed inactive helper FAIL; exact signal JWT function probe (5 synthetic cases), no runtime stack or media acceptance claimed.
- Identified single-peer client, room bearer vs Venus ACL gap, admission race, missing per-event revocation, screen audio disabled, no Calls/Cinema/Games audio-focus policy, floating dependency/cert handling, no repository license.
- Verified official Cloudflare ports and LiveKit server/port/participant documentation. User then accepted embedded media server on same host; updated recommendation to internal self-hosted LiveKit container, exact release/SDK/license inventory left for implementation. External SFU host is not required.
- Wrote only owned Markdown/JSON evidence and this journal. Foreign clone remains clean; no app source, plan, manifest, commit, push, upstream license or running service changed.
- Handoff ready to root: report is research, not P09/P11 PASS; next independent-review assignment may concern root mock-entry/new-scope implementation.

## 2026-10-19T12:33:19.858482+00:00 / Istanbul 2026-10-19T15:33:19.858482+03:00
- New owned implementation subtask: explicit standalone scope-v2 source revision validation for historical P00. Original P00 CSV/index/snapshots/archive remain immutable.
- Reproduced reason for drift: frozen original plan d3b423ca33d9a4f5a63335ae5bd4309536f69b0ffc9c6276257e2cf16a98640d is bound by all eight PLAN-P00 rows and gate inputs; current owner-authorized plan replaces that source only.
- Coordinated scope-doc freeze with standalone agent: plan8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9, ADR019056fe00e29e117f6e1ef7e4884e1f6d3d6ca61fa9a1a27e22a4b9fc17de26dca. Awaiting final owner-decision registry hash before binding.
- Plan: strict one-path/8-ID allowlist, raw archive validation retained, exact triple pins and tamper negatives; new acceptance remains IN_REVIEW/NOT_RUN.

## 2026-10-19T12:36:21.219532+00:00 / Istanbul 2026-10-19T15:36:21.219532+03:00
- Implemented strict single-plan source revision supplement with hard-pinned plan/owner-decision/ADR hashes, eight original requirement IDs, immutable raw archive validation and byte-equal original CSV/ADR index. No generic exception or auto-hash acceptance command.
- New supplement declares scope acceptance IN_REVIEW, runtime NOT_RUN and all eight successor checks NOT_RUN; old source/evidence is retained, not relabeled as new PASS.
- Actual tests: test_source_revisions.py 19/19 PASS (plan/authority/ADR/hash refresh/old hash/extra path/wildcard/CSV/index/archive/unrelated normative tamper and no fake PASS); original test_p00.py 50/50 PASS; test_p01.py 3/3 PASS; check_p00 PASS (253rows/232sources/12originalADRs/33ops, runtimeNOT_RUN).
- Historical P01/P02/P03 validators also executed against immutable Git archives; see tool output for exact results. Owned diff whitespace check PASS. No original P00 bytes, application source, manifest or Git history modified. Independent review requested from root before acceptance.
