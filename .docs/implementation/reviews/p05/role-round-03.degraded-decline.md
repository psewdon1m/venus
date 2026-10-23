# P05 role round03 addendum — degraded specific refusal gap

2026-10-19T15:39:04.374516+00:00, independent `/root/p04_evidence_review`. Main `role-round-03.md/.json` is preserved unchanged (MD SHA `87148cc21a3782a9dac7559fd5788ec2abf2cfee7196a2eb6d5f551315e2e75b`). The combined round03 remains CHANGES_REQUESTED with **ROLE005 and ROLE006 open**; ROLE003/004 have only their previously stated scoped closure.

## P05-ROLE-006 (P2)

Active plan `.docs/10_IMPLEMENTATION_PLAN.md:189`, EXIT-P05 criterion2 explicitly requires Stop/decline during animation, consent waiting and degraded connection, with honest unconfirmed server status. This is an existing obligation, not a new owner preference.

Frozen actualTSX/OwnControls retains session Pause/Stop/Abort positive facts, but treats skip/decline_invitation/withdraw_action as ordinary5-second connected-only grants. GamesPanel hides all visible private invitation/action data when offline. A still-live pending invitation therefore loses its specific Decline after metadata expiry or offline transition, even though whole-game Stop remains. This does not satisfy the explicit Stop/decline requirement and whole-game termination is not evidence of specific offer refusal.

Own independent probe executes the exact frozen actual TSX/OwnControls d6d4d0... from archived source copies, using explicit hook/API doubles. Pending invitation expires40000; own display lease expires15000. At local10000 online, specific Decline is visible/enabled and saved actual JSX callback sends one decline POST (positive control). At16001, while invitation still valid, Decline is visible but disabled, Skip is absent, saved decline callback sends zero POST; whole-game Stop remains. Offline at10000 hides Decline and Skip, saved callback sends zero POST; whole-game Stop remains. Exact outcomes/source hashes are in `degraded-decline-probe.json`; probe exit0 means these gap observations reproduced, not requirement PASS. This is **not** actual browser/PostgreSQL proof.

Server ownActions classifies actor Skip/refusal as catalogue-independent safety. The client safetyKeys contains only pause/stop/abort, and fresh() additionally requires connected transport and5-second lease. Thus API policy/available whole-game Stop does not close UI-specific offer refusal. Actual SA07 only verified session Stop; its PASS must not be promoted into this EXIT2 claim.

Required: Provide a generic specific refusal control using only previously confirmed own bounded round/offer/proposal/session/identity safety facts, without retaining partner/private prompt/condition payload. Keep final POST authority, stale identity/ABA/newround/removal/privateclear/freshfalse denial, no autoaccept, no invented role, and honest unconfirmed state. Add actual degraded Chromium+HTTP refusal regression independent of whole-gameStop.

No private cache text/partner data should survive merely to display a refusal. A new generic own-only control may preserve the minimum authorized target/offer metadata with strict fences. If there is no previously confirmed own role/target, do not invent one; retain authenticated leave/own settings paths and communicate uncertainty. Exact final refusal remains server-authorized. This review does not prescribe implementation details beyond the existing safety/privacy requirement.

No current product/test/candidate/manifest changes by reviewer. The pending ROLE005 product fix and later diagnostic runs remain outside the archived source proof. A new source freeze, regression tests and fresh independent component review must resolve both open findings; no full P05 or human/media/production acceptance follows from this addendum.
