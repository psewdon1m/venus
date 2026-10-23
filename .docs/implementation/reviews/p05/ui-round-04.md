```venus-review
{"reviewer_id":"/root/p04_evidence_review","source_sha":"b5436cde02dd09aa049ce0103cab58d9642e8c70","source_identity_sha256":"c3a7b270c04e6fe4a5f9cce47d136c641912859c55d6402a2701fcd4c67dba9c","scopes":["frontend_freshness_and_ui001_ui002_ui003_fixes"],"status":"PREFLIGHT_PASS","open_findings":[]}
```

# P05 UI independent review — round04

**PREFLIGHT_PASS for inspected frontend freshness and UI001–UI003 fixes.** No open code finding within this scope. The prior first-prepare/stale-read actual Chromium gap now has a completed source-bound single-case PASS. This is still dirty preflight, not the full browser matrix, clean-source component acceptance or EXIT-P05. Topic/advice/semantic/runtime work, human450 HOLD and media/production limits remain separate.

## Exact source and ownership

Received author WRITES_FINISHED, then captured12 scoped frontend hashes before testing; all12 match after testing. Primary GamesPanel SHA `91c765f349eff01565c1f089ce99d8f0225612f9ae2b8520b903c9f8bb7a54fa`; new game-setup SHA `7866f8ff2d7e5737c163fe4524cf80105b55126b78b3db8d8be7405629a0a98a`. Source HEAD is b5436cde02dd09aa049ce0103cab58d9642e8c70 with dirty implementation; source hashes, not HEAD alone, bind this result. Before/after receipts retained. Prior round01/02/03 Markdown and raw reproducer hashes verified unchanged. Reviewer changed no implementation/test/manifest files.

## Fresh authenticated preparation and recovery

Inspected actual freshPreparation and GamesPanel. Explicit intent is captured once; authenticated room GET occurs before Prepare POST. Fresh revision can replace stale room_rev while selected IDs/order, mode, round count and idempotency key are preserved. Membership/context changes, cross-room/stale/duplicate room data and selected readiness/presence failure deny the POST and require a new visible decision. Server expected_rev remains the atomic race guard between GET and POST; a fresh GET is not claimed to remove that race.

Conflict/setup-change/not-ready recovery removes the stale retry and availability, refreshes Rooms and Games, and requires another explicit prepare with fresh revision/key. Unknown network outcome is different: preparedInput remains captured, so the same request can replay exact original serialized body/key without changing revision behind its idempotency identity. Manual Refresh updates both Room and Game; a saved handler invoked after identity render is rejected before side effects. Old pending fresh-room lookup cannot proceed to Prepare after identity changes.

## Independent adversarial execution

Ran own current TS/TSX module probe, derived from preserved round03 controls with a contract-complete authenticated room API double. All actual component/helper code remains unmodified; minimal deterministic hooks/API doubles test application logic, **not native ReactDOM/browser E2E**.

Actual `node C:/Temp/venus-p05-ui-round04-independent.mjs`: exit0, **39/39 PASS**:

- All25 previous UI001–UI003, ABA/transport, stale DOM, callback disposal, delayed private read, prepare/availability, positive prepare/replay and independent safety controls remain PASS.
- Fresh authenticated GET precedes POST; exact chosen A/B IDs, mode yes_but, rounds7 and fresh rev30 retained; unselected observer not silently added; Start is not automatic and becomes enabled only after availability.
- Eight negative dimensions block Prepare: selected member removed, extra member, changed context, selected not ready/offline, cross-room response, rewound revision, duplicate member. Stale retry/Start absent; Room refreshed.
- REVISION_CONFLICT clears old retry, refreshes Room and Game, then another explicit prepare uses rev31/new key instead of stale rev30/key.
- Unknown network result retries two identical serialized POST bodies with one original fresh GET, even if the room prop revision later changes.
- Manual Refresh hits Room+Game; old handler after identity render has zero side effects; delayed old fresh GET cannot POST under a new identity.

Independent durable suite `node node_modules/vitest/vitest.mjs run apps/web/src`: actual exit0, **7 files/28 tests PASS**. No broad quality or browser claim follows from these local tests.

First reviewer helper attempt had38 PASS/1 FAIL because its historical default WS room_rev5 was older than the new authenticated fresh room_rev20; production correctly ignored it. Reviewer intended a newer-session frame, corrected only the fixture header to50, and reran39 PASS on unchanged production bytes. Observation retained separately as ui-round-04.attempt-01-observation.json; it is not a product defect or a silently changed production fix.

## Completed actual single-case Chromium proof

Independently inspected `.artifacts/p05/venus-p05-6becaa70c95d` after terminal completion. Saved nine unmodified raw files under `ui-round-04-browser/`, indexed by ui-round-04.browser-evidence.json. Before/after maps contain1715 identical inputs with identity `c3a7b270c04e6fe4a5f9cce47d136c641912859c55d6402a2701fcd4c67dba9c`; all12 reviewed UI source files and5 inspected harness/runtime/Docker source files match their captured hashes/current bytes. Exact image `sha256:f29ae07805bff7b5599484acb7b5318b25611ec76d81a2d42913a0066fa7a0d6` matches image-id.txt.

