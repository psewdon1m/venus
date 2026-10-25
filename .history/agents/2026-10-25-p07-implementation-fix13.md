# P07 fix13 preparation — one readiness checkout for eight fresh schema probes

- 2026-10-25T18:37:20Z — Parent requested READONLY preparation pending design approval. Actual strictsoak hour01 first readiness timeout while eight independent pool.query schema probes compete with room transactions; earlyabort and cleanup retained. Proposed one shared checked-out client for all8freshprobes in production server and P07fixture; same SQL/checkpoint/generations/query timeouts, noBEGIN/cache/poolbypass/newpool/queue/helper/framework. Scope journal+source/type review only until explicit APPROVE. Need original EOL pin and existing compiled probeJS parity after type-only parameter widening; later finite PG badschema/outage/release/contention proof, no AV/P10 reruns.

- 2026-10-25T18:38:45Z — Parent EngdesignAPPROVE received with safe failure disposal: completed=false; ALL8checks(c); completed=true; finally c.release(!completed). Completed all10source changes BEFORE checks: production protectedRuntime.checkpoint still precedes checkout; both production and P07fixture use one checked-out client for unchanged8fresh schema checks; failed checks destroy client; noBEGIN/cache/helper/pool bypass/newpool/queue/timeout changes. Eight probe parameters only widened pg.Pool→Pick<pg.Pool,'query'>; all migrate methods retain fullPool. No SQL/order/generation/query_timeout change. Byte replacements preserve each file's original EOL, including preexisting mixed fixture EOL.

- 2026-10-25T18:39:25Z — Targeted ESLint all10files exit0; Node24.22.1 API TypeScript build exit0. Pick query shape accepts actual PoolClient. All8compiled migration JS hashes match original local compiled bytes byte-for-byte after type-only changes; actual cached hour01 fixture image7e855711059a064f59da464fe8bee3aca08762a38d2f539a110368fddda46be9 imports independently match those8new compiledhashes in proof. compiled-parity.json pins each before/after fullJS digest. These checks do not claim production image/server full runtime parity beyond those8probe modules.

- 2026-10-25T18:43:11Z — Finite actual PostgreSQL16.14 owned isolated proof PASS21cases, final run4.4s: healthy all8fresh onecheckout; each of8migration tables changed maximum generation and missing generations independently reject, failed poolclient destroyed(totalCount0), restoring exact real rows enables fresh recovery (16cases); real schema-query tablelock timeout1000ms destroys poolclient, backend exits after owned lock release, fresh readiness recovers; actual database ALLOW_CONNECTIONSfalse+terminate only owned appDB connections rejects checkout, reenabling DB allows fresh recovery (notDockerstopclaim). Same12slot pool with11heldclients+onequeuedrival: old8separatecheckouts times out2005ms, newonecheckout completes all8checks4ms. This controlled acquisition-pressure demonstration is not an8client room-advisory benchmark or hour/performancePASS. Actual wrapper body extracted from edited production server.ts; existing actual compiled probeSQL used unchanged.

- 2026-10-25T18:43:11Z — Failed own proof attempts retained: initial Node import from /artifacts could not resolve pg (exit1 beforeSQL), fixed proof-only import to actual /app/node_modules/pg/lib/index.js. Repeat01 reached healthy+16schema cases, then failed an OVERSTRONG diagnostic assertion that server-side locked query must disappear within50ms before releasing external lock. Required pool.totalCount0 was already true; disconnected PostgreSQL backend can remain blocked until lock releases. Corrected only own proof assertion to verify immediate pool disposal/no reuse and backend exit AFTER own lockrelease, then fresh recovery. Repeat02 PASS21. No product cancellation/timeouts changes; parent approved correction. Failure logs not overwritten, final proof explicitly states immediate server cancellation not claimed.

- 2026-10-25T18:43:56Z — Own test namespace venus-p07-readiness-fix13 internal Docker network+single PGtmpfs, no hostports or persistent volumes. Ephemeral synthetic-only PG uses trust exclusively on internal owned namespace, no credential files/real secrets. Test worker read-only/nonroot/capdrop/networkscoped,2CPU/1GiB; PG1CPU/512MiB/128PID. PG --rm stopped and network removed exit0; exact labeled container/network inventories empty. No AV/P10/preflightTTL/fullsoak/statistical reruns; source unchanged after initial allcode; no app.test rerun needed because handler/sourceunchanged and finite realPG test covers impacted readiness wrapper.

Final source/EOL pins (.artifacts/p07-readiness-fix13/receipt.json lists all10SHA):
- apps/api/src/server.ts12b88e620f09121f80d822ae65e1365c070448d53d9e6092eb6922895b76104f,106CRLF/106LF
- tests/p07/server.mjs3229a7b9d9dfecc40c25f7fe894f5177fa5c292097861b1cbea80a62f37511f4,1CRLF/65LF (originalmixedretained)
- migrations cb86405e05c7d12a287646619214e3f624009ecbfc26d29ef5db15a0998c7d6a
- game-migrations4c366e1d31c2611ac0085d675b6ed155e106c0c892d13eee9e1feeaa79127ed8
- catalog-migrations5fa96c4e65c8c94ba240343c1e82b1b6d22e499d9282cf0562f98e7ffb3fe76f
- chat-migrations4b3e155930d0781dc844fff3f25568ae75e4dc2409eebe25fc5a4f72590988b3
- private-topic-migrationse48115e9ce892862f2739db122d7464d08b5e522894110be3411ac20c136e8ab
- music-migrations407795be9cfddb8ca420b8dc0d1b87d76c04020164c7aa1a6762731eda072fe7
- media-migrations53eb16ea67790c505bb775561500ba34354e4ac73b927d0ff11b4f47b20cd1a0
- presentation-migrationsa236232ca1518155cba831810c91a6c167adbb17503f24b4369fa042ceaf1c48

Own ignored proof pins:
- receipt.jsoncadab0e86d43da5d9a00ccc5a0a129cf4b8a73249e19acd164a054f88660645d
- compiled-parity.json42a4e383753d36e94c7d35b96740859aa7d8b7c0f048ec7c00f182c9fb2239d1
- actual-pg-proof.jsonfcbf952f8648ce242950a3d1dd20505053efc625157fa9207f4a134f5bd82fc1
- initialfailurelog05fd0fcb798472de9b54042a750ebfbcb057e150862e202165462b4eecac09ad
- repeat01failurelog4eb68f2c8b5b70661984e2d4f13dec1fe8a2c89ff2aaf8f801d2ba46312d6a16
- repeat02PASSlogf87833c4609cf69a1b677582aa68363779b89ad7e36b56cf6b74c4e5e2fd54b2
- finite own actual-pg-proof.mjs97c663658d8953092dd175179fe5f18628a73625d3ec07cdd75318f708aa0bbb

- 2026-10-25T18:43:56Z — FINAL STOP. Exact10sourcefiles +ownjournal/artifacts only; no Wcommit/C/ROOT/manifest/status/oldsealedproof edits or new tracked test framework/helper. Parent independent code/security review, clean build/source proof and actual application firstminutes/hour remain mandatory. Tiny contention result is causal component evidence, not hour acceptance. Discovery rg wildcard OS123 retained; exact discovered8paths used afterward.
