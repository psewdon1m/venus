# P04-r2 independent review — round 01

Result: **CHANGES_REQUESTED**, scoped to adherence of draft processing to the owner's 450-card HOLD review. This is not human editorial approval, rights clearance, approved pack release, or EXIT-P04.

Reviewed at: 2026-10-19T12:44:56.101010+00:00. Workspace includes uncommitted concurrent implementation (`source_dirty: true`). Exact content inputs are recorded in the JSON sidecar and the independent-checks report. The frozen partial candidate is not to be edited; corrections belong in a separately traced full candidate.

## Findings

- **R450-01 / P2 — TD-1108, `text.tr.dare`:** the owner-requested replacement of `kesin açıklama` was applied only to truth. Dare still contains the original phrase. Apply the natural concrete-description correction consistently while preserving the image/description distinction.
- **R450-02 / P1 — 11 YB Turkish proposals:** the rewrite generator places final `öner` after an already complete explanatory clause or question. Affected IDs: YB-1007, YB-1038, YB-1071, YB-1086, YB-1103, YB-1106, YB-1124, YB-1128, YB-1135, YB-1141, YB-1145. Examples include `sesleri sözcüklerle anlatabilirsiniz öner`, `kişisel öykü gerekmiyor öner`, and `nereye gidiyor, ne fark ediyor? öner`. End the infinitive suggestion with `öner`; move the independent qualification into a separate sentence. Check all affected locales for unchanged intent and preserve a revision/hash trail.

## Verified

The author's ten content tests independently reran successfully. A separate read-only audit passed **1,841 assertions** covering exact 450 review-row IDs/comments/decisions, all frozen card-map raw/canonical hashes, no active/quarantine orphans, r1 source-card preservation, the 106-event authoring chain and exact original 54-event prefix, immutable original SQLite bytes, and all original 450 r1 revisions retained in both ledger copies.

The 71 MOVE_TO_RULES cards are absent from active issuance and mapped to 19 explicit UX requirements. Their implementation and runtime scenarios are honestly marked NOT_IMPLEMENTED / NOT_RUN. All 21 semantic clusters and 15 required scenarios are recorded; their presence is not proof of runtime enforcement.

YB-1111 now permits each person's individual veto in RU/EN/TR. YB-1148 is confined to quarantine and describes a voluntary agreement without screenshot/retelling protection. Online private cards retain `private_text_chat`; retained private cards remain stage >=3, and neutral recontextualized cards are made public rather than lowering the private safety threshold. All changed cards remain draft with null human-review identity/date and needs_review rights status.

The 378-card partial catalog is explicitly insufficient as the final balanced 450-card candidate. Full-candidate additions, restoration of neutral/private coverage, semantic-cluster changes and actual C2 will be reviewed in a later independently captured round. No full-stage PASS is issued here.
