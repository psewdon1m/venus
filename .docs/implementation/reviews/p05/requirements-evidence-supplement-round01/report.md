# P05 current-source baseline and unit evidence · independent supplement01

**BOUNDED_EVIDENCE_AUDIT_PASS — not full P05, V2 topic UI or full-quality acceptance.** Reviewer `/root/p04_gate_preflight`. This audit inspects retained actual results and executes only the current pure report validator; it does not rerun Docker, PostgreSQL, browsers, product requests or image-content inspection.

## Exact bytes and checks

Shared frozen dirty identity `ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571` /1811 included files. Contextual HEAD remains `b5436cde02dd09aa049ce0103cab58d9642e8c70`. Every current included hash, every unique included-source ZIP entry and the complete freeze map were independently compared again. ZIP SHA `5a622f20a18c427cde591b0f0f78a61f52b892b7dec3fff5ff14833d532b82af` matches. Source remained unchanged through the audit.

| Retained packet | Exact index SHA256 | Independently verified indexed children |
| --- | --- | --- |
| engine2-baseline-browser-preflight-01 | `7fd138e77d11a5f62cac99408ecc908f4499897d547747da24f915da946d1443` |282|
| engine2-linux-units-preflight-02 | `16151362147c592bca2e7e6fabd95e265794fc2052b4bea44e5f74baa44bb4f2` |9|
| engine2-additional-host-checks-01 | `d933e5168f268b56d72aafeffe18eac0d63cd8434dff54e79a2580e6af44c6e6` |4|
| retained Linux attempt01 FAIL | `6bb832bc147565b323937b98c7d857c699bd0ea01b344591904af79d73f8da30` |10|

All305 child byte lengths/SHA match. Browser, accepted Linux run and old failed Linux run each retain complete before/after1811-file maps equal to the current frozen map. The supplementary4-log packet carries root's `source_identity`/`source_unchanged` assertions but has **no own per-command full input maps**; this audit does not invent them.

## Browser baseline

Retained actual browser report has **30unique PASS groups /216layout cells /27native zoom observations**, zero captured pageerrors, completed runtime/display cleanup and expected full engine/case selection. Independently executed the current `tests/p05/report-contract.mjs` validator on the actual report: PASS. Its exact-case and unique finite matrix checks cover3engines×3locales×3screens×8layout cells and3×3×3native observations, with declared viewport/DPR/reset and native-isolation requirements. This is validator execution over a retained report, not a new browser run.

Actual recorded versions: Chromium156.0.8078.4, Firefox157.0, WebKit27.2; Node24.22.0, npm11.19.1, Playwright1.64.1. Native observations retain CSS zoom1 plus measured DPR/reflow/native keyboard/window evidence; CSS zoom2 cells are separately identified. WebKit Linux is not Safari/device support. All270PNG files have valid PNG signatures and matched their indexed raw hashes; no all-screen visual/contrast assessment by this reviewer is claimed.

Image receipt `sha256:730c941120c24532e4e4f06350bd99a20ae076a0afd00dc23cb00aea34820edf` matches runner, image-ID file and recorded BuildKit exported manifest-list ID. The archived wrapper/Dockerfile compose a synthetic test server on an internal network with UID1000/read-only/drop-cap restrictions. Raw cleanup log removes the owned DB/network/volume; retained resource-query receipt has empty containers/networks/volumes. No fresh Dockerinspect or byte inspection inside that image was executed here.

The packet is explicitly **baseline protocol1 regression**, not the V2 topic UI matrix. It improves current-source baseline evidence but cannot close topic/advice UI, new consent flows, content HOLD, language meaning or full G1 acceptance.

## Linux units and additional host checks

Accepted Linux unit raw output reports **57 test files /965PASS /3SKIP**,968total. Runner performs `tsc -b --force` before `npm test`. Image `sha256:17ab5bf821f60523c882d634ace69b708d999f80a57fc06322dd326a200dfdbb` matches the accepted image-ID file, its captured imageinspect and the retained attempt01 build export. Both runs use the exact same inspect bytes and complete included source maps; this is evidenced image reuse, not an unexplained image swap. Inspect declares Linux/amd64, UID1000 and `/workspace`; runner declares network none/read-only/cap-drop/no-new-privileges and bounded tmpfs/resources. Remaining owned-container query is empty.

Attempt01 remains **FAIL_PREPARATION_BUILD_STEP_MISSING**, with937PASS/3SKIP and54passed/3failed test files; its raw missing-dist/prebuild failure is not relabeled as product failure or accepted unit coverage. The new pass is a separate run with the prerequisite build. Neither run is full quality: no full `quality` command, container integration, browser, schema/doc/manifest/negative gate completion is inferred from `npm test` alone.

Additional host logs retain `check:schemas`, `check:i18n`, Python117PASS and native reporter44PASS with declared root-observed exit0. The reporter cases include explicit isolated command-boundary controls; they are not44actual Docker/browser runs. Equal localization keys do not establish genuine competent RU/EN/TR content approval. Global included `check_docs.py` still has the separately reported historical encoding failure; the prospective candidate is not integrated or accepted by this packet.

## Limits and handoff

No new artifact mismatch or source defect was found in this bounded supplement. The source-bound dirty/preflight nature, original raw FAIL, synthetic content and no-full-stage flags remain intact. Root's V2 browser/restore corrections and ENGINE2 measurement work are separate ongoing gates, not completed by this baseline/unit audit. Owner450 HOLD, reviewed-pack and genuine language acceptance remain open.

[checks.json](checks.json), [audit.py](audit.py), [input-pins.json](input-pins.json) and [browser-validator.txt](browser-validator.txt) preserve reproducible scope and checks. The first diagnostic assertion failed because it searched ANSI-colored raw unit output for an uncolored literal; final parsing removes only terminal ANSI and does not rewrite the raw evidence. One exploratory Windows default-decoding read also failed before writing. Both are preserved in the own journal and do not alter source or packet results.

Only this new excluded report directory and the reviewer's own journal were written. Included source/tests/validators, foreign reports/raw packets, approved registry and FILE_MANIFEST were untouched. No P06 or later-stage work resumed.
