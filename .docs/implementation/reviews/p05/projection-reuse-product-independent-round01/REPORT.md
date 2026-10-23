# Independent projection reuse application review

**PASS_SCOPED_PRODUCT_CHANGE_AND_IMAGE_BINDING. PASS_OPERATIONAL_METHOD20_REBIND_ONLY.** No actionable finding remains in the reviewed delta. No Docker/browser or functional regression was executed by this reviewer. Actual latency improvement, complete Chromium16 and full P05 remain unproven.

## Exact scope

Verified author INDEX `d641b3d8aba90cbdd965ca46b1aa8830513afe1754e673f1dc601acbedbd6128` /18 and current inventory `c454631da2b2ede99241555273a35d7b0b4124c76f30ab3632bf2ba48d540d40` /1825 before/after own finite tests. Compared with AA1823: only topic-games.ts changed; the projection test and source-revision record were added. AST comparison confirms86 TopicGames members unchanged, six changed (`dto`, `prepareProjection`, `prepared`, three delivery callers), two added (`projectionMatches`, `namesDigest`), none removed. Prepared metadata is additive, scoped inside encrypted member/session storage. No DB schema, wire type, frontend, planner/engine, policy or RNG change.

## Safety and behavior

The cache hit follows existing actor authorization and full reconciliation. Reconcile still advances/persists round and conversation clock floors, reconciles consent/presence/boot/safety, and runs engine expiration. Parent, offer or advice expiration changes engine state/revision and invalidates old projections. Cached payload does not skip that process.

Reuse requires exact member, locale, sorted fresh public-name digest, schema, boot, game revision, round, conversation revision/epoch and safety state, plus **strictly more than2s** on the original absolute projection expiry. A hit does not store a projection, renew its expiry, advance stream revision or replace private refs. Initial/mismatched/near-expiry preparation still computes the DTO and publishes a fresh stream/ref through the original transaction. Missing old metadata cannot hit. The DTO miss path reuses already loaded names/conversation but still projects and stores engine state.

Final HTTP/WS/chat delivery independently reads current locale/names and conversation, matches the projection, and retains previous source, safety, boot, game/round, participant/presence, invitation, parent/offer, monotonic floor and absolute projection-expiry fences. The captured final delivery fence still runs again immediately before enqueue. Delayed completion cannot turn an expired projection into a grant. Returning a copied view with current server_time and unchanged absolute parent/offer/advice expiries prevents old stored server timestamps from inflating a later first-read relative deadline. It does not extend projection or consent TTL. Existing final checks remain authoritative even if the earlier >2s hit margin is consumed by IO.

## Independent tests and inherited evidence

Used the existing Vitest runner in an own excluded clone of the nine author tests, changing only four relative import/mock paths, then appending six focused boundary tests. **15/15 PASS, exit0**: strict2s cutoff/no sliding expiry; captured-view expiration after construction; reconciliation refusal before hit; parent expiry during names IO; stable digest despite SELECT row order and missing legacy digest denial; projection timestamp cannot outlive parent. Original tests additionally cover first publication, member isolation, locale/name/conv/epoch/game/safety changes, boot/member mismatch, fresh timestamps and source/presence/clock fences. Source inventory after this command remains exact c454/1825. Test storage/SQL/reconcile dependencies are explicit doubles; this is not actual PG/ACL/WS performance proof.

The frozen author's focused95, full-host863 PASS/208 platform SKIP, lint/typecheck0 are retained as author executions, not independently rerun wholesale. Prior safe-error assertion failure and map assembly failure remain preserved; they were not relabeled PASS. Own input/binding/source-delta commands and15-test command all exit0. No new general testing framework or product change was introduced.

## Image and operational rebind

Receipt `e0c99a63d62d69c152bb3a989267a89910a1d0a5f0fd80281e64d3fe0b073921` binds image `sha256:9e1a7ee66230b3b5c362a4f5f08fff6bef04899e10796129392fe7a28ab5e355` to c454/1825. Verified203 source and64 compiled host hashes, seven SQL entries as a source subset, and three served-web entries in the actual image receipt:270 unique pins. Actual served web exactly equals prior AA/ef5 image; host web asset names are not used as authority. Changed image paths are only topic-games source/compiled plus the new test source. Root's build/probe exit0, auto-removal, build-log hash and unchanged-source record are internally consistent. No independent new Docker probe is claimed.

Outer `6ca2dff8b962ed4a870562b46117daa8093549483d4ff446f8aa1e5f35486034` equals previously accepted METHOD20 outer11c8e6 after exactly four single literal replacements: image, source identity,1823→1825 and ACK path. Draft `80441fa1e70bbf20b344653d9500e959c939c9c1c38acb0d0694f7c7f44d3c4a` stays rootACK false. All ten runtime20 pins match exact actual20 producer; source frontend/cache/contracts also unchanged. No observer/oracle/setup/deadline/permissions or scenario changes occur in this rebind. Fresh root ACK is required before one actual attempt.

Actual20 AA failure remains6 PASS/07 FAIL/9 NOT_RUN: batch6.20s exceeded its5s own permission. This optimization removes repeated publication work, but that does not prove the exact bottleneck or establish faster execution. A genuine fresh batch and all remaining functional cases must pass on this source/image before the browser gate can close. Human-card HOLD, rollback14, statistics, layout, clean-source and full-stage gates remain separate. Writes COMPLETE.
