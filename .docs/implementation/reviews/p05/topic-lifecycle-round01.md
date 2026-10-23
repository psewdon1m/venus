# P05 room topic lifecycle composition — independent round 01

**PREFLIGHT_COMPONENT_PASS**, exact frozen dirty-source component only. Reviewer `/root/p05_topic_lifecycle_review` did not author the producer, storage or root integration. No included source files were edited. This report does not accept all P05 or LIFE001–004 obligations.

## Inputs and provenance

- Included source identity `f43faefe9046d4f735878bcfccf15acd12c24dd383dee6d704e998e341446fd3`, 1780 files. Independently recomputed canonical inventory identity; every ZIP entry matches its inventory hash, without extra entries. Before/after file maps are equal.
- Original [producer proof](../../evidence/p05/topic-lifecycle-preflight-01/index.json): all 19 indexed file byte lengths and SHA-256 values verified. ZIP SHA-256 `30fd36618695f732ffe1a7851b90579b5d21343da0103cffcf6c1b8662e3a1ec`.
- Exact immutable Linux image `sha256:25311e4177c8358b7fb43e0b046cbc77ed72b954f07be00b0c60598b85eeef2a` exists. **179 image inputs** copied by the Dockerfile (apps/packages/tests/dependency/config files) independently match the frozen archive. Build log records successful build/export of this image. Execution uses that image; no moving checkout source is mounted. Reviewer controls alone are mounted as a separate test script.
- [Independent evidence index](../../evidence/p05/topic-lifecycle-independent-01/index.json) SHA-256 `859727585675666135dd578defc61c15f3ab4f75c8dc44d978834d12a7361123`. Accepted execution is **attempt-02**; the evidence root contains initial raw logs and working copies, while exact accepted inputs/results live under attempt-02 and failed inputs/results under attempt-01, as FINAL_RECEIPT explains.

## Independent execution

**16/16 producer cases independently rerun PASS, then 12/12 reviewer-authored controls PASS**, runner terminal exit0. Both phases use a fresh actual PostgreSQL16 database with the same frozen Node24 image, HTTP loopback server, UID1000 Linux filesystem, actual TopicRoomDirectories/TopicRoomLifecycle/TopicRoomRegistry/PrivateTopicPreferences/Rooms/TopicGames revocation. Only card/topic content and map provider are synthetic. No admission/member/session rows are SQL-seeded; create/join and explicit 18+ acceptance use real HTTP routes. Deliberate SQL row restoration, query waits and clock movement are named fault controls.

Reviewer controls cover:

1. `TLC-R01`: 18+ false create is rejected before any SQL room or external directory allocation.
2. `TLC-R02`: 18+ false join leaves SQL membership and authenticated admission-chain bytes unchanged.
3. `TLC-R03`: supplied foreign owner field is rejected; peer permissions and preference rows remain unchanged.
4. `TLC-R04`: legacy protocol1 room creation allocates no protocol2 authority and exposes no topic settings.
5. `TLC-R05`: another room's valid credential cannot read topic settings or withdraw membership.
6. `TLC-R06`: actual durable member withdrawal followed by PostgreSQL division-by-zero rolls SQL back; the old still-active SQL row cannot authorize HTTP. Maintenance reconciles removal/session revocation.
7. `TLC-R07`: after restoring the older encrypted preference row, idempotent exclusion replay returns the stricter external state; reuse of its request UUID with different topics conflicts without narrowing those topics.
8. `TLC-R08`: unsafe lifecycle authority-root permissions deny Leave without SQL removal; restoring the exact healthy root permits Leave.
9. `TLC-R09`: Close succeeds for an active released private round when the source provider becomes unavailable.
10. `TLC-R10`: Leave succeeds with the personal chain parent missing, while healthy metadata authority records permanent withdrawal.
11. `TLC-R11`: after durable room retirement and actual SQL rollback, a later retry with another UUID cannot reset the authenticated original retirement time; maintenance uses that original time.
12. `TLC-R12`: corrupt birth prevents actual Close POST, changes no SQL room state and is not repaired by the operation. Restoring exact birth bytes permits Close.

