# P05 topics UI — independent round 01

**FAIL — two P2 findings.** This is an author-disjoint UI component preflight on dirty source. It is not a full P05 gate.

Reviewed exact packet `topics-ui-preflight-03`, index SHA256 `4b4e377d62a7a435e47fa9890ddb01804aad9d5db54d63b6bab79c2ef6990f21`: 35 indexed artifacts verified; all 27 copied source/toolchain-contract inputs matched the worktree before probes. Exact inputs are in `verified-inputs.json`. Author web suite independently reran: **133/133 PASS**, exit 0. Independent probes below expose gaps outside those assertions. Product source was not edited.

## UI-R01 — P2: public prompt is not cleared

`topic-games-panel.tsx:35,52,53,68,77`: `clear()` destroys private cache and drafts, but public text remains in `record.game`. Public rendering has no display-lease check.

Actual TSX scheduler reproduction (`probes-round01.mjs`) receives a synthetic valid public Questions round, then separately simulates `/current` SERVICE_UNAVAILABLE, 6000ms without renewal, and disconnect. In all three, public prompt remains; private prompt/chat clear. Error-path opaque OtherQuestion and confirmed own Stop remain correctly. The catalog outage/withdrawal scenario can suppress a late frame without increasing room_rev, so an independent bounded display lease is necessary.

Fix public presentation validity/clearing while retaining text-free refusal and Stop/Pause attempts. Repeat all three probes and actual runtime/browser tests.

## UI-R02 — P2: wall-clock rollback defeats independent TTL

`topic-state.ts`, `topic-safety.ts`, `game-controls.ts` and panel call sites use Date.now and a max-wall floor for presentation and action deadlines. A nondecreasing wall floor does not measure elapsed time during wall-clock rollback.

Actual TSX scheduler reproduction (`clock-probe-round01.mjs`) receives active private prompt/chat with a 5s own lease, rolls wall time back one hour, then executes 24 scheduled 250ms callbacks with advancing wall timestamps. After simulated elapsed 6000ms, private text/chat and advice controls remain. Server checks are still authoritative: no server authorization bypass is claimed. Use a consistent monotonic elapsed clock for local deadlines and server ISO values only for relative durations. Repeat skew/rollback, stale promise and ordinary V1 regression checks.

## Reviewed behavior and scope

Source inspection and author tests support strict capability/protocol dispatch without V1 fallback, exact full topic-label union and offer/epoch/proposal/token POST tuple, recipient advice opt-in, replacement advice, early clearing before OtherQuestion/condition changes, permanent exclusion, online-only epoch chat, own boolean control authority and generation/identity/transport fences. The independent positive error-path probe confirms private clearing and text-free safety retention. These bounded observations do not override either finding.

No Docker/browser was launched. Scheduler tests do not prove ReactDOM timing, browser engine layouts, accessibility, real authenticated HTTP/WS, restore/rollback, production/DNS/TLS or devices. Full P05 PASS and human content approval are forbidden claims from this report. Root owns subsequent exact-source freeze and final gates.
