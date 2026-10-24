# Main pointer-focus centering: narrow source assessment

UTC 2026-10-22. Reviewer `/root/p05_gate_reviewer22`; current source `6497511399213eb7f8f606d8b5fb95ef66bcb26dd4b7bb61d8917dda4c9014b1`/1886, main.tsx SHA256 `b46836b65d9d4e226115dd176a3155781297d9ec10fa717dd4dc4863a1ee6acc`, lines100–110. Source-only reasoning; no APP edits, Docker, tests, new framework or full inventory recheck.

The proposed one-condition correction is supported. Current outer condition:

```tsx
if(field instanceof HTMLElement&&field.matches('input,select,button,textarea')&&field.matches(':focus-visible')) {
```

Proposed outer condition:

```tsx
if(state.keyboard&&field instanceof HTMLElement&&field.matches('input,select,button,textarea')&&field.matches(':focus-visible')) {
```

`onPointerDownCapture` clears keyboard intent before the ensuing focus. Current code nevertheless executes immediate `scrollIntoView` if the focus-visible predicate matches; only the later RAF is gated. A pointer-origin focus satisfying that predicate can therefore move the target between pointer down/up. The new condition deterministically prevents **both main-owned centering actions** while keyboard intent is false; for keyboard intent true it preserves existing immediate centering and the single scheduled frame. Keep unconditional generation cancellation before this condition, Tab-keyup behavior and callback safeguards unchanged. No event suppression, custom Tab order, focus reassignment, timeout, retry or permission change is needed.

This is a concrete conditional product interaction defect in the current main handler, not proof of what happened during EN `game-next`. Saved click completion/no POST lacks actual handler/guard/hit-target evidence; EN cause remains UNKNOWN. It does not justify weakening TTL/ACL checks or claiming that the next expected POST is guaranteed.

The guard covers the root handler only. Existing child textarea-specific immediate focus handlers remain separate; do not claim all pointer-driven scrolling in the application has been removed. Previous round02 resolved deferred-RAF eligibility and preserved this immediate behavior; that historical acceptance/HOLD remains immutable. New source revision/freeze plus original fresh current UI gates must cover the correction. Backend/statistics source remains unchanged; no corpus restart is warranted.

No other finding in this narrow review. STOP.
