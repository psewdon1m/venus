# METHOD16 independent repeat review

**PASS_METHOD_ONLY_NOT_BROWSER. No P1/P2 findings in the reviewed change.**
Author INDEX40bedb0d635c7387533401e100e72887510fe74df8af5dffa2dc16657ef6ba03,
25children verified byte-for-byte. Working browser/helper/observer/request modules
match the frozen author packet. Writes are COMPLETE. Root-run ACK remains false;
there was no Docker/browser run or product/source change in this review.

The source comparison confirms only two function bodies differ from METHOD15:
normalPrivateReady gains a failure-evidence catch/rethrow, and acceptActionsUi
changes its shared action deadline/budget constants8000→12000. The new import and
readiness-diagnostics helper accompany that change. All16 case AST bodies remain
exact. Existing private-batch observer, request-emission, runtime, frontend
validators, observations and private ticket/click/control helpers remain exact.

One absolute12s deadline is reused for both actor preparations and emissions. It
does not reset for actor2. The current ticket still expires at the minimum of the
shared deadline and its observed actual permission lease; minimum lease250ms,
same-cycle/scope checks, one exact POST/click, latest receipt revision, required
active chat and all product consent/permission expiries remain unchanged.

Scope precision:12s is the preparation/last-emission deadline. The existing
request helper's15s receipt wait and final coherentGame's8s wait are separate
bounded waits, unchanged from METHOD15. The helper does not assert total phase
completion wall time<=12s after those waits. This acceptance does not claim such
a whole-flow wall cap or extend a private authorization lease.

Failed readiness now retains a fixed-field projection of error.readiness (or
last returned snapshot), synthetic actor locale/member and expected room/member/
session/round/minimum revision. Static reason whitelist, finite bounded numeric
fields, strict booleans, known part/HTTP keys and UUID/locale checks prevent raw
error/DTO/token/private text and arbitrary unknown fields from being copied.
Original exceptions are rethrown; finally still records timestamps/save. This
remains passive observer evidence, never observed app cache.accept/auth generation.

Validation is42 finite controls total:16 new independent VM/AST/privacy controls,
21 author controls replayed with only import/output relocation, and5 prior
source-bound observer diagnosis counterexamples. All exit0; independent syntax
also exit0. Independent tests use exact normalPrivateReady/assertPrivateTicket/
click/acceptActionsUi and request-emission code with explicitly inert page/HTTP/
clock fixtures. They demonstrate the8.078s modeled preparation fits12s only with
a valid current ticket; after12s, expired ticket, second-actor denial and missing
required chat remain failures, without retries/final success. Malformed/unknown
readiness fields do not leak canary values. Exact observer/production validator
controls separately enforce active-chat completeness and unchanged5s permission.

Reviewer fixture mistakes are retained: first VM attempt omitted the global phase
and failed; second inert expired fixture reset its own fake clock and was stopped
after identifying only its exact node PID160784. Neither failure executed product,
browser or Docker code. The reviewer fixture was corrected; no author code changed.

Operational limits remain: inherited run.mjs is an inert historical template with
older source/image pins. This review accepts method bytes only. A fresh exact
outer binding to restored historical1274/1813, rebuilt image29e39, complete runtime
including the new readiness helper, durable independent review and explicit root
ACK must be reviewed before actual execution. This is not live-current source
acceptance. METHOD15 actual remains4PASS/05FAIL/11NOT_RUN with cleanup PASS;
METHOD16 actual is NOT_RUN. Human content HOLD and full P05 remain unchanged.
