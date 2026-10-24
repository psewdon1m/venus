# P06 Engineering/QA round02 — source-only hold

Status: **SOURCE_ONLY_HOLD**. E01/E02 are corrected on the reviewed source and relevant component evidence. No new concrete source finding. This note is not a pre-sign or stage PASS, and there is deliberately no final DECISION pending actual test handoff.

Reviewed clean clone `C:/.projects/venus/.artifacts/p06-clean-source01`, HEAD `412b7e3f94b84ac094127d13f32c52aaa8d62896`, core `bb7ed1fc354e8ffb018493e4bb11b0cadff87e90e52165da15326639c57163b9`/1942. All1942 freeze03 inventory hashes independently match. Freeze03 INDEX SHA256 `9a32780bffe2d139b8069de190afe78496bff0a22ea44f8fc0fd47641d1b1fa5`. Observed empty git status. Round01 remains immutable.

E01: `engine.mjs:31` now binds health to the candidate signed manifest. Finished COMMITTED/RECOVERED_A recovery at line38 closes serving first and verifies the appropriate authoritative manifest before reopening. Regression at `tests/p06/operator.test.mjs:35` proves wrong candidate runtime identity restores compatible A and mismatched terminal recovery remains closed.

E02: `engine.mjs:38` invokes exact job temporary cleanup after exclusive executor lock acquisition and active-job validation. `driver.mjs:47` limits cleanup to the validated UUID's `.dump.tmp` and `.vbackup.tmp`, requires regular/nonlink/single-link/current-owner600 files, retains unrelated paths and syncs the directory. Regression at `operator.test.mjs:36` exercises explicit recovery, unrelated-file retention and symlink refusal. Lock protection is visible in source.

Related SEC01/02 and fixture/CI corrections were inspected: initial-install recovery repeats preflight, schema version/tag patterns match runtime syntax, fixture input file ownership and Docker contexts include required files, CI expected job list includes P06. These remain component/source conclusions.

ROOT fast-preflight02 INDEX SHA256 `09989959e993612824ed905e8dee527c828eb12239a1e3cb923046852b148d29`: unit05 raw report26PASS0FAIL0SKIP, exit0; lint03 empty log and exit0. All packet file hashes and six bound exact input hashes independently match reviewed source. The packet explicitly distinguishes subsequent fixture packaging edits from executable operator/product bytes. Reviewer ran no tests or Docker commands.

Part12 applicability remains source SHA256 `f41a851e3afa97a2084fec14d32395c5f4a9ce07e37611babdaba99166fd1b57`. Independently verified118 unique IDs, source lines and row hashes against catalogue SHA256 `7f356b724df80444c5cd00c15bd808046f4f5667afa2cabf87cf1acd196c86a9`: zero mismatches.81 applicable,34 narrow absent external-component N/A and3 mixed/deferred rows retain all local data/ACL/restore duties.

Await actual source-bound full quality, clean install/reader, A/B, restore/decryption/count/integrity, durable phase faults, offline recovery, monotonic ledgers and operator browser drill handoff before final gate decisions. Permanent service trust approval, actual service signature/publication/anonymous smoke are separate from fixture results. Production DNS/TLS/UDP/mobile/daemon isolation, SLA and external backup-copy remain outside local proof. P07 excluded; original450 HOLD/current470 temporary pilot card acceptance unchanged.
