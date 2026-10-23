# A17 Layout16 first-shard failure: independent focused diagnosis

Status: `ACTUAL_FAIL_RETAINED_FOCUSED_DIAGNOSIS_COMPLETE`. The saved actual remains **0 PASS / 1 FAIL / 50 NOT_RUN**, root exit **1**, saved owned-resource cleanup **PASS**. This report supplies neither layout acceptance nor an APP correction. Review performed 2026-10-21 UTC; no browser, Docker, API, SQL or other native workload was launched.

## Exact checked evidence

`INPUT_PINS.json` records exact bytes and SHA-256 for all inspected inputs, including the 1,871 materialized source files. Source identity is `93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d`; test image is `sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2`. Run: `.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-v2-layout-2869c29ddbd2`; root stdout/exit: `.artifacts/p05-layout16-a17-chromium-ru01.*`. Root ACK SHA-256: `defc6c4ffd38690473349b3501a2cf5f24f87bddb88c34fd8073f1203fb0c1a9`; prior method INDEX: `aa4bcb3daa8e0430ca0a4fa1e02493a6c4a658a966b2b14a6d1c3484fcf4b77a`; producer runtime digest: `4a18ef21bef61e66765e998ca04eb46efff22083e22bc62efda684e08aee82c8`.

The independent audit matched source before/after maps to freeze14 and freshly checked all 1,871 files, the runtime digest, current producer top-level bytes against saved producer-before, and 73 copied run-producer files. Runtime/source changes during this run are not indicated. The typed harness derivative has exactly its two declared semantic replacements; `synthetic_source_only` and `synthetic_fixture_only` remain true. This is a presentation-only DOM clone with owner-R4 text, not authentication, API, consent-state or production acceptance.

## Established failure and method gap

The first record is `chromium/ru/entry/w320`. Its sampled entry controls have zero contrast failures/unresolved values and passing keyboard/focus evidence for five controls. This supports the sampled A17 control contrast correction, but the record itself still fails.

The first text observation is `Q-1168/ru/question`, revision 2, private surface, one 275-character paragraph. Saved geometry is width 320, height 568, DPR 1, CSS zoom 1, document scroll/client width 320, text matches true, clipped false, last paragraph bottom **2672.265625**, scroll top **20**, bottom_reachable false. The saved audit has no horizontal overflow or contrast failures. Exact terminal location `real-text-probe.mjs:29:114` is the assertion on `bottom_reachable`.

In this frozen producer, `real-text-probe.mjs:26` defines that name as the immediate condition `rect.bottom > 0 && rect.bottom <= window.innerHeight + 2`. It measures current viewport visibility. Lines 38–40 install the clone, click the first h1, issue exactly one `Control+End`, immediately evaluate geometry once, then assert. There is no animation-frame/end-state observation, root maximum-scroll measurement or active-element evidence. A completed keypress call alone does not supply the omitted final geometry proof.

The concrete method defect is therefore an immediate single-sample assertion that can reject an intermediate scroll state. The actual reason for this run's scroll top 20 remains **UNKNOWN**: key handling, focus, scroll settlement and a persistent inability to reach the bottom cannot be distinguished from saved data. Neither native smooth scrolling nor a focus defect is asserted as the actual cause. APP clipping/overflow is not established: the observed clipping check is false, horizontal width is exact, and inspected production body/main styles do not establish a fixed-height, root-overflow restriction. This does not prove every APP geometry is correct.

The sole entry screenshot predates this text-clone measurement; it is not a failed-clone image and cannot prove the final text endpoint. No failed-clone screenshot is saved. The first-shard run ended in approximately 8.746 seconds; no phase-budget exhaustion is reported.

## Finite cold proof and smallest correction

`scroll-countermodel.mjs` invokes the exact exported `measureOwnerText`, assertion and absolute-budget helper with an inert page model. It reproduces failure after exactly one intermediate geometry read, records failure and cleanup, and separately shows that a synthetic reachable endpoint passes the unchanged strict assertion. Exit **0**. This proves the method permits this false-failure pattern; it does not simulate native scrolling or prove that this actual browser later reached that endpoint. Static evidence audit exit **0**. No additional native experiment is needed to establish the sampling gap.

The smallest justified next change is confined to the method: after the existing single physical `Control+End`, observe the existing strict bottom predicate through animation frames inside the original absolute budget. Retain geometry and fail if the strict condition never holds. Preserve clipping, width, text, fixture, cleanup and other assertions. No APP change, arbitrary sleep, repeated key action, programmed scrolling, threshold relaxation, extra budget or retrospective PASS is justified by this diagnosis. A separate author/reviewer cycle and exact newly authorized actual run remain necessary. Root has authorized that separate minimal method17 author task; this packet does not accept its implementation.

Saved cleanup output lists the owned database container, isolated network and postgres-data volume removed; saved remaining-owned-object files are empty. This is saved run evidence, not a fresh global Docker inventory. No private DOM, session, ENV, volume or database contents were read. Original failures and typed limitations are preserved.

## Reviewer attempt history

Two audit attempts exited **1** due to reviewer checks: assertion-token column versus stack member column, then an overbroad absence check for `scrollHeight` that also matched legitimate paragraph clipping code. Saved scripts/stderr remain in this packet; corrected checks pass. A guessed local dependency source path was absent and contributes no semantic conclusion. These were review-tool mistakes, not additional product failures.

All owned output is frozen by `INDEX.json`; no APP, producer, ACK or historical source was edited. `COMPLETE_STOP`.