Actual case P05-STALE-READ-AFTER-NEW-PREPARE uses real ReactDOM/Chromium156.0.8078.4, HTTPS/WS/API/PostgreSQL synthetic fixture. Inspected test body219–229: initial A UI prepare/start succeeds; A finishes; browser route holds a real backend current response whose session equals A; B prepares, stale A releases, UI remains B/Truth-or-dare, Start is enabled and B actually starts. The completed browser report has one PASS record with held_real_backend_response=true/new_session_preserved=true, distinct A/B IDs, and phase release-old-A-then-start-B. Raw browser log agrees.

Runner PASS/cleanup completed/source_unchanged true; dirty=true/preflight_only=true. Runtime/display cleanup completed; raw cleanup log confirms owned DB, network and volume removal. This is **one selected Chromium case, matrix0, full_suite=false/full_browser_matrix=false**. No Firefox/WebKit/full matrix/native zoom acceptance is inferred; this particular report records native zoom NOT_RUN. Reviewer inspected this completed run rather than launching a replacement browser run. Earlier failed attempts remain historical.

Browser report SHA `cc6d80f3a1ac26acca06b84aada4b68a3d4428c42a96a5d593d8974d71c7b4e5`; runner SHA `56eeb20469575784830886054b166ccf91f1c2ddf12b243486877ab8dc9e13d7`. All nine exact file hashes are in the retained evidence descriptor.

## Remaining boundaries

UI001–UI003 remain resolved. The narrowly selected initial-prepare/stale-read Chromium gap described in round03 is resolved by current actual proof. No open finding in this scoped review. Full P05 still requires its complete source-bound browser/runtime matrix, cleanup/fault/privacy/consent/rollback tests and final clean freeze. Topic/advice/semantic scheduling, genuine reviewed catalogue publication and media A/V are not accepted here. Production/DNS/TLS and real devices remain outside local preflight. Changes to these scoped bytes require refreshed affected tests/review.

## Exact inspected hashes

| Input | SHA-256 |
|---|---|
| `apps/web/src/games-panel.tsx` | `91c765f349eff01565c1f089ce99d8f0225612f9ae2b8520b903c9f8bb7a54fa` |
| `apps/web/src/game-operations.ts` | `50fc1aab56bdc9d327a228af817ee90a10409f6d5df655ed96c297b6434a20a4` |
| `apps/web/src/game-operations.test.ts` | `5cae10ae9499c571f65cdceb759f0ef309df46f437e737c37d27db3d9d9f1af7` |
| `apps/web/src/game-races.test.ts` | `d975429870a269eef6b829aa06651387648f676ddc968048af1abc24b703869d` |
| `apps/web/src/game-state.ts` | `5e2a6b0c68fae6bccb441b7e246aee069d6ae3ab4dcceece82c9d069d2d17a46` |
| `apps/web/src/private-state.ts` | `be22a3b41802f80dac4731588201fecd6359066094a8be26f80d5f12b298a4bc` |
| `apps/web/src/game-copy.ts` | `07cfed14d2dabcee05708099a323ec7191982e1f0e3c8c38981a492837b27f95` |
| `apps/web/src/api.ts` | `d761808aca8273081a856cc5c1431cd91a709c375f80d1989c2b20efa4c4fcb3` |
| `apps/web/src/room-shell.tsx` | `197c3688843df1d2adaf5c57b973f11c73395095f7c94b00b58453cf3c0d4727` |
| `apps/web/src/main.tsx` | `0106dbc19960a31109ab51c9471999c49347b33f4a9df0eb8f1bb72ca105f787` |
| `apps/web/src/game-setup.ts` | `7866f8ff2d7e5737c163fe4524cf80105b55126b78b3db8d8be7405629a0a98a` |
| `apps/web/src/game-setup.test.ts` | `ba328705ae9e89a43bac27fab6d23ca9812fceb90dcf84042ce70dcd4d2b67a4` |
| `.docs/implementation/reviews/p05/ui-round-04.adversarial.mjs` | `f9f322eb70e9cd3c1fc104bca360156f52a020db18a70718b8e7bf2f41aeea28` |
| `.docs/implementation/reviews/p05/ui-round-04.adversarial.json` | `9bc422579495d9faa278d3be1b843f535bed234135dfeacb8ca6c46f986cef5e` |
| `.docs/implementation/reviews/p05/ui-round-04.before.json` | `be9d8bf4a5a4f84ca57fa17de268c5568601c234c061fea910e1bac89b6de067` |
| `.docs/implementation/reviews/p05/ui-round-04.after.json` | `d9f9226196084ddac48eb5ffe85842169d65e4bfde56b0e588d88398d6ee6d0f` |
| `.docs/implementation/reviews/p05/ui-round-04.attempt-01-observation.json` | `2859be7e9a1c7f63fbce2fdcc932f84e4471f7aee2e02c1427aef0c2d276c8ae` |
| `.docs/implementation/reviews/p05/ui-round-04.browser-evidence.json` | `b89a80f9f7747373a2d7973200394fe9763549205e32c9e30f4a7f3778ff007e` |
