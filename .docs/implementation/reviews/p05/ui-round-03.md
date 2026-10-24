```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"b5436cde02dd09aa049ce0103cab58d9642e8c70","source_identity_sha256":"660dd91150ea824d450202dba2e18430c402d3b630d903b734ba5ad9a37e045d","scopes":["frontend_ui001_ui002_ui003_fixes"],"status":"PREFLIGHT_PASS","open_findings":[]}
```

# P05 UI independent review — round03

**PREFLIGHT_PASS only for the scoped UI001/UI002/UI003 fixes.** No remaining finding in this code-level scope. A separate actual-browser first-prepare freshness failure reported by root remains open; this report does not accept the browser matrix, a clean-source component or full EXIT-P05. Human450 HOLD, topic/advice/semantic/runtime and media/production boundaries remain pending.

## Coordinated exact bytes

Waited for author WRITES_FINISHED17:04+03, then froze10 frontend input hashes before review. Compared after all independent tests: all10 unchanged. Primary GamesPanel SHA `0f5231f635bf199719c92c20a514c5788faa14286770305c2f5b859f4a4e5848`; game-operations SHA `50fc1aab56bdc9d327a228af817ee90a10409f6d5df655ed96c297b6434a20a4`. Repository is still dirty with other agents working; whole-source identity is a point-in-time descriptor, not a final clean freeze. Prior round01/02 report hashes and raw reproducer hashes were checked unchanged. No implementation/tests/manifest edits by reviewer.

## Code reviewed

AuthBoundary.bind synchronously revokes the vault and advances identity/transport generations without network or React state writes. Game/availability records are identity-bound; private records are transport-bound. Rendering denies a prior envelope before passive effects. The mutable resource can revoke an abandoned render's older token but cannot authorize that token again after A→B→A. Async current/private/chat paths check captured transport before publication and before issuing old chat requests; prepare/availability additionally check operation/session/revision ownership. Private grant publication invalidates incompatible retry entries.

The vault clears retained Entry.operation, leaving old DOM handlers only opaque unusable IDs. Identity/transport changes clear it before effects. Expiry checks run both synchronously before retry and through explicit deadline/fallback timers. This verifies retained callback disposal and authorization, not heap zeroisation or cancellation of bytes already sent over HTTP.

## Independent actual-module execution

Reviewer created ui-round-03.adversarial.mjs from own preserved round02 reproducer; author adapted controls were not used as the result. It transpiles/evaluates current unmodified TS/TSX and imports their actual helpers, with a deterministic minimal hook scheduler and API doubles. No browser/ReactDOM E2E claim is made.

Actual command `node C:/Temp/venus-p05-ui-round03-independent.mjs` exit0: **25/25 PASS**. The raw script/result and before/after receipts are retained beside this report.

- All16 historical controls now PASS: original stale current/prepare UI001, expired old-DOM retry UI002, exact-deadline retry before timers, post-effect revoke/disconnect/new session/room/member disposal, delayed old private read, delayed prepare and availability, vault physical callback nulling, grant mismatch table, first returned tree for outsider/new room, and old DOM retry before identity passive effects.
- Identity A→B→A without effects: old game/private record stays hidden, old callback remains null, stale chat submit/retry sends no extra payload.
- Disconnect/reconnect at the same identity without effects: transport generation invalidates old private data/callbacks. Public safety identity can remain available without reviving private grants.
- Held old private response after member, room or transport transition before effects: no old prompt publishes and no old chat GET occurs.
- Positive first null→A and completed A→B replay: authoritative availability appears, Start becomes enabled, zero starts occur automatically, and one real component Start handler call publishes the new active game in the API-double scenario.
- With an ordinary finish request still unresolved, the actual safety Stop handler issues abort independently and clears private UI before the ordinary request settles.
- Independent AuthBoundary token checks confirm identity and transport generations remain monotonic through ABA transitions.

Also independently ran `node node_modules/vitest/vitest.mjs run apps/web/src`: actual exit0, **6 files/21 tests PASS**. These include the new durable actual-TSX race tests and grant/boundary controls. This is additional local unit/application-logic evidence, not an actual browser outcome.

