# P03 · independent implementation review · round 2

Reviewer: `/root/p03_implementation_review`. Date: 2026-10-18. Status after repeat verification: **REPORTED CORRECTIONS VERIFIED / PRE-FREEZE; NOT EXIT-P03 PASS**. Open implementation findings from this round: **0**. HEAD at review: `c653a260993743971d436e8a2793b8a5d222a63a`; runtime changes are uncommitted and mutable. This report does not certify a final source identity, PostgreSQL run, statistical result or production readiness.

Read scope: implementation-plan P03, normative Relationship Engine and implementation CONTRACTS, ADR-015, P03_DEVELOPMENT, both preliminary round-1 reports, production consent/pack/selector, Games service/model/routes, room dispatch hooks, Games SQL/migrations, current unit and integration-test sources. No production source was edited. With explicit parent authorization, this reviewer added only the permanent unit regression `apps/api/src/games-delivery.test.ts` and this report. Docker was not used.

## Findings retained with original reproduction and resolution

### P03-IMPL-01 · P2 · CLOSED · private Yes, But drops the reviewed responder instruction

`Games.promptView` calls `localText`, which selects only `card.text[locale].proposal` for Yes, But. `PrivatePrompt` has no separate responder field, and `publicRound` intentionally returns generic state for a private round. Consequently `card.text[locale].responder` never reaches either private actor through HTTP or WS. The public Yes, But projection does render both fields. A reviewed responder instruction explaining the recipient's yes/condition/decline options, including its actor placeholders, is lost precisely on the private path.

Preserve the existing strict PrivatePrompt contract by rendering proposal and responder into its bounded prompt, or define and validate another explicit actor-only projection. Apply the one-pass role substitution to both fields. Add a private Yes, But regression with distinct responder content and P1/P2 tokens; assert HTTP and WS actor delivery and absence from public projection. The current combined Yes, But admission budget already reserves both fields, so preserving both is compatible with that design.

### P03-IMPL-02 · P2 · CLOSED · invitation/action request deadline can pass during dispatch reads

`Games.privateDelivery` checks `reconcileConsent(offer, this.now)` before awaiting `snapshot` and `names`. It later constructs invitation/action request payloads using `invitationView` or `actionView`, neither of which checks the current deadline. A pending offer can expire during those database reads and still be returned for synchronous enqueue. Prompt rendering checks `consentAllows` again near return, and the condition branch also performs a later consent check; this specific reproduction concerns the stale request metadata, not disclosure of a private prompt after its expiration.

Reproduced against actual compiled `Games.privateDelivery` using in-memory query/service stubs, without Docker or DB mutation: invitation created at0, deadline2000, initial clock1000; the awaited `names` stub moves clock to2000. The method returns `type=game.consent_requested`, `expires_at=1970-01-01T00:00:02.000Z` while the dispatch clock is exactly2000. Add a final no-await deadline/current permission check before return/enqueue for every private event kind and a deterministic boundary regression that advances the server clock during the awaited read.

Repeat verification: the implementer added `privateText`, preserving proposal plus the separately substituted responder instruction, and changed `Games.promptView` to use it. The new private Yes, But renderer regression passes, including literal braces within a participant name. The implementer also added a final `reconcileConsent` deadline check after every awaited read and directly before returning the prepared event. Repeating the same compiled microprobe now returns only `game.private_cleared` for invitation and action at the exact deadline.

This reviewer added eight permanent Vitest cases against the actual source `Games.privateDelivery`: invitation and action remain available at deadline minus1; both become clear at the exact deadline and after it when the clock advances during the awaited names read; a reference predating the current game revision cannot reconstruct its old body; and a terminal round cannot reconstruct it even if its reference revision matches. The adapters stub persistence only; the dispatch permission/view logic is the actual implementation. These unit boundaries complement the separate real-PostgreSQL serialization/barrier suite.

## Confirmed corrections and useful properties

- SEC-01 lower-time-bound correction: encrypted offers preserve `created_at`, `last_ack_at`, `activated_at`; permission fails closed before final acknowledgement, including legacy offers missing timestamps. Accept and condition replacement reject backwards times; late safety refusal remains available.
- SEC-02 render-budget correction: admission accounts for the full192-codepoint name bound, UTF-8, escaped JSON, both simultaneous Yes, But fields and both alternative Truth/Dare sides. Oversized valid templates are rejected before play rather than truncated. One-pass substitution preserves braces inside participant names as text.
- Q-04 finish alias correction: `response kind=finish` delegates to the same `game_finish` operation; operation/resource/member scope and normalized request body now match the dedicated finish form. A deliberately changed optional body remains a distinct request and must conflict.
- SEC-03 dispatch-fence correction: the old prepared plaintext bundle is replaced by references. `Rooms.dispatchPrivate` holds the same room lock as revocation, rechecks current socket generation/session/acceptance, reconstructs from current encrypted state, and invokes the synchronous enqueue callback before releasing the lock. A previously committed revoke converts the stale reference to a targeted clear.
- SEC-04 old-recipient correction: socket selection includes the member's old-round references; a stale current revision/round is projected as `game.private_cleared`, rather than silently dropping it because the member is absent from the next pair. Real DB barrier/cross-round tests remain required; source inspection alone is not transport evidence.
- Mutation authorization precedes idempotency replay. Host, game participant, round actor and primary/secondary role checks are distinct; cross-room SQL scope is included. Safety skip/stop do not call snapshot validation; no raw preferences or condition text enters public projections or reference-only outbox rows.
- Deferred SQL consent constraints enforce exactly two actor rows in one room/session/round/scope; selected participants can only be inserted while waiting, actor identity updates are forbidden, and room/session/member FK chains prevent substitution across rooms.

## Executed checks and remaining obligations

Initial command: `npm test -- packages/relationship-engine/src/consent.test.ts packages/relationship-engine/src/engine.test.ts apps/api/src/games-model.test.ts`, Node24.22.0, Vitest5.0.5: **3 files / 15 tests PASS**, duration760ms. The initial dispatch microprobe failed as described; it is retained above rather than hidden by the later correction.

Repeat command including `apps/api/src/games-delivery.test.ts` and the same three test files: **4 files / 24 tests PASS**, duration984ms. This covers the new private renderer, all eight independent dispatch boundary cases, consent lower bounds and render budgets. Targeted ESLint for the new regression file passed. No final acceptance or production-content claim follows from this unit result.

Review does not substitute for the parallel real PostgreSQL/HTTPS/WS suite, both finish-alias retry directions, authorization after role/membership revocation, expiry reconciliation commit/rollback boundaries, unknown pinned-version safety operations, actual rollback/restore, or the preregistered 70000-session/fairness/inference evidence. Final review must bind exact clean source and evidence and rerun after corrections. Human content approval P04 and approved actual offer/public entry P05 remain outside this technical review.

Observed mutable source SHA256:

| File | SHA256 |
| --- | --- |
| apps/api/src/games.ts | `70f267e6143f6b0edd70b357b5b74a44d703849fe678437c49f26a15a7267c3f` |
| apps/api/src/rooms.ts | `76e9a46761b0ca1060b72dc7916203fc889a63863d00e2baa9a3d4f0c3f9920b` |
| apps/api/src/games-model.ts | `ba830dce8eacf280aeaec59467e6a12d8e4b2ce147f4ef0206783b207f395f97` |
| packages/relationship-engine/src/consent.ts | `f8e27f79971458a29dea756f2d2852e2339c51400445773f3baaf2661186e463` |
| packages/relationship-engine/src/pack.ts | `2b9ab9ee6062b668020cd19642991f826431d3129842797b68ef0b9fe61aa1d9` |
