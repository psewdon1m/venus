```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"b5436cde02dd09aa049ce0103cab58d9642e8c70","source_identity_sha256":"8d25fd498980ef8ccdb244c3e416ca3d84401127222f736a191acab70e5394a4","scopes":["frontend_backend_role_alignment_code_audit"],"status":"CHANGES_REQUESTED","open_findings":["P05-ROLE-001","P05-ROLE-002"]}
```

# P05 independent role/completion audit — round01

**CHANGES_REQUESTED.** Two role/state control findings. This is read-only code and actual-module execution with doubles, not HTTP/PostgreSQL/browser evidence or full P05 acceptance. No API/UI/tests/p05/manifest files were modified. Prior reports remain unchanged.

## Reproduction and scope

Ran `node C:/Temp/venus-p05-role-independent.mjs`: actual exit0, assertions confirm both defects. Current actual GamesPanel, game/private state, actual Games TypeScript methods and actual publicRound projector were transpiled/evaluated. The real Games.mutate role guard, canFinish, finish/response/choice/condition/pause/stop/resume/advance methods execute; room transaction/access/query/persistence/target/snapshot and browser hooks/API are explicit doubles. The query double implements only immutable participant membership and actor rows matching newRound's real fallback `[primary_member_id]` when plan.actors is empty. Unexpected SQL fails. This proves role/control logic, not concurrent SQL/final-dispatch behaviour.

Synthetic identities: A primary and selected; B selected secondary for pairs or selected nonactor for group; C room host but not selected; D nonselected spectator. Eight scenarios ×four identities =32 role cases, with nine actions inspected per case. Raw result lists every shown/enabled UI control and actual method allow/code result. The script records hashes of actual TS inputs at load; checked afterward against current files. Supporting compiled dependency hashes are also recorded below.

The first helper attempt omitted the mandatory action-consent limit and failed CONSENT_SCOPE_INVALID before the matrix. Corrected only the fixture to use actual engine proposeConsent/consentResponse with valid limit; rerun completed. No production fix was made. All data is synthetic.

## P05-ROLE-001 · P1 · shared public visibility is not own action authority

Frontend location: `games-panel.tsx:135–136`; backend `games.ts:52–56,221–227,270–294`; projection `games-model.ts:publicRound`.

For public group Questions the real projector returns actors=[] while the engine/server retains a hidden primary. Actual UI enables Finish and Skip for A/B/C/D. Actual Games.finish/response permits only A: B/C/D fail ROUND_ACTOR_REQUIRED. The legitimate finisher exists, but the public projection intentionally provides no reliable way for UI to identify that finisher; the other three users are offered actions guaranteed to fail. Exposing primary publicly to solve this would change privacy semantics.

Additional reproduced instances of the same missing recipient authorization/state contract:

| Role/state | UI offers | Actual current guard |
|---|---|---|
| Selected nonactor B, group Questions | Finish / Skip | ROUND_ACTOR_REQUIRED |
| Nonselected host C | Pause | GAME_PARTICIPANT_REQUIRED |
| Spectator D | Pause / Stop / Skip | GAME_PARTICIPANT_REQUIRED / ROUND_ACTOR_REQUIRED |
| Secondary B, private Questions without bilateral action | Finish | ROUND_ACTOR_REQUIRED (primary-only) |
| Primary, Truth/Dare before choice; pair YesBut before action consent | Finish | ROUND_NOT_ACTIVE |

Host C's Stop correctly targets host abort and succeeds despite not being selected; do not accidentally replace that with participant-only stop. Selected A/B Pause/Stop, actor Skip, primary Choice, secondary Condition and host-only Resume/Advance need their distinct server-derived permissions. This is not a backend ACL bypass: the rejection is working. It is an enabled-control/own-role mismatch that obstructs the intended completion/safety UX.

Positive alignment also checked: public Truth/Dare exposes primary and only that UI shows choice; YesBut pending condition is shown for secondary B and actual method allows B; Resume when paused and Advance when terminal are host-only in UI and backend. These positives do not eliminate the failing scopes.

## P05-ROLE-002 · P2 · private choice remains falsely available after lock

Frontend location: `games-panel.tsx:129`. For private Truth/Dare, the condition uses Boolean(prompt), whereas public mode checks `!round.choice`. After A commits truth, prompt stays present and both Truth/Dare remain enabled. Actual Games.choice accepts the same-side idempotent truth but rejects the alternate dare with CHOICE_LOCKED. The private prompt contract contains no committed choice field for UI to gate on; recipient-owned choose permissions can solve this without exposing private choice publicly.

## Proposed additive self-actions contract

Full proposal is `role-round-01.self-actions-proposal.json`, **PROPOSED_NOT_IMPLEMENTED_NOT_ACCEPTED**. Add a separate authenticated recipient-only GET `.../game/self-actions`; keep shared GameView/PublicRound/public WS unchanged. Do not append primary_member_id, private actor lists, another participant's role or capability matrix to public data.

A dense fixed-shape response binds schema, authenticated room/member, current session/round/game_rev/room_rev and bounded expiry. It contains own session actions (pause/stop/host-abort/resume/advance/neutral-reset effect) and own round actions (finish/skip/choose-truth/choose-dare/condition/consent). False permissions have no explanatory private reasons. Recipient comes only from the authenticated session, never a caller-selected member_id. No partner/primary/card/relationship/condition text is needed.

Compute permissions from the same policy helpers as actual mutation authorization, including actor role, immutable selected membership, active round, choice lock and current consent/proposal/deadline. Do not duplicate weaker permission rules in a display-only projector. A true display permission is not bearer authority: POST always reruns authoritative checks. Existing request/response idempotency stays intact.

