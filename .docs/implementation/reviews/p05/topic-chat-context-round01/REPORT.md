# Independent protocol2 chat review — round01

Verdict: **CHANGES_REQUESTED**, TG-CHAT-001 **P1**. Component policy reproduction: **0 PASS / 3 FAIL**, actual probe exit1; runner successfully collected the defect and cleaned its own resources (exit0). This is dirty frozen-source component evidence, not full P05 acceptance.

## Confirmed defect

P05_PRIVATE_CHAT specifies `private_text_chat` only when the operator enables chat and room context is `online`; `in_person` snapshots must not advertise it. TopicGames instead hardcodes the capability during draftSnapshot, offers self-actions.chat without a context/config check, and sends/reads chat without such a guard. server.ts supplies VENUS_PRIVATE_TEXT_CHAT only to legacy Games, never TopicGames.

Frozen source `1d4de7ebb897bcd93f76e66f966650dfbc3b6d9c378da352dbb3a926faedf143` (1803 files), existing frozen image `3e253902de3a3d1bf23f1f9c494fb7e970aa83f634d6e29ceb9debf1322e277a`; own unique project `venus-chat-context-review-b856eb032919`. No image rebuild or product source mount. One excluded review script imports the image's real HTTP/PG/lifecycle/registry/provider harness; synthetic source content, fixture clock/policy/SQL wrapper are explicitly inherited. The ordinary production entrypoint is not exercised.

Actual in_person room: bilateral invitation and topic acceptance; frozen baseline context in_person with capabilities=[private_text_chat]; actor POST /conversation/chat returned200, peer GET returned200 and contained the synthetic canary, and self-actions advertised chat:true. Exact structured observations are in actual-independent-report.json; no session cookies or real private data are archived. This is a policy bypass for otherwise authorized pair actors, **not** cross-actor disclosure or bypass of bilateral consent.

VENUS_PRIVATE_TEXT_CHAT=false was present in the container environment, but harness does not parse it: operator-off omission is confirmed by source wiring, not claimed as an actual ordinary production-server positiveV2 test. Both source inventory identities and file maps before/after are equal. Owned containers/networks/volumes are empty after cleanup; generated secret and temporary directory removed by runner.

## Required fix and verification

Pass the exact backend chat capability into TopicGames. New snapshots advertise it only online+enabled. Enforce current context, immutable snapshot capability and current backend flag on POST, GET, self-actions and final delivery; old snapshots must not acquire capability on flag changes. Keep in_person prompts usable without chat grant. Disabling chat after a snapshot must not retain usable online chat or represent an unavailable online private transport as available; align existing reconciliation contract.

Fresh controls must cover online enabled positive, online disabled denial, in_person enabled/disabled denial, snapshots without capability, feature-off after snapshot/boot, recipient role and final awaited-context/flag fences, unchanged storage after denied writes, and exact retries. Existing lifecycle integration uses h.create hardcoded in_person and its boot case intentionally posts chat200; that test must be corrected to the authoritative context rather than retained as policy acceptance. Re-run affected actual Games/lifecycle proof plus independent review on new bytes.

## Separate limit compatibility question

Legacy P05_PRIVATE_CHAT explicitly requires12 new messages/minute/actor and128/round, polling last32. Protocol2 source uses100 messages and65536 bytes per current epoch, with no minute limiter; replacement deletes epoch chat. The new topic design explicitly changes epoch transport but no explicit superseding quota decision was found. This is a separate OPEN compatibility question, not silently accepted or a second actual rate-limit finding. Decide/document inherited versus intentionally revised limits before gate acceptance; if inherited, add actor/minute and round-wide controls across epochs. No 13-message runtime test is claimed here.

## Bounds and immutable inputs

source-pins.json maps original paths to exact opaque byte snapshots, avoiding invalid partial-document relative links. actual-* preserves raw source inventories, compose, image metadata, probe stdout/exit, and owned cleanup inspections. Parent same exec handle55009 ended0. Owner450 HOLD, clean-source/stage acceptance, browser behavior, production, mobile and real restore remain outside this review.
