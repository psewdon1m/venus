# P05 server/runtime wiring — independent preflight round 02

Result: **STATIC_COMPONENT_PREFLIGHT_PASS**. RW-001, RW-002 and RW-003 are **closed in the reviewed configuration/method scope**. Actual ordinary-server startup, PostgreSQL/WebSocket/browser integration and existing-client cache clearing remain unverified by this review; this is not full runtime/P05 acceptance.

Inputs: [26 exact per-file captures](runtime-wiring-round02/pins.json), taken after root's product/API WRITES_PAUSED checkpoint. The supporting probes transpile the captured TypeScript into retained local modules and execute those modules, not mutable product source. No Docker, real PostgreSQL server, HTTP listener or websocket was run. The after-input check confirms all 26 captured bytes were unchanged during the probes. Markdown source snapshots are retained as opaque `.md.bytes` to preserve their exact bytes without treating relative links as standalone documents; `pins.json` maps original paths to snapshot paths.

Key hashes:

- Topic Games: `97c76626df3be6bf7b580d51265b367c4dd1f6f60d328e848b2e5a149121a7a7`.
- Rooms: `dc32ea80c4bd819c123a38d8579c5bff9ba9b7ce2a6bdbc954eafa875656f4e1`.
- RoomGames router: `93a4ca8c1dccdb5c07ced22e7f38b6c182e6a22ddc873182915e0637f5b00ab7`.
- Compose: `25fdbc52735df272dc23e55528ecd7e7e641aa800bfef23379aecc5c01b13476`.

## Findings rechecked

**RW-001:** Compose now forwards `CATALOG_REVOCATION_LEDGER_FILE` with an empty default. The guide names the explicitly provisioned `/var/lib/venus/catalog-revocations.jsonl` path in state separate from PostgreSQL, exclusive initial provisioning, and a required protected mount for external host paths. Missing restored authority is explicitly not repaired with an empty replacement. Old-volume upgrade has an operator procedure, but its actual drill remains OPEN. Closure here proves configuration forwarding and the written boundary, not execution of that procedure.

**RW-002:** Disabled Topic Games return no public/private projection and no private references before touching retained game/source data. Independent probes for waiting, active, paused, completed and aborted retained states exercise the production RoomGames wrapper and verify no source, safety or legacy implementation reads occur. Ordinary source calls remain disabled rather than authorizing starts.

**RW-003:** The production RoomGames wrapper catches only the reviewed `DomainError`/503 content-source allowlist for V2 child projections. With enabled Topic Games and the source returning `CATALOG_LEDGER_UNAVAILABLE`, active/paused/completed room projection returns no game/private refs; direct backend and ordinary HTTP content dispatch still reject. Private projection has separate withdrawal/unavailable positive and auth/authority/ciphertext/SQL/spoof/wrong-status negative controls. Legacy failures are not swallowed and a missing V2 backend cannot select V1.

Late child publication fences are rechecked separately: public/private expected source errors cause no enqueue after a successful parent fence. Parent final-fence failures, including a parent failure bearing the same allowlisted catalogue code, propagate outside that catch. Child unknown/auth/ciphertext failures also propagate. This verifies catch placement and no enqueue with explicit boundary doubles; it does not establish actual token/database/filesystem authentication or a real concurrent websocket race.

## Executed evidence

Independent supporting suite: **41/41 PASS**, exit 0, no skips. [Probe](runtime-wiring-round02/probe.mjs), [final raw output](runtime-wiring-round02/probe-raw-04.txt). The first successful smaller attempt was **32/32 PASS** and is preserved with its probe version. An initial harness attempt failed before executing cases because the captured compiler dependency `topic-game-model.ts` was omitted; the exact source was then added and pinned. That setup failure remains in raw-01 and is not attributed to product behavior.

Static server review retains the earlier startup-order observations: migrations precede family probes; approved compiled profile compatibility is mandatory; boot revocation and catalogue/lifecycle reconciliation precede listen. The runtime flag remains exact/strict and the current empty approved registry remains unavailable. No fixture approval or content was added.

The review also repaired only its own journal encoding after root's docs scan found three legacy PowerShell em-dash bytes. Original bytes and SHA-256 are retained in `journal-before-utf8-fix.bin`; only invalid legacy bytes were translated and the journal was rewritten as strict UTF-8. Existing immutable review reports were unchanged. A subsequent strict UTF-8 scan of all `.docs`/`.history` Markdown found no invalid files.

## Outstanding proof obligations

- Run the ordinary server factory/process with actual migrations, cold/default/closed/unapproved profiles, feature-off recovery and incompatible/missing authority negatives.
- Exercise real ordinary websocket cookies/tickets/generation and heartbeat during feature-off, early source loss and late child source-fence failure; keep parent auth/lifecycle failures denied.
- Start from already displayed private/public content, then withdraw or lose its source. Dropping new frames does not itself prove old client content clears within the required lease. Test browser leases/clear signals and unchanged-room-revision outages explicitly.
- Execute old-volume upgrade and restore/recovery drills without recreating missing authority; finish full frozen-source quality/CI, semantic-family and browser gates.

These remain OPEN and are not inherited from prior Games or TLC component results. Human review450 remains HOLD. No production/DNS/TLS/device proof is claimed. Round01 remains immutable with all original findings/failures.

Evidence index: [round02 index](runtime-wiring-round02/index.json). Journal: [reviewer journal](../../../../.history/agents/2026-10-19-p05-topic-games-review.md).
