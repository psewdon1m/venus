# P05 topics UI component preflight 03 / handoff

Author `/root/p05_topics_ui`, 2026-10-19. Included UI writes are **PAUSED** at this checkpoint pending root runtime freeze and independent UI review.

Bounded author proof: **133/133 web tests in 13 files**, including **31 new V2 cases** (12 actual-panel scheduler, 4 actual own-settings scheduler, 3 own-control, 12 pure cache/safety/API/copy cases). Global typecheck, web/i18n ESLint with zero findings, web build, RU/EN/TR dictionary check all exited 0. The 27 copied source/toolchain-contract inputs match `inputs-before.json` and `inputs-after.json`. Full checks ended 2026-10-19T20:56:07.7543002+03:00. Runtime Node24.22.0/npm11.19.1, Vitest5.0.5, TypeScript6.0.3, Vite8.3.4.

This is a dirty-tree **author component preflight**, not independent gate, clean-source proof, whole-repository freeze, real browser/Docker proof, P05 PASS or human approval of catalog450. No Docker/browser was launched by this author. Actual TSX tests evaluate included components using deterministic hook/API scheduling; they do not prove ReactDOM rendering, accessibility, actual HTTP/WS/backend ACL, restore, production/DNS/TLS or real devices.

## Changes and boundaries

- Strict runtime capability-selected creation path, pinned across an unknown-result retry. V1/V2 room CSRF handling is explicit.
- Authenticated immutable per-room protocol selects the legacy GamesPanel or separate TopicGamesPanel. A failed V2 request never falls back to a V1 reader.
- Own topic allow list defaults empty. Pinned RU/EN/TR labels are fetched separately. Previously allowed topics cannot silently be removed: explicit room-lifetime exclusion is a separate operation. Peer preferences are never requested or shown.
- V2 preparation uses fresh RoomView revision/readiness and an exact stable request_id; receipts are followed by current/availability reads before Start. Per-round controls use authenticated own booleans, with existing retained Stop/Pause/refusal handling; no actor authority is inferred from host status.
- Full topic union precedes exact offer/epoch/proposal/token acceptance. New topic, other question, exclusion and condition edits clear private prompt/advice/chat before awaiting the mutation.
- Recipient advice has generic opt-in before text; sender editing creates a replacement requiring fresh permission. Revoke immediately clears controlled local content. Chat is epoch-scoped and online-only.
- Private publishing is bound to identity/transport/session/round/game revision, generation, monotonic topic epoch/revision, server-relative duration and the shorter own permission/presence deadline. A clear/expired lease destroys retained private retry callbacks; an old Retry handler cannot resend them.
- A text-free exact Other-question safety attempt can survive WS loss. It contains only original opaque tuple + bounded relative TTL, never content/labels/card IDs/partner/Accept authority, and cannot move to another identity/session/round/game revision. Fresh no-offer/negative metadata, revocation or expiry removes it.

Earlier packets 01 (130 tests) and 02 (131 tests) are preserved unchanged. Subsequent own review added explicit destruction of expired private retry closures and clearing a stale Other-question reference when a fresh projection has no offer. The new regressions justify this fresh run. The journal retains earlier failed tool commands, test fixture failures and corrections; full before-fix source inventories were not captured for those exploratory failures, so they are not represented as exact-source failure proofs.

## Review and next checks

Independent reviewer should inspect publication/ABA/epoch/permission/lease guards, degraded own safety, advice opt-in/edit/revoke, permanent exclusion, request idempotency, V1 compatibility and absence of technical copy. Root coordinates the ordinary runtime + actual Docker browser/RU-EN-TR/keyboard/focus/layout/contrast/reduced-motion/race matrix and full current-source stage gate.

Operational rollback must use a compatible protocol2 reader or disable new protocol2 creation and safely revoke active V2 moments while preserving exclusions. This UI does not claim an old V1 build can serve V2 rooms. Root integration/updater owns deployment rollback. Owner review450 remains HOLD and separate from this proof.
