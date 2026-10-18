# P03 · engine runtime and review boundary

Current state: IMPLEMENTING. An implementation checkpoint or successful unit run is not EXIT-P03 acceptance. Final acceptance requires a clean source identity, real PostgreSQL/HTTP/WS tests, preregistered statistical results, protected CI and independent source-bound reviews. P02 is accepted at `p02-accepted-20261018` (`12a028b174cc03a4a8ea1398f321d23c6a4c6e98`).

## Runtime contracts

P00 inputs remain immutable. Additions are specified by `contracts/p03.events.schema.json` and `contracts/p03.additions.openapi.json`; the latter adds a host-only abort command without broadening the baseline participant-only stop command. Room schema generation remains1. The separate Games schema generation1 has its own migration checksums, lock and readiness probe; both streams must be ready.

`POST game/prepare` creates a host-controlled draft. `POST game/start` atomically checks every selected player’s online membership, explicit setup and current offer acceptance, pins the actual reviewed pack and policy/algorithm revisions, freezes the private directed preferences, and selects the first round. All rounds use that encrypted snapshot; display names and locale are live rendering data. Changing context or preferences while active/paused returns409 `GAME_SETTINGS_LOCKED`; neutral setup skip affects only future games. Spectator joins, locale changes and provider/catalog updates do not mutate the running snapshot.

Production has no reviewed catalogue provider at P03, so preparation fails closed with503 `PACK_UNAVAILABLE`. Synthetic draft cards are explicitly restricted to the integration server and statistical fixtures. Online private rounds require `private_text_chat`; production snapshots omit that capability until the real P05 channel is implemented. Simulation capability does not enable a product feature.

Host authorization, selected participant authorization and round actor authorization are distinct and checked before idempotency replay. A host who is not an actor cannot read a private invitation, prompt, action consent or pair condition. Both finish endpoint forms normalize into the same scoped operation. Consent timestamps are server-owned, and access requires the current time to be at or after the final acknowledgement and strictly before expiration. Safety decline/stop remains available with stale revisions or changed offer acceptance.

Card admission bounds the worst expansion of192-codepoint display names, UTF-8 and escaped JSON before a game can start. Text is not silently truncated. Substitution is one pass; braces within a display name remain literal text. TruthOrDare hides both sides until the primary actor chooses; only the chosen side is rendered. Public private-round projections contain generic state without private card IDs or actors.

## Private delivery and cleanup

The outbox stores references and target member identities, never prompt/condition text. `socketState` returns reference candidates. Immediately before WebSocket enqueue, `dispatchPrivate` rechecks the current authenticated socket generation, offer acceptance, room state, exact game/round revision, actor scope and deadlines while holding the room transaction lock used by revoke operations. It reconstructs payloads from committed encrypted state. The synchronous enqueue occurs before releasing that lock; an earlier committed decline cannot be followed by a stale prompt enqueue. No state mutation or new consent is performed in this dispatch transaction.

Stale references become targeted `game.private_cleared`, including when a round finishes and advances to another pair between ticker iterations. A P05 consumer must clear its previous private display on disconnect, a different session/round, a terminal public round, stop/pause or targeted clear. A new authorized prompt may then replace it. Already delivered information cannot be erased from another participant’s memory; expiry controls subsequent authorized access.

Public `game.snapshot.stream_rev` follows the room revision; nested `game_rev` is the current game’s optimistic concurrency revision. Private stream revisions are monotonic per room/member, including across games. A dropped/pruned reference is not permission to reconstruct older private content. The outbox retains the existing global count/byte/age bounds.

## Recovery and rollback

The Games migration is additive and does not rewrite accepted P02 core migration001. Before running the accepted P02 image, stop new Games commands and invoke the trusted local `Games.quiesce()` operation. It serializes each affected room, aborts waiting/active/paused games, clears their snapshot and round/consent/outbox data, and writes a metadata-only audit event. There is no consumer HTTP quiesce endpoint. Verify that no active Games state remains before switching images; preserve the core room identities and private preference ciphertext. Do not revive prior consent when returning to P03.

Room close purges game sessions and private stream state in the same revoke flow. External deletion-ledger reconciliation remains required after restoring a backup. Runtime shutdown terminates sockets and awaits disconnect reconciliation; a fresh connection cannot be marked offline by a stale generation’s callback.

Compatibility limitation discovered in the accepted P02 runtime: its default production offer provider is unavailable, and its host-close path checks that provider. Therefore that old image correctly rejects new entry but also returns503 for host close without an offer; guest leave remains available. P03 treats authenticated host close as a safety operation independent of offer availability. The rollback exercise must record the old default503 explicitly and distinguish any synthetic test bootstrap used to verify old close against the upgraded schema. It cannot claim that a synthetic offer is approved for public use.

## Measurements

The original P03-M1 preregistration is retained at `p03-m1-preregistered-20261018`. Independent pre-freeze findings require P03-M2 before the first statistical run. Its source is `implementation/p03-measurement-protocol-v2.json`; the source checkpoint, exact runner, fixture and policy bytes are pinned before measuring. Report every declared stratum, raw counts, seed ranges, safe refusals and failed attempts. Passing a fixed linear inference probe is limited evidence for the declared compatible profiles; it is not universal social privacy proof.

The work journal is `.history/2026-10-18-p03.md`. Preliminary reviews in `implementation/reviews/p03/` remain available after fixes. Production content approval belongs to P04 and the actual offer/public end-to-end entry belongs to P05; synthetic tests cannot satisfy either approval.