The first independent attempt preserved **11 passing controls and a reviewer fixture failure**: R12 used a helper that expected successful GET after deliberately corrupting birth, so Close POST was never sent. Corrected only reviewer setup: capture room revision before corruption and send Close POST directly. Original scripts, FAIL/raw/report and cleanup remain under attempt-01; full rerun on unchanged image is under attempt-02. This is not a production defect or a discarded failure. A harmless initial Docker inspect formatting error (absent Config.Labels) and early optional log-file read before creation are recorded in the reviewer journal.

## Producer checks inspected and reproduced

- TLC01–03: schema probe and idempotent migrations, protocol2 creation with explicit18+, real protected birth and host/peer admission, immutable protocol update denial. Missing external birth fails without initialization. SQL UPDATE cannot change protocol; this does **not** claim arbitrary privileged DELETE/INSERT or entire host-state rollback resistance.
- TLC04–06: owner-only settings, 16KiB encrypted payload, older encrypted preference row rollback cannot restore an excluded topic. Deliberate actual PostgreSQL fault occurs after real topicsChanged removed offer/incremented epoch; SQL rolls back, external exclusion remains stricter and prior private text is unavailable.
- TLC07–09: protocol1 never silently upgrades; legacy HTTP/bulk reconcile/quiesce/withdraw skip AAD2 games. Real setup/prepare/start/invitation and bilateral topic acceptance release private content, while public current round remains generic. After Leave and stale SQL member/session restoration, **actual pre-existing private reference** dispatch rejects exact `TOPIC_ROOM_MEMBER_RETIRED` before enqueue. HTTP no-leak assertion accepts a generic denied response; the exact authority error is established separately by direct dispatch/storage checks.
- TLC10–13: Leave tolerates missing/corrupt personal files; Close tolerates missing personal parent while authority roots stay healthy. Durable room intent survives actual SQL rollback; maintenance retains original closedAt and removes personal/lifecycle member-containing files within the tested <24h interval. Restored old room/member/session rows still deny access when the legacy deletion fixture is deliberately empty, isolating the new retirement authority.
- TLC14–15: fixture adds a named advisory-wait expression to the **actual final PostgreSQL credential SELECT**. pg_stat_activity confirms a real Lock wait before server clock crosses actual session expiry. Narrowing returns401 with unchanged external revision/exclusions and no preference publication. Private dispatch returns401 and never invokes enqueue, after proving a projection had been persisted.
- TLC16: actual SQL bootGate clears conversation/chat/private refs and prior consent grants, retaining identical history object and external exclusions. This invokes the boot barrier in the same process, not an API process restart.

## Resource safety and scope boundary

Original project `venus-topic-lifecycle-ea471f5a2ffe` cleanup ownership inspected and all three resource classes independently absent. Reviewer projects `venus-review-tlc-e9c7d63a7deb` (failed setup attempt) and `venus-review-tlc-81ee636e3eea` (accepted) independently have zero containers/networks/volumes. Each test API is non-root/read-only, cap_drop ALL, no-new-privileges, 1 CPU/768MiB, no Docker socket or published port; PostgreSQL is 1 CPU/512MiB on a private internal network. Cleanup affects only the unique owned Compose project. Temporary database secret files are removed; no credential values are recorded.

No confirmed code finding remains **within this exact component scope**. These are preflight bytes, not a clean-source/full-stage acceptance, and later backend/UI/capability/taxonomy changes do not inherit this PASS. **Source/profile compatibility and cold bootstrap of all five protected roots remain OPEN.** This run preprovisions roots in a protected temporary directory; it does not prove serving startup/operator provisioning.

SQL row snapshot updates are not full pg_dump/restore. BootGate is not process restart. HTTP ws-ticket plus direct Rooms.connect and direct dispatch are not ordinary browser WebSocket transport or browser cookie-jar proof. Not proved here: full host/key/authority rollback model, simultaneous authority rollback defence, independent backup/restore lifecycle and <=7d pruning, cold restart/old-worker quiescence, current full browser/C2/fairness/public-inference matrix, production/DNS/TLS/devices, clean CI/full P05 or human approval of450 cards. Those remain separate gates; human450 HOLD is unchanged.
