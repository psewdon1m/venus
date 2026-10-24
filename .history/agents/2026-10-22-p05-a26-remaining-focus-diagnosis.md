# P05 A26 remaining Firefox textarea clipping — independent diagnosis

## Actual 2026-10-22 UTC
Read source23/p05/venus-v2-layout-deb143059dc4: actual36PASS1FAIL14NOT_RUN (rootinitial35/15 corrected), cleanupPASS/source27f1881/image48c/runtimec156. Private_active/w320 SECONDARYpair-chat-input firstrect504.4..604.4>568,scroll3932,actualdocumentfocus predicate true/visible/nonoccluded/contrastpass. First27c4a5c5873dc6dde0ef31e0da3b8c5d615ceadd82e186ef48e505df64c115e8/report014c3da82bd2a150aa32e9229a71fd2527968ce998eb30f0cecabf290dbfd1f6/runner36038ab2fb116149061f4c021408afd0c77b629842f2ab584e7c42fd974090ef. No causaltrace inthisruntime; inviteexplicitclick correction doesnotguaranteefullgenericnativecaret visibility. No APP causeclaim fromthissamplealone.

## Independently verified upstream mechanism
Primary current-main URLs read via web, not downloaded or treated as exact pinned1555 source:
- https://raw.githubusercontent.com/mozilla-firefox/firefox/main/dom/base/Selection.cpp :3690..3715 async selection scroll earlyrunner,3766 arbitrarycaretrect forwarded.
- https://raw.githubusercontent.com/mozilla-firefox/firefox/main/layout/base/PresShell.cpp :3779..3782 arbitraryrect omitselementscroll-margin,3417..3426+3443..3445 scrollcontainerpaddingstillaffects visibility/placement.
This supports document scroll-padding ratherthanmoreelementscroll-margin/overflow-anchor/timers/handlers. Currentupstream!=vendored157/revision1555, so exactbinarycause and success remain nativevalidation pending.

## Minimal APP candidate sent root
html {scroll-padding-block:min(30vh,120px);} only. At568viewportpadding120 leaves328px,100pxtextareaplusoutlinefits; at320lowheightpadding96 leaves128px,100pxplusoutlinefits. Symmetricpadding preserves idealcenter, no boxlayoutwidth/height/input/consent/TTL/oracle changes. No new RAF/timers/listeners/repairloop/waits/retries. This supersedes earlier overflow-anchor hypothesis (not specific to evidenced selection writer). Keep explicitinviteclick andmain/textarea handlers unchanged for controlled comparison.

Frontendonlyfuturechange must preserve exactA26compiledbackend/source-slice/pack/map/modelmethod binding to currentuniformstatistics; do not resampleoriginalbackendcases forCSS. Existing evidence keeps originalsource27f labels and qualified equality, no new mixedrawassembler/wholeAPPstatisticalclaim. Rootreportedmethodprereg8960c682/tagp05-uniform-a26-method-prereg-20261022/e19dfe32 witness and supplementary23999exit0; reviewer didnot verify those actuals here andassignsno matrixcredit.

Root andfocusauthor notified. Reviewer no APPwrites/newdiagnostics/tests/Docker/native/framework. No newpacketrequested; journalonly. COMPLETE_STOP.
UTC completion 2026-10-22T22:05:44.6060038Z
