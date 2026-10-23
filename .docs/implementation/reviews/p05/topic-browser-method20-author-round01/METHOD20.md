# METHOD20: новый own response немедленно блокирует старый batch

Additive correction after independent19 P2. Pending batch records ownResponseArrived synchronously before awaiting/decoding response body. Malformed/rejected body therefore cannot leave old accepted permissions ready. Unanswered ordinary request may still retain the exact unexpired accepted batch as in19. All other18 semantics, min250ms, original TTL/deadlines, native clocks, setup/scenarios and application source unchanged. No actual RUN yet.
