# P05 Topic Games V2 — independent review, round 02

Result: **COMPONENT_PREFLIGHT_PASS** on the frozen source below. **TG-REV-001 is CLOSED in this component scope.** This does not accept the complete P05 stage, human catalogue content, production deployment or later edits to the live checkout.

Source identity: `38a117dbd52dc3e6a5e3db8f42bf524a0bd097b0d595be302631c1ede94b8aaa`; immutable image `sha256:3192b2d46772ea434977ef918bdd81775f5fb459fea1a8080c596d082907bc94`; source ZIP `643cd731566b293abd2192fce4cf87be08f4d33d8bc7b88e8a11b7f09671276e`. Backend `topic-games.ts` SHA-256: `8154111ff8a85923c315c183fd4f3a1c9b547da4c8a025baaa3c407ae2832b83`. [Twelve exact source pins](topic-games-round02/pins.json) are copied from that archive and independently checked against the runtime image.

## Correction and independent retest

`mutation()` now fingerprints `{input,operation,scope:target}`. Round operations provide `{sessionId,roundId}`; session operations provide `{sessionId}`; prepare/start provide the room-level scope, while the SQL primary key still binds room/member/request ID. Chat additionally authenticates its conversation ID and epoch as part of the full input. All 13 public mutation entrypoint variants independently forwarded the expected structured scope in executable probes.

The original public HTTP wrong-round and wrong-session reproducer was rerun unchanged against actual PostgreSQL and the frozen new image: **5/5 PASS**, terminal 0. Wrong-round and wrong-session each returned **HTTP 409**, without the earlier receipt; same-scope replay remained HTTP 200 with the original receipt, and changed body conflicted.

A separate strengthened run retained those cases and required the exact `IDEMPOTENCY_CONFLICT` code and unchanged hashes of every persisted game/round/sidecar/chunk/reference/request row after denied replays: **5/5 PASS**, terminal 0. This proves rejection and unchanged persisted state for the named actual SQL/HTTP cases; it does not claim a previously demonstrated second consent grant.

Historical body-only request fingerprints fail closed on the exact original URL. This is deliberate compatibility behavior: they are not silently reinterpreted as scoped receipts. Exact new scoped replay still revalidates the current credential; expired credentials cannot redeem a stored receipt. No new migration or rewrite of immutable 002 was needed.

## Evidence

- Independent final Linux/Node backend boundary suite: **51/51 PASS**, exit 0, no skips. An initial smaller round02 attempt was **37/37 PASS** and is retained. The private helper calls were adapted only for the new explicit target parameter. Public URL regression controls still call public backend methods/routes. Coverage includes exact/body/operation/old-unbound idempotency; all 13 scope-forwarding variants; final auth and exact non-JSON value fences; rollback of grants versus committed tagged errors/clock floors; source-independent Stop/Pause/Abort and round refusals; host/participant/actor ACL; late selected-member presence/session/offer expiry; bounded 16KiB chunks, UTF-8 object roundtrip and authenticated metadata/AAD corruption.
- Actual PostgreSQL/HTTP unchanged reproducer: [project `venus-topic-games-review-7aaa24c336c3`](topic-games-round02/runtime/venus-topic-games-review-7aaa24c336c3/topic-games-report.json), **5/5 PASS**; raw output explicitly records both 409 statuses.
- Actual PostgreSQL/HTTP stricter state-preservation run: [project `venus-topic-games-review-5823d26db416`](topic-games-round02/runtime/venus-topic-games-review-5823d26db416/topic-games-report.json), **5/5 PASS**. New assertions compare persisted row hashes without logging plaintext or credentials.
- Root 20-case evidence: independently verified all **19 indexed files**, **1785 source ZIP entries**, before/after file-map equality, recomputed source identity and exact **20 unique PASS IDs**. TG19/20 cover real HTTP cross-session/round/body/operation conflicts and unchanged state, plus exact retries. The reviewer did not rerun the entire root 20-case producer and does not count its cases as 20 new independent tests.
- Both actual projects terminated with exit 0 and cleanup completed. Fresh ownership-label queries confirm no retained project containers/networks/volumes; standalone Node probe containers auto-removed. The root proof likewise records no resources remaining.

All runtime tests used the immutable image and copied review producers. No live source bind or image rebuild was used. Generic copied SQL runner metadata also records the concurrent checkout inventory; for the strict run it differs from the frozen image because root continued separate wiring work. That live inventory is not the executed backend identity and is not treated as source equivalence. The image/archive/pins above are the accepted component inputs.

## Remaining gates and limits

No further findings were identified in the reviewed component. Round01 remains immutable with its actual failures and original P2 report. This report closes only TG-REV-001 and the specified backend preflight scope.

The backend/model probes use explicit SQL/auth/source doubles where named; they do not establish actual transaction or filesystem durability. Both actual SQL producers preserve declared synthetic source, safety and lifecycle fixture seams. Root's separate current TLC16 real provider/lifecycle proof is outside this review's own execution scope and is not promoted by this report.

Full lifecycle/provider restore composition and its independent acceptance, ordinary production WebSocket route, browser V2 UX, dedicated actual cross-mode semantic-family canary, feature-off/unapproved-source app negatives, final clean-source quality/CI and the whole P05 gate remain outstanding requirements. Human review450 remains HOLD. No production/DNS/TLS/device acceptance is claimed.

Evidence index and exact source copies: [round02 directory](topic-games-round02/index.json). Reviewer journal: [p05-topic-games-review](../../../../.history/agents/2026-10-19-p05-topic-games-review.md).
