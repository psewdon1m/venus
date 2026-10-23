# METHOD15 actual browser failure: independent diagnosis

**Producer preparation deadline exhausted; no second-action product failure proved.**
Actual Chromium slice has01–04 PASS,05 FAIL,06–16 NOT_RUN and cleanup PASS.
Source before/after is1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad;
actual rebuilt image is sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f.
This is a historical exact-source diagnostic, not the current complete stage gate.
No Docker or browser rerun was performed for this diagnosis. Original producer,
actual outputs, frozen stats packet and production source are unchanged.

The last_control RU action-accept is the **last successful click**, not the actor
whose subsequent preparation failed. RU has one exact action accept request at
79214.571670ms, receipt200 and game_rev31. The shared action phase records RU as
its only completed actor. Its second normalPrivateReady call is for TR, starting
79843.189701ms; no second action request was dispatched and no HTTP409 is reached.
At failure, actual fixture remains active/pending private round13, all three live
WebSockets are present, RU shows own acceptance received/disabled, and TR has
accept_action=true with its action-accept visible/enabled. No page error or final
diagnostic overflow/pending work is recorded.

## Actual observed timing

The producer gives both actor preparations, exact clicks/receipts and the final
coherence check one absolute8s phase:77474.295468→85474.295468ms.

| Observation | Native monotonic milliseconds |
|---|---:|
| RU preparation ready |79164.342486|
| RU action request observed |79214.571670|
| TR preparation begins |79843.189701|
| TR mixed cycle60: current30 read begins |78853.667154|
| TR cycle60 self-actions31 begins |79419.590748|
| TR receives actual game.snapshot31 |80699.599270|
| TR fresh cycle61 current31 begins / body observed |81856.254954 /82691.591…|
| TR cycle61 self-actions31 begins / body observed |82685.759083 /83217.749…|
| TR cycle61 target31 body observed |83734.678…|
| TR cycle61 active conversation31 body observed |84654.904…|
| Shared producer deadline |85474.295468|
| TR cycle61 required active chat body observed |85552.868576|

Full precision/raw metadata is in TIMELINE.json. The last chat body observation is
78.573108ms after the deadline. The code requires a matching complete current/own/
target/conversation batch and, when conversation is active, its chat. It rejects the
earlier current30/private31 mixture and invalidates on the new game WebSocket
revision. Source topic-games-panel performs serial current→self-actions→target→
conversation→conditional chat; it prevents overlapping sync work and schedules
polling at1500ms. The observed read chain and revision transition explain the
budget pressure without treating enabled DOM as sufficient authority.

## Certainty and missing evidence

The actual thrown error is OBSERVER_READY_DEADLINE, at requireReady inside the
second action preparation. The failed preparation has last_snapshot=null because
requireReady throws before normalPrivateReady assigns its return value to last.
The thrown error already contains a sanitized readiness snapshot, but the caller
does not preserve it. Preparation rows also omit member/locale/expected scope.

Therefore the exact final observer reason/cycle/parts cannot be certified from the
archived failed row. Delivery diagnostics read JSON separately from the private
batch observer's body read; their completion timestamp is not the latter's finish
or the application's cache.accept timestamp. The late coherent-chat metadata is
strong evidence for an insufficient producer phase budget; it is not a conclusive
measurement of React acceptance or a proof that the product could have clicked
successfully78ms later. A pending body, scope invalidation, DOM work or lease check
may distinguish the final reason. Do not classify this as a product authorization
bug or claim later scenarios passed. Performance under the actual CPU/transport
profile may warrant separate investigation if fresh bounded runs keep failing.

## Minimal next method change and controls

1. Preserve sanitized error.readiness in the FAILED preparation row, and record
   member/locale/expected tuple plus fixed phase and completion timestamps before
   calling requireReady. Preserve the original exception and failed run. The
   observer snapshot has no private prompt/token/advice content; do not dump DTOs.
2. A narrowly scoped METHOD16 may preregister **one common12s bilateral-action
   preparation phase** in place of8s, justified by this observed8.078s positive
   serial-delivery path plus explicit bounded margin. This remains a producer
   scheduling limit, not an extension of any product permission/consent expiry.
   Keep exact original actor order, latest receipt minRev, one click/POST per
   actor, same fixture/seed, required chat/coherent scope, min lease250ms and
   ticket deadline=min(phase deadline,current actual observed lease). No per-actor
   deadline reset, selection retry, automatic click retry or partial-consent retry.
3. Independently review the exact new helper/diagnostic bytes and rebind the full
   runtime/image/rootACK. Run a fresh owned fixture once with the ordinary cleanup
   and retain failure if it exceeds12s or any lease. A larger method deadline
   alone proves no success. If timeout recurs, use the new exact failing readiness
   evidence to choose product-vs-producer work; do not successively widen limits.

Five new independent finite controls import the exact actual observer03 with its
source-pinned production validators/TopicCache. All transport, DOM and DTOs are
explicitly inert synthetic controls, not reconstructed private responses:

- A coherent cycle with actual-like timestamps is incomplete without active chat
  at the original deadline; after chat, its5s own permission still has~2132.89ms.
- current30/private31 cannot authorize the action.
- A longer producer phase cannot extend the unchanged5s permission.
- An enabled DOM cannot override accept_action=false.
- A closed WebSocket cannot become ready through extra method time.

All five pass. These verify the proposed distinction and safety boundaries, not
runtime success. Existing4PASS/1FAIL/11NOT_RUN and human content HOLD remain.
