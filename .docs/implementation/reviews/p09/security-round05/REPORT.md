# P09 independent security actual rebind — round05

**PASS — qualified local functional Security/Privacy component.** S09-01…04 are closed by the previously reviewed implementation and the completed actual round25. No new concrete finding or missing proof blocks this bounded security acceptance. This is not full original G3, final P07, signed v3 publication, physical-device or public-production acceptance.

Runtime source: `3dad49ae02d62708977fd83aa1b3cfdfecd564eb`; core `1b7758fd93c67d92312d9338760c08ff63d7616615bb001cadf3a2a88ccceb40`,2016 files. The implementation is unchanged from the17a correction and sealed source round04. Exact media/routes/app/rooms/protected authority/migrations/supervisor/operator/frontend hashes match that source review. Later fixture/contract changes are bound to the actual run, rather than called a new execution of an old revision.

## Actual finding closure

| Finding | Exact final record/assertions | Decision |
|---|---|---|
| S09-01 — false cutoff success/pending loss | `P09-UNCONFIRMED-RETRY-AND-EXPIRY`, `P09-STOP-RETRY-CUTOFF`, `P09-PENDING-CUTOFF-API-RESTART`: repeated release/stop/reaccept remain503 while admin and quiesce are injected unavailable; pending survives actual API restart with persistent fault state; recovery permits explicit reconciliation. Lease expiry rejects renewal. | CLOSED |
| S09-02 — media-dead app healthy | `P09-MAINTENANCE-MEDIA-READINESS`: actual authenticated prepare/operator health program rejects media/admin failure while API is alive, prepares an empty child when healthy, retains closed consumer admission and disabled RTC authority. | CLOSED |
| S09-03 — healthy open preflight rejected | `P09-OPEN-READINESS-AND-AUTOPLAY`: embedded operator health program succeeds while current Cinema is live, with unchanged child boot and live state; explicit blocked-playback recovery also passes. | CLOSED |
| S09-04 — old release retires new scope | `P09-OLD-RELEASE-KEEPS-NEW-SCOPE`: retired publisher's old release503 under admin+quiesce failure, recovered same-lease retry200, then new Cinema stays live and the actual viewer continues. The member-scoped Cinema UPDATE matches selected upstream scopes. | CLOSED |

Read the exact final test source and its assertions, not only record labels. Injected failures execute production Media/real PG/host authority transitions inside the owned fixture; they are not relabelled as an independently induced physical network outage. The operator helper executes the production embedded health program against the real fixture API/supervisor, with Docker container discovery adapted to the fixture; it is not a complete signed v3 installation.

`P09-PENDING-JOIN-VS-CLOSE` closes an actual live AV room, clears an actual viewer, closes pending signaling and rejects the removed session. `P09-API-LOSS-WATCHDOG` confirms child cutoff in2542ms against the5s bound. `P09-OLD-LIVE-PG-RESTORE` performs actual PG16 custom dump/restore, waits for a new ready media epoch, authenticates the restored open-room cookie with HTTP200, and only then rejects the old JWT401 on all four gateway paths. A separately protected closed room still returns ROOM_CLOSED403. Thus stale-grant rejection is not accidentally proven by an invalid cookie or closed snapshot room. Protected files are not restored from PG.

## Evidence integrity and limits

Independently verified targeted-round25 INDEX SHA256 `a73ecfb60d3f2fa5a510dd1a550e6bef25bc26a38ead3980122558cd28c54c29` and all11 indexed file hashes. Before/after source maps are equal; recomputed their canonical core, and every2016 W source-file hash matches. Runner records clean source, unchanged identity, PASS and completed cleanup; native log contains32PASS/0FAIL/0SKIP and all19 mandatory P09 records PASS. The harness rejects nonzero native Docker test exit before assigning PASS. No reviewer runtime, tests, Docker or network/API calls were launched.

Actual Chromium native tab capture with own synthetic AV serves one publisher and seven viewers. Normal results: p95AV66ms, glass75ms, skew45ms,2100 samples; source calibration173 frames/7 pairs/p9544ms. Media-only degraded shaping explicitly filters SFU source ports7881/7882 and leaves private authority/control unshaped; a separate actual API-loss watchdog check remains mandatory and passed. UDP-blocked10s records TCP for all seven viewers. The normal SFU observations and local fixture do not establish whole-stack/physical/public deployment capacity.

Historical failed runs and source-only rounds remain unchanged. Production-build02/a8a is separate local build/inventory metadata, not another runtime run, signed release or vulnerability clearance. Rights, protected content and arbitrary OS captures are not inferred from owned synthetic tab capture.

Qualification: accepted localhost functional Music+Cinema+Games component, pinned single-host media transport, current room/consent/lease fences and tested restore/retirement behavior. Full original G3, final P07, public ICE/NAT/TURN/DNS/TLS, physical devices, professional content rights and public signed v3 delivery remain false/unaccepted. Immutable signed0.0.1 has no P09 feature claim. Protected authority/key must remain outside DB backup; compatible rollback must retire authority and confirm cutoff rather than restoring old grants.

Only the reviewer's own journal and this new review packet were written. Final source/evidence pins and decisions are adjacent. COMPLETE_STOP after final hashing.
