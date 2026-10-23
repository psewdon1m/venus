```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"b5436cde02dd09aa049ce0103cab58d9642e8c70","source_identity_sha256":"45bc2f73be6dd440b331fd32e7b4478a7c237e61afa5ddb1ac9bcee7241155f2","scopes":["frontend"],"status":"CHANGES_REQUESTED","open_findings":["P05-UI-003"]}
```

# P05 UI independent review — round02

**CHANGES_REQUESTED.** Original UI001/UI002 are resolved on the inspected bytes; new privacy finding P05-UI-003 remains open. This is a scoped dirty-code review, not browser E2E, a clean-source proof or full P05 gate acceptance. No implementation/test/manifest edits by reviewer.

## Scope and freeze

Received author WRITES_FINISHED before testing. Captured nine frontend hashes at13:53:35.416359UTC; independently compared them after all probes: all unchanged. Before/after receipts are retained beside this report. Primary GamesPanel SHA `19d3f37e1bf11f25a1bfc7636c0a488f2952b348fef514d47902c4760bd0fe66`; new game-operations SHA `0524a84d946f96b41eb17f2d0e9e83551479871aefcdbcaf8f1874b95bb2a3e1`. Other agents may change unrelated backend/harness files; these per-file hashes define this review. Round01 Markdown hash and original two reproducer hashes independently checked unchanged.

Read actual new RetryVault/retryAllowed, generation fences, prepare/availability and private-cache code. Author C:/Temp/venus-p05-ui-author-fix.mjs was read only as a reference. Reviewer created a separate expanded probe from own original round01 scheduler and actual current TS/TSX modules; it is preserved as ui-round-02.adversarial.mjs/.json.

## Resolved findings and positive regressions

Thirteen adversarial controls PASS:

- Original UI001: old delayed current response cannot replace new B or issue old A private GETs.
- Original UI002: TTL clears input and retained entry callback; old saved DOM retry does not resend. Synchronous exact-deadline validation works before the timer fires.
- Post-effect revoke/disconnect/new session/different room/different member physically null the old vault entry callback and reject saved retry/chat-submit handlers.
- Delayed private read after a new session frame cannot publish old prompt or issue old chat GET.
- Delayed prepare result and delayed availability cannot overwrite a newer session frame.
- Vault clear mutates even retained Entry.operation to null, old IDs cannot recover the callback, IDs are not reused.
- Grant table rejects ten negative dimensions/deadline cases, including offer/proposal/deadline mismatch.

These are actual current module executions under a deterministic hook scheduler and API doubles, not copied implementations and not native browser/ReactDOM tests. No claim of heap zeroisation or cancellation of bytes already sent by an in-flight HTTP request is made. The vault does dispose its retained actionable callback after the tested clear transitions.

## P05-UI-003 · P1 · new-scope render exposes old private JSX and callback

Location: `apps/web/src/games-panel.tsx:57` and68–75; private cache publication at28.

`privateData`/`privateRef` has no owner room/member envelope. `visible` checks connection and a clear frame but not the identity for which cached data was fetched. The `auth` ref is advanced only in passive useEffect, which queues clear. Therefore a direct render with a new room or authenticated outsider member returns the former pair's private JSX before an effect-driven rerender.

Two independent variants fail: member C is added as a real room member and becomes owner_member_id while old prompt actors remain A/B; and room_id changes from room to room-B. In each case the actual returned tree still contains private-prompt with PRIVATE PROMPT. A third negative captures an old Retry handler, performs the new-identity render without running passive effects, then invokes it: currentContext still uses old auth.current/grants and actual old private POST count becomes2 instead of remaining1.

This is evidence of stale private output/callback in the component's returned render. Physical browser repaint, screenshot exposure and backend ACL bypass were not measured or claimed. It still violates the component scope contract; eventual passive cleanup is not sufficient.

Fix with a synchronous owner scope envelope on the cache and render-time fence, and operation checks against current render identity before passive effects. Prefer safety inside GamesPanel itself rather than relying on a parent key/remount. Include room/member/session/round ownership as appropriate. Drop or reject old inputs/callbacks and delayed private responses at the identity transition. Retest first returned JSX, saved DOM callbacks before effects, old async private completion, and all13 passing cases.

## Actual result and remaining work

Reviewer command `node C:/Temp/venus-p05-ui-round02-independent.mjs` actual exit1: **16 cases,13 PASS,3 FAIL**, all three failures are UI003 variants. The preserved raw JSON includes exact assertion output and synthetic marker only. No secrets or real private data were used. Source hashes before/after unchanged.

No fresh browser matrix, native zoom, backend HTTP/SQL lifecycle, harness cleanup/fault audit or full clean gate was run in this round. Those scopes remain separate. Human450 HOLD, approved registry isolation and media/production limits are unchanged. Author must fix UI003 and run affected regressions, then independent round03 reviews exact new bytes; this CHANGES_REQUESTED round must remain historical.

## Exact inspected inputs

| Input | SHA-256 |
|---|---|
| `apps/web/src/games-panel.tsx` | `19d3f37e1bf11f25a1bfc7636c0a488f2952b348fef514d47902c4760bd0fe66` |
| `apps/web/src/game-operations.ts` | `0524a84d946f96b41eb17f2d0e9e83551479871aefcdbcaf8f1874b95bb2a3e1` |
| `apps/web/src/game-operations.test.ts` | `c7342015a52863c380a65475c2de3e4c0c8dc2465b9b642bc637989ee32aaaf6` |
| `apps/web/src/game-state.ts` | `5e2a6b0c68fae6bccb441b7e246aee069d6ae3ab4dcceece82c9d069d2d17a46` |
| `apps/web/src/private-state.ts` | `be22a3b41802f80dac4731588201fecd6359066094a8be26f80d5f12b298a4bc` |
| `apps/web/src/game-copy.ts` | `f76e51efadc02e29c7cf0d4aa18c57275e9723c3552db95dbafcf5c472aed2fe` |
| `apps/web/src/api.ts` | `d761808aca8273081a856cc5c1431cd91a709c375f80d1989c2b20efa4c4fcb3` |
| `apps/web/src/room-shell.tsx` | `197c3688843df1d2adaf5c57b973f11c73395095f7c94b00b58453cf3c0d4727` |
| `apps/web/src/main.tsx` | `0106dbc19960a31109ab51c9471999c49347b33f4a9df0eb8f1bb72ca105f787` |
| `.docs/implementation/reviews/p05/ui-round-02.adversarial.mjs` | `cad5287d310c42b3078beb8a4aae6ea61f73f0acdaa0d4f72fe9e71c952741f8` |
| `.docs/implementation/reviews/p05/ui-round-02.adversarial.json` | `a9247a5ed91ee2a1a29897032a4dd90e17f68cc8c54428eceb2a0d43ea260003` |
| `.docs/implementation/reviews/p05/ui-round-02.before.json` | `7931c7a9e30db81b0b6a60a9c852ad477463986b8fdad3286f97a04624d71729` |
| `.docs/implementation/reviews/p05/ui-round-02.after.json` | `1ff4490115ab015fcb9e4d12d685910fedc519a854ba29f63c7cb24b663f47ac` |
