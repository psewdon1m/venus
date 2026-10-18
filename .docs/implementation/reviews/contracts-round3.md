# EXIT-P00 · Independent contracts review · round 3

- Reviewer: `/root/contract_review`.
- Revision: P00-2; candidate identity: `0ca44d74b5c6b46f1e475aca1d7865ff04d763eab9db0a8876472b8edbf4ceb2`.
- Frozen inputs: `.docs/implementation/evidence/p00-2-candidate-r3/input-hashes.json`.
- Result: **PASS** for P00 contracts/privacy/textual flow-board review. **Open findings: none.** Prior FAIL reports remain intact.

## Resolution and independent checks

Round 1 CR-001…005 remain resolved: server-owned Truth/Dare choice; responder-owned Yes, But condition with scoped text and revision reset; explicit finish; separate invitation/active expiry; separate invitation/channel and action consent. This round compared its exact input inventory to round 2, re-read all changed contracts/reference sections, and retained the prior scoped review of unchanged definitions and 02/04/08/09.

CR-006 is resolved. GameView and SessionStatus now expose only the safe `pause_reason=null|transport|safety`, with state-dependent validation. The FSM binds disconnect to transport pause, participant pause to safety pause, and reconnect only to a valid transport recovery with current membership/consent reconciliation. An explicit host resume clears the pause cause without extending consent deadlines. The reference helper uses the same guards. An independently constructed matrix of all **64** combinations of cause/trigger/host/same-identity/membership/reconciliation matched the expected policy. Additional checks denied safety-pause reconnect and non-boolean membership. No identity of the person pausing or personal explanation is exposed.

CR-007 is resolved. `action_is_consented` now rejects invalid time types and times before the maximum invitation/action clock. The independent reproduction from round 2 now gives: bool time → false; t=9 before second action ack → false; t=10 exact ack → true; t=181 → true; t=182 exact invitation expiry → false; t=183 → false. The active action is bounded by the original private channel deadline.

The final candidate therefore provides reviewable wire commands and state transitions for choice, condition, scoped action accept, finish, safety pause and recovery. Accept requests bind server offer ID, consent scope and current proposal revision. A condition amendment clears both action acknowledgements; invitation acceptance never authorizes a hidden action. Private disclosure remains pair-scoped, and public generic round schemas reject actors, prompt/card IDs and private fields. Snapshot/revision/idempotency/transaction obligations remain explicit without pretending that schemas implement runtime ACL or ACID.

## Evidence

- Independently recomputed `candidate_files` and canonical `identity`: complete file inventory exactly matches the frozen receipt and the identity above.
- Independently reran `python -B -m unittest discover -s tools -p 'test_*.py'`: **63 tests PASS**, exit 0; unittest runtime **1.279 seconds**.
- Separate independent pause matrix and temporal authorization probes above PASS. No test/probe source files were added to the candidate by this reviewer.
- Python: `C:\Users\pc\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`; dependency directory: `C:\Temp\venus-context-deps-7709ad0a19bb4d2c8b3aefdf55d5f269`; `-B` used to avoid bytecode writes.

## Reviewed file identities

The full input inventory is fixed by the receipt and candidate identity. Principal directly reviewed contract files:

| File | SHA-256 |
|---|---|
| `.docs/contracts/api.v1.openapi.json` | `77d4e7eeed862ac26bbd48ec96c47b62fd48c7647af4f5ea4cd930fddac410f9` |
| `.docs/contracts/projections.v1.schema.json` | `0c5671aa6576901a5eb03604e426011347c9eb88002191a8e320ce32473c8450` |
| `.docs/contracts/events.v1.schema.json` | `83e443ed41e2cdf2590b9d089d2b5e1db4a1f1f93005b4e461feab9c793fb82c` |
| `.docs/contracts/state-machines.v1.json` | `d9653e7fe7bee7e5deb3697968f2af818cd8fef7d0fa2c2e547853604fc0cf8e` |
| `.docs/contracts/relationship-policy.v1.json` | `6c5ae5a82cb9419668342c7fdce5d72c0c85e14759bcc4acb0f44829889c726f` |
| `.docs/contracts/service-entry-policy.v1.json` | `51eac6362bd95e3df6655d4d83c08a6280a980f312861d0162ea652477660377` |
| `.docs/implementation/CONTRACTS.md` | `1e5fdce8fa8f766c85175324ce0c43b6fa6dc5c484ea77e266b7e18630520e77` |
| `.docs/implementation/UI_FLOWS.md` | `1c61de86d0424743a323a156f1f34bba26e63857c45c703bbead421fd7570d70` |
| `tools/p00_rules_reference.py` | `f220958b5a846d1b3f540b9cf261208d243e217d00936871b798e73f7210758d` |
| `tools/test_p00.py` | `a020f6f95aa8c599a7cf015a91cf78033e794a34bbefd36f987106edb79d2666` |

## Scope and limitations

This PASS accepts the P00 specification/reference candidate for the reviewed scopes, including textual flows, transport/privacy requirements and independent negative fixtures. It does not prove an application, browser layout/accessibility, production DB migrations, encryption, HTTP/WS ACL/races, human editorial/linguistic content review or deployment. Their gates remain P02/P03/P04/P05/P06 and later as assigned in the plan.

The owner's U-001…004 decisions and explicit custom comfortable visual direction are accepted. The visual override does not waive safety/accessibility/security/release obligations. Central single-operator applicability to future consumer guest surfaces remains a recorded conditional boundary before its affected implementation; this report does not manufacture an operational compliance result. No P01 work was done. Only this review's MD/JSON were authored; source files, previous reviews and the manifest were not edited.
