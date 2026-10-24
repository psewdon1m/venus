# Independent Security/Privacy — source signing round05

**PASS_PRE_SIGN_STANDALONE_LOCAL_PILOT**, restricted to source and compatible-component readiness. **Full P06 HOLD** pending actual P04 execution/current five-context CI and actual qualified signed-service proof. No new P04, current CI, release or stage PASS is claimed. No open Security source finding. S03-01 remains closed. P07=false.

Exact cleanC Gitcf2d61958fbe43e02ce746d272862d8e78aa3825/coree87d9b1bf15741cfd87a837711c5c17383d0f12092d9cf7e8416d369dc243a66,1948files. All1948 root/clone hashes match freeze05. Sole delta from708c/coreffbe is existing tests/p04/runtime.integration.test.mjs. No app/API/DB/operator/driver/authority implementation changes, retries, sleeps, removed/weakened assertions or new framework. Historical FAIL packets and prior source reviews remain immutable.

The source fix correctly isolates the existing projector measurement from independent legitimate room writers. A separate read-write client begins transaction, obtains the existing shared catalog advisory lock, then SELECTs the target room FOR UPDATE. Stored game revision baseline and file-clock jump occur after that row gate is acquired. A separate real PostgreSQL BEGIN READ ONLY client retains the actual publicDelivery call and the unchanged current_round=null/game_rev=baseline assertions. Stored DB revision equality is asserted while the row gate remains held. Finally restores original clock before rolling back/releasing the gate and releases both clients. No HTTP/WS/maintenance completion is awaited under the gate.

Independently read publicDelivery and its row/current(false), snapshot/pack/names/catalog.assertPinned paths: these are plain SELECTs and do not request the held room row lock, so the reviewed scenario introduces no lock cycle. Background room/game mutations use the room row fence, so already-running writers drain before baseline and subsequent writers wait until clock restoration. The read-only projector is not replaced with the read-write gate and cannot silently gain write authority. Exact-expiry boundary and both projection/stored-revision requirements remain tested.

Engineering-p04-race-round01 source diagnosis is consistent: the earlier shared catalog lock permitted other shared-holder room writers while the shared fixture clock advanced; the failed assertion occurred after successful real READ ONLY projection. The precise background writer was not traced, and this review does not invent one. Source stabilization is accepted; actual execution/deadlock/P04 pass is still pending. Author reports focused ESLint exit0; empty lint log is not a substitute for actual P04 proof. The currently running/possible cheap preflight is not accepted prematurely by this report.

| EXIT-P06 gate | Security source pre-sign result | Remaining actual boundary |
|---|---|---|
| RELEASE | PASS unchanged signing protocol/U020/U021 source | New P04/current five CI, exact main/tag/OCI/service signature/published bytes and anonymous service verification pending. |
| INSTALL | PASS unchanged local-component rebind | Real qualified service candidate install/fresh anonymous service-digest pull pending. |
| SCOPE | PASS unchanged applicability rebind | Preserve67PASS/34N_A/7final-artifact-pending/10production-deferred,118total; no reclassification or aggregate stage PASS. |
| BACKUP | PASS unchanged local implementation/proof | Actual10 atomic mode0600 PG stream/restore/decrypt/count proof retained, not rerun. |
| UPDATE-ACL | PASS unchanged local implementation/proof | Narrow trusted executor, separate identities/Host/Origin/job journal unchanged; E07 GitHub GID118 historical proof retained. |
| FAULTS | PASS unchanged local implementation/proof | Actual10 faults/offlineA/9SIGKILL/original causes retained; no new current-head execution claim. |
| MONOTONIC | PASS unchanged local implementation/proof | OldDB/newledger/strict authority/noautorestore historical proof retained. |
| RECOVERY | PASS unchanged profile/measured proof | Original actual10 UTC event2545–9198ms/noSLA and explicit post-backup accounting retained. |

SOURCE_REBIND.json distinguishes quality03/actual10/E07GitHub/unit10 and targeted policy-unit proof from current source; none is relabeled a new run. The previous preview-publication01 Public/empty-config anonymous pull remains accepted only for version0.0.0/195e/digest0653678d4cbc920daf684355ddde5c7006d04aa89f950e2697e7fe4a5b7f4b3e. It is not a qualified service signature or proof of the future service digest. U021 five-required/manual-statistics policy and U020 exact-key/environment source remain unchanged.

Production dedicated/rootless daemon isolation/DNS/TLS/UDP/mobile/externalcopy deferred;450HOLD/470temporarypilot unchanged. Reviewer used source/evidence reads and file hashes only; no tests/API/runtime/Docker/Git/admin mutation or privatekey/credential read. **COMPLETE_STOP**: review writes finish with this package and own journal, before final manifest. New actual P04/current-CI/service results require separate handoff.
