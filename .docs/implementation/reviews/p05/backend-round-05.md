# P05 backend · Independent B05-004 review round05

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T14:22:29.643653+00:00. **PREFLIGHT_EVIDENCE_PASS**, stage_acceptance=false. Base HEAD b5436cde02dd09aa049ce0103cab58d9642e8c70, dirty candidate; latest actual chat/catalog included identity `c3a7b270c04e6fe4a5f9cce47d136c641912859c55d6402a2701fcd4c67dba9c`. Games SHA `f47b50ffec0c941e4d760c79dbf857d4d69617ed5f38f8f03a1e3debadfd7d40`.

## B05-004 · Resolved for reviewed online channel guard

Root's original actual run venus-p05-3c43ad5377a5 had17PASS/2FAIL: after cold restart or same-boot restored revoked rows, chat grants stayed unavailable but the old private prompt endpoint still returned restored text. Original FAIL is retained; chat-only authorization was insufficient.

Current code decrypts authenticated frozen snapshot bytes with room/session AAD to determine online/in-person. An online private moment requires pinned capability, enabled backend and current volatile grant; restored ciphertext never grants transport access. Normal reconciliation stops a missing-channel round and clears invitation/action/condition and transcript without catalogue lookup or snapshot rewrite. Only a new online round may register a new grant. In-person private moments require no online grant and consume no chat capacity.

Final HTTP/WS private projections independently check channel before reconstructing payload and again after awaited reads; denial/clear does not save/bump/queue or mutate SQL during final dispatch. Full pinned snapshot/pack validation still applies to normal content projection. Safety cleanup uses authenticated snapshot context without depending on catalogue availability. Earlier B05-001/002/003 protections remain present.

## Independent adversarial checks

New9/9 reviewer cases plus prior17/17 B05-001–003 cases PASS,26/26 total. Cases exercise cold missing grant, flag-off, missing frozen capability; HTTP denial and WS clear with unchanged snapshot/round and SELECT-only queries; a controlled shorter grant deadline crossing awaited names reads; in-person condition delivery without chat; safety stop/clear without catalogue lookup and without re-registering old grants; new in-person round without grant capacity; wrong snapshot AAD rejected. Independent rerun of selected author suites66/66PASS, including13 new channel tests.

The first reviewer harness had2 false failures: it expected a channel error while consent expiry correctly rejected earlier, and asserted a spy when flag-off intentionally had no chat object. The corrected fixture isolates a shorter valid upper-bound grant deadline and handles absent spies; implementation was unchanged. Original attempt retained. Two image-audit commands initially failed PowerShell parsing before Docker started; corrected proper shell quoting produced exit0 for both, preserved as harness history.

## Actual Docker regression evidence

After fix, venus-p05-994395418cd1 actual chat suite19/19PASS and venus-p05-02ec8e075119 actual catalogue suite8/8PASS. The former now denies old prompt after both restore scenarios and still covers actual HTTPS/WS chat lifecycle/expiry, while the latter retains B05-001 real internal HTTP replay and B05-003 real PG/filesystem safety/reconcile. Source maps recompute to identical before/after identity c3a7..., each run explicitly dirty/preflight. These are not clean-source proofs.

Reviewer read six relevant source files directly from each retained exact image (ffe8017... chat and212fed... catalogue); both match tested input maps and current reviewed source. All3 original test projects' containers/volumes/networks independently absent. Owned read-only/nonroot/network-none audit containers completed and were removed; no foreign resources modified.

## Limits and handoff

This round accepts the reviewed backend fix and its component preflight evidence. It does not close full P05/P04, human content review, production, media/mobile/native zoom or deferred product requirements. Full clean frozen source Docker/browser/quality proofs and final independent acceptance remain pending. A denied targeted read need not itself commit reconciliation when its transaction returns an error; final projection remains fail-closed, and ordinary game/socket/maintenance reconciliation performs durable cleanup. No claim that every denied GET commits a write is made.

All earlier rounds,17/19FAIL and corrected results are retained. Reviewed3 pins still match at report creation. Reviewer ends journal/review writes after this handoff until follow-up; root refreshes derived manifest when all agents finish.
