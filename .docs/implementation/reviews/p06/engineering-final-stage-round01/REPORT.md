# Final independent Engineering gate — P06

**PASS_P06_STANDALONE_LOCAL_PILOT_QUALIFIED_LINUX_CLASSIC. full_stage_pass=true.** This is the independent Engineering stage decision for the declared local Linux classic Docker profile. Overall closure still requires the other independent final gate and the orchestrator's derived manifest. Production and P07 are not authorized.

Exact source: main/tag commit `77ee6ea5ab4d1e92fcf53328ede8f8d3fc3994aa`, core `d44f9f1f0da5dd685685bedfe485046a0e31e5d3fd05c0f457b46e7e5e5e28cc`, 1951 files, `venus-v0.0.1`. Release identity `446bef794ce99f71e95aec4c550049a58b53ca80ebdd440d5a8efebe2755cc7c`; real owner-approved Ed25519 key `59a72237edc78adf5874cd609471324108e55b2ac6e81f7ac63ed31f1038e1fb`.

The reviewer authored no implementation and performed no product tests, Docker/runtime/network/API/Git mutations or private-key reads. Independent analysis read frozen files, recomputed hashes, public-key signatures, archive metadata and journal chains. Every one of the1951 core files matches the frozen D44F inventory in both ROOT and the clean clone after the final handoff. Accepted P05 entry INDEX remains `58b680ef116bc2d1f652ea4c3862c1a00b23333100cc65d7bae88bfc7d4f1b81`.

## Frozen evidence and publication

INPUT_AUDIT.json pins exact INDEX hashes for publication01 (123files), promotion01 (11), current-pr-ci-round01 (49), pre-sign05 (2), Linux profile01 (2), Linux install01 (49) and final candidate01 (2). Every indexed file hash and byte length matched. The candidate was treated as an author's proposal, not acceptance.

Protected promotion receipts bind PR4897538 to squash main77ee and tag venus-v0.0.1. Five required checks succeeded on PR run40138703934 and separately on main run40139186060. Qualified workflow40139261281/job121007310309 succeeded on main77ee. U021's five-check policy applies; cancelled historical statistics are not PASS or mandatory checks. Historical Git/source/test inputs retain their original identities.

Independent offline crypto verification of the anonymous downloaded public bytes confirms the pinned SPKI key identity, service trust/owner approval, Ed25519 signature and canonical manifest. Bundle SHA256 `a573acf6fafec943052b3fc17ab315927aaa789b281b4f1e17c3c1d72184d8f1`, size1274, two regular tar members/checksums and exact installed compose bytes all match. All four anonymous asset IDs, sizes and hashes match GitHub API asset digests; receipts show no credentials or Authorization header. Anonymous OCI pull exited0. Build metadata, signed manifest and actual runtime agree on OCI `sha256:06b6d2ed6ca40938a97c5eb9096ffe4e7cb7547c442207d3b4c6da4687198960` and actual config `sha256:9e9bb982f428a2c99dd89828f1c816711a1ea982f622dcf85ca7dd0b9f279d01`.

The release API marks prerelease=true and immutable=false. This decision accepts exact signed content identities, exact OCI digest and the no-overwrite release procedure; it does not claim a GitHub provider-enforced immutable-release lock. No original tag/assets were rewritten.

## Actual real-signature installation and offline image recovery

The predeclared profile uses pinned DIND image `docker@sha256:173f284a4299164772a90f52b373e73e087583c0963f1334c9995f190ef6f3f5`, Docker29.1.3/Linux amd64/overlay2 classic. Declaration precedes the actual install. Frozen boundary inspect shows privileged **daemon infrastructure**, no outer host Docker socket, no host bind mounts or daemon published ports, and only its own /var/lib/docker volume. This does not claim hardened production or rootless isolation.

Actual approved-service-key import succeeded and installation job280e35a6… reached COMMITTED/INITIAL_INSTALL_HEALTHY. Its five event hashes/previous links were independently recomputed with no errors. The initial helper then failed a post-install probe because it expected64-character dockerps ID and received12; the original FAIL/raw logs remain intact. The continuation uses the committed state and unchanged shipped DockerDriver, not a modified app or a repeated acceptance result.

Actual runtime reports venus0.0.1, main77ee and signed OCI06b6. App is1000:1000, nonprivileged, read-only, with no Docker socket/operator credential mount. Executor is1001:1002 with cap-drop ALL, no-new-privileges and network none, authorized only to the isolated daemon. App is bound to127.0.0.1:49432 **inside the qualified Linux host namespace**; DB has no host ports. No outer Windows-host browser reachability or production ingress is inferred.

