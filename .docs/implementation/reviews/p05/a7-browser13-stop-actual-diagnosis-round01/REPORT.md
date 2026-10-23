# A7 Chromium case13 — exact Stop diagnosis

Verdict: **CONFIRMED_HARNESS_EXPECTED_PATH_ERROR**. No application Stop failure established; the safety mutation actually committed. This is not full browser or stage PASS.

The case13 watcher expected `/stop`, but the RU primary actor was the room host and the production `game-stop` button correctly emitted `/abort` (HTTP 200). Request metadata has two aborts in this phase: the initial previous-session cleanup and the final click after both current-session topic acceptances. The latter is the only terminal safety request after those acceptances. Final authoritative fixture is `aborted`, revision 36, round `stopped`; all three UI snapshots show the stopped game. The watcher classified the successful different path as NOT_DISPATCHED, waiting its unchanged 15-second request timeout. No lease/UI race is required to explain this failure.

Exact materialized A7 source: `apps/web/src/topic-games-panel.tsx:96` chooses `abort` when `can('abort')`, otherwise `stop`; `apps/api/src/topic-games.ts:227` grants host abort and participant stop; `topic-game-routes.ts:22` maps both to `safetyStop`; `topic-games.ts:173` checks host/participant respectively and makes both terminal aborted with private clearing. Producer `browser.mjs:239` hardcodes `/stop`; `request-emission.mjs:13` compares the literal complete pathname. Host and participant routes intentionally differ.

Minimal correction: before the one click, select the exact expected suffix from production own action authority (authorized abort or otherwise authorized stop). Preserve exact POST path, request/receipt correlation, 200, authoritative aborted state, and private UI clearing. Do not accept either route retrospectively or retry. Finite host/participant/wrong-route controls suffice. No app, TTL, consent, Stop, or timeout change is needed.

Observed 12 prior cases PASS, case13 FAIL, cases14–16 NOT_RUN, cleanup PASS. Preserve the failure. Independent corrected method review and new authorized actual run remain required. Declared synthetic-source outage does not prove production catalog outage.

Read-only raw/source audit; no Docker/browser/app writes. INPUTS pins actual run files and materialized sources; CORRELATION retains ordered raw metadata. First analysis-script assertion wrongly assumed one abort over the entire phase; raw inspection revealed the setup abort and was corrected to the post-topic-accept boundary, with the failed attempt logged.
