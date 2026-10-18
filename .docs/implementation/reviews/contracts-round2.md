# EXIT-P00 · Independent contracts review · round 2

- Reviewer: `/root/contract_review`.
- Revision: P00-2; frozen candidate identity: `c9ec07841904a3524706d19ca14f5dba30f5df050ffad974a0f68503f91f800b`.
- Result: **FAIL**. CR-001…005 from round 1 are resolved in this candidate; CR-006/007 below remain open. No source, runtime implementation or manifest was changed by this reviewer.

## Resolved findings

| ID | Independently reviewed correction |
|---|---|
| CR-001 | Actor-only `/choice`, immutable selected side reference, mode-specific public projection and scoped current state |
| CR-002 | Responder-only `/condition`, offer/revision binding, bounded pair-scoped condition event and GET, acknowledgement reset on amendment |
| CR-003 | `/finish` and response kind finish; active-only completion, terminal non-resurrection |
| CR-004 | Invitation deadline and active-until separated; time-aware reads, explicit active timeout, duplicate accepts do not extend |
| CR-005 | Separate invitation and action consent, separate server offer IDs/revisions, channel acceptance cannot authorize hidden action; condition can change pending action while channel stays open |

## Open findings

### CR-006 · P2 · Reconnect can bypass a participant safety pause

Locations: `.docs/contracts/state-machines.v1.json:64` (paused/reconnect transition), `.docs/contracts/state-machines.v1.json:89` (participant pause); `.docs/implementation/CONTRACTS.md:109` (host resume).

The game now supports both transport pauses and participant safety pauses, but retains the unconditional transition `paused -- reconnect / same_identity_valid --> active`. No pause cause is stored or used in that guard. As frozen, a reconnect after a participant called safety pause can reactivate the game without the declared host resume path. It also fails to bind automatic reconnect-resume to current membership and consent while the prose explicitly requires those checks for host resume.

Correction: specify pause cause/state and allow automatic resume only for a recoverable transport pause with current membership/actor availability/consent checks. A safety pause must require the explicit accepted resume policy. Expose sufficient safe state for reconnect UI without disclosing who paused or why if that is private.

Verification: participant safety-pause, then reconnect the same identity and another participant; game stays paused. A transport-only pause can resume only when all required current guards pass. Expired private consent is never revived. Explicit host resume cannot bypass absent actors or renew deadlines.

### CR-007 · P2 · Action consent can appear effective before its second acknowledgement

Location: `tools/p00_rules_reference.py:197`, `action_is_consented`.

The helper checks the invitation clock through `can_read_private_prompt`, but never checks that `now >= pair.action.last_at`. A synthetic action whose second acknowledgement occurs at t=10 reports authorized when queried at t=9. `pair_response` correctly enforces the maximum pair clock; the read/authorization helper must enforce the same lower bound instead of using an action state from the future.

Independent reproduction, using only in-memory synthetic IDs:

```python
c = respond(Consent(('A', 'B'), 30), 'A', 'accept', 1)
c = respond(c, 'B', 'accept', 2)
p = open_action(c, 3)
p = pair_response(p, 'A', 'action', 'accept', 4)
p = pair_response(p, 'B', 'action', 'accept', 10)
assert action_is_consented(p, 9) is True  # observed; must be False
```

Correction: reject invalid/backwards time against both consent clocks in authorization, retaining the exclusive active-until boundary. Verification: before second acknowledgement is false, exact acknowledgement is true while valid, and expiry is false; bool/float/backwards clock values fail closed. Reuse these fixtures on P03 implementation.

## Independent validation and limits

- Recomputed the entire candidate file inventory with `p00_evidence.candidate_files` and canonical identity with `identity`; exact equality with frozen input-hashes.json and `c9ec…` confirmed.
- Ran bundled Python with the supplied dependency directory and `-B`: `-m unittest discover -s tools -p 'test_*.py' -v`, **61 tests PASS**, exit 0, test runtime 1.081 seconds.
- Separate no-file probe reproduced CR-007 (`action_ack_at 10 query_at 9 is_consented True`) and inspected the unguarded paused/reconnect tuple for CR-006. Existing green tests miss both boundaries.
- Re-read wire request/response schemas, scoped projections/events, FSM, CONTRACTS, UI_FLOWS and reference fixes against 02/04/08/09. Verified accept requires scope/offer_id/proposal_revision, condition requires current offer/revision, generic public phase rejects private fields, finish and new choice/condition endpoints preserve ACL declarations. Production DB/race/encryption/transport/browser proof remains P02/P03/P05, not claimed here.
- Accepted owner decisions U-001…004 and custom comfortable visual direction are not reopened. No request for identity/authority confirmation. The future central single-operator/consumer guest applicability boundary remains assigned to its declared later gate and is not a runtime compliance claim.

## Reviewed file identities

The complete candidate inventory is identified above; these are the principal directly reviewed files in this round:

| File | SHA-256 |
|---|---|
| `.docs/contracts/api.v1.openapi.json` | `9634e08fe3d27ab7e8c436f89a97b501aa0eea971d858053ce1ac6d8ccb01dde` |
| `.docs/contracts/projections.v1.schema.json` | `5a0e7c3b49b2ac7485458b224a6be974b74c64411bd9bf6c488d2c491e93a420` |
| `.docs/contracts/events.v1.schema.json` | `ccf46cbeaee3d624d3c1dac7f8f3439a17c8c948816b662c5c572d0be88e9677` |
| `.docs/contracts/state-machines.v1.json` | `e46ff703b579f7524e57dc73150894cb5e4f02c4c6789cb99c0e682286213336` |
| `.docs/contracts/relationship-policy.v1.json` | `6c5ae5a82cb9419668342c7fdce5d72c0c85e14759bcc4acb0f44829889c726f` |
| `.docs/contracts/service-entry-policy.v1.json` | `51eac6362bd95e3df6655d4d83c08a6280a980f312861d0162ea652477660377` |
| `.docs/implementation/CONTRACTS.md` | `96ee90107e365022d1090629516cec98b20f5d542a6ab685b64f15616731d8d7` |
| `.docs/implementation/UI_FLOWS.md` | `1c61de86d0424743a323a156f1f34bba26e63857c45c703bbead421fd7570d70` |
| `tools/p00_rules_reference.py` | `ae13991e443c52df799f5c3a82d697fcb42ff27cdeac5abca56ff2c88065248f` |
| `tools/test_p00.py` | `4a41d9d65e0fdac640d936f08bff3f3feb067d79a6ae25e46f5d93890e24f19c` |
