# P05 topics UI — independent round 02

**COMPONENT_PREFLIGHT_PASS. UI-R01 and UI-R02 are closed within this bounded UI component scope.** Full P05 PASS is not established.

Author-disjoint review of frozen author packet04, index SHA256 `b6037653f5a3dd613c5700d8d5370ddf42547c7a0c93f234555cde4a9437fb4b`. Verified all39 indexed artifacts and all31 exact source/toolchain-contract copies against the worktree before and after checks. Regression01 index `0c9602a143032083bd6318ea05b4634e28a34c47c960a2f47a5eff1ad8b8e58e` verified15 artifacts, preserving four initial failures and correction evidence. Round01 FAIL remains immutable.

## Checks

- Independently reran whole author web suite: **141/141 PASS**, exit0.
- Own actual-TSX scheduler probes: **8/8 PASS**. Original public read-error,5s expiry and disconnect cases now hide public/private text. Private error clearing preserves text-free OtherQuestion and confirmed Stop.
- Own one-hour backward wall adjustment plus24×250ms elapsed callbacks now expires private prompt/chat and advice controls after6s. Public expiry probe explicitly advances the new monotonic counter; wall and elapsed are intentionally independent. The unchanged old clock-only expiry stimulus would not mean elapsed time under this corrected model.
- Own legacy probes confirm offline decline stays text-free without Accept/private partner content; original30s refusal expires despite wall rollback while confirmed Stop remains; explicit private-cleared frame blocks a stale DOM decline callback.
- Web TypeScript and web/i18n ESLint: exit0.

## Findings closure

UI-R01: separate public lease is bound to identity, transport, session, round and game revision. Fresh HTTP current plus accepted own metadata grants at most5s, anchored before current request. Errors, clear, expiry and disconnect revoke public display while opaque identity supports own safety attempts.

UI-R02: shared presentationNow reads Date.now once to create the legacy-compatible epoch anchor; subsequent elapsed time comes from performance.now, with no wall fallback. Panel/cache/control/retry/safety call sites use the same clock. Existing own boolean checks and refusal logic are unchanged; the legacy source diff is clock-call substitution plus import. Server timestamps supply relative durations for V2.

No additional functional findings identified in reviewed sources. Strict capability/immutable protocol dispatch has no V1 fallback. Full label union and exact offer/epoch/proposal/token tuples, advice opt-in/replacement, own settings and permanent exclusion, stale generation fences and text clearing remain covered by source inspection and the rerun suite.

## Limits

Tests evaluate actual TSX with deterministic hook/API scheduling. They do not prove ReactDOM timing, real browser engines, CSS/layout/accessibility, authenticated runtime HTTP/WS, backup/restore/rollback, production/DNS/TLS or physical devices. No Docker/browser was launched and no product source was edited by reviewer. This exact dirty-tree component proof is not a clean-source/full P05 gate. Owner catalog450 HOLD and release approval remain separate. Root owns ordinary-runtime freeze, browser matrix and final independent stage gates.
