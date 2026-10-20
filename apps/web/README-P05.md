# P05 frontend implementation

This source implements Rooms and Games against the real authenticated API. It does not activate a fixture or unreviewed draft pack. An empty approved registry produces a visible localized unavailable notice; the isolated browser harness supplies test fixtures outside product startup.

## Flow and controls

- Existing explicit offer +18 admission and private directed preferences stay in force. Host sees only readiness, never another player's comfort or directed relations.
- Games setup selects mode, 2–8 member IDs and 1–100 rounds (20 default). Prepare and Start are separate server operations; availability is authoritative and is rechecked at Start. Retry retains the exact request object and identity.
- HTTP current state and strictly scoped WebSocket game snapshots drive the UI. Disconnect hides private content immediately; reconnection polls fresh state. No optimistic completion or automatic consent is shown.
- Questions, server-owned truth/dare choice and YesBut conditions use distinct controls. Only the secondary participant sees the condition editor. Current condition revision is shown before separate action consent; invitation consent never substitutes for action consent.
- Private invitation, prompt, action and condition are read through authenticated scoped HTTP projections. Exact session/round/recipient, revision, expiry, actor membership and chat sender membership are checked before rendering. Room host gets no special private access.
- Private text chat is only rendered with an active private prompt and server chat capability. Messages never fall back to a public channel. Text stays in component memory; no localStorage, analytics or logging. Revision changes, deadline, revoke, transport loss and unmount hide/purge data.
- Skip, decline, withdraw, pause and stop have a separate mutation path from ordinary pending requests. No reason field or scoring penalty is introduced; no actor is named as refusing. Stop is confirmed only by server response/current state.
- The explicit “End game and use neutral settings” safety action calls `/me/setup/skip` through the independent safety path with the authoritative own preferences revision and a fresh idempotency UUID. ADR-021 server atomically ends a current participant’s session and resets only that participant’s preferences; a spectator reset does not stop another player’s session. Ordinary no-CAS Stop remains separate and available if the neutral-reset revision conflicts. UI waits for actual server state; integrated browser acceptance of this new action is pending.
- Replay prepares a new draft with a new request UUID; a new explicit Start creates a server-owned seed. No consent is copied.

## Prepare freshness and explicit decisions

Prepare first reads the authenticated current room and uses that revision. It preserves the selected member IDs, mode, round count and request identity. A changed room context, changed membership, unavailable selected member or unfinished selected setup stops preparation before any POST and refreshes the room/game for a new explicit decision. The visible “Select current members” action resets selection only after a user click; departed IDs are never silently dropped. Draft review shows context and names; Start remains a separate explicit action.

A server revision conflict discards the stale retry and refreshes Rooms plus Games. A new click prepares against a fresh room with a new request key. An unknown network result instead retries the exact original POST body/key, so a possibly committed prepare cannot be duplicated by silently changing its revision. Error Refresh reads authoritative Rooms and Games and keeps subsequent failures visible.

## Delayed-response and retry fences

Every mutation attempt advances a read generation before sending its request. Pending `/current` and private projections from an earlier generation cannot publish state or issue further private reads. Prepare/availability continuation also checks the current operation and session; replaced known sessions are retired, and pre-prepare WebSocket room revisions cannot restore the old session. Same-session authoritative revisions and localized refreshes remain supported.

Retry state stores an opaque numeric ticket ID. Its revocable callback is held in one vault and binds room, authenticated member, session, round, consent scope, offer, proposal revision and exact deadline. A private retry rechecks all dimensions against current authenticated state before any HTTP request. Expiry has a deadline timer and a monotonic wall-clock guard; expiry/revoke/disconnect/auth/scope changes physically clear the callback and private input. Old retained DOM handlers cannot recover it. Safety requests continue through an independent lane and invalidate superseded reads/operations.

Game, availability and private caches carry internal authenticated identity envelopes. An imperative deny-first boundary is bound synchronously to the current render's room/member and transport; it performs no HTTP or React state update. Identity/transport changes immediately revoke old retry callbacks, before passive effects. Rendering checks the envelope itself, so the first new-identity tree contains neither old public game state nor old private JSX. Late reads and old DOM handlers check the same monotonic identity/transport tokens; switching away and back cannot revive a retired token. Public stale/safety state remains identity-bound during a transport interruption, while private state requires a fresh transport grant.

Independent round01 found a stale-session race and an expired-private-retry retention defect. Independent round02 then found a first-render identity-boundary defect; internal cache envelopes and synchronous authorization now address it. All original reports and failing reproductions are preserved. Author regression and affected unit checks are recorded separately; independent round02 and real-browser races are still required.

## Scope that requires further server/product work

This implementation alone does not close all extracted owner requirements. Quiet consent before a publicly addressed pair is being integrated in the server by the orchestrator using the same personal invitation UI; its end-to-end acceptance remains pending. Semantic exclusion scheduling needs engine/server enforcement. Topic allowlists before a private conversation, private topic changes and advice hidden until recipient permission have no current API contract. These requirements remain unimplemented until that contract and end-to-end evidence exist. UI copy and an optional skip are not proof of those behaviors.

Music is owner-deferred. Cinema and Calls remain visibly unavailable until their own implementations. Actual browser evidence, independent accessibility review and full stage acceptance are produced separately by the orchestrator; unit/type checks are dirty-source preflight only.

## Accessibility

Native labelled inputs, fieldsets, buttons and dialog retain keyboard behavior. Touch controls are at least44 CSS pixels. Text wraps under narrow layout/zoom; scrolling is allowed while scrollbar chrome is hidden. Reduced motion removes animation/transition. RU/EN/TR game copy is a strict three-column dictionary; server errors are mapped to local strings without interpolating raw private details.
