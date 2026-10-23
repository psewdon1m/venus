# Independent root registry/provider review round 01

## 2026-10-19T20:04:53.4223298+03:00 — started
- Read AGENTS.md previously; root requests independently review four frozen bridge/provider files. No implementation edits. Prior lifecycle02 reports immutable.
- Scope: registry/provider mocks plus focused actual Linux filesystem guard control; no PostgreSQL/scheduler/backup/full stage claim.
- Preliminary concern sent root: registry guard delegates assertLive/assertMember, real lifecycle live() reads personal ledger; mocked open() failure does not establish safety path availability under personal corruption. Reproduce before finding.
- Read commands exit1 only from nonexistent apps/api/vitest.config.ts; root vitest.config.ts exists and was read. No source mutation followed.

## 2026-10-19T20:07:26.3262209+03:00 — actual Linux reproduction and provider controls
- Froze four target inputs and supporting Rooms/lifecycle/ledger/security runtime copies; seven readonly individual source/probe Docker binds. First25 control run exit1:23PASS/2FAIL. Preserved full first attempt. Extended registry recovery controls repeated exit1:31PASS/2FAIL of33.
- Confirmed SAFETY-GUARD-01: actual Rooms.finalAccessFence(safety=true) -> registry.guard -> lifecycle.assertLive -> personal.read fails TOPIC_LEDGER_INVALID or ENOENT on corrupted/missing personal chain. Valid credentials/metadata unchanged; no application-controlled retirement. Mocked PG rows only; actual Linux filesystem and real lifecycle/registry/Rooms fence executed. Root and author notified.
- Other controls PASS: authenticated original retirement timestamp/UUID recovery; exact known withdrawal errors only; real personal/member cleanup; no auto-init; provider frozen-object/client scope, selected-membership exactness, pre-narrow expiry, no nestedTX, low-part rollback up to8*4096 vs65536, limits, stricter durable state on revoke failure and read-only/no-public-write behavior.
- Four target files unchanged at review completion. Actual Docker exit1 retained; both owned labels queryEMPTY. Historical lifecycle02 PASS not rewritten. Publishing CHANGES_REQUESTED for integrationfinding.

## 2026-10-19T20:13:07.0149843+03:00 — round02 started
- Root provided lifecycle60c8f41b.../testcd2375ce... and metadata-only registry authority wiring. Prior round01 remains immutable. Re-snapshot all inputs and repeat original33 controls unchanged, then add authority/content/adversarial tests. No included source edits.

## 2026-10-19T20:15:10.9747945+03:00 — round02 completed
- Fresh isolated actual Linux exit0:51PASS/0FAIL/0SKIP, original33 logical controls retained; mocked recovery error injection moved to new authority API target without changing denied errors/expectations.
- Added9 paired safety/content/withdrawal/roomclose negatives,7badmetadata/key/birth negatives, processrollback and finalSQLclosure checks. No failed attempt inthisround; SAFETY-GUARD-01 closed bounded scope.
- Six frozen target/lifecycle files unchanged. Author20-file index verified,210PASS/2skip raw andexit inspected separately; actual author/reviewer Docker labels queriedEMPTY.
- New MD/JSON+evidenceindex saved; no included source writes. FullPG/HTTP/scheduler/backup/restore/stage remainOPEN. Prior reports immutable.

## 2026-10-19T20:15:55.4556803+03:00 — separate allocator composition review started
- Root explicitly requests probe of store.directories callback -> lifecycle -> registry -> actualRooms under personal parent-root faults. Prior registry-provider-round02 stays immutable and does not claim this allocator boundary.
- Read topic-room-directories implementation/tests. directories() withRoots opens all5 protected parents before returning any room paths; hypothesized dependency reproduced next. No included edits.

## 2026-10-19T20:16:54.8397538+03:00 — separate allocator finding reproduced
- ActualLinux Docker8controls exit1:5PASS/3FAIL. New SAFETY-GUARD-02 P1: store.directories -> withRoots validates all5 parents even for lifecycle metadata-only guard. Missing/mode0750/symlink personal root blocks actualRooms.finalAccessFence safetytrue after real registry.birth/provision+storage.
- Healthy composition and personalchild corruption pass, as do3badmetadata-root denial controls. No globalPostgreSQL/auth claim: SQL rows are seams; allocator, lifecycle, registry.birth, Rooms.finalAccessFence and files are actualfrozen implementations.
- Root alerted immediately; no implementation edits; rootandpreviousreports immutable. OwnDockerlabel actualcleanupEMPTY. Separate CHANGES_REQUESTED report prepared.

## 2026-10-19T20:21:20.2920927+03:00 — directory-authority round02 started
- Root supplied frozen scope-aware allocator1bee0233/test4c956741 and lifecycleed7694aa/test813c03d3; explicit requirement actual boundmethod callback forwards metadataOnly. No included edits. Prior SG02 report/evidence remainimmutable.
- Coldbootstrap all5root constructor precondition remains separate documentedlimit, not closedbyruntime faultrecovery.


## 2026-10-19T20:23:24.3679231+03:00 — directory-authority round02 complete
- ActualLinux19PASS/0FAIL/0SKIP exit0; original8 logical expectations retained with supported boundmethod callback. Added11 pairedfault/rootfloor/lateancestor/noinit/bootstrap/lostflag controls.
- SG02 closed only running initializedinstance+boundcallback composition. Coldconstructorall5rootavailability precondition andoneargumentlostflag denial explicitlytested andremainintegrationlimits.
- Frozen11includedcopies matchcurrent. Verified20author indexedartifacts213PASS/2skip; copiedrootallocator19PASS/1skipevidence andverified3pins. Author runs inspectedonly, notaddedtoindependent19count. Actualreviewer+authorlabelscleanupEMPTY.
- Separate reportsdirectory-authority-round02 MD/JSON+indexedpacket saved; priorFAIL/PASSreports unchanged. No includedcode edits; fullPG/HTTP/scheduler/backup/restore/production gatesOPEN.
- Optional read of nonexistent rootauthor descriptor returnedexit1; actualreceipt/sourcepins/inspect files usedsuccessfully, no missing evidence concealed.
