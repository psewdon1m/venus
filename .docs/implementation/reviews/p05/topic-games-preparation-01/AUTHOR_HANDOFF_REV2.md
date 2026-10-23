# Topic Games V2 author handoff, revision 2

Scope: correction for independent TG-REV-001. WRITES_PAUSED; independent round02 required.

The original 18-case proof and review round01 remain unchanged. Round01 proved incorrect success receipt on a different URL target, with no proved second consent grant. Author public-method regression tests reproduced four failures before correction (plus two positive controls); raw `.artifacts/p05-topic-games-idempotency-beforefix.txt` preserved.

The shared mutation helper now fingerprints canonical `{input, operation, scope: target}`. Targets are explicit structured objects: `{}` for room-level prepare/start, `{sessionId}` for session actions, `{sessionId,roundId}` for round/conversation/chat actions. Room/member/request remain the database key and operation remains an explicit stored discriminator. No raw URL concatenation or duplicated actor ACL was added. Exact retry returns its original receipt without another mutation; changed scope/body/operation returns `409 IDEMPOTENCY_CONFLICT` before grant or receipt changes.

Compatibility: historical body-only hashes are not guessed or migrated. They conservatively conflict, including exact URL retry, because the old stored record cannot establish its URL target. A rollback to the old implementation similarly cannot match newly structured hashes; it must not reinterpret them as body-only receipts. Immutable migrations and historical evidence were not modified.

Author verification: 36/36 scoped tests PASS, including actual shared replay logic with real HMAC/AEAD and explicit SQL/auth doubles, 13 public scope-wiring controls, old-hash negative and previous model/display regressions. Global typecheck, scoped lint, Node syntax and build exit0. New actual producer cases19/20 add exact retries and crossed session/round/body/operation conflicts, checking game revision/state, exact round cipher, encrypted sidecar object metadata and receipt counts.

Read-only observation of root-owned actual run `venus-topic-games-521e76f044d3`: runner PASS, exactly20 unique PASS checks, cleanup completed. Source identity `38a117dbd52dc3e6a5e3db8f42bf524a0bd097b0d595be302631c1ede94b8aaa`; image `sha256:3192b2d46772ea434977ef918bdd81775f5fb459fea1a8080c596d082907bc94`. Root retains terminal handle and immutable archive; consult root receipts for terminal confirmation.

Source pins: TopicGames `8154111ff8a85923c315c183fd4f3a1c9b547da4c8a025baaa3c407ae2832b83`; new author tests `0d6fd5c5652bf947b44b09c462202abc3ba639dad3ce87d5ed7bc6ed5c1b1595`; producer `347626fe6860fa650ca18ae6a7b30f0ccbfc438dbebbe7e4cafd47fc07dd7aeb`; new actual cases `edd4ace15d3e3bc91e1e633952a4a61633bb89f0bda818f5e2c965f7618aff41`.

Internal review helper signature changed to `mutation(room,credential,input,operation,target,safety,fn)`. Fresh reviewer probes must pass explicit scope; original failing probes/reports remain untouched.

All previously open composition/browser/production websocket/cross-mode semantic-canary/full-stage requirements remain open. This correction does not promote the component proof to P05 PASS.

Root subsequently confirmed same handle68980 terminal exit0 and immutable archive `topic-games-preflight-05/` (ZIP643cd731..., index0417e6f...; full hashes in root receipts). Included source before/after unchanged. Independent round02 requested using this frozen image; backend writes remain paused.
