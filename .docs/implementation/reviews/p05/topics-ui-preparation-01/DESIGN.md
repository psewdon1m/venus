# P05 frontend V2 checkpoint — design / not implementation proof

Owner: /root/p05_topics_ui. Start 2026-10-19T20:36:07+03:00. Own web API/room-shell/game panel/new topic helpers/tests and additive RU/EN/TR strings; requested main.tsx ownership for explicit capability-selected room creation. No API server/contracts/infra/manifests. No browser/Docker without root coordination.

## Contract and implementation approach

- Keep historical GamesPanel V1 unchanged behind authenticated immutable per-room protocol resource. Never infer/downgrade V1 from V2 HTTP failure. Loading/error displays localized generic status and permits explicit retry.
- New room path follows explicit runtime capabilities; failure aborts creation, never retries another protocol. SessionApi recognizes CSRF for both prefixes.
- A separate TopicGamesPanel uses real V2 receipts, current/availability/target/self-actions/conversation/commands/chat routes. Prepare re-reads RoomView and validates selected readiness with freshPreparation, adapting only its valid intent fields to V2 request shape.
- Reuse OwnControls with explicit protocol-aware validation for booleans; no host inference for per-round actions, only host-only setup visibility. Self-actions relative lease remains bounded; minimal authenticated refusal facts contain no text/partner/accept permission.
- New scope/cache helper fences identity/transport/session/round/read generation, monotonic game/content/epoch/revision; stale HTTP responses cannot restore cleared private prompt, advice or chat. Clear synchronously on mutation/withdrawal/new epoch/frame/offline/visibility. Local presentation deadlines derive server-relative remaining duration at request start and monotonic local time, capped to backend TTL; target deadlines use fresh own server time. Accepted same epoch reads cannot extend original known deadline.
- Own topic settings have empty defaults, only explicit allowed boxes, permanent room-local exclusion separate from allow/save; removed previously allowed topics require permanent exclusion and an explicit warning. Vocabulary labels come from pinned authenticated taxonomy resource, never source IDs shown to users. Lists are own only.
- Private full union labels shown before exact bilateral topic acceptance. New topic or other question invalidates old text/advice/chat locally before HTTP. Advice receiver sees generic opt-in until accepted; sender edits replace_id with fresh consent, revocation clears text first. Epoch-scoped free chat online only.
- Preserve public/private quiet invitation, primary TD choice, secondary YB condition, independent action accept, own finish/skip/pause/stop/abort/neutral-reset. Condition edits clear old consent content immediately.
- RU/EN/TR consumer copy, accessible forms, existing responsive panel CSS. No protocol/debug/token labels in UI.

## API gaps / coordination

- Root promises runtime capabilities and authenticated pinned topic taxonomy. Existing per-room protocol is implemented. TopicRoundTarget has no server_time; anchor to current authenticated self-actions clock lease, never absolute client/server comparison. Conversation has own server_time.
- Availability V2 has planned_rounds rather than available boolean. Treat sufficient only when planned_rounds equals requested and exact draft_rev matches current waiting game.
- V2 mutations use request_id, not legacy idempotency_key, and prepare receipt is followed by explicit /current read.
- Backend commands have exact shapes: do not add optional expected_rev where exact operation rejects it. All request IDs retained for explicit same-scope retry; clears destroy private callbacks.

## Validation planned

Focused Vitest: protocol/CSRF/no fallback, V2 self-actions roles, stale generation/ABA/epoch, full-union validation, advice opt-in, server clock skew/expiry, own topics monotonic exclude, RU/EN/TR parity. Typecheck/lint/web build after valid checkpoints. Parent later actual Docker browser integration and independent author-disjoint gate. This checkpoint is not a PASS or content approval.