Use the room/catalog/deletion-ledger dispatch transaction fence, no-store/private CSRF+Origin profile, and reconstruct immediately before synchronous enqueue after rechecking current identity/session/round/rev/consent/clock. No awaited onSend gap. Poll/invalidate recipient packets without adding role-dependent public stream events/revision counts. Do not log capability payload or insert it in room-audience outbox.

Client cache needs room/member AuthBoundary identity/transport and session/round/game_rev ownership, deny-first render and callback checks, expiry and ABA protection just like current private state. Session-level authorized safety is independent of ordinary pending; packet failure must not invent authority or remove safe leave/own-neutral-reset. Preserve the distinction between own participant Stop and host Abort. Observer neutral reset changes own future settings and must not promise to abort another participant's game.

## Required implementation/review tests

Add table-driven policy tests and real HTTP/PG/browser cases for selected primary/secondary/nonactor, host outside selection and spectator across group/solo/public/private and pending/active/terminal/paused states. Verify Finish transitions only for its authorized role, then host advances. Verify quiet public none/one/two invitation acknowledgements separately from action consent; no Finish until action activation; proposal revision changes invalidate former acknowledgements/capabilities. Verify private committed choice hides/disables locked alternative.

Cross-room/member/session/round/revision/ABA/reconnect/deadline packets and stale DOM callbacks must fail; hold responses across withdraw/remove/close/pack/deletion-ledger revocation and inspect real bytes. Verify no primary/pair/role leak to room or nonrecipient host, and authorized safety still runs during a stalled ordinary request. Preserve current freshness/idempotency tests and old reviewed proofs; full acceptance requires clean-source evidence and independent re-review.

No normative contract/schema/code is changed by this audit. Additive versioning allows old readers to ignore the new endpoint; a mismatched UI should fail affected controls closed while retaining authorized emergency routes. Do not roll back by exposing hidden primary or weakening role/consent checks. Genuine human catalogue review and full P05/media/production acceptance remain pending.

## Exact inspected hashes

| Input | SHA-256 |
|---|---|
| `apps/web/src/games-panel.tsx` | `91c765f349eff01565c1f089ce99d8f0225612f9ae2b8520b903c9f8bb7a54fa` |
| `apps/web/src/api.ts` | `d761808aca8273081a856cc5c1431cd91a709c375f80d1989c2b20efa4c4fcb3` |
| `apps/web/src/game-setup.ts` | `7866f8ff2d7e5737c163fe4524cf80105b55126b78b3db8d8be7405629a0a98a` |
| `apps/web/src/game-copy.ts` | `07cfed14d2dabcee05708099a323ec7191982e1f0e3c8c38981a492837b27f95` |
| `apps/web/src/private-state.ts` | `be22a3b41802f80dac4731588201fecd6359066094a8be26f80d5f12b298a4bc` |
| `apps/web/src/game-operations.ts` | `50fc1aab56bdc9d327a228af817ee90a10409f6d5df655ed96c297b6434a20a4` |
| `apps/web/src/game-state.ts` | `5e2a6b0c68fae6bccb441b7e246aee069d6ae3ab4dcceece82c9d069d2d17a46` |
| `apps/api/src/games.ts` | `f47b50ffec0c941e4d760c79dbf857d4d69617ed5f38f8f03a1e3debadfd7d40` |
| `apps/api/src/games-model.ts` | `d8345dff0a0685e2e2f3a1ff36ad378c6793762a3ccfbcc53fab588a268952fa` |
| `apps/api/src/game-routes.ts` | `68fe5db38663b8dfcd93644f218183f2ae11e9203a1d2e8dc171390110f2067b` |
| `apps/api/src/security.ts` | `5782e8f6a8d906e75eef35765bef0513f47064ca090f84f2f1d222f506b07d25` |
| `packages/contracts/src/generated.ts` | `c0b314d085fddea72944b8e6dbc63e76de0d9acb0511d483a4b1a96870396cf8` |
| `packages/relationship-engine/src/engine.ts` | `be84b979418c56e17066b0c1788ec985f869a99ab38c2c77ad3daa84657c3d8a` |
| `packages/relationship-engine/src/consent.ts` | `f8e27f79971458a29dea756f2d2852e2339c51400445773f3baaf2661186e463` |
| `apps/api/dist/security.js` | `99a699e658ed2925c379677aac7fe875268076b8500ab766abbf189abf1c57e0` |
| `apps/api/dist/rooms.js` | `9cae87dbcb0f1800da8b78b367cdad360c5f784b0be63cb9f339c2b16ce4178d` |
| `apps/api/dist/private-chat.js` | `75d9e4cad3770b657be8dd1c6534c3b1ec2796ab8767d8643f2078d623b7d5ff` |
| `packages/relationship-engine/dist/consent.js` | `1b6f0dcf763f2cef3626664c482021f54158bc28480b687be4bbb7d33d69e460` |
| `packages/relationship-engine/dist/types.js` | `494073c9508bba7f218ff56afe965828c5026cb99d797115c1e5944032b39e51` |
| `packages/relationship-engine/dist/pack.js` | `9c0ed408a68c20b97f6d17ad5d3271ef69799768f269649f1dc237c3824d15ed` |
| `.docs/implementation/reviews/p05/role-round-01.adversarial.mjs` | `96b79184205da26e0cdd0adac845ee40e0f255822ceaa60fb9401490b46b3632` |
| `.docs/implementation/reviews/p05/role-round-01.adversarial.json` | `f025953c26bdbf167817fbfdd4ec10c3290843cbd992a106246593b6925a933d` |
| `.docs/implementation/reviews/p05/role-round-01.self-actions-proposal.json` | `808f1e8b65ded5f5e050869cb03186365e068509141e087c8d35c6744aed80d9` |
