# EXIT-P01 · independent implementation review · round 1

Reviewer: `/root/p01_implementation_review`. Source: `deaac55e693db7f27de2c7645e9bdb8aa1675ba5`. Source identity: `b06bcddb65f86955b01e1a965d57df0c5f0efe86502c0dbada60c2a73bec5cac`. Result: **FAIL**.

## Scope and verification

Reviewed P01 work and all four exit conditions in the implementation plan, developer guide, ADR-013, workspace/lock/toolchain setup, API and its tests, React/i18n scaffold, Dockerfile/Compose, ordinary CI workflow and negative-gate implementation. Separate evidence review remains independently responsible for authenticity and binding of remote receipts.

Independently executed on pinned Node24.22.0/npm11.19.1 and the project Python environment:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 3 tests / 2 files.
- `python -B -m unittest discover -s tools -p test_p01*.py`: PASS, 7 tests.
- `npm run check:schemas`: PASS, schema/reference and policy-config checks.
- `npm run check:i18n`: PASS, RU/EN/TR parity and nonempty values.
- `npm run build`: PASS, TypeScript and Vite production build.

Inspected actual local container report: seven checks PASS on this exact source, clean source, image `sha256:465f6c25a18e2d3391b5ad8d205ec72027637f2d04f9ca0af6bb389a5ecbd314`. Nonroot1000, read-only rootfs/capabilities isolation, private DB network/loopback app binding, pinned base digests and targeted COPY instructions are consistent with the code. Ordinary workflow uses read-only permissions, pinned action SHAs, safe pull_request trigger and no signing credentials.

## Open finding P01-IMPL-001 · P2

Location: `apps/api/src/app.ts`, Fastify construction/error handler.

A malformed percent URL is handled by Fastify's router before the configured error and response hooks. Reproduction after `npm run build`: import `createApp` from `./apps/api/dist/app.js`, inject `GET /%MALFORMED_SECRET` with a no-op database probe and any valid version metadata. Actual status400 body:

```json
{"error":"Bad Request","code":"FST_ERR_BAD_URL","message":"'/%MALFORMED_SECRET' is not a valid url component","statusCode":400}
```

The response reflects the raw input URL, omits server-generated `request_id` and adds fields outside the strict accepted `{code,message,request_id}` contract in CONTRACTS.md section2. It also bypasses `Cache-Control: no-store` and security response headers. Malformed JSON follows the configured safe handler correctly; this is specifically an early router-error path. My independent probe asserting no synthetic SECRET marker in body failed on this input. Logs did not leak that marker.

Required correction: route early framework/bad-URL errors through a sanitized strict error response, generate a server request ID, apply the common response headers, and add an explicit regression for malformed URL containing a synthetic invite/token marker. Then rebuild, retest and independently review the new source SHA. Do not infer acceptance from the existing green unit/CI run because it lacks this case.

## Limits

No production deployment or live user data were accessed. No code was edited. Room lifecycle, consent, real age/offer entry, production release/signing, real schema generation and comprehensive browser/a11y tests remain later-stage scope as declared in the guide. This review does not require implementing those P02+ functions during P01.