## Resolved findings

P05-UI-001 RESOLVED: delayed old current cannot replace a successfully prepared newer session or issue old private GETs.

P05-UI-002 RESOLVED: private TTL/revoke/scope loss clears the actionable stored callback/input; old DOM retry cannot resend it, including exact deadline before the next timer.

P05-UI-003 RESOLVED: first returned render for another room/member denies old private JSX synchronously, old callback before effects cannot send, and identity/transport ABA cannot restore old authority. Delayed old private HTTP publication is also denied before effects. Real browser integration remains independently required.

## Separate actual-browser freshness failure remains open

During this review, orchestrator reported an actual thin Chromium attempt ending42d543fd0417 failed at initial prepare A with no backend game and localized StateChanged; another expired-retry browser attempt endingbfd0c056b93c passed. Their raw traces were not independently audited in this round, so neither is relabelled by these code-level positives.

Read-only diagnosis from current code: prepare captures expected_rev from the room prop, without a fresh room GET. REVISION_CONFLICT in its catch does not call refreshRoom; the retained setup Retry closes over the same old expected_rev, and the game error Refresh requests only game/current. This is a plausible freshness race/recovery explanation requiring actual-trace confirmation and the next scoped fix. The orchestrator is tracking it separately; no whole browser/UI product PASS follows from this preflight.

Remaining mandatory work includes that real freshness regression, actual Chromium/Firefox/WebKit harness and cleanup/fault checks, final coordinated clean source freeze, source-bound Docker/runtime/ACL/consent checks and independent full gate review. CSSOM zoom is not native browser zoom, which remains separate. No P05/media/A-V/production acceptance is made here.

## Exact inspected inputs

| Input | SHA-256 |
|---|---|
| `apps/web/src/games-panel.tsx` | `0f5231f635bf199719c92c20a514c5788faa14286770305c2f5b859f4a4e5848` |
| `apps/web/src/game-operations.ts` | `50fc1aab56bdc9d327a228af817ee90a10409f6d5df655ed96c297b6434a20a4` |
| `apps/web/src/game-operations.test.ts` | `5cae10ae9499c571f65cdceb759f0ef309df46f437e737c37d27db3d9d9f1af7` |
| `apps/web/src/game-races.test.ts` | `f48faf475e1e1a43a0ec11af9ebed402b2cb52c5db4ee5af79041a65bedcefb9` |
| `apps/web/src/game-state.ts` | `5e2a6b0c68fae6bccb441b7e246aee069d6ae3ab4dcceece82c9d069d2d17a46` |
| `apps/web/src/private-state.ts` | `be22a3b41802f80dac4731588201fecd6359066094a8be26f80d5f12b298a4bc` |
| `apps/web/src/game-copy.ts` | `f76e51efadc02e29c7cf0d4aa18c57275e9723c3552db95dbafcf5c472aed2fe` |
| `apps/web/src/api.ts` | `d761808aca8273081a856cc5c1431cd91a709c375f80d1989c2b20efa4c4fcb3` |
| `apps/web/src/room-shell.tsx` | `197c3688843df1d2adaf5c57b973f11c73395095f7c94b00b58453cf3c0d4727` |
| `apps/web/src/main.tsx` | `0106dbc19960a31109ab51c9471999c49347b33f4a9df0eb8f1bb72ca105f787` |
| `.docs/implementation/reviews/p05/ui-round-03.adversarial.mjs` | `78a485a521bfa79244970180b30b8a35e0037a8bf2c9ea34f8a5186b40083ebe` |
| `.docs/implementation/reviews/p05/ui-round-03.adversarial.json` | `cb46e6a493556e41594c3fbc58a094699c4f11d9b257539abce335b3100ec66f` |
| `.docs/implementation/reviews/p05/ui-round-03.before.json` | `d3ed181c23e8affd682342e13a5d87a6adb29dda715bdf8926db4cb2d0c173b8` |
| `.docs/implementation/reviews/p05/ui-round-03.after.json` | `0bbd9d86948417e2c8d1a131fdfb6291e3b1e16f45061415e5f89ccc034e0a91` |
