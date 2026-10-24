# P05 role round05 — CHANGES_REQUESTED; ROLE006 remains open

Independent `/root/p04_evidence_review`, 2026-10-19T16:01:14.149148+00:00. **New client refusal correction improves normal/ahead-clock behavior, but a confirmed behind-clock path still violates the specific degraded refusal requirement.** Actual author's ten-case run passes within its bounds; that does not close the independent gap. Prior ROLE001–005 scoped closures and all historical FAIL reports remain preserved. No full P05, human/content, C2, planner/ledger or media approval.

## Exact frozen input

Source identity `11b47dd77b31ae9b257fb0240c79c01c24818c095a6806be83d6979ced62ebff`,1737 included files; recoverable archive SHA `3dcc88ceccbabe2970026e0bf92cc5b9759c4625680cf9b8c32d5409b81b9408`,12946624bytes in `evidence/p05/self-actions-preflight-04/`. Independently verified all1737 unique archive members/raw bytes, recomputed inventory identity and every working file at pin, then sent SOURCE_SNAPSHOT_READY. Own75 source/docs copies remain byte-identical at report completion; subsequent current-workspace writers are outside this review. This is a dirty included-source archive, not a clean Git/full-checkout proof.

Frozen OwnControls `7987a1b1fce0211bf8b9913aeb77009ae604c9092f8f6073f4fcab96b7ece79b`; GamesPanel `1ce9ceeaf3c83e8e1b08a912304a455f304dcb361b091098223b07c458b96fe2`; actual test `980a53c20e2fbc19e9ae25e349e660f5cc1a11dfff4f2b504fee2984c381ff8f`. Four additional unexported planner files are part of the global inventory but **outside acceptance**, with known unresolved privacy concerns. The author-reported341 host tests include57 new planner units; neither their count nor this UI review accepts those modules. Ledger was absent at this pin and not reviewed.

## Code boundary and independent finding

Reviewed current P05_SELF_ACTIONS/ADR022, own-resource code and UI caller. The intended resource contains offer/proposal/until/skip and own boolean envelope rather than partner/prompt/condition text. Code separates refusal from accept authority, caps pending/active durations at30s/180s from local metadata request start, prevents same-tuple extension via minimum prior bound, consumes monotonic time, requires current tokens, rejects same-revision tuple replacement and clears on new round/game revision/identity/removal/terminal. Deny-only aged negative handling and no-first-observation-after5s are explicit source changes. These observations describe inspected implementation boundaries; they are **not** an exhaustive independent retest or complete acceptance of every path.

The caller still derives evidence **after** `scopePrivate(..., Date.now())`. Its private-state expiry predicate requires absolute expires_at>local now, which discards a valid own offer when server time trails local time. The refusal class's relative arithmetic cannot compensate for evidence it never receives.

### P05-ROLE-006 (P2) — remaining behind-clock path

Own boolean packet has a valid5s relative lease and authenticated own invitation expires30s after server_time. With server clock360000ms behind local, scopePrivate(...Date.now()) discards its raw invitation because expires_at is in the local past before observeRefusals sees it. Fresh genericDecline exists initially from own boolean, but after5s/offline no retainedfact exists; genericDecline disappears and no POST can be attempted while actual relative offer deadline is still valid. Zero/ahead-offset controls retain genericDecline and send one declinePOST. This independently reproduces a remaining006 availability gap, not server ACL bypass.

Independent frozen-source actualTSX/OwnControls probe uses a local request start10000, own packet server_time10000+offset / expires15000+offset, and actual own invitation expiry40000+offset. At local16001, after transition to offline, all three offers still have23999ms of their original server-relative lifetime:

| Server offset | Initial fresh Decline | Generic Decline after lease/offline | Decline POSTs |
|---|---|---|---:|
| -360000ms | Visible | Absent |0|
|0|Visible|Enabled|1|
|+360000ms|Visible|Enabled|1|

The three-case result and exact actual-module hashes are in `clock-skew-result.json`. Probe exit0 means observations reproduced; the result explicitly records REPRODUCED_NEGATIVE_SKEW_REFUSAL_GAP. React/API seams are explicit doubles; no independent realHTTP/browser exploit is claimed. Initial fresh display permission is not the same as successfully seeding a bounded retained refusal resource.

Required: Validate minimal authenticated own offer/proposal/session/round metadata separately from private render payload using fresh own packet and anchored server-relative bound; preserve30s/180s caps, no extension/skew/rewind, no late first seed, explicitfalse/changedtuple/generation/clear/removal revocation. Do not restore private text, partner, accept/choice/Finish authority. Add both clock directions and degraded positive/negative regressions, actual component evidence and fresh independent round.

Root and author received exact raw probe paths and source hashes. Since a blocking correction is known, root requested this changes-request handoff instead of repeating the entire32-role/27-client/10-server matrix before the fix. Those prior rounds are not overwritten or presented as freshly rerun here.

## Actual author run28cdc5621986 — bounded10/10 PASS

Author/root confirmed same process62267 terminal exit0. Independently inspected all10 structured cases and raw output, runner, archived test source, image receipt, inventories, cleanup and PNG. All12 root durable index descriptors match actual sizes/hashes; all10 runtime files match `.artifacts` byte-for-byte and are copied under `runtime-28cdc5621986/`. Before/after1737 dictionaries are identical to the pinned archive and hash to11b47d...; image `sha256:46d8798a32af9ffb34cb9904c81273a48ffe05b6cebe0483560e393a9b47eda1` agrees with image-id/runner/index. Both cleanup statuses are completed, source_unchanged true; dirty/preflight/synthetic/full_browser_matrix:false limits remain explicit. Reviewer did not launch these actualHTTP/PG/Chromium tests.

SA01–09 retain their bounded recipient/role/privateTD/quiet consent/realSQL presence/authTTL/actualUI completion/degraded session Stop/Pause coverage. SA06 now awaits both primary and host DOM round plus matching authoritative public card/revision/text or generic projection before its screenshot. Structured flag advanced_dom_matches_authoritative=true, actual source assertion locations and PNG agree; observed English UI shows newRound5/15 and public solo syntheticQ4 after group completion. The PNG is not native/mobile/A-V evidence.

SA10 holds ordinary Accept before server handling, aborts own metadata/invitation HTTP, waits past5s, and uses generic Decline UI. Actual HTTP200 closes the round to stopped while the session stays active; SQL state and host Advance are checked. Its generic label excludes private partner content. This run observes server **ahead** by412000ms. SA10 does not disconnect WS itself: specificDecline proof is HTTP-degraded; actual WS loss for session Stop/Pause is covered separately by SA07. No claim that SA10 tests negative clock offset or every transport combination is made. Thus actual10/10 PASS is compatible with the independently reproduced missing negative-clock case.

Original26be4/707de failures and59a18 nine-case PASS remain historical; originalSA06 failure's wire cause remains unproved. No retrospective causal claim or replacement of old evidence occurs.

## Outcome and next review

Status CHANGES_REQUESTED, ROLE006 OPEN with the narrowed clock-skew defect above. Fresh fix/test/source freeze/terminal runtime evidence and independent round06 are required. Prior scoped ROLE001–005 closure is carried from round04, rather than re-proving the complete new code through test counts. Human450 HOLD, fullP05, topic API/ledger/planner/C2, source cleanliness and production/media constraints remain separate.

Reviewer changed only excluded role-round-05.* and own journal; source/tests/candidate/manifest were untouched. Root owns derived manifest and status updates. No user approval was invented or requested by this review.
