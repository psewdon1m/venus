# P05 self-actions role round02 — preliminary CHANGES_REQUESTED

Independent `/root/p04_evidence_review`, 2026-10-19T15:24:47.296605+00:00. Dirty candidate, authors still editing tests/source; no WRITES_FINISHED or final-source acceptance. Context HEAD `b5436cde02dd09aa049ce0103cab58d9642e8c70` is not a source freeze. Two reproduced findings are handed to the author. All old reports/probes remain unchanged. No source/tests/manifest were edited by this review.

## Original role defects and reviewed code

New `role-round-02.roles-probe.mjs` preserves the original32-role/8-state scenario matrix and executes current actual Games/ownActions/TSX source with explicit hook/API/SQL doubles. It reports0 enabled-UI→rejected-POST mismatches. Group Questions still publishes actors=[]; only the hidden primary gets Finish/Skip. Selected nonactor, nonselected host and spectator do not gain those controls. The host outside selection has Abort, not participant Pause/Stop. Locked private Truth/Dare shows neither alternative. This supports the P05-ROLE-001/002 correction direction for the per-probe input hashes; they remain pending final frozen scope/actual-browser evidence, not closed stage gates.

Reviewed actual shared role/participant/host/finish/choice/condition guards, recipient-only policy, contracts, route, final dispatcher, OwnControls and GamesPanel token/vault wiring. The response is a dense own-boolean shape, contains only recipient member identity, and does not expose primary/private pair/card/condition/reason. It is not put into public GameView/WS/outbox; nonrecipient expiry does not use another pair's private deadline. Route uses privateReadGuard, forbids query selector, and enqueues synchronously with no-store headers. Own action facts are display metadata; POST remains authoritative with existing codes/idempotency guards. Finish/choice/condition rules are shared; catalogue degradation denies ordinary permissions while participant/host safety remains. Selected-live timestamps are rechecked against final now; this still leaves the independent authentication deadline issue below.

Client binding checks room/member AuthBoundary generation, transport, exact session/round/game rev and room rev, finite relative lease capped5000ms; stale request sequences cannot replace a newer accepted false. Identity/session/removal/terminal state clears retained safety; transport loss preserves only previously positive own safety with visible uncertainty. New safety callbacks go through current token checks and are independent of ordinary pending. Review identified a high-water-time early-return hole despite those measures. No independent claim is made here that every ABA/cache path or all55 historical tests ran this round.

## Reproduced findings

### P05-ROLE-003 (P2) — Record monotonic time before safety and neutral-reset early returns

Actual OwnControls accepts a 5s lease at local1000; Finish1100=true, Stop6001=true intentionally survives TTL, then Finish2000=true after wall-clock rewind. allowed() only updates its high-water time through fresh() on the ordinary path. Safety/neutral-reset early returns do not consume observed time, so the same expired ordinary metadata can revive. POST remains authoritative; this is a display/callback freshness defect, not a reproduced server authorization bypass.

Required: Consume finite now into monotonic high-water time on every time-bearing entry before early returns; regression expiry→safety/neutral-reset→rewind must deny ordinary actions while preserving confirmed safety.

During ongoing author writes, a separate clock-current probe on SHA941968339143cb178c8ca3b1c06a0cb5a89d2027214b2e51369d300108596a50 returned finish_after_rewind=false. This is a narrow intermediate corrected observation, not final independent acceptance; original failing input/result preserved.

### P05-ROLE-004 (P1) — Fence the authenticated session deadline after the final awaited access read

Actual Rooms.access/Rooms.auth and Games.dispatchSelfActions with explicit SQL-return doubles: sessionexpires7000, grant/member SQL parameters evaluated at1000, final awaited currentAcceptance advances clock to8000. The final presence checks still pass (<45s), then recipient metadata is enqueued with Finish=true and expiry13000 despite expired authentication. Auth returns no session expiry, so final synchronous now cannot compare or cap it. Both source methods are real; SQL/transaction/current/snapshot/present seams are explicit doubles. This does not claim a real PostgreSQL wait or browser exploit.

Required: Return an authenticated grant expiry from actual session-row reads; after all awaited policy/access reads, enforce current authenticated deadline synchronously before any enqueue (including safety metadata) and bound emitted lease. Authentication failure must not become degraded-safety metadata; retain intended acceptance/catalog failure safety semantics. Add actual PG/HTTP last-read wait crossing authentication expiry, then fresh independent retest.

## Actual evidence and execution boundary

- `roles-probe.mjs` exit0 /32 cases/0 mismatches, source hashes in `roles-result.json`. API, SQL, React hook scheduler and optional-read fixtures are explicit doubles; actual TSX and authoritative methods run. This is not HTTP/PostgreSQL/browser E2E.
- `clock-probe.mjs/.json`: original SHA `89a4fb8ec4a0b53a2d722a51c8e0921ca789280b641f0aa6afaabc6634b03edb`, Stop after expiry=true and Finish after rewind=true. Exit0 means this observation reproduced, **not PASS of the requirement**.
- `auth-expiry-probe.mjs/.json`: real source Rooms.access and Games.dispatchSelfActions, explicit SQL-return/time doubles, final clock8000>sessionexpiry7000, metadata enqueued Finish=true. Raw SQL/arguments/time trace and all six actual module hashes preserved. `--no-cross` positive control (`auth-expiry-positive.json`) enqueues at1000<7000 as expected. Both runs exit0 on observed behavior.
- Ongoing author edits changed web source after initial probes. `source-snapshot.json` honestly records14/16 matching observed files copied into the excluded source-snapshot folder and two changed web hashes; there is no fictitious unified source identity. Initial7 inputs and every probe's own actual read hashes remain pinned. Intermediate `clock-current` on `941968339143cb178c8ca3b1c06a0cb5a89d2027214b2e51369d300108596a50` already denies the specific rewind attack, but author testing/freeze is incomplete and no final closure is issued.

The author-reported29 new units/55 historical checks are **reported, not rerun by this reviewer**. Actual HTTP/PG/browser suite is still being authored and is NOTRUN by this reviewer. Required remaining actual UI regression is group primary Finish→host Next through JSX/UI with selected nonactor/nonselected host/spectator negatives, plus session/round/rev/identity/transport/TTL stale-self-state and private-public leak controls. No full P05, owner HOLD override, production, device or A/V claim. The unrelated new pure-conversation kernel is excluded from this review.

## Handoff

Author/root received exact raw probes and hashes, must preserve this round and implement fixes under source ownership. Complete regression/service tests, signal WRITES_FINISHED, freeze exact inputs, then run independent next round with new evidence. Root alone updates manifest after journals close. This report is a preliminary changes request and consumes no human approval.
