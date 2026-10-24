# Topic Games V2 author handoff

Status: WRITES_PAUSED. Fresh independent gate pending. No full P05 acceptance claim.

## Exact accepted component attempt

- Root process handle 33748: terminal exit 0; project `venus-topic-games-0c4bc5086318`; exactly 18 unique actual PASS checks; runtime cleanup verified.
- Included source before/after: `62b9d73a1e72a63aaf44fa26c98b8219e21c79f43a82f7dfc908cf29ac1d955b`.
- Image: `sha256:6f2c41b444f2789c99989a41c6228e5771654a5a307a58a675564c8a0f1059f6`.
- Root immutable archive: `.docs/implementation/evidence/p05/topic-games-preflight-04/`. Full archive/index identities are in root receipts.
- Earlier failures `8ac4c90b437c`, `a97cbae045bc` and prior core11 PASS `557b596917d1` preserved independently.
- Scoped author model/display tests 16/16 PASS; typecheck, scoped ESLint, Node syntax and build exit 0 on this checkpoint.

## Owned implementation

`apps/api/src/topic-games.ts`, `topic-game-model.ts`, `topic-game-routes.ts` and tests; `packages/contracts/src/topic-games.ts` plus additive export; explicit production planner/conversation exports in relationship-engine index. New isolated actual producer under `tests/p05-topic-games/`.

- Real V2 TopicSnapshot/planner/history pipeline for all three modes, quiet bilateral public/private rounds, TD choice lock, YB condition revision, targeted topic replacement and current-topic exclusion, structured advice opt-in/edit/revoke, epoch-scoped private chat, replay with authenticated runtime prior.
- AEAD AAD2 schema codecs only, encrypted bounded multi-chunk objects, real 100-round history beyond one padded ciphertext. No legacy RoundPlan or fake history/card identifiers.
- Exact request idempotency, current actor ACL, authoritative POSTs, retained own safety controls independent of normal source health, committed kernel error/clock floors, source/safety/selected-presence/auth/TTL delivery fences attached to exact returned values via non-JSON gameDeliveryFence symbol.
- Waiting draft reprepare/cancel, own-pair public condition transport, old finish/content revision denial; per-recipient stream revision and one latest prepared ref per actor.
- `bootGate()` clears ephemeral private state and acknowledgments and stops pair rounds before listener/admission; retained immutable history and exclusions. `purge()` cascades shared game_sessions. `withdrawPacks(c,digests)` aborts every affected P2 session without source/safety reads and locks rooms before game rows.

## Migration and composition requirements

- Migration 002 is immutable: `b6c799ccb4ec98f8eb442ceb32a600a73b6949f48697185e55841448cef16411`.
- New 003: `02aca5734831bae2d139f888c9cbb637c578703f28daa086fd1e954d6042c414`; clears transient refs and adds unique recipient stream revisions. Parent migration generation/probe now 3.
- Run migration then `await topicGames.bootGate()` before listen/admission. Barrier is source-independent; failure prevents startup.
- Pack withdrawal caller must hold exclusive catalogue transaction; method does ordered room locks itself. Room close must call actual purge hook.
- Protocol 2 exclusively selects this backend and versioned transport. V1 readers remain unavailable to P2, including feature-off. Default/unapproved source cannot start V2.
- Source hooks active/pinned/assertCurrent; safety hooks read/excludeLocked(actual Auth, exact observed state)/assertCurrent(exact provider object). Exclusion callback reloads game/round/conversation and fresh safety in same transaction. No nested preference transaction.

## Actual scope of new checks 12–18

Waiting reprepare/cancel; public own-pair condition and stale revision; 111 real HTTP polls and bounded recipient refs; real WebSocket bytes over an explicit fixture adapter using production Rooms ticket/generation/dispatch (not the production websocket route); final credential SQL blocked in real PostgreSQL with observed advisory wait then session expiry/HTTP401; distinct Node worker startup boot gate; source-independent pack withdrawal and shared-base purge. Previous 1–11 include real migrations, three modes, 100 rounds, bilateral quietness, advice/chat, TD/YB, targeted topics/exclusion, runtime prior, safety and clock floor.

## Explicit remaining acceptance gaps

Fresh independent source review and correction/retest loop; root real registry/provider/lifecycle/restore composition; production websocket route and browser V2 UX; dedicated actual cross-mode semantic-family canary (current actual prior test preserves genuine records with identity-only families); final root app feature-off/unapproved-map negatives. External source/safety/lifecycle in this producer are declared synthetic fixture seams. Component PASS does not establish full backend/stage/production acceptance.

Journal: `.history/agents/2026-10-19-p05-topic-games.md`.
