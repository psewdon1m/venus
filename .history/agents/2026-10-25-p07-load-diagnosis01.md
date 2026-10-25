# P07 load diagnosis 01

- 2026-10-25T15:44:06.5235867Z Task: READONLY source/evidence diagnosis of eight-browser preflight normal-traffic latency/readiness. No tests, heavy Docker, or application edits. Inputs HEAD dcf2d7088a7a30b586a8c6be10138d80dda51d5e and preflight-round03. Own journal only.
- Initial inventory command exit 1 because repository has no src/ root; no tests run; switching to rg --files inventory.

## 2026-10-25T15:47:42.5115836Z Readonly findings / handoff

Input accepted evidence: preflight-round03 INDEX source dcf2d7088a7a30b586a8c6be10138d80dda51d5e; live source can contain concurrent author fix04, so exact hashes below bind the bytes inspected. No application or test files edited; no tests, build, benchmark, Docker command, or network action run.

### Confirmed observations

- Correct ISO timestamp aggregation (ConvertFrom-Json -DateKind String) gives 94 samples strictly before explicit DB fault 2026-10-25T15:38:18Z: 15:30:32.666Z through 15:38:12.832Z. Six readiness samples returned 0 (monitor's 3s abort), all liveness samples 200. Last pre-fault PG network cumulative 164MB in / 2.39GB out. This is not DB fault fallout.
- Earlier PowerShell date aggregates were WRONG because ConvertFrom-Json inferred DateTime and the subsequent string parsing changed timestamp handling; they included all104samples. Discard those attempted counts. Explicit DateKind String/ordinal ISO comparison corrected the result; raw proof untouched.
- Existing PG sample supplied by orchestrator: 11 advisory waiters and one idle transaction, eventually resolves. This audit did not independently re-run that measurement.

### Concrete source amplification

1. apps/api/src/topic-games.ts socketView (332): each active socket poll calls row SELECT g.* then loaded BEFORE testing whether member is one of plan.actors. loaded calls required/row again, source/pins/catalog, snapshot+history+round, all-members safety and presence. Only after all that does actor=false skip prepareProjection. For an eight-member pair, six sockets do this full work every second without needing a private projection. No reconcile is performed for those six, so the expensive nonactor loaded call does not itself provide expiry persistence.
2. apps/api/src/private-topic-preferences.ts readForPlanner (106-124): one member list query, then eight loadOwner calls. Each loadOwner repeats same room/birth lookup (two queries) plus one padded preference ciphertext query. That is 25 queries for safety load alone; eight 16KiB padded plaintext / about22KiB base64 envelopes traverse PG repeatedly. assertPlannerCurrent still reads protected authority and must remain authoritative.
3. TopicGames getCurrent→loaded then view and dispatchHttpView→publicDelivery do repeated row/source/snapshot/history/current reads. current() decrypts and validates current round; row() pulls draft+snapshot padded ciphertexts. TopicSnapshotCache / TopicHistoryCache intentionally validate only immutable derived work; fresh auth/decryption/storage fences remain, so their existence does not remove the repeated SQL/network IO.
4. Reconcile persists clock floors and conversation state. saveConversation currently reloads stored conversation then storeTopicObject rewrites encrypted chunk(s) even when only clock floor changes; DO NOT drop this persistence speculatively. It carries rollback/expiry semantics.
5. All room operations hold Rooms.roomOrdering advisory lock and row lock; pool slots are acquired before room-lock wait. database.ts max12, connectionTimeout2s, query_timeout5s. Readiness shares that same pool and acquires it for eight schema probes sequentially, each query_timeout1s. Eleven room waiters plus one active transaction leave readiness queued for checkout; the monitor aborts at3s. This is a concrete starvation mechanism consistent with observations, but this readonly audit cannot rank SQL transport vs synchronous FS/crypto by measured duration.

### Narrow recommended action (send to author, no changes performed here)

- First: in socketView obtain validated locked current round, test member in plan.actors + conversation_id, and call full loaded/prepareProjection only for actual conversation actors. Preserve room/session/lifecycle auth, refs query and dispatchPrivate's independent fresh delivery checks. This avoids six of eight needless full safety loads in the pair case, with no cache, reduced client count, relaxed timeout or authority change. Reusing already-read g/round within the SAME room transaction can additionally avoid duplicate SELECTs; no cross-transaction reuse.
- If still necessary: batch same-transaction birth and all preference rows for readForPlanner (same eight exact members), retaining each ledger read and final authority fences. Do not replace fresh reads with process cache.
- Do not treat a dedicated readiness pool alone or higher container CPU cap as the application-latency fix. CPU percent combines Chromium and API; low aggregate vs12CPU does not show that single Node event loop is idle.
- If source fix still needs disambiguation, one bounded existing preflight sample can capture aggregate pool total/idle/waiting and one active transaction duration, without SQL values/session IDs/keys. No broad new profiler or hour soak until short run is stable.

All findings transmitted to /root. STOP; no more writes after final journal hash.
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\topic-games.ts: 45d2484238b9096de91df3d7ccfb5e97754e46ceabcfee3d35b4bc2c46295b8e
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\private-topic-preferences.ts: e6fcb12b474c922137af061b3815521e086aa8b8701a174c1d0af580daef2c3a
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\rooms.ts: 8e0c5ebe49f1db70c0c5256f133c113414a5d8a32689a795fea7abed493d94e1
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\database.ts: 521bed6eab7853553dd7ff8eeb51b90e0c3ed46336fc36609577ba0099cebdd9
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\topic-game-source.ts: 4fe2ce5a1542fb1911f233cdbedbb78e657fcf00e9b2281798e1106be63afc7b
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\app.ts: 698f9cd6f4f6523d0348a699728c087aa3cf214262fbf3cd034cbd425ec6f68a
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\apps\api\src\room-routes.ts: f2b70e555d4c944398f86f1d6a5560d38c80b3259224fade2206615ae0de0fcf
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\.docs\implementation\evidence\p07\preflight-round03\INDEX.json: 14799975fbe0f1e6d02f0f94ea2da2dc54fc5f2a0196bec1c353aa989d7033fe
- C:\Users\pc\.codex\worktrees\p06-standalone-release\venus\.docs\implementation\evidence\p07\preflight-round03\host-samples.jsonl: 314314891d5557aebf8bdb0d5b0313c8015fa89e1711bb67fcda87b3f305372c
