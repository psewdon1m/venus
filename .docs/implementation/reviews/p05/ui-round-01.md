```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"b5436cde02dd09aa049ce0103cab58d9642e8c70","source_identity_sha256":"ec8ffd81ff00bc5d36f42a634674033c845ac54010c8ac81965b05c8dd522f12","scopes":["frontend","harness_partial"],"status":"CHANGES_REQUESTED","open_findings":["P05-UI-001","P05-UI-002"]}
```

# P05 UI independent review — round01

**CHANGES_REQUESTED. Early dirty code review only.** No clean-source/component/full EXIT-P05 acceptance. Reviewed actual frontend modules against ADR020 quiet public consent, ADR021 atomic neutral reset, private-chat contract and P05 work-map. Browser harness body remains under concurrent author work; its source inspection is partial, with no completed-matrix claim.

## Findings

### P05-UI-001 · P1 · stale HTTP response replaces a newer prepared session

Location: `apps/web/src/games-panel.tsx:20–25`, mutation/prepare update at59–61; `apps/web/src/game-state.ts:acceptGame`.

`sync` captures `epoch`, but successful prepare/update does not invalidate the pending read. `acceptGame` only compares revisions inside the same session and accepts any different session_id. Hold an old GET/current response for A, successfully prepare B/availability, then release A: actual GamesPanel first displays B Yes,but/waiting, then A Questions/active, and begins A invitation/private/action-consent reads. The epoch guard did not reject it. Server-side authorization may reject later requests, but the UI has already reinstated stale session/control scope.

Fix with a monotonic read/operation generation across prepare/replay/session transitions; publish a mutation result only for its still-current authenticated room/member scope, and never accept earlier current responses over it. Test delayed reads after successful new prepare, safety changes and session replacement, including stale private endpoint suppression.

### P05-UI-002 · P1 · expired private retry resends retained plaintext

Location: `apps/web/src/games-panel.tsx:43–54`, generic retry at error block, chat closure at91.

The clock only filters invitation/prompt/action DOM. On SERVICE_UNAVAILABLE, run retains an arbitrary retry closure capturing chat plaintext. After the deadline, prompt/chat controls disappear but the generic Retry button remains; clicking it invokes the captured old request without rechecking scope/deadline. The adversarial actual-component run sent the same synthetic private body twice, with the second POST after expiry. This is a local retention/retry defect even if the server correctly denies the stale grant; it is not a claim that backend chat ACL was bypassed.

Drop private input/condition/payload closure on expiry and every revoke/disconnect/auth/member/room/session/proposal transition. Scope retry metadata to the exact authorized state and deadline; check it before calling the API. A stale pending completion must not recreate actionable retry state. Retest chat/condition/accept payloads and preserve the independent safety lane.

## Actual adversarial execution

Ran `node C:/Temp/venus-p05-ui-adversarial.mjs`, final actual exit0, both required defect assertions reproduced. Exact script/result are preserved as `ui-round-01.adversarial.mjs/.json` next to this report. It transpiles and evaluates the unmodified actual GamesPanel and its actual imported api/game/private/copy modules. A deterministic minimal React-hook scheduler and API doubles drive deferred response ordering and clock changes; this is code-level adversarial execution, **not real ReactDOM/browser E2E**. The first scenario selects Yes,but through the actual UI handler before prepare, keeping request/response mode consistent.

Trace1: old/current pending → prepare B + availability success → UI B waiting → old A released → UI A active + A private GET calls. Trace2: failed chat POST → TTL expiry hides private UI → generic retry still present → second identical synthetic POST. No implementation/test/manifest files were edited by reviewer.

Reviewer helper development errors are preserved in own journal: an initial expected-label case mismatch and initially unstable fake state-setter identities caused assertion failures; stable React setter semantics and the explicit real mode-change handler were corrected before the final repro. Those helper errors are not product findings. The final saved script is the exact successful reproducer.

## Other inspected behaviour and limits

Private prompt/chat rendering has exact session/round/actor fences, renders message strings as React text, and does not route private failures into public output. Game snapshots check room/audience/revision; private-clear events check recipient. Separate safety actions bypass ordinaryLock in source, and clear private fields immediately; a full stalled-mutation browser regression is still required. No automatic consent is present: invitation/action handlers require explicit clicks; proposal revisions are sent, and changed terms are tied to action revision. These observations do not replace actual race/consent browser proofs.

