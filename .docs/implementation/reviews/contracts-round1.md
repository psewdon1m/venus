# EXIT-P00 · Independent contracts review · round 1

- Reviewer: `/root/contract_review` (independent review agent; no implementation changes).
- Date: 2026-10-18, Europe/Istanbul.
- Candidate: P00-1, before owner-decision/admission amendments are finalized.
- Result: **FAIL**. Five actionable contract gaps below require correction and independent re-review. Pending U-001…005 markers are excluded because the author is updating the accepted decisions concurrently.

## Findings

### CR-001 · P1 · Truth or Dare has no server-owned side selection contract

Locations: `.docs/contracts/api.v1.openapi.json:2253` (`RoundResponse`), `.docs/contracts/projections.v1.schema.json:230` (`PublicRound`); source `.docs/04_UI_UX_AND_INTERACTIONS.md:100`, `.docs/implementation/UI_FLOWS.md:19`.

The only wire responses are accept/decline/skip/stop. There is no command to choose truth/dare, no authoritative selected-side field in a round, and no corresponding state/event contract. The specified UI therefore cannot synchronize the chosen side across clients/reconnects without inventing an API during implementation. Freeze an authenticated actor-only choice command, immutable or explicitly versioned choice semantics, and scoped round projections/events. Keep chosen action consent separate where necessary.

Verification: positive choice round-trip and reconnect projection; reject spectator/other actor, invalid mode/side, forged identity, conflicting repeated choice; replay same operation without a second mutation. Verify all locales observe the same selected side and only appropriate prompt content.

### CR-002 · P1 · Yes, But cannot submit the responder's own condition

Locations: `.docs/contracts/api.v1.openapi.json:2253`, `.docs/contracts/projections.v1.schema.json:230`; source `.docs/04_UI_UX_AND_INTERACTIONS.md:104`, `.docs/08_RELATIONSHIP_ENGINE.md:221`, `.docs/implementation/UI_FLOWS.md:20`.

`RoundResponse` has no yes-but outcome or free-text condition, and the public/scoped projection has no responder-owned result. Pair messages alone do not establish the round outcome and cannot support public rounds. Define responder-only yes/yes-but/no/skip semantics, bounded ephemeral condition text, consent implications of a changed condition, and disclosure scope. A response must not silently become public or permit the host to answer on B's behalf.

Verification: submit a synthetic condition in public and private rounds, reconnect/replay it, reject A/host-as-B and oversized text, prevent private condition leaking to room events, and preserve refusal without reason. A materially changed proposed action requires fresh appropriate consent rather than reusing consent to the original action.

### CR-003 · P2 · Private Done has no HTTP command

Locations: `.docs/contracts/api.v1.openapi.json:2253`; `.docs/contracts/state-machines.v1.json:141`; `tools/p00_rules_reference.py:128`; source `.docs/04_UI_UX_AND_INTERACTIONS.md:113`, `.docs/implementation/UI_FLOWS.md:21`.

The consent machine and reference implement `finish`, and the UI promises Done, but the only response schema rejects `finish`; no other HTTP route provides scoped successful completion. Using stop instead changes the terminal meaning and does not implement the frozen flow. Add an own-actor scoped finish command, declare pending/terminal handling and idempotency, and align HTTP, FSM and reference.

Verification: pending finish fails safely; active finish completes once, revokes prompt/message access and removes ephemeral content; stranger/host without actor scope cannot finish; repeated finish is idempotent and cannot reopen the offer.

### CR-004 · P1 · Active private consent has no enforceable expiry in executable rules

Locations: `tools/p00_rules_reference.py:124`, `tools/p00_rules_reference.py:136`; `.docs/contracts/state-machines.v1.json:141`; source `.docs/08_RELATIONSHIP_ENGINE.md:135`, `.docs/08_RELATIONSHIP_ENGINE.md:241`; policy `.docs/contracts/relationship-policy.v1.json` (`suggested_private_duration_seconds=180`).

`deadline` expires only pending invitations. Once active, `can_read_private_prompt(consent, actor)` has no current-time argument and remains true indefinitely; no active timeout transition exists in the FSM. Although PrivatePrompt contains expires_at and prose says access ends at expiry, the executable specification does not distinguish the 30-second invitation deadline from the active budget. Define active-until at activation, an active timeout transition, and time-aware fail-closed prompt/message access. Freeze a duration baseline or explicitly parameterize and pin it; extensions must require both actors if supported.

Verification: both accepts at t=1/2 produce an active budget independent of invitation deadline; access works just before active-until and fails exactly at/after it, including read after reconnect with no prior timer tick. Expiry completes/ends the round safely and deletes text. Late accept/finish/replay cannot renew expired scope.

### CR-005 · P1 · Private invitation consent must not authorize the hidden action

