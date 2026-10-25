# P09 engineering independent exit/preflight round02

Reviewer `/root/contract_review`. **FAIL / required runtime completion blocked by fixture expectation.** Source `94baae5936f56c49c96d05062ff6432d51001bfb`, exact clean identity `825d04a212d12cb7814e92bf3c2d2e82f2ffe662b0045c5a61ca1b357af31b25`, runtime image `sha256:96340589aad94c2a8170b0e4922ca39aa13c9eadf26cc297d2bfe4caab5be149`. This is an engineering subgate, not P09/full G3, P07, public or physical-device acceptance.

## E09-04 — P2 — immediate close expects the wrong authentication result

Current clean `venus-p05-d0dae0919672` is complete FAIL, source unchanged and cleanup completed. Fifteen functional records pass; `P09-PENDING-JOIN-VS-CLOSE` fails at `tests/p09/integration.mjs:64` because the final viewer room read returns401 and the fixture expects403. The earlier assertions already confirmed pending socket close and actual viewer media clearing. `apps/api/src/rooms.ts:123-127` checks an unrevoked active room_session first, then room/deletionledger. Close revokes all room_sessions. Therefore401 AUTH_REQUIRED with the old viewer credential immediately after close is correct. Changing app authentication to satisfy403 would be the wrong correction.

Correct only the immediate-close assertion to401 AUTH_REQUIRED. Keep the distinct postrestore403 ROOM_CLOSED assertion: old PG restores a formerly active DB session, allowing the protected deletion ledger to be tested independently. The primary dump room remains open, with its saved cookie required to receive roomHTTP200 before old mediaJWT401 on all4paths. This is the correct fixture design; the current run did not reach its restore assertions. Preserve this failed round and re-run the corrected exact clean impacted sequence.

Current NOT_RUN: P09-PENDING-CUTOFF-API-RESTART, P09-API-LOSS-WATCHDOG, P09-OLD-LIVE-PG-RESTORE. No previous-source PASS is substituted for these missing records.

## Prior engineering fixes

E09-01 is corrected. Open serving `Media.prepareDelivery` returns ready/mode:serving after read-only supervisor health, without retiring leases or changing boot. Closed serving still performs real quiesce/start/admin preparation before opening. The current actual open-readiness case checks unchanged boot, live Cinema and operator health exit0, while the maintenance case exercises denied external use and unavailable admin rejection. This addresses preflight on serving A; a final actual signed v3 deployment/update drill remains P07/delivery scope.

E09-03 is corrected by the current controlled HTMLMediaElement.play NotAllowedError, explicit sound action and recovered live playback. This is a controlled policy error case, not a claim every physical browser autoplay implementation was tested.

E09-02's normal metric failure is corrected on current exact bytes: A/V p95 **65ms**, glass **72ms**, viewer skew **37ms**,2100 samples and35unique matched pairs for each of7viewers. SFU p95CPU 0.1111cores, peakRAM 115261440bytes, p95egress 4933492bps; observed loss0 and max jitter2ms. Earlier125/376ms failures remain historical FAIL; no120ms target relaxation or offset subtraction was found.

## AV source and profile qualification

The fixture now schedules each1Hz100ms audio pulse once on a fixed AudioContext epoch, drives flash via getOutputTimestamp output-clock mapping and retains Date.now+checksum video marker. Both waveform and flash use low-to-high detection; audio hysteresis re-arms below.01. Pairing uses each audio event at most once. One header readback replaces repeated40pixel readbacks. Source calibration samples actual captured stream before SFU using a visible, foreground temporary clone: 175decodedframes/6pairs/p9578ms. It is a separate required record; catch-and-continue does not waive it because final records.every(PASS) is mandatory.

The clock and detector changes remove known uncontrolled source/level-counting defects. The raw received-audio track analyser still branches before HTMLMediaElement audio output, so the65ms result is a defined local received-audio/rendered-video metric, not measured user-heard hardware lip-sync. Source calibration does not subtract its offset. Matching can omit unmatched events; retained pulse counts plus35matches per viewer qualify this specific healthy fixture, not arbitrary missing-pulse conditions or a wider output guarantee.

Profile changes were documented as new fixture revisions before the corresponding runs: API+browser fixture8CPU/4GiB on16CPUhost, SFU2CPU/1GiB, DB1CPU/512MiB. This change addresses measurement-fixture CPU saturation; it does not demonstrate production app2CPU capacity. Degraded qdisc affects SFU7881/7882 media ports only; private authority/admin control is explicitly unshaped. API/control disappearance has a separate mandatory watchdog case, currently NOT_RUN. TCP fallback case observes a nominated TCP path after a fresh capture/join with UDPblocked. No full-network blackout/physical internet guarantee is inferred.

## Mandatory scope map

| Plan requirement | Current evidence and disposition |
| --- | --- |
| EXIT01 ACCESS | Actual1publisher+7viewers, guest/second publisher and all4 foreign-origin/cookie paths, revoke/stale token and old-release/new-scope PASS. Close receipt assertion blocks full closure completion; restored replay proof NOT_RUN. |
| EXIT02 AV | Sourcecalibration, normal30s, media-only degraded10s and UDPblockedTCP10s PASS for qualified received-audio fixture metric. No physical/output/public network claim. |
| EXIT03 FAILURE | Denied/noaudio, controlled autoplay retry, failed-cutoff retry/expiry, explicitstop and sourceend PASS. API-restart/watchdog/restore NOT_RUN current source. |
| EXIT04 CAPACITY | SFU CPU/RAM/egress/RTP and single-room admission with active Games PASS for declared fixture. Separate app production load/finalP07 NOT_RUN. |
| EXIT05 COEXISTENCE/REGRESSION | Current Cinema+Games and actual Music pause PASS. Retain scoped P06 unit negatives and unchanged-app static checks. Final whole-stack P07 and actual new signed delivery/update/rollback NOT_PASS. |

## Exact build and regression limits

App/packages/supervisor/operator production code has no diff from17a41867 to94baae59. The captured17a targeted-static01 records sixchecks exit0 and10fast regressionunitPASS; its lint result is not retroactively claimed for later fixture source. Current native runtime compiles/executes the current fixture. Production-build02 was built at a8a2ad22; production Docker build inputs compare byte-identically through current94baa, except SOURCE_REVISION build metadata. Its image is `sha256:332ab2fba19c7ca53386f7917aa7f7eb9ad14f3261650619b3a5098c8c5d73dd`; it is not an exact94baa production build or a publication. Actual inventory retains binary5153d7ce..., Node24.22.0/Debian12. Dependency round02 remains qualified LOCAL only; Node patch/full redistribution readiness remain final delivery items.

Security source closure round04 and prior runtime packets do not replace a complete current runtime packet. Full G3/P07/public signed v3 release/production DNS-TLS-NAT/physical devices remain NOT_PASS under U022. No new app implementation blocker was found in this bounded review.

Reviewer launched no Docker, tests, build, installs or new framework. One optional static INDEX lookup was absent and corrected to actual RESULT; one read-only diagnostic stdout hit Windows cp1252 printing a checkmark and was corrected by normal PowerShell reads. These were reviewer read errors, not product failures. Exact hashes and current scope map are in INPUTS.json. Only own journal/packet were written; all historical failures preserved. COMPLETE_STOP.