Harness source uses unique project/temp paths, internal Compose network, pinned image IDs, UID1000/read-only/cap-drop, no Docker socket, retained logs and input inventories; native zoom is honestly NOT_RUN and CSSOM zoom is separate. This is partial inspection only. Timeout/cleanup fault injection, unfinished reconnect case and full Chromium/Firefox/WebKit matrix have not been independently completed in this round. Parent requested immediate handoff of the two privacy/session findings so the author can fix them; remaining harness audit is deferred to a subsequent review, not marked PASS. No fresh browser/container run was launched by this reviewer.

## Exact inspected bytes

The repository is dirty/concurrently developed; metadata identity is a point-in-time snapshot, not a frozen acceptance source. Per-file hashes below bind what is being reported; changes require a fresh round.

| Input | SHA-256 |
|---|---|
| `AGENTS.md` | `9a9daa15a5d7536ead8922f16fd0bbdb931daa77e0f10d5c13c4c6cbd0f984b8` |
| `.docs/adr/ADR-020-p05-quiet-public-pair.md` | `4025ff60dbd5435f170cbf409c8d40150017a588afab4e49b6b5fd3afbeb8e23` |
| `.docs/adr/ADR-021-p05-safety-neutral-reset.md` | `81c55012893705552c29143b82702cf86339174205102dac8acc1d6f8b6b27de` |
| `.docs/P05_PRIVATE_CHAT.md` | `2b4317402111066af5aa2a8b0dc1f4e5785d6f0fcee43e3ad39e9f612ac3344b` |
| `.docs/P05_TESTING.md` | `60ad1215e3a14cdde702fb145b60e5e256421c891ce9cfa41d9e2cbb6ef061e0` |
| `.docs/implementation/p05-work-map.json` | `eb5b44371f1034cf3c6d5929372125da3a1183fdc04cfd0ccd965a8b5551d6a6` |
| `apps/web/src/games-panel.tsx` | `0c82832bf25bf9917615264ae3875e3903e81d4da80aac2ea6ead56b65ec2e17` |
| `apps/web/src/game-state.ts` | `5e2a6b0c68fae6bccb441b7e246aee069d6ae3ab4dcceece82c9d069d2d17a46` |
| `apps/web/src/private-state.ts` | `be22a3b41802f80dac4731588201fecd6359066094a8be26f80d5f12b298a4bc` |
| `apps/web/src/game-copy.ts` | `f76e51efadc02e29c7cf0d4aa18c57275e9723c3552db95dbafcf5c472aed2fe` |
| `apps/web/src/api.ts` | `d761808aca8273081a856cc5c1431cd91a709c375f80d1989c2b20efa4c4fcb3` |
| `apps/web/src/room-shell.tsx` | `197c3688843df1d2adaf5c57b973f11c73395095f7c94b00b58453cf3c0d4727` |
| `apps/web/src/main.tsx` | `0106dbc19960a31109ab51c9471999c49347b33f4a9df0eb8f1bb72ca105f787` |
| `apps/web/src/game-state.test.ts` | `3121b9606f034dbbbfd06aa2434cae7dac5babb736447b41cd6592d4de259702` |
| `apps/web/src/private-state.test.ts` | `96c0b1fd952c9c002e35c624f34d1c0e4d9bdeb757152886a3fe0f36a8a52888` |
| `tools/p05-browser.mjs` | `ffe4d03f5940051073bf84eded51000fbaf3ddf4f769c8741892f9519524552b` |
| `tests/p05/runtime.mjs` | `7926fa84dad1100dd5751047f8f3900c9403a3df41181f3a6cad722263e08d30` |
| `tests/p05/browser.mjs` | `3e3b19880368e6299d5df76e54c5675cf5735a465278f30a9870b074eba797fb` |
| `infra/venus/Dockerfile.p05-tests` | `b7743c772ae1481b5fd8c91d51e0902ed457922c14434c300b30f6ea315c2679` |
| `infra/venus/compose.p05-tests.yml` | `068f7c58e8254c6316a4456380b13658b200b87fd3678e9604532ba3c4cf422f` |
| `.docs/implementation/reviews/p05/ui-round-01.adversarial.mjs` | `6cb9e2da3dd3cc94b2b21a862d8cb0629e0ea5ef5b83a3952c0d0d72fa4c4969` |
| `.docs/implementation/reviews/p05/ui-round-01.adversarial.json` | `8d43ecf200b88aa9c4be51a159718ef16a2f52e8016525a9b8296d18d7619df4` |

## Required next step

Author fixes P05-UI-001/002, adds meaningful delayed-response/TTL/private-clear regressions, runs affected tests, then a separate independent round02 retests exact new bytes. Preserve this report and both reproductions. Human450 HOLD, synthetic fixture isolation, full P05/runtime/media/production boundaries remain unchanged.