The unchanged driver saved a276604416-byte archive, receipt SHA256 `8c51a20ee5aa2396b4464e1f940184d021a5199759609eba8b5fa69244916a06`, bound to exact OCI/config/native identities. The app was stopped/removed; removing the exact image was followed by native inspect exit1/No such image. The daemon was disconnected from its only outer bridge; frozen offline inspect has zero networks. Actual pinned registry pull exited1 with “network is unreachable.” Unchanged driver load/start/healthy then restored signed config-native ID9e9b, with three protected-file hashes unchanged. The receipt is actual driver save/load verification; the archive was removed during owned cleanup and was not independently rehashed as an available raw file by this reviewer. Native daemon/anonymous-volume cleanup exited0.

This closes the published-image export-dependent gap **in the declared Linux classic profile**. Original DockerDesktop29.1.3/containerd2.2.0 pulled-image export remains a real failed/unsupported case:11776-byte metadata-only archive, missing config and all19layers, rejected before DB. Linux success does not repair Desktop or prove universal cross-store/archive portability. The frozen Linux REPORT provides the operational scope/runbook addendum and fail-closed handling. No application fix or0.0.2 release was necessary or proven by these results.

## Generic restore, ACL and fault obligations

Current exact-core GitHub classic proof has18checks,45native exit0 commands, GID118 and a native config ID different from OCI. Its17 exported job rounds have147 independently recomputed event hashes with no errors,11 equal six-table restore comparisons and nine actual executor SIGKILL phases. Exact-core actual11 separately proves differing OCI-native/config identities, real health/migration/pull/permissions/port faults, operator create-confirm-lost502-reload-reauth-cancel, idempotent/restarted jobs, full PostgreSQL restore/decryption and newer deletion/withdrawal ledger replay. These remain explicitly synthetic-state/fixture-key proofs on their own source/Git/profile; none is relabeled a real-service-signature DB restore.

Real-image offline recovery supplements those generic same-code proofs. It does not waive backup data integrity, keys, protected ledgers, compatible schema or failure outcomes. Keys/protected metadata remain separately retained; DB backup alone is not full clean-host recovery. The previously independently checked measurement03 uses original UTC strings: seven recovery event intervals2751–8665ms, terminal backup ages2031–36131ms, explicit app-quiesced write boundary, zero loss of backup-committed records, separate post-backup marker loss and required newer-policy deletion. These are wall-clock event measurements, not engine stopwatch, monotonic-clock accuracy or production SLA.

## All118 and eight gates

All118 original source-row hashes/check IDs were checked against catalogue SHA256 `7f356b724df80444c5cd00c15bd808046f4f5667afa2cabf87cf1acd196c86a9`. Only the seven formerly pending service IDs change to PASS; counts are **74PASS,34specific N_A,10production deferred**. No daemon/profile-driven N_A or generic DATA/ACL/restore waiver was introduced.

| Service ID | Independently accepted actual evidence |
| --- | --- |
| REL03 | Protected exact main/tag receipts, five main checks and qualified workflow success |
| REL04 | Exact built0.0.1 pre-sign smoke, then real-key target COMMITTED and exact runtime identity |
| REL05 | Single built/published OCI/config binding through metadata, signature, runtime and offline reload |
| REL06 | Anonymous published byte/API digest roundtrip and independent signature/bundle/template verification |
| REL07 | Qualified fixed entry assets and installed source/template, no mutable remote shell/bootstrap |
| REL09 | Four anonymous asset fetches and OCI pull without credentials, valid cryptographic identities |
| TRUST06 | Pinned owner-approved real key, public verification and actual target import/install/offline identity checks |

| Mandatory gate | Engineering decision and basis |
| --- | --- |
| RELEASE | PASS real qualified signed/public release and exact identities |
| INSTALL | PASS actual service Linux install, privilege/port boundaries and offline image recovery |
| SCOPE | PASS all118 and explicit qualified-profile/production limitations |
| BACKUP | PASS exact-core full PostgreSQL restore/decryption/counts, separately retained keys/ledgers |
| UPDATE-ACL | PASS current operator/consumer isolation, UUID/reload502/idempotence and negative checks |
| FAULTS | PASS current nine durable-phase interruptions/real fault outcomes plus real-image offline recovery |
| MONOTONIC | PASS current oldDB/newledger/witness/restart tests; protected hashes stable in real-image reload |
| RECOVERY | PASS fixed profile, measured event intervals/backup age/write boundary and data invariants |

DECISION.json records every ID and all eight individual gate decisions. Production DNS/TLS/UDP/real devices/mobile, external backup-copy failure domains and operational SLA remain deferred. Original450 owner HOLD and current470 temporary local-pilot card approval are unchanged. P07 remains unstarted and unauthorized.

**COMPLETE_STOP:** Engineering's qualified local P06 gate is PASS; the failed Desktop/probe attempts remain visible. All own writes finish with this report, decision, input audit, index and journal. The orchestrator owns the derived final manifest and joint closure after both independent STOP handoffs.

