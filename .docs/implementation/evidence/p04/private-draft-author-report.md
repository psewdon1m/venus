# P04 · Private-pair draft authoring report

Author: agent `codex-p04-private-ip-draft-author` / `codex-p04-private-online-draft-author`. This is an authoring report, not independent gate review, rights clearance or human editorial/localization approval.

Added150 drafts after the original300-card preparation set:75 in-person-only cards Q/TD/YB-1101..1125 and75 online-only cards Q/TD/YB-1126..1150. Each context has25 cards per mode and5 per category. The current set contains450 draft cards,150 per mode,30 per category/mode, zero reviewed cards. Existing IDs1001..1100 were not edited by this subtask.

All new cards are pair_private, two participants, bilateral consent, friend_or_more scope, comfort1 and stage3. In-person cards assume an already available mutually chosen private moment and do not instruct anyone to leave or isolate. Online cards actually use pair-only text exchange and require private_text_chat. Neither group requires physical contact, going away, media playback, attachments, screenshots, proof, identifying details, contact information or relationship disclosure. Text includes both P1/P2 roles in all corresponding RU/EN/TR fields; the Yes But responder retains the freedom to set a condition or decline. The draft wording requests optional low-risk creative ideas/preferences, without romantic confessions.

Six IP requests were validated and reserved before IP materialization against the exact300-card base pack `sha256:5e6b10ee99e3a44f808434598114b3ef3686326b36ed701cbaef9f310ea3eb9e`. Six online requests were then validated and reserved before online materialization against the actual375-card base pack `sha256:5c37ab39aad02d82158582378f560e14454610bb4ca5405046a9824d924e22b6`. All12 batches were recorded through the real v2 AuthoringLedger CLI, with dedicated author IDs and20+5 ranges per mode/context. Last export:54 events, head `fcb3d987fd319b221d36e1ce4cbbd7bd55483b81b82a3f9dfe0eec297248e6b2`. Durable exports are `authoring-private-{ip,online}-{Q,TD,YB}-{001,002}.json`.

Bounded source files preserve the actual creation timestamps: IP2026-10-19T00:53:14Z; online2026-10-19T00:56:35Z. No external card collection was used. status=draft, rights_status=needs_review and null reviewer/date remain unchanged. Human originality, rights, cultural suitability, safety, similarity, diversity and tri-locale review are still pending.

Actual local machine checks:

- CARD schema/semantic validation:375/375 and450/450 parsed, zero errors.
- Actual CLI analyze + FrozenPack + both complete P04-C2 coverage runs completed for375 and450.
- Final450 analysis: zero exact normalized duplicates, 0 threshold .78 token-Jaccard queue pairs, no category above20%. The uncalibrated queue does not prove semantic originality.
- Historical375 cap[] private coverage PASS, conditional private_text_chat CONTENT_GAP:840 online cells lacked baseline content. This observed gap is retained in `draft-author-375/`, not relabeled. Its index has375 files, no online IDs, matching catalog digest and375/375 current byte hashes.
- Final450 cap[] and conditional private_text_chat private coverage both PASS; neutral20 both PASS. Full exact counts are below. Conditional coverage is a content compatibility test, not a statement that production chat is enabled.

```json
{
  "coverage.json": {
    "protocol": "P04-C2",
    "capabilities": [],
    "neutral20": "PASS",
    "private_coverage": "PASS",
    "eligibility_cells": 5880,
    "cell_statuses": {
      "RULE_EXCLUDED_STAGE": 2940,
      "RULE_EXCLUDED_COMFORT": 588,
      "RULE_EXCLUDED_CLASS": 672,
      "CAPABILITY_UNAVAILABLE": 840,
      "SUPPORTED": 840
    },
    "neutral_sessions": {
      "PASS": 4200,
      "EXPECTED_REFUSAL": 14
    },
    "private_sessions": {
      "CAPABILITY_UNAVAILABLE": 210,
      "PASS": 210
    },
    "private_rounds_min": 8,
    "private_rounds_max": 25
  },
  "coverage-private-chat.json": {
    "protocol": "P04-C2",
    "capabilities": [
      "private_text_chat"
    ],
    "neutral20": "PASS",
    "private_coverage": "PASS",
    "eligibility_cells": 5880,
    "cell_statuses": {
      "RULE_EXCLUDED_STAGE": 2940,
      "RULE_EXCLUDED_COMFORT": 588,
      "RULE_EXCLUDED_CLASS": 672,
      "SUPPORTED": 1680
    },
    "neutral_sessions": {
      "PASS": 4200,
      "EXPECTED_REFUSAL": 14
    },
    "private_sessions": {
      "PASS": 420
    },
    "private_rounds_min": 7,
    "private_rounds_max": 25
  }
}
```

Final draft catalog digest: `08b327efd3071608ec14b21de6ebeaf91793f61d43c1a71968921967944ba306`. Final draft pack digest: `sha256:33ea855f5d03e15143728928fa89607512e386d390627008d883de68543bb45c`.

The complete local evidence and human reading packages are preserved separately as `draft-author-375/` and `draft-author-450/`; each output-sha256.json binds its exact copied files. The final450 input index has450 files and450/450 current byte-hash matches. Historical300 evidence was also checked against its saved output hashes and remains unchanged.

These are development checks on a dirty source tree, not a source-frozen final gate PASS. The root agent must rerun final checks after implementation freeze and obtain independent gate reports. No human registry, signatures, approval record or release publication was fabricated. Production remains blocked until real human review and remaining stage conditions are satisfied.

Rollback: keep the prior active reviewed pack unchanged. Draft IDs stay permanently reserved; reject/withdraw or explicitly revise the same draft ID rather than recycling it. New drafts do not change any production pack pointer.
