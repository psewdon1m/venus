# P05 browser harness — independent round 02

Outcome: **PREFLIGHT_EVIDENCE_PASS** for the repaired browser harness and its actual local Docker fixture matrix. No open findings remain in this scope. This accepts neither a clean checkout nor full P05, production, actual human content review, real phones, Safari/macOS/iOS, music or later-stage media.

Reviewer: `/root/standalone_gate_review`, independent of implementation. Author WRITES_FINISHED received. Root retained dirty preflight source and all original evidence at `.docs/implementation/evidence/p05/browser-matrix-preflight-01/`; this review does not change implementation or manifest.

## Exact candidate and execution

Actual full browser attempt `venus-p05-b69106075752` and nominal capability probe `venus-p05-dee06684ef96` both finish PASS with cleanup completed, unchanged identity `46bf2780058b7a420af842de0939245f05bad32d039bc69cef90fe9fd853c197`, Git HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70`, `source_dirty:true` and `preflight_only:true`. Full run image: `sha256:5bce39bf29aaae7afde8ef341eecd4b06d110f882f4cacdc4d310da1b0df1277`; probe image: `sha256:186527d74a2896c7a18647e578d1f428dd166c0713d31bb52197942e0f1eff79`.

Independent verifier checked SHA256 and byte size of **all 287 indexed evidence files**, all **1720 included-source ZIP entries**, before/after inventories, identity, current source inventory and original raw runner/build/image receipts. Everything matches. Read eight implementation/runtime files directly from the actual retained full-run image using a stopped, owned, labelled container; all eight hashes match current and archived source. The reader container was removed without running it. Actual Docker inventory shows no remaining containers, volumes or networks for either attempt or the reader. Images are retained evidence.

Exact source pins:

| File | SHA256 |
|---|---|
| tools/p05-browser.mjs | 7584cebf2ad25df59d280d3f3c46922e44d64331a13c9bfaefa2111508defdbf |
| tests/p05/browser.mjs | 182821727f361e323c10b4422a716e642576a850d11935d9bf23a7fdbb755916 |
| tests/p05/report-contract.mjs | b1a5db42c765fd534c5c16f74374a2f0a21304b8200fb4d2b2194bdbcdcf30ae |
| tests/p05/window-inventory.mjs | 962c7f474a063bd4e7a3502eef07c09b54a3296f24015f28bc5c79b7688ad833 |
| tests/p05/report-contract.test.mjs | eecc6beefd82acb4293bda18aa7d8ab824be4a2f947bbeea1210eca16b697b8d |
| .docs/P05_TESTING.md | 14e5e78dd77bae9340f5bc9fb5fe829856a826f066885e0a3535ec6b6facb6b6 |
| package.json | 5e3481aeed9e43a9d7c1750906b5ebce387bf7176b1d4b830760401d17859514 |

## Findings closed and independent negative checks

- **BR05-001 closed:** explicit caller selection overwrites inherited environment selectors. Wrapper validates exact inner scope, toolchain, engines, ten allowed cases per requested engine, unique layout/native cells, result statuses, cleanup and measured zoom properties. Full/targeted receipts cannot interchange. Actual report passes this caller contract. `quality` actually invokes `test:p05:reporter`.
- **BR05-002 closed:** the producer checks pageerrors after runtime/display cleanup; nonempty errors, absent overflow witness and overflow force FAIL with diagnostics. Wrapper independently applies the same rule. Current real run has zero pageerrors, overflow false and zero failed trace steps.
- **BR05-003 closed:** probe has a unique owned name and project/role labels. Cleanup verifies the exact name/labels before removal; wrong ownership or unconfirmed inspect/removal yields cleanup FAIL. Timeout retains failure and raw output. Only the owned name is removed.

Own controls pass: **23/23** actual-wrapper/exact-finalizer isolated controls, **14/14** X11 inventory controls and **14/14** native-scene/identity mutation controls. Independently reran author reporter suite: **39/39 PASS**. These are explicitly synthetic command-boundary or receipt controls, with no Docker/X11 execution claim; they are stored separately from the real matrix evidence. Earlier control variants are retained. The first native-scene control attempt expected an older report to pass after member_id became mandatory and failed; that incorrect expectation was corrected, original attempt preserved, and the older report now forms an expected-rejection case. Synthetic member witnesses were used only in labelled controls, never in the actual-run evidence.

## Additional real failures and repairs retained

The previous full attempt `74afa1d3662c` failed Firefox capacity with 9 new windows instead of 1 after X11 `BadWindow/X_QueryTree`. It had source identity `27311f...` unchanged and cleanup completed. Shared `windowInventory` now retries only this specific transient, five attempts with four 50ms waits; partial output never becomes an empty baseline. Genuine empty requires status1 plus empty stdout/stderr; other failures propagate. Main/native actor identity still requires exactly one newly observed window. Independent controls cover exhausted/transient/unknown/partial/malformed/duplicate cases. Actual targeted Firefox capacity `266c3274b29a` then passed. This failure remains at `window-inventory-fail-01`.

The next full attempt `2d1afb6069fd` exposed copied-session interference. `Rooms.connect` increments a member's socket_generation; the cloned native process replaced the main socket, and its close correctly affected original game membership. The harness now creates fresh contexts, a separate room and two fresh members for native lobby/active scenes; native active uses its own actual random game and genuine invitation/action consents. No main cookie/session is copied, no WS is blocked and real clocks/timers remain intact. This failure remains at `native-session-interference-fail-01`. Source before/after scenes are now required, as are distinct native/main member/room/session and active game/round in active scenes.

## Observed matrix and visual checks

Actual full run: **30/30 cases, 216/216 layout cells, 27/27 measured native zoom checks, 33 keyboard target traversals**. Versions: Chromium156.0.8078.4, Firefox157.0, WebKit27.2; Node24.22.0/npm11.19.1/Playwright1.64.1. Actual native zoom is 200% for Chromium/Firefox and 207.36% for WebKit, with CSS zoom1, measured viewport shrink, successful reset and unchanged main viewport/DPR. Nominal probe actually executes all three engines.

Verified every actual native/main identity witness, source scene invariance and active state. The main RU/EN/TR scenes share one session/card/round per engine; native scenes have independent identities/rooms/sessions and may use another card. Actual random pair_public coverage includes Firefox main and native RU plus WebKit native EN, with two real action consent offers accepted before long checks; all recorded game/round states active. This is not a deterministic replacement of random selection.

Independently viewed physical X11 control screenshots for Chromium RU active, Firefox RU active and WebKit EN active: browser chrome retained, enlarged layout visible and stop control has keyboard focus. Source/diagnostics confirm actual OS focus ownership and Tab events after a neutral heading click, without direct target focus/click bypass. WebKit Linux remains a Linux engine claim. Fixture TLS remains local fixture TLS; visible browser trust warnings are expected for the public test key.

All verifier scripts/raw JSON and tests are durable under `browser-round-02-artifacts/`. Previous round01 and actual FAIL evidence remain unchanged. Subsequent included-source changes require a fresh relevant execution/review; this accepted historical dirty preflight is tied to the exact bytes above.
