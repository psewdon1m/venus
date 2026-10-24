# P05 ordinary runtime producer — proposed DESIGN

Author `/root/p05_topic_lifecycle_review`, 2026-10-19. This is a new author role; another agent must accept its results. No Docker execution before root freeze/start authorization.

## Ownership and execution

Included writes only `tests/p05-runtime/{probe,monitor}.mjs` and `tools/p05-runtime.mjs`. Product `server.ts`, `topic-runtime.ts`, infrastructure and approval registries remain read-only. Runner builds the exact `infra/venus/Dockerfile` with source revision argument; records inventory before/after, build/image inspection and exact test pins. It starts the image's unchanged default CMD `node apps/api/dist/server.js`, with actual PostgreSQL16, production keyring/deletion configuration, `local-pilot` mock offer, localhost HTTPS application-origin string, empty compiled approved registries. No synthetic content/approval injection and no harness imports, direct Rooms calls or overridden entrypoint in the app service.

Unique owned Compose project, label-checked project-specific cleanup, internal network, no Docker socket or published ports. App/probe non-root UID1000, cap_drop ALL, read-only filesystem, 1CPU/768MiB, tmpfs; DB 1CPU/512MiB. Five authority directories are Dockerfile copy-up into a fresh named state volume. Probe container uses same production image only for built-in HTTP/FS/PG utilities and mounts reviewer-authored scripts separately; app gets no test script/source bind. Test HTTP is internal plain transport with exact configured HTTPS Origin headers and manually carried secure cookies; this is not browser/TLS/cookie-jar proof.

## Fixed controls

1. Fresh image/state volume: assert all five roots already exist, UID/GID1000 and0700, no room allocations. Ordinary server ready with flag absent (default false); migrations1..3 exact checksums/8 topic tables match image SQL; compiled approved card/topic registries empty.
2. HTTP entry-policy is explicit mock notice; adult18:false and accept_offer:false denied without room creation. Correct explicit18+ creates protocol1; inspect SQL immutable protocol, acceptance and no topic birth/external room allocation. Private topics/V2 endpoints unavailable; public room remains usable. Never claim positive V2 under current HOLD.
3. Before/after ordinary P1 read, deliberately remove one empty personal root and chmod another root to0755 using a separately declared owned-volume fault control. Actual room/protocol/topic-settings HTTP reads must not create or repair either root; no topic directory content appears. This proves ordinary disabled/default read behavior only; V2 reads cannot be exercised without a released profile and remain separately unproved. Restore only our exact empty test root/mode to continue.
4. Stop ordinary server; restart same image/state/DB with flag true while approved registries remain empty. Process must exit nonzero with generic STARTUP_UNAVAILABLE, and never bind4300. Separate monitor shares the app network namespace, launches before app start (stopped app must retain usable namespace: if Docker cannot support that, use a deliberate fixed container alias/IP monitor plus server log/exit/code inspection; document observation strength). No private rows or roots are initialized.
5. Invalid flag value `TRUE` (not accepted parser value) fails closed before listen, without migration/publication changes; no environment approval override.
6. Insert a clearly named SQL **restored-V2-metadata fixture** while app stopped, satisfying deferred room/member/birth constraints but without external authority, sessions or private content. It is not a real admitted V2 room, full backup restore or approval. Flag false ordinary startup must exit nonzero because existing V2 requires a compiled release profile. Confirm rows remain protocol2 and roots untouched; no fallback/downgrade/initialization.

Each negative phase records actual container exit/logs and network listener observation. Generic safe startup errors are intentional; assertions identify the case by configured preconditions and inspect actual compiled server startup ordering instead of expecting secret-bearing exception text.

## Evidence and limitations

All fixed control IDs must execute once PASS or final FAIL; failures and cleanup survive. Persist command exit codes, runtime report, root metadata snapshots, schema checks, source inventories, image ID/metadata, actual container/network/volume inspections, logs and cleanup absence; no secret values/session cookies/private payload in raw output. Require included bytes unchanged even dirty preflight. Runner will not create or update FILE_MANIFEST. Default clean requirement; explicit --allow-dirty marks preflight only.

OPEN outside this producer: positive V2 serving startup with an approved source/profile, ordinary browser/WS transport, full pg_dump/restore, host authority/key rollback, production/DNS/TLS, <=7d external backup/pruning, full P05 and human450 acceptance. Product/config gaps are findings to root, never patched or bypassed in tests.

## Design question resolved by implementation research

Avoid falsely claiming proof of 'never listened' from a final failed connection alone. Preferred monitor is an independent process started before app command and observing localhost4300 in its network namespace, with timestamps and attempts through process exit. If namespace lifecycle prevents an unchanged default CMD and pre-start monitor together, report explicit narrower observation and root decides the required stronger instrumentation; do not secretly override server CMD or suppress its logs.
