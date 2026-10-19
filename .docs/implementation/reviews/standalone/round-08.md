# Catalog receipt semantics · Independent review round 08

Reviewer `/root/standalone_gate_review`; UTC 2026-10-19T13:04:37.519019+00:00. **PREFLIGHT_PASS**, stage_acceptance=false. Exact tested helper SHA256 `e6dec8b42cb5fa46288d2b14f9149908f557484c67745075b06d075b3d162882`. Dirty working candidate, not clean-source/full-stage acceptance.

## SG-003 · Resolved

Current code requires safe integer test count>=14, actual array skipped with no entries, schema_version1 for both schema/history reports and explicit human_approval=false. Strict failures/errors0 and450parsed/statusPASS remain required. Missing/malformed fields fail closed.

Independent unchanged-source semantic18/18 controls PASS: one valid report→PASS; all prior5 malformed count/skip shapes now→FAIL. Additional too-few tests, failures/errors/skips, schema failure/count449, wrong report versions, actual/missing human approval flag, fractional and unsafe-integer counts all→FAIL. Every controlled subprocess exits0, so these results exercise the semantic receipt guard itself.

Repeated whole checker6/6 controls PASS using genuine-shape test fixtures: success; first nonzero; second timeout; third signal/null; unavailable spawn; missing coverage. Raw logs and accurate command metadata survive failures; success hashes all7reports. Both harnesses record the exact helper raw SHA at read time, and it matched current bytes when this report was written. This closes round06 coverage-race caveat with explicit current-source retesting. Original rounds06/07 remain preserved.

Existing15-receipt Docker wrapper and source guard controls remain applicable to unchanged files; their earlier fixed capture indices and required catalog logs were checked separately. No further actionable defect found in this tooling preflight.

## Limits and handoff

All new controls use isolated subprocess/file fixtures, no actual catalog or Docker execution. Actual full catalog/C2 and clean Docker quality still require source freeze and actual producer evidence. No human editorial approval or stagePASS is inferred. Own journal/report writes end with this handoff until root follow-up.
