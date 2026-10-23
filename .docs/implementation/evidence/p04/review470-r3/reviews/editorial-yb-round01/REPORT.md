# Independent YB correction review — round 01

Review timestamp: see `initial-pins.json` capture time; completion preceded round02 capture. Reviewer did not implement the candidate. Scope is root-authored P04 R3 YB corrections only; P05 is outside this review and untouched.

## Outcome

**Scoped correction gate: CHANGES_REQUESTED — five targeted language/readability corrections below.** All 56 changed YB proposals were read alongside their exact owner notes and full RU/EN/TR text. All 150 YB responder triplets were checked. This does not confer human editorial, qualified language, safety or rights approval; owner review450 HOLD and full stage gates are unaffected.

Exact input bytes and before/after raw + canonical hashes are recorded in `review-inputs-yb150.json`, with initial raw pins in `initial-pins.json`. The independent script `verify-yb.mjs` completed exit 0: **119 checks, zero automated failures**, 150 YB records, 56 changed YB, 25 YB carrying the offline-private owner note. Automated checks do not replace the manual findings.

## Findings requiring correction

1. **P2 — YB-1021 `/text/tr/proposal`: preserve three dishes, rather than three seasons.** `üç mevsimlik yemek` is ambiguous between three seasonal dishes and food lasting/covering three seasons. RU/EN explicitly request three dishes and then change the season. Use `mevsime uygun üç yemek sunan bir masal kafesi` or equivalent.
2. **P2 — YB-1062 `/text/tr/proposal`: preserve reciprocal swapping.** RU `поменяться значениями` and EN `swapping meanings` ask the two words to exchange meanings with one another. TR `anlamlarını değiştirmek` merely says change their meanings. Use `anlamlarını birbiriyle değiştirmek` or `anlamlarını takas etmek`.
3. **P2 — YB-1116 `/text/ru/proposal`: remove the mechanical privacy pile-up.** Current opening is `{P1}, в личном чате если оба хотите, предложи {P2} в вашем разговоре только между вами ...`. The new channel insertion leaves several overlapping privacy phrases and awkward word order. Keep one clear `в личном чате`, the fictional scene, and the statement that no real joke is needed. Shared responder already retains refusal/withdrawal.
4. **P2 — YB-1119 `/text/ru/proposal`: remove the same doubled privacy instruction.** Current opening `{P1}, в личном чате если оба хотите, предложи {P2} только между вами ...` overloads the invitation after channel insertion. A natural form starts `{P1}, предложи {P2} в личном чате придумать ...`; retain fictional friends and no need to disclose real habits.
5. **P2 — YB-1179 `/text/en/proposal`: natural placement of the channel.** Current `to in private chat invent` is a mechanical insertion in an awkward infinitive. Use `to invent a funny explanation ... in private chat`, with the voluntary condition preserved by the common responder or natural clause.

Root must update its derived ledger after fixing the final card bytes, then request independent repeat review. Initial FAIL and exact inputs remain preserved.

## Coverage and accepted correction observations

- YB-1021, 1022, 1028, 1031, 1032: concrete P2 changes to season/weather/fog/stair material/leaf colour create a shared scene and a meaningful response, rather than a project worksheet. YB-1021 has the TR clarification above.
- YB-1047, 1051: P2 can add unexpected instrument sound or wind changing the music. The response changes the story; no music performance, research or physical task is required.
- YB-1061, 1062, 1064: replace nearby charter/committee/instruction operations with spoon escape, word meeting, and stool party. YB-1062 has the reciprocal TR clarification above.
- YB-1071: short shared cloud story; right to decline and conditions are in the common responder. No duplicated skip flow remains in the proposal.
- YB-1102, 1104, 1107, 1130: early neutral public pair, stage 1, comfort 0, acquaintance, bilateral; no private capability or relationship prerequisite. New texts do not appoint an unwilling pair; runtime quiet preconsent remains a separate obligation.
- YB-1108, 1109, 1110, 1111, 1112, 1114, 1115, 1116, 1117, 1118, 1119, 1124, 1160, 1161, 1162, 1163, 1164, 1165, 1166, 1167, 1168, 1179 (and other retained offline-private cards): explicit `private_text_chat` capability is required. Private source metadata is a guard, not proof that this chat is available in `in_person`. If runtime exposes it online only, offline cards must be withheld. No movement, fake local chat availability, or mandatory disclosure is introduced. The source-only review does not certify delivery/runtime guards.
- YB-1117: fictional drawings invite guests at a gallery opening; each adds an invitation detail. The former long administrative invitation is removed.
- YB-1124: two fictional closing lines clearly constitute play; the proposal no longer conflates roleplay with ending/skipping the real turn.
- YB-1145: concrete corner in flying garden plus partner's changed route restores a shared fictional change.
- YB-1151–1176: all 26 former responder B cards now exactly match the other 124 responder triplets. Each locale provides agreement without a condition, a condition, or refusal without explanation. P1 freely decides a condition and both explicitly confirm before starting; either can withdraw. TR `özgürce değerlendirmelidir` is read with the following mandatory bilateral confirmation, which prevents treating evaluation alone as acceptance.
- YB-1159: `приключение по силам` / `an adventure that suits them` / `gücüne uygun bir macera` removes the earlier calque; three short lines are retained.
- YB-1161: wholly fictional visit and explicit absence of a personal-experience requirement preserve the requested imaginary alternative.
- YB-1166: no photographs is a fictional scenario; card promises no technical prohibition on photography or confidentiality guarantee.
- YB-1172: RU now includes `от ... к ...`; full RU/EN/TR meanings align. This is a fictional note, with open reply permitted.
- YB-1180: two interpretations are explicitly equally valid in every locale; no winner, comparative rating or performance requirement remains.

All 56 changed IDs are covered in the hash-bound records; the list above groups identical owner-note checks without implying sampling. No long quotation, brand use or requirement to copy external material was introduced by these corrections. This is an agent content observation, not legal or rights clearance.

## Owner global guidance and limits

Owner DELTA365 §4 and §6 were read together with the action-item notes and §7 examples. The inconsistent 224/141 introductory count is resolved in favour of the detailed 226/139 decision table, appendix and explicit actions139. Existing accepted 94 YB revisions were not reopened except the mandated all150 responder consistency check. The full 470 catalog activation is not authorized by this review.

§4.3 quiet pair readiness before public P1/P2 display, §4.4 both independent relationship directions/global comfort, and §4.5 voluntary progression require runtime proof. §6 semantic clusters and operation limits remain queue/session obligations; changed fictional operations reduce the local repetition but cannot establish queue ordering or session diversity by themselves. The independent runtime/traceability reviewer owns those checks. Qualified RU/EN/TR, human editorial, rights and owner acceptance remain pending.


