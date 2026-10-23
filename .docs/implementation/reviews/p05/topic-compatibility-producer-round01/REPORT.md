# P05 compatibility producer review round01

**CHANGES_REQUESTED_BEFORE_ACTUAL_RUN.** Root author; independent reviewer `/root/p05_topic_games_review`. This is static/source-bound inert review only: no Docker, PostgreSQL, realHTTP or functional producer execution, and no product/producer edits.

Exact four producer snapshots are indexed: integration f84b2d9cb8e3a95dcbda4be47ea9fd3d2239d6eaadf15c5880fffc64e5e9a1d9, runner c985c42b9905b3f1f10d81d17f4313ad5e07bd78055082023da0597f8d63bb14. Included source is ef009/1811 with unchanged actual harness06fb prefix (fullSHA in report). Fixture keys/admission/Rooms/lifecycle/source/provider composition are actual included helpers; source and unsupported header edits are explicitly labelled producer seams, not approved legacy execution or production startup.

## Required corrections

COMPAT-PR-001 P2: exact case04/05 handlers call GET availability only. They never call the actual POST start boundary with the newly prepared draft_rev. The original handlers were executed in inert VM: availability503 makes both report success while an intentionally faulty hypothetical start would return200 but is never called. This is a coverage counterexample, not evidence that current product start is faulty. Add POST/start503 exactcodes in both cases, then assert newgame remains waiting/no new snapshot or history reset and oldsnapshot/history remain as expected. Keep six case IDs; case06's clean positive start does not test the forbidden prior path.

COMPAT-PR-002 P2: case01 positively establishes history objects/chunks and conversation/chat objects, but not preexisting projection/private_refs. Case03 only checks those scopes are zero afterward. Those two assertions can pass vacuously if no refs/projection were ever present. Actual prepareProjection creates both in this frozen source; capture positive counts before header/boot and require them>0, then record pre/post counts. Do not seed a fake grant/reference to satisfy the baseline.

COMPAT-PR-003 P3 documentation: DESIGN says keys/credentials only in component tmpfs; DBpassword is actually generated in a host temporary secretfile until cleanup. Clarify this scope. Runtime app keys/session credentials are ephemeral; no raw secrets are logged by reviewed assertions/runner. This is a description correction, not a newly found secret leak.

## Verified runner and other boundaries

Three copied executable sources pass Node syntax exit0. Exact prepare-runner transformation was executed with inert read/write callbacks and reproduces c985 byte-for-byte from accepted c77 source; changedbase rejects before any write. The reviewer never runs the actual preparer or mutates producer files.

Exact runner executed in an inert VM with no actualDocker or hostFS mutations:14 controls pass. Baseline PASS; missing/duplicate/failedcase, wrongsuite, runtimecleanupFAIL, initialsource mismatch beforebuild, sourceafter/finally drift, producerafter/finally drift, ownership mismatch, leftoverresources and secretcleanupfailure all become FAIL/exit1. Finalaftercleanup equality remains mandatory. Baseline has three source captures; report failures retain finalcapture and cleanup. Only exactlabel resources may be removed, and cleanup/secret failure prevents PASS.

Composition is API1CPU/768MiB/nonroot/read-only/cap-drop, DB1CPU/512MiB/internal network/noports, one artifact mount and one readonly integration mount; no harness/product override. Explicit component command is declared, never ordinaryproductionCMD. Build/test percommand20minute timeout is inherited rather than a completion estimate. Dynamic sourceguard requires ef009/1811; fixedschema/suite/exact6uniqueexpectedIDs/allPASS+runtimecleanup required. Prepared producerexecutables are pinned before/after/finally. DESIGN/preparer are static provenance rather than runtimeimports.

The six scopes otherwise match source contracts: actualtopic/chat positive setup; header-only AEAD revisionfixture preserves existinghistory; source-disabled directbootabort and protectedabortedview; unsupportedprior and SQL-valid abortedmissing snapshot preservehistory; clean neverstarted aborted draft permits a new20planned-round start. Case06 proves20planned+actualstart, not20completedrounds. Partial SQL edit is not pg_dumprestore; methodboot is not newprocess/ordinaryprelisten; oldheader edit is not oldengine execution. Scope labels correctly retain these limitations.

Source/runtime freeze and root RUN_ACK still follow an independent corrected producer round. No actual pass, fullrestore/production bootstrap, human450 approval or P05 stage acceptance is issued here.
