# TG-CHAT-002 — preliminary independent source review

Verdict **CHANGES_REQUESTED_PRELIMINARY**, severity **P2**. V2 shared text validation accepts lone UTF16 surrogates contrary to P05_PRIVATE_CHAT and the explicit scalar guard in legacy chatInput.

Independent public sendChat boundary probe on exact copied/transpiled TopicGames source a7b864450a13c1d23fe210ae206c3faaa510b9e54e9b633e79c46e815d0919d5:4PASS/3FAIL, exit1. Highsurrogate, lowsurrogate and embedded lone surrogate all reach the mutation/persistence boundary. ValidASCII and validastral positive controls pass; bidi and whitespace negative controls reject. The mutation seam only records reachability; actual HTTP/PG persistence is not claimed. Input source remained unchanged during this probe. Product is not globally frozen yet.

Required correction: reject malformed Unicode scalars in the common text validator, preserve legitimate surrogate pairs, and verify invalidchat HTTP400 without quota/message/receipt writes. Retain this before-fix probe/report and run a fresh after-fix packet. Root acknowledged finding and is authoring the correction. No product/producer writes by reviewer.
