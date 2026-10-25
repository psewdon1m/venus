# P07 readiness checkout diagnosis13

Verdict: SOURCE_ONLY_DESIGN_APPROVED_WITH_FAILURE_RELEASE_REQUIREMENT. No runtime or stage PASS. Application implementation is author-owned and was not changed in this review.

Inputs are sealed in INPUTS.json: W HEAD 3dbfdfa10285369c37ca21b8602a623b2a3dee9e, current production/fixture closures, all eight probe modules, installed pg implementation, and raw hour01 evidence. Prior FAIL and sealed reviews are preserved.

## Actual failure and limits

Raw hour01 (`venus-p07-bb7476f32a63`) remains FAIL. Soak began 2026-10-25T18:30:22.491Z; first in-window ready status 0 occurred at 18:30:31.021Z. Owner-controlled early termination is explicitly recorded; outer exit 137 and post-stop monitor failure are not presented as a completed-hour product measurement. The wrapper reports cleanup completed, empty cleanup_errors, finished 18:34:06.012Z. Readiness recovered at 18:30:36.230Z, but strict ALL200 still fails. Neither late idle PostgreSQL nor healthy game/media progress proves the exclusive cause of the timeout.

## Source finding

Production server.ts and the P07 server bootstrap execute all eight schema probes sequentially against Pool. Each probe performs exactly one fresh pool.query with its existing query_timeout 1000 ms, table presence and generation assertions. Each call separately checks out and releases a shared client. Under shared-pool contention this readiness request may queue eight times. database.ts retains max12 clients and connectionTimeoutMillis2000; the monitor independently has a 3000 ms fetch deadline. The source therefore supports the proposed queue-wait reduction, without proving that it alone resolves actual hour01 failure.

A single existing-pool checkout for the complete sequence is a legitimate application improvement: it removes seven reacquisitions while preserving every real SQL check. It creates no second pool, reserved capacity, request queue, readiness cache, SELECT1 shortcut, new transaction, or extended deadline. Each statement remains fresh under normal autocommit semantics. Initial checkout and query execution can still fail under load.

## Minimal accepted change

1. Both production and P07 bootstrap obtain `const client = await pool.connect()` once for this probe invocation; execute the same eight probes in the same order. Keep production protectedRuntime.checkpoint and all checks unchanged.
2. Widen only each probe parameter from pg.Pool to `Pick<pg.Pool, 'query'>`; PoolClient exposes the compatible query interface. Migration functions requiring transactions/connect remain pg.Pool. Probe compiled JavaScript should be unchanged apart from erased types.
3. Release on every completed/failed chain. Require safe failure disposal, for example `let completed=false; try { ...eight checks...; completed=true; } finally { client.release(!completed); }`. Pool connect failure requires no release because no client was obtained.

Unconditional `finally {client.release()}` is not accepted: installed pg-pool Pool.query calls release(err) on query errors, removing the connection. Installed pg Client query_timeout can invoke its error callback while the server query is still executing; returning that checked-out client as healthy changes the previous pool behavior. PoolClient.release accepts boolean; release(true) conservatively removes an incomplete-chain client, including schema assertion failure. Successful chains still reuse the client. No retries are proposed.

## Bounded verification recommendation

Existing app.test.ts checks real readiness/liveness separation at the app boundary, 503/recovery and secret-safe errors. Existing container smoke and P07 outage record exercise real unavailable/recovered dependencies; older whole suites need not be rerun solely for erased parameter types. A finite actual-PG author regression should exercise the same eight probes against real migrated schemas, wrong/missing schema/generation rejection, recovery after failure, one checkout per chain, and a real query-timeout/failure proving client disposal and subsequent successful readiness. Static typecheck and scoped lint should cover the widened interfaces. A contention comparison can establish reduced pool acquisitions, but cannot replace the required exact clean-source strict hour.

No tests, Docker operations, timing/capacity changes or implementation edits were performed by this reviewer. One rg search used an unsupported Windows glob path and returned exit1/os error123; the subsequent explicit-file search succeeded. This search error changes no source or test result.

## Handoff

Root received the concrete safe-release requirement and design approval. Author implementation, independent final-byte review and actual bounded runtime proof remain pending. Aggregate P07 remains HOLD until the mandatory clean strict-hour and other closing evidence pass. This report does not accept readiness timeouts, change budgets, or requalify hour01.
