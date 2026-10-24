# A32 WebKit/RU — factual third-shard failure

Actual host session55415 ended2026-10-23T04:43:44.9140302Z exit1. Source29/core d9c779/1895 selected Git5f4b, testsimagecc05/runtime d94fb. Actual51-cell shard:35 PASS,1 FAIL,15 NOT_RUN;8 completed keyboard actions,9 preparations,0 page errors; browser and runner cleanup PASS.

Failed cell webkit/ru/private_offer/native200, primary role, checkpoint KEYBOARD_FOCUS: KEYBOARD_FOCUS_OUTSIDE. Existing keyboard-first-failure.json is ORIGINAL_FIRST_FOCUS_SAMPLE: conversation-stop focus-visible, in_viewport=false; rect top587.881591796875/bottom631.8796501159668; viewport308×463, scrolltop3467. This is the original first sample, no replay or favorable later sample. Internal browser cause is not established by this packet.

No failure screenshot is expected because first-focus validation precedes role capture; the failed record has no captured roles. All69 existing actual PNGs and original raw/producer files remain at original paths, hashed in RAW_FILES.json. Absent post-failure screenshot is not a separate artifact failure. Selected reports/logs/inputs/first-sample are copied exactly; inputs before/after match.

First two A32 shards were reported PASS by root and are not re-audited or combined here; no full-matrix acceptance. This packet records the third failure only. No tests/repro/helper/native/Docker/APP/Git/WIP/registry/status/manifest writes. Independent diagnosis remains separate. Full P05 acceptance and P06 remain false.
