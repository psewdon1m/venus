# EXIT-P00 · Independent evidence and traceability review · round 1

- Reviewer agent ID: `/root/evidence_review` (separate QA/traceability agent; source author/executor: `/root`).
- Report UTC: 2026-10-18T15:28:32Z.
- Result: **FAIL** for closing EXIT-P00; existing 46 local unit tests **PASS**.
- Scope: gate evidence, traceability, test meaning, baseline verification and separation from runtime acceptance. This review was requested under user decision U-004. Intermediate PENDING markers while decisions are being recorded are not findings.

## Findings

### E-01 · High · Traceability and gate checks accept unverifiable evidence

`tools/check_p00.py:check_rows` requires only nonempty `evidence_uri` and `evidence_sha256` for VERIFIED. It does not resolve the file, hash its bytes, or require an actual successful check. Reproduced using an in-memory copy of the real CSV (no source mutation):

```python
rows[0].update(status='VERIFIED', evidence_uri='does-not-exist.json', evidence_sha256='0'*64)
assert check_rows(ROOT, rows) == []  # observed: accepted
```

The same checker does not validate a current gate report, its check evidence, reviewer report bytes or reviewer identity. The registry only rejects PASSED when `human_acceptance == 'PENDING'`; changing that marker can bypass the check without independent reports. Therefore this checker cannot enforce the general gate agreement in plan §2.2 or U-004. The historical gate report itself remains honestly IN_REVIEW and is not accused of false acceptance.

Required fix: fail closed on absent/stale evidence; verify digest and source identity against the complete candidate input set; require concrete independent reports covering P00 criteria, independent reviewer IDs, report digests and compatible revisions. Add negative tests for absent, altered, stale and self-authored reports, incomplete checks, and fake VERIFIED references. Keep future product runtime checks explicitly outside P00 acceptance.

### E-02 · Medium · Traceability assigns several requirements to the wrong acceptance stage

`traceability.csv` assigns V-006 (Music), V-013 (Cinema) and V-014 (desktop/mobile host support) to P05, although G1 excludes those modules and implementation occurs at P08/P09/P10. Conversely `/api/v1/version`, `/health/live` and `/health/ready` have P02 milestones although EXIT-P01 already requires real version/health behavior.

Required fix: assign the correct stage or split milestone evidence explicitly (for example, G1 unavailable state versus actual later module behavior). Do not close a future behavior requirement by checking its G1 unavailable placeholder.

## Executed checks and assessed coverage

Executed from the project root with bundled Python 3.12, `-B` and the provided isolated PYTHONPATH:

```text
python -B -m unittest discover -s tools -p 'test_*.py' -v
Ran 46 tests in 0.973s — OK — exit 0
```

Meaningful local coverage includes the independent 36-cell relationship matrix, rational boundary comparison for all 5,050 supported round positions, exhaustive context/comfort guard combinations, veto in either direction, malformed cards, serialized consent orderings, timeout boundary and prompt revocation, strict public/private schemas, and negative card release checks. This is sufficient evidence of those reference and schema behaviors; it does not prove database serialization, HTTP/WS ACL, encryption, planner fairness, actual browser UI or deployment. Existing evidence accurately records these as NOT_RUN/future-stage work.

Baseline archive receipt and checker bind ZIP bytes, the original manifest and original member bytes. The original archive is external to the workspace; relocation and protected archival storage remain recorded operational limitations. An earlier restore receipt is present; this review did not perform a new restore drill.

## Checked file hashes

SHA-256 captured for the reviewed round 1 candidate (before fixes):

| File | SHA-256 |
|---|---|
| tools/check_p00.py | d6e41ea8807e6e624fb42dd12aacd9996f434b5e221ef2b0b58e74a8b6af5421 |
| tools/test_p00.py | 8b9d050527671b9e025db2ce54204834201f2a831a0985ea75f1232b32f90524 |
| tools/test_contracts.py | 84d2b93e7f9ee0f7e0692f2fe90be1ff6ad50460676c2e76c88deb3a89377946 |
| tools/p00_rules_reference.py | 0f52d955ab81c667911cc05ac0935e0f6543c40c0360ac38d98d830eed36776e |
| .docs/implementation/traceability.csv | 18a2c2c2c122c0713beb32ab288a81cc58759de5ec5f33c944e3de3e3b02d7ef |
| .docs/implementation/p00-registry.json | 3468483a98b229f5d316ef101f9768903dd357f798efcfbd72e11d99f050412b |
| .docs/implementation/evidence/p00-20261018T151605Z/gate-report.json | e35f7b6405c3f8ec987429d1970b7867332c23f1328191a1fcf9da617d6e3c57 |
| .docs/implementation/evidence/p00-20261018T151605Z/test-results.json | c1bfe92e1061a61ab155af3d72e8990e71d3f77245780a21c6975dada9459512 |
| .docs/10_IMPLEMENTATION_PLAN.md | 208ffca3dd15c36cbcf6537d9270752dea2d9d78f5e775cdf6f391bdda7d2dea |

After fixes a new review and test run are required; this report stays FAIL as historical evidence. Agent gate review never authorizes production or removes external central-document, legal/content, release or deployment blockers.
