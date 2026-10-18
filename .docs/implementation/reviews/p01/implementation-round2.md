# EXIT-P01 · independent implementation review · round 2

Reviewer: `/root/p01_implementation_review`. Source: `aa680b8dd29358245d4cf715ba15204106d918a9`. Source identity: `b2a15edfbd321c193152c97f6a8a7f8f9271379cf5519f1526fad304627448dd`. Result: **PASS**. Open findings: **0**.

## Scope

Independent implementation review of the P01 plan, developer guide, ADR-013, npm monorepo/toolchain/lock, API, i18n/web foundation, CI, Dockerfile and disposable Compose. The first round source and FAIL report remain preserved; this report accepts only the new source identity above. Remote evidence integrity and completeness remain the responsibility of the separate evidence reviewer and final source-bound gate.

## Correction of P01-IMPL-001

Verified the new early `frameworkErrors` handler, server-generated request ID, safe fixed error response and explicit security/no-store headers. The handler does not log or reflect raw URL. The existing privacy unit test now covers the previously missed malformed URL, and the real container smoke repeats that request through the network listener.

Independently repeated my own executable probe against the newly built API using Node `--input-type=module`, importing `createApp` from `./apps/api/dist/app.js`. Inputs `/%MALFORMED_SECRET`, `/%`, `/%FFPRIVATE_SECRET` and `/%E0%A4PRIVATE_SECRET` all return400 and exactly the keys `code,message,request_id`, with a server-generated UUID, no raw marker, `Cache-Control: no-store`, nosniff, no-referrer and CSP frame-ancestors none. A forged client request ID is ignored. Malformed JSON remains safely normalized. Captured JSON logs contain no synthetic PRIVATE/QUERY/HEADER/BODY/DB secret marker. Result: PASS. **P01-IMPL-001 CLOSED**.

## Executed checks and inspected integration results

On pinned Node24.22.0/npm11.19.1 and project Python environment independently ran:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 3 tests / 2 files, including API outage/privacy/router regression and ordinary CI trust boundary.
- `npm run build`: PASS, TypeScript and Vite production output.
- `python -B -m unittest discover -s tools -p test_p01*.py`: PASS, 8 tests, including stronger negative/CI/container evidence bindings.
- Direct probe of healthy/unavailable DB readiness, continued liveness and unchanged version response: PASS.
- `tools.p01_gate.identity(inputs())`: matches `b2a15edfbd321c193152c97f6a8a7f8f9271379cf5519f1526fad304627448dd`.

Reviewed the changes to negative-gate source SHA/identity/clean snapshot records and source-bound evidence verifier. Rollback documentation now separates bootstrap refusal, first-runtime safe shutdown and restoration of a previously accepted runtime without deleting mandatory CI.

Inspected the completed clean container smoke report on this exact SHA: seven checks PASS; image `sha256:3b26fbbf99248afad81b4214932529b66b95f46a16bb95d570e9d7c677387d08`. Runtime inspection records nonroot1000, read-only rootfs, all capabilities dropped, no-new-privileges, no Docker socket, read-only secret mount, loopback-only app and unexposed PostgreSQL. Database stop/recovery separates readiness503 from liveness200; version is bound to source/build/image identity. The image is a local config digest, explicitly not a claimed registry signature.

Inspected negative receipt on this exact clean SHA: four positive controls PASS, corrupted schema/locale/type/unit rejected, source unchanged. The exact-SHA [GitHub Actions run](https://github.com/psewdon1m/venus/actions/runs/39144088108) is completed/success. This review does not manufacture or replace those run receipts.

## Boundaries

No production deployment or user data accessed. No source code edited. Runtime rooms, auth, consent, offer/age entry, persistent application migrations, browser/a11y scenarios and production signing remain declared later-stage scope. The comfortable custom UI follows the user's visual decision; no upstream operator-theme requirement is imposed. No remaining implementation defect blocks EXIT-P01 within this scope.
