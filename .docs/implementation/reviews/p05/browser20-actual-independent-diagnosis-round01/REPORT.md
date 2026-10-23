# Actual METHOD20: case07 independent diagnosis

Verdict: **DIAGNOSIS_COMPLETE; ACTUAL_BROWSER_FAIL_PRESERVED**. This is a read-only diagnosis, not a browser or P05 PASS. No Docker/browser execution or product/producer changes were made.

## Exact inputs and verification

The actual packet INDEX is `1521e7b6f94e12d9e8627a4d338cc45bedb2d9c5539d10e66073df04adcc18ed` (51 verified children). All 43 archived/raw original pairs match. Before/after source inventories match AA `aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee` /1823; all ten runtime pins match, including final METHOD20 observer `adc56af2e11c684fc8839b19f1c4f064424278a8697c5b2592c42ba400f5adb0`. The actual image is `sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5`.

Actual outcome remains 6 PASS, case07 FAIL, 9 NOT_RUN; cleanup PASS. Case06 advice now passed. Game and round were active, revision39, round12. The first EN action accept was HTTP200/revision39. The second TR preparation failed without another mutation. See `audit.py`, `audit.json` and `timeline.json` for reproducible checks and the bounded raw metadata projections.

## Sufficient primary rejection reason

The last complete TR delivery batch69 was too old to accept safely:

| Event | Native milliseconds |
| --- | ---: |
| self-actions592 request started | 137843.171745 |
| latest possible end of own permission (+5000ms) | 142843.171745 |
| chat599 body completed, completing the batch | 144045.937761 |

The own DTO has server time `00:18:56.932` and expiry `00:19:01.932`: exactly5000ms. Batch collection took **6202.766016ms**, exceeding this window by **1202.766016ms**. Own, target, conversation and chat were all HTTP200; their projected shape checks passed. A successful response does not renew an earlier permission.

`apps/web/src/topic-state.ts:33–49` anchors the lease at the own request start, caps it at5000ms and rejects when `until <= clock`. Therefore expiry alone guarantees rejection, even from an otherwise fresh model. Increasing the outer12s preparation timeout would not make this batch usable. No timeout, minimum lease, consent TTL or permissions should be weakened for this outcome.

The action itself was still pending until `00:19:17.135`, and its invitation until `00:20:35.561`. These are later than the own server timestamps. This is not evidence of another early30s action creation bug, paused transport or a consent-parent expiry. Nor is it evidence of a new METHOD20 predicate defect.

## Earlier READY snapshot is a different batch

The stored earlier READY46 snapshot had old revision38: own/target200, optional conversation409/null, chat not required. The outer preparation also requires the requested minimum game revision39 and matching DOM before clicking, so this old snapshot did not authorize the second action. The final complete47 snapshot has all four parts200 and MODEL_REJECTED. Its observer cycle number is not the delivery cycle69 identifier. Mixing these two namespaces or snapshots would misdiagnose the failure.

## Product implications and limits

The production UI uses the same serial own→target→conversation→chat collection in `apps/web/src/topic-games-panel.tsx:40–53`, with an unchanged5s own permission. This actual run demonstrates that the application read pipeline could not assemble fresh actionable state for this step under its local workload. The mandatory browser case remains open. It does **not** yet localize the delay to a specific query, encryption operation, room lock or CPU budget.

The existing API hot path repeatedly prepares/stores encrypted projections and advances stream/ref state (`apps/api/src/topic-games.ts:180–190`, also HTTP chat and socketView). Avoiding unchanged projection publication is a plausible targeted application optimization, subject to exact freshness/auth/revision/locale/name/consent checks. It is not an established sole cause or a performance guarantee; this packet has no SQL/lock/CPU profile. Repeating the same browser attempt unchanged or developing another broad observer layer is not supported by this evidence.

Actual internal cache floors and the precise first failing return branch were not persisted. The expiry inequality is sufficient, but does not prove that no other model constraint also rejected. Actual React cache acceptance was not observed independently. No full-stage, statistical, human-card approval, layout or rollback claim follows from this diagnosis.

## Minimal next actions

1. Address a concrete application read/publication hot path while preserving freshness and final delivery fences; use focused regression tests for the changed behavior.
2. Independently review exact changed bytes and bind the resulting image/source before one authorized browser repeat. Preserve this FAIL.
3. Complete remaining cases08–16 only after case07 can finish with a genuinely fresh permission; this packet provides no substitute PASS for them.
