# P09 independent engineering exit/preflight — round01

Reviewer: `/root/contract_review`. Decision: **FAIL**. Immutable source `ba039f8731a053de030199394e754a5589e57431`, baseline accepted P08 `70ec9416c666483a198d79db21167ebad4ea58c5`. This is an engineering subgate; P09 stage PASS is not granted.

## Findings requiring correction or proof

### E09-01 — P1 — ordinary media-v3 update rejects healthy serving A

`tools/venus-operator/driver.mjs:38` calls `healthy()` from preflight when an existing app is present. At line81, media-v3 healthy unconditionally POSTs `/internal/v1/media/prepare`. `apps/api/src/media.ts:36` permits preparation only with the serving barrier CLOSED. `tools/venus-operator/engine.mjs:29-30` runs preflight before `serving(false)`. A normal healthy serving installation therefore returns409 to every preparation attempt, exhausts60 retries, and fails before QUIESCING. The pre-mutation catch at engine line34 calls the same healthy check while serving is still open; it fails again and closes serving with RECOVERY_FAILED. This breaks the promised compatible v3 update and makes a preflight rejection affect availability. Static control-flow finding, not a newly executed test.

Separate non-mutating readiness of serving A from closed-gate preparation of a candidate/recovered app. Keep mandatory real admin preparation before opening the candidate. Add a focused v3 update regression starting with serving=true: no prepare or lease retirement before QUIESCING; preparation after closing; early failure preserves healthy A.

### E09-02 — P1 — current exact clean AV target fails; downstream proof absent

Current owned clean run `.artifacts/p06-clean-source01/.artifacts/p05/venus-p05-1317c7c503c7` is complete and FAIL. Source unchanged identity `57b2b80a8e0a8eaa38c93eaaceba4e241e2dbdabe36f00151c34e7746bea126b`, image `sha256:9d6a881ec2079477edc0cb6b432f58dc990ab85cee5d40d36535c05d84863c3c`, cleanup completed. Node runner:32 tests,31 pass,1 fail. Actual8participant getDisplayMedia, maintenance readiness, denied/no-audio, ACL and game coexistence/admission records passed. Normal A/V p95 **125ms exceeds120ms**; glass86ms, viewer skew68ms. Seven viewers each had35 matched pulses; individual p95 was122/118/135/142/140/109/108ms. This is a real failed agreed assertion, not evidence of a specific transport exploit or a proven root cause.

Because the AV assertion aborts the integration sequence, degraded, revoke, UDP/TCP, pending-cutoff retries/expiry, source-ended/close, pending-join race, API-loss watchdog and old-live-PG restore are NOT_RUN on this revision. Resource/RTP assertions located after the AV assertion are also not reached. Preserve this FAIL, diagnose the source/timing or validated measurement cause, and re-run the impacted exact clean sequence after correction. Do not change the target to turn the failure green.

The earlier `1bf51346ffb95f533ec64f10a16d9c503d78132e` packet targeted-round15 has A/V83ms/glass70ms/skew67ms and8 functional PASS records, but overall FAIL at API-loss watchdog. It does not validate new ba039 watchdog, cutoff ledger or maintenance changes. This review does not replay prior tests.

### E09-03 — P2 — required blocked-autoplay/retry behavior is unproven

`tests/p09/integration.mjs:44` launches every browser with `--autoplay-policy=no-user-gesture-required`. The test covers capture denial/no audio, but never exercises `CinemaPanel`'s media playback NotAllowedError/blocked state or sound retry. P09_MEDIA line25 and EXIT-P09-03 explicitly require this behavior. The implementation contains the branch and button; its correctness is not yet demonstrated.

Add one bounded browser acceptance case with restrictive policy, or controlled NotAllowedError from media.play followed by real user-gesture retry; assert blocked status, the accessible sound action, subsequent successful playback, and that retry does not create a second lease/stream. No additional long statistical run is needed for this branch.

## Review coverage and retained qualifications

Read Cinema ownership/generation teardown and capture, media API/grant/current-room fences, JWT restriction and renew/revoke, supervisor preparation/watchdog/reconciliation, protected authority, additive checksummed migrations, room hooks, operator v3 signature/environment/template and backup/restore changes, and actual scoped runtime records. Checked P09_MEDIA, plan §13 and ADR-036. API transport join-CSRF fix correctly limits admission CSRF to room join; Cinema join uses room CSRF. Server migration002 preserves pending cutoff rows rather than treating revoked metadata as confirmed transport cutoff. No additional confirmed implementation blocker was found within this bounded read-only review.

Dependency round02 qualified local PASS is retained for unchanged binary/lock pins. Official publisher+digest/embedded build-info trust remains qualified and is not source attestation. Node patch and complete public distribution readiness remain separate final delivery items. Actual Chromium/Linux same-host fixture is neither production/DNS/TLS/NAT nor physical Android/iOS proof. P07 stays pending.

## Execution and limits

Reviewer launched no Docker containers, builds, installs, app tests, scanner or statistical run. Observed orchestrator-owned completed tests only. Source and evidence SHA256/byte counts are in INPUTS.json; immutable Git blob hashes are distinguished from checkout hashes. Two harmless read attempts failed (journal looked up in W though owned journal is ROOT; an incorrect ADR directory glob), then were corrected. No source, index, manifest, registry or other agent journal was edited. Re-review corrections and current proof in a new round; preserve this FAIL.
