# P05 server/runtime wiring — independent static preflight round 01

Result: **CHANGES_REQUESTED**. Three P2 findings: RW-001, RW-002 and RW-003. Scope is individually captured source files on a dirty tree; no global freeze, Docker runtime, full P05 or production acceptance is claimed.

Exact inputs: [21 per-file hashes](runtime-wiring-round01/pins.json), [design and next proof obligations](runtime-wiring-round01/DESIGN.md). Server SHA-256 `726268af1a41b56b7f0119f7fd915a3b9ca07241236e9c490b64c3572b0ce492`; compose SHA-256 `a7ac3709c2df8b37fe650afa4005519dab461e46487abbfd874cc6cee92eea60`; Topic Games SHA-256 `8154111ff8a85923c315c183fd4f3a1c9b547da4c8a025baaa3c407ae2832b83`. Later concurrent changes are not these reviewed bytes.

## RW-001 — P2 — ordinary compose cannot forward the required catalogue ledger path

Location: captured `infra/venus/compose.yml:9–20`, combined with `apps/api/src/server.ts:51–57`.

Compose forwards the topic enablement flag but does not forward `CATALOG_REVOCATION_LEDGER_FILE` into the application container. A host environment value is not implicitly inherited by that service's explicit environment map. Server assembly requires a configured catalogue and revocation ledger whenever it loads a topic profile, including existing protocol2 rooms with feature off. Thus the supported ordinary compose path cannot configure that dependency and cannot complete enabled/recovery startup once an approved compatible profile is present.

Observed scope: static configuration/control-flow defect. Default feature-off with no protocol2 rooms remains valid. The current empty approved registry may fail earlier with `TOPIC_RELEASE_PROFILE_REQUIRED`; this finding does not authorize bypassing that HOLD. Missing ledger remains fail closed; no disclosure is demonstrated.

Correction: explicitly forward an optional configured path to a genuinely provisioned ledger on protected host state, with an actionable documented provisioning/upgrade procedure. Never create an empty replacement automatically when an old ledger is missing. The existing `venus-state` volume is separate from PostgreSQL's volume and can provide this DB-restore boundary; adding a third volume is not intrinsically required. An operator must provision new directories on an older existing state volume explicitly; the Dockerfile's fresh-image directories do not by themselves establish old-volume upgrade readiness.

## RW-002 — P2 — feature-off retained games terminate basic room websocket transport

Location: captured `apps/api/src/topic-games.ts:190,218` (`publicDelivery`, `socketView`); `apps/api/src/rooms.ts` (`socketState`); `apps/api/src/room-routes.ts` initial/ticker websocket catch.

Server correctly instantiates Topic Games with `enabled:false` when a compatible existing protocol2 room needs recovery. However, `socketView()` reads `loaded()` for an active retained game; for paused/completed games it eventually calls `view()`. Both paths invoke `source()`, which throws `TOPIC_GAMES_DISABLED`. `publicDelivery()` likewise calls the source-dependent view. `Rooms.socketState()` awaits this child hook, and the ordinary websocket route closes the entire connection with 4401 on the propagated exception. Feature-off therefore disables basic room presence/heartbeat transport rather than only private content/new starts. Source-independent safety HTTP methods still exist; this is not a claim that Stop grants unsafe content.

Independent direct-method reproduction: exact captured Topic Games source is transpiled locally, with explicit SQL rows/doubles. Active, paused and completed retained games each cause `socketView()` to throw `TOPIC_GAMES_DISABLED`; paused `publicDelivery()` also throws. Desired generic/null room projection assertions fail. The ordinary source-denial control passes. **1 PASS / 4 FAIL**, exit 1. [Probe](runtime-wiring-round01/probe.mjs), [raw output](runtime-wiring-round01/probe-raw-01.txt). This establishes the method failure and static production route consequence; a real websocket closure was not executed in this preflight.

Correction: explicit early generic/null game and no private references for disabled room projection hooks, including prepared private delivery. Keep ordinary content/prepare/start HTTP routes denied. Preserve all parent authentication/lifecycle/final enqueue fences. This narrow correction does not close RW-003.

## RW-003 — P2 — expected catalogue source outage still terminates ordinary room transport

Same projection and route call chain as RW-002, but `enabled:true` and the provider returns the production-normalized `DomainError(CATALOG_LEDGER_UNAVAILABLE)`. Independent captured-source probes for active/paused/completed retained games each propagate that error from `socketView()`. The supporting suite is **1 PASS / 7 FAIL**, exit 1: four original feature-off failures plus three catalogue-outage failures. [Expanded raw output](runtime-wiring-round01/probe-raw-02.txt). The provider exception is an explicit double; a real catalogue file or websocket was not used here.

This is a separate serving-recovery requirement: the feature-off early return does not handle an enabled service's expected catalogue outage. Degrade only classified expected content errors at room projection/transport boundaries while denying content and preserving auth/authority checks. Do not catch arbitrary errors around `Rooms.socketState()` or suppress authentication, lifecycle authority, personal safety corruption, PostgreSQL failures, malformed history/snapshots or unknown engine errors. A source failure arising later in the exact returned Symbol fence also needs its own final-enqueue proof; it has not been experimentally reproduced in this round.

Production `Catalog.readLedger()` and `ReleaseTopicGameSource.assertCurrent()` already wrap ledger filesystem/CatalogError failures as `DomainError(CATALOG_LEDGER_UNAVAILABLE)`. Expected source failures should be normalized at that source boundary and allowlisted by code. A broad `catch(Error)` in the room path would mask unrelated safety/authority failures. Retest disabled, withdrawn and unavailable-source cases along with explicit negative authority/auth controls and actual ordinary websocket behavior.

## Other static observations and limits

Migration order is base → games → catalog → chat → private topics, preserving immutable additive migration hashes. The compiled release profile requires matching taxonomy and topic vocabulary across retained bundles. Startup runs V2 boot revocation, catalogue reconciliation, legacy public-pair reconciliation and room recovery before application listen. Legacy maintenance uses a protocol1 predicate; the ordinary V1 route plugin rejects protocol2 before legacy AAD decoding. The immutable room dispatcher selects V2 even when disabled rather than falling back to V1.

These are reviewed control-flow properties, not executed startup/restore proof. The profile registry remains empty until real owner approval. Full cold launch, old-volume upgrade, feature-off recovery, missing-authority refusal, restore/revocation and final source-bound runtime/browser gates remain required. Root is correcting findings; this report intentionally records the original failures, not later fixes.

Reviewer journal: [p05-topic-games-review](../../../../.history/agents/2026-10-19-p05-topic-games-review.md). No included product edits and no Docker operations were performed for this review.