Locations: `.docs/implementation/CONTRACTS.md:35` (neutral invitation before disclosure), `.docs/contracts/api.v1.openapi.json:2253` (unscoped accept), `tools/p00_rules_reference.py:116` (single consent state); source `.docs/04_UI_UX_AND_INTERACTIONS.md:100`, `.docs/08_RELATIONSHIP_ENGINE.md:89`, `.docs/08_RELATIONSHIP_ENGINE.md:243`.

The private handshake is intentionally reason-neutral and private prompt content is withheld until two accepts. Those accepts can authorize entering/disclosing the private scope; they cannot simultaneously authorize a physical or revised Yes, But action that neither actor has seen yet. The single undifferentiated accept command/state does not specify a second action-specific handshake after reveal. Define separate invitation/channel and action consent scope with immutable action/proposal revision. Reveal must not imply action acceptance. P2 must be able to propose a condition after private reveal, before action execution, invalidating prior action acks without treating consent to the channel as consent to the modified action.

Verification: accept private invitation twice, reveal an eligible synthetic contact task, and assert action remains unaccepted. Then collect two independent accepts for that exact action revision. After P2 condition amendment, reject an old in-flight accept and require new independent acknowledgements. Preserve scoped private-channel access while safely negotiating, and revoke all access on scope stop/expiry/membership loss. Public/nonphysical flows must not gain implied authority to act for the other person.

## Tests and scope

- Ran independent baseline `python -B -m unittest discover -s tools -p 'test_*.py' -v`: **46 tests PASS**, exit 0, 0.897 seconds test runtime. Existing tests do not cover the above wire/state gaps, so green baseline tests do not imply EXIT-P00 PASS.
- Runtime: `C:\Users\pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`; PYTHONPATH `C:\Temp\venus-context-deps-7709ad0a19bb4d2c8b3aefdf55d5f269` supplied by parent. Bare `python` was unavailable; bundled Python without this dependency path could not import jsonschema. No dependencies were installed.
- Read-only cross-review covered OpenAPI, projections, events, state machines, relationship policy, CONTRACTS, UI_FLOWS and executable guard/consent reference against 02/04/08/09. Strict generic private projections, actor-targeted events, veto/comfort/context/progression guards, transaction/idempotency/ACL prose were inspected; no additional blocking finding from those inspected portions.
- No production API, DB, sockets, encryption, browser or content quality claim. No P01 implementation performed. Report is the only authored file; manifest is left to the integrating author.

## Reviewed SHA-256 identities

| File | SHA-256 |
|---|---|
| `.docs/contracts/api.v1.openapi.json` | `cd39cb09cd0286dfc1d6216d10622458d6e043ae869f07aebeb33df16a8fe1ea` |
| `.docs/contracts/projections.v1.schema.json` | `05f3a31fb5dcbb91e1f8cd8623147f15822e051dd0e5ed2b2f315f1009e1935b` |
| `.docs/contracts/events.v1.schema.json` | `08b85927eb48027a4603788700d6f53c095a8090cdabd8e3ec35d5a4c6af00e0` |
| `.docs/contracts/state-machines.v1.json` | `8c2d943839fc543986cb6483597fe8d5a7c4266a1d4bcbb7a4db4a7689988edd` |
| `.docs/contracts/relationship-policy.v1.json` | `6c5ae5a82cb9419668342c7fdce5d72c0c85e14759bcc4acb0f44829889c726f` |
| `.docs/implementation/CONTRACTS.md` | `08809e8400e9ebd1fe42d3edb8b48256af1793d1e745933e2aa3c64d78f15aad` |
| `.docs/implementation/UI_FLOWS.md` | `c16fddce0ea4a6983755374f044f246939f7b14a4d5e5971d8999fff591b19e4` |
| `tools/p00_rules_reference.py` | `0f52d955ab81c667911cc05ac0935e0f6543c40c0360ac38d98d830eed36776e` |
| `tools/test_p00.py` | `8b9d050527671b9e025db2ce54204834201f2a831a0985ea75f1232b32f90524` |
| `.docs/02_TECHNICAL_ARCHITECTURE.md` | `a7825eba063e6e6b4353ccc50082516a64affbf0dd4413c9ef4eac6464cb42ae` |
| `.docs/04_UI_UX_AND_INTERACTIONS.md` | `8c480bf76e0601a1c112c1b9c4f1086e7de51c70a274ace29400e39ba38a79b7` |
| `.docs/08_RELATIONSHIP_ENGINE.md` | `579095425bf4f261c44700f898e2349d7632472f20930c838f4bb83a81d4c384` |
| `.docs/09_CARD_AUTHORING_AND_AUTOMATION.md` | `82c1ddf4db23deef280281ac797db6be792b3fdf83d0839e6294ed778f14e408` |
