# Dedicated chat policy actual02 — independent evidence review

Status: **BOUNDED_ACTUAL_CHAT_POLICY_COMPONENT_PASS**. Reviewer `/root/p05_topic_games_review`; producer author `/root/p05_topics_ui_review`; prior independent checkpoint04 static reviewer `/root/p05_topics_ui`. No new findings. TG-CHAT-001 and TG-CHAT-002 are fixed within the policy/context/feature-flag/final-fence and Unicode HTTP scopes evidenced here. This does not accept the full P05 stage or change owner450 HOLD.

## Exact inputs and execution provenance

- Root evidence: `topic-chat-policy-preflight-02/index.json`, SHA256 `6c8476a7baf537d4bafbac9142a8053fa62f71bfa2b589a9bcae16e1f8a5e39a`: all **28** indexed byte lengths/hashes independently verified. Root observed the same exec handle **50387** terminate with exit **0**; archived terminal, runner and raw tests independently agree. This review does not derive a process exit code from a planned command.
- Included source identity `895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04`, **1808** files: full maps before/after/after-finally/current equal. Shared `topic-games-preflight-07/included-source.zip` SHA256 `9627fb299dbb42feae8955bb765140acdaf168054c159cae7c87a599f6a23a5b`: all1808 unique entries match every input hash. Selected source copies are opaque `.bytes` snapshots; mapping is encoded by their exact-source path and listed in INDEX.
- Frozen image `sha256:c02fb83839339f0c60b55c7df509e73c6fb774c0a0ed6cc05ab4c746a131fc1c`: archived/fresh Docker identity and Config equal. Build log runs the runtime target and npm build; cached build layers are retained in the log. Own file-only image inspector matched **204** source/package/test inputs, exit0, read-only/nonroot/no-network/128MiB/1CPU; owned container removed. This inspector is not a functional rerun or independent compilation proof.
- Producer integration `3716f7da3c17bfae46f4ba1b011ec287edeb5b2d0037a1c1452c7ec25bd373fb`, runner `c77b72308b42dc3262c55015afa1793c31cdfc8d5396a03ec515627a4c6da8e4`: archived files match before/after/after-finally pins and independent static04 report. HANDOFF's pre-run pending labels remain historical snapshots; the separate static04 PASS and actual02 reports supply the later outcomes.

## Actual controls and assertion strength

Raw tests and structured report contain exactly **12 distinct expected PASS IDs**, in order; missing/duplicate cases cannot count as completion. This review checked each case against the archived producer assertions and the included real-PG harness, rather than accepting method names or status booleans alone.

| Cases | Verified outcome and concrete boundary |
| --- | --- |
| 01 | Actual online bilateral prompt release and send; sender/recipient projections. Pending action remains a valid chat case; action consent was not retroactively made a universal chat prerequisite. |
| 02–03 | In-person private verbal prompts remain available with either flag value, frozen chat capability absent; GET/POST chat and self-actions deny. Expected 4xx policy codes are required, never generic500. |
| 04–05 | Flag-off online snapshot has zero chat capability/private opportunities;20 unique ordered rounds1..20 and actual DB count20, terminal finalround. Re-enabling cannot add capabilities to that snapshot; cipher bytes unchanged. |
| 06 | Disabling current backend policy revokes prompt/chat/self permission; previously successful exact retry also denied without quota charge; re-enable cannot revive the old private moment. |
| 07 | Real room with three members selects the two peers. Host outside selected actors cannot read/send or advertise chat. |
| 08 | Exact retry returns same receipt without quota/messages change, changed body409. Actual HTTP rejects isolated high/low and embedded lone surrogates400 INVALID_TEXT, without quota or request receipt increments. |
| 09 |12 messages per actor per fixed calendar minute;13th429 RATE_LIMITED, peer independently allowed; next minute accepted. Actual current offers accepted by each actor through two HTTP POSTs before clock movement. |
| 10 |34 actual HTTP sends, last32 only with sequences3..34 and first/last text assertions; chat alone does not bump game/room revision. Baseline follows action acceptance. |
| 11 | Explicit encrypted quota-only SQL fixture total126 under room lock/FOR UPDATE/real AEAD AAD. Two real HTTP sends produce127/128;129 returns429 PRIVATE_CHAT_VOLUME_LIMIT. OtherQuestion advances epoch and clears old text while quota127 survives. Auth/consent/lifecycle are not seeded. This is not128 natural sends. |
| 12 | Separate actual GET and POST final-credential PG lock waits; backend flag changes only after actual pg_stat_activity Lock observation. GET returns no text. POST policy denial rolls back quota/messages and exact new request receipt count remains0; sent canary absent. |

The quota clock correction is explicit: case09 clock1000000→1020001 with active expiry1180000; case10 clock1020001→1080001 with active expiry1200001. Each case performs exactly two actual action accepts before advancing; action active deadline, invitation active deadline and conversation parent expiry remain unchanged across the advance. Case10 crosses its old pending action deadline1050001, so the prior failed precondition is corrected through consent, not TTL extension or shorter clock.

The GET wait selector observes the same PoolClient read a chat object for this room/session before selecting its final credential SQL. The POST selector first observes this exact room/member/request_id chat receipt INSERT, then the same client's final credential query. Both wait on real PostgreSQL advisory locks; they do not replace results or bypass authorization. The feature flag and clock are explicitly mutable fixture seams; there is no claim of a production hot-config API.

The producer uses actual createApp/Rooms/TopicGames/RoomGames, encrypted lifecycle/preferences/filesystem authority and real PostgreSQL; admission, invitation and topic acceptance go through protected HTTP. Cookie/Origin/CSRF headers are manually assembled by the harness, and presence uses direct actual Rooms.connect/liveGrant callbacks. The mounted script is only the excluded producer, alongside artifacts. No product or harness mount, NODE_OPTIONS override or external port exposure. API limits1CPU/768MiB/read-only/nonroot/cap-drop; DB512MiB, internal network. It deliberately runs the component producer command, not production server CMD.

## Cleanup, retained failures and independent checks

Root project `venus-topic-chat-policy-69dbed48212f`: archived pre-cleanup objects carry its exact ownership label; cleanup removes owned DB/network/volume. Fresh label queries independently returned empty containers/networks/volumes. Generated password file and its temporary directory are absent. Harness cleanup reports completion; the private runtime process is removed. No global cleanup was used.

Old actual01 FAIL packet index `858cf94b2d112a1f04cdf3cb3d076b81f1c168ba9b11370699cdbd6ecb5744e5` and all indexed files remain byte-identical: cases01..09 PASS,10 FAIL,11/12 not run. Only excluded09/10 producer action preconditions changed for the retry. Old failures and before-fix Unicode/context/fence reports remain immutable.

Own evidence-audit script exit0; nine inert altered-evidence controls were rejected: missing/duplicate case, scope inflation, extended deadline, single-actor acceptance, unlabelled quota seed, missing GET wait, missing POST wait and unrolled-back receipt. These are verifier sensitivity checks, not new product executions. Own no-network image hash probe exit0/autoremoved. No functional Docker rerun was performed; included source identity remains895 after these checks.

## Acceptance limits

This is component evidence on a frozen dirty-tree source snapshot with synthetic cards/map and explicit fixture clock/config/SQL wait selectors. It does not prove clean-source CI, real approved V2 catalogue release, browser cookie behavior, ordinary production CMD, production/DNS/TLS/device behavior, full restore/rollback or full P05. Existing Games20/lifecycle16/runtime8/ordinaryWS10 have separate reviews; their PASS is not silently folded into this result. Human content approval and measurement/C2/fairness/inference gates remain separate.
