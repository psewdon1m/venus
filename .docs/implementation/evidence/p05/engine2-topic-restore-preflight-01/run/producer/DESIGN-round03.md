# P05 restore design — revision03 ordering clarification

Status: DESIGN / NOT_RUN. Author root. Inherits round02 SHA256 93ed0073e1fb92bb6199387c64ad627234e7862c1e877ae80ded524030eeb56b and its pinned round01. Fourteen required controls unchanged.

For RESTORE08/13 the third child must run real TopicGames.bootGate, then a **read-only raw DB assertion immediately after bootGate and before legacy reconciliation, Rooms.maintain, listen or any private/self-actions/target read**. Assert untouched D round stopped, invitation/action acknowledgments revoked, conversation/chat/advice-bearing objects and private refs absent. Preserve and compare the relevant snapshot/history. Record a barrier chronology with child PID, real method return, query completion and listener opening. Only after that observer succeeds may legacy reconciliation, maintenance and listen run, followed by ordinary valid room200 and old exact private command denials.

This proves the startup method performs the revocation, rather than relying on lazy boot-ID checks during the first HTTP request. If reconciliation additionally changes other raw rows, record it separately. The observer never writes or patches grants. Native elapsed and monotonic fixture clock requirements from round02 remain mandatory.
