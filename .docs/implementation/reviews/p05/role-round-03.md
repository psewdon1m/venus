# P05 self-actions round03 — CHANGES_REQUESTED

Independent `/root/p04_evidence_review`, 2026-10-19T15:37:32.652318+00:00. **ROLE003/004 closed within the exact source/component scopes below; ROLE005 remains open.** Original32-role corrections are supported, but required actual UI completion and a fresh complete self-actions run are not accepted. No full P05, human/content approval, clean-source or production claim.

## Exact reviewed input and archive

Included-source identity `d6d4d0d9f119fa7d1647fb2f0d81536d085e231ebe0f1ef3e9c9a722e7fc97b6`,1733files, context HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70`, dirty preflight. Independently verified recoverable `evidence/p05/self-actions-preflight-01/included-source.zip` raw SHA `66574fb540c13f469c04acfa51a220c76afd1032c72523d0a3f80590e89c4b13`,12914609 bytes, all1733 unique member paths and every member's bytes against runner inputs-before and working inputs at intake. This archive deliberately excludes derived evidence/journals/registries/manifest; it is not a whole checkout or clean Git snapshot. Nine principal source hashes are in `inputs-before.json`.

Actual run26be4ab8f56b's before/after inventories are identical and independently hash to the same d6d4d0... identity; its runner reports source_unchanged:true, synthetic_fixture_only:true, preflight_only:true, full_browser_matrix:false and cleanup:completed. Frozen product inputs: Games `962bcedac6d8d09c1e9f8728007752464018c90fb35dac5c8e9e8acf464af0c3`, OwnControls `941968339143cb178c8ca3b1c06a0cb5a89d2027214b2e51369d300108596a50`, GamesPanel `e35e8df45fcdeef655ffdf3c15acd78fad1937b5f85deb7da17188ba914725a8`. Root subsequently released source writes for diagnosis/fixes; those later bytes are outside this reviewed snapshot.

## Prior finding closure

- **P05-ROLE-003 — scoped closure.** OwnControls941968... consumes now before all early returns. Independent4 expiry→pause/stop/abort/neutral-reset→rewind cases deny Finish;27 client/actualTSX controls pass. Historical failing89a4... input/result retained. No clean/fullstage claim.
- **P05-ROLE-004 — scoped closure.** Games962bced... final actual session/entry join after awaits enforces synchronous session and room expiry and caps lease. Independent10 actualmodule+explicitSQL-double cases pass; author actualPG/HTTPS SA09 blocks second real currentAcceptance via ownedfixtureSQLfunction then expires session and gets401/no metadata. Both evidence types distinguished; original failure preserved.

The final dispatcher still binds actual authenticated recipient, selected participants/live timestamps, current role, current consent/proposal and catalogue locks; fresh auth/room TTL failures deny **all** metadata, while authenticated catalogue/entry-policy degradation retains intended own safety only. Exact own booleans stay dense, no primary/private pair/card/condition/other-recipient metadata is added to public projections. Nonrecipient lease clipping does not encode another pair's private deadlines. Shared POST guards/codes and same-side TD idempotent semantics remain authoritative.

## Independent executed controls

- 32 role cases/8states run against actual TSX, Games and shared ownActions with explicit hook/API/SQL doubles:0 enabled-UI→authoritative-rejection mismatches. Group Questions primary hidden publicly still gets Finish/Skip; others do not; private committed TD hides both choices.
- 27 own actual OwnControls/TSX checks pass: four safety/neutral-reset time-rewind regressions, relative skew/TTL, duplicate/old response rejection after fresh false, eight binding ABA changes, reconnect/fresh false, private-clear generation, shape/foreign-recipient rejection, revision rewind denial and late metadata refusal. Eight saved actual JSX Finish callbacks send no POST after TTL, room revision, identity ABA, transport ABA, new-session frame, new-revision frame, private clear or removal before passive effects.
- 10 server projection scenarios execute real Rooms.access and Games.dispatchSelfActions with explicit SQL-return/clock/snapshot/presence seams: baseline, original expiry-crossing, equality, final-credential-query crossing, revoked grant, room expiry, lease cap, degraded catalogue, entry mismatch and clock rewind. Expired/revoked auth returns AUTH_REQUIRED/no enqueue; room TTL returns ROOM_CLOSED/no enqueue; valid degraded state keeps Stop and denies ordinary Finish. These are not independent realPG/HTTP executions.

Raw scripts/JSON hashes are retained under role-round-03.*. The initial old32-role matrix checks enabled→allowed alignment and targeted primary/TD behavior; it does not prove every possible valid action is rendered. The new source defect below is precisely a missed version-alignment path.

## Open finding P05-ROLE-005 (P2)

Incoming shared frame can synchronously bind OwnControls to game revision6 while gameRecord still renders HTTP revision5. A poll receiving self-actions revision6 is accepted, then the actual Next JSX appears and its handler POSTs expected_rev5 from old game. Actual API revision checks reject such a request; this is a completion/control availability defect, not a server ACL bypass. Independently reproduced on frozen e35e8d... TSX with actual controls941968... and explicit React/API doubles.

Independent generic-card reproduction: actual HTTP cached/rendered revision5; incoming shared completed frame and self-actions revision6. Next is offered and actual JSX posts expected_rev5. `revision-mismatch.json` pins exact source and observations. `replay-frozen.mjs` reproduces this defect from11 exact archived source files after author changes current product source; `frozen-source-index.json` binds those copies back to original archive hashes. Dependencies still use the workspace installed runtime; this is explicit actual-module testing with doubles, **not browser E2E**.

Required: Require exact rendered session/round/game revision agreement with the accepted control envelope before offering or dispatching revision-bound actions, or atomically accept the view and permissions. Keep stale/ABA/TTL denial and degraded safety regressions. Independently rerun after new freeze and actual nine-case suite success.

Author's new negative Vitest case independently encountered the same class: this reviewer executed four self-actions test files and observed40PASS/1FAIL, nextOffered:true/postedRevisions:[1]. That test was already added **after** the archived freeze (test hash73dc7fb490d2443779c4ad47fb6bb7d4f6cb4daf0ac70df9c95072c23e002d32); it is corroboration, not an assertion that the frozen1733 suite had41 unit cases. Author's prior full252-unit receipt is reported, not independently rerun here. No old failure was overwritten.

## Actual author component run independently inspected

Provider execution was author process83348, root/author confirmed terminal exit1; this reviewer did **not** launch its HTTP/PostgreSQL/browser run. Independently inspected and preserved all9 raw output files under `runtime-26be4ab8f56b/`; `runtime-index.json` pins byte hashes, image `sha256:8d5d582df552e34bd4c7f14421b2a59133a9ea0d0797967c0cb029dd429e28ab`, inventories and limits.

Actual suite **FAIL,8/9PASS**: SA01recipient matrix/public-role non-disclosure; SA02 Origin/CSRF/query/foreign-session/read-only; SA03 privateTD choice lock; SA04 quiet/action/condition revision; SA05 realSQL presence-boundary wait; SA07 actual Chromium stalled Finish/degraded metadata/expired lease/confirmed Stop; SA08 realSQL session revocation wait; SA09 real final-acceptance wait crossing authTTL all pass. SA06 group UI Finish→host Next fails: Finish reaches completed, Next click does not change round within5000ms. No success PNG exists in this run (failure precedes screenshot); no visual evidence is invented. Cleanup log removes the owned container, network and volume.

SA06 original wire cause is **not proved** by that report; ROLE005 independently proves a source defect in the same required completion area. Root reported a later diagnostic707de run in which SA06 wire flow passes but two fixture-prepare cases fail; that separate changing-source diagnostic is not independently accepted here and cannot retroactively turn26be4 into PASS. Fixture pool repair, product fix, new exact snapshot, allnine actual cases and fresh independent review remain required.

## Handoff and limits

Round03 outcome remains CHANGES_REQUESTED, one open P2. Preserve original32-role FAIL reports, ROLE003/004 failing proofs, this source archive and actualSA06FAIL. Root/author own all implementation/test changes; reviewer changed only excluded role-round-03.* and own journal. Unrelated pure-conversation kernel review/work is excluded. Human review450 HOLD, topics candidate status, standalone/media/device scope and full-stage statuses are not changed. Root updates derived manifest after agent writes finish. Next independent round04 must use new frozen source and terminal component proof, with stale callback/ABA/TTL/auth regressions retained.
