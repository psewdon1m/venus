# OCI03 startup: confirmed ESM top-level-await cycle

**Confirmed startup defect. This is diagnosis only, not acceptance of OCI03 or
the reviewer's earlier OCI02 implementation.** No Docker or functional OCI run
was performed by this diagnosis.

Actual root log reports Node unsettled top-level await at driver.mjs:14, and root
records exit13 before any project output/resources appeared. The exact source
boundary explains that result:

1. CLI driver top-level awaits run().
2. After authority/source/guard-module checks, run dynamically imports host-runner.
3. host-runner statically imports producerMap and verifyIncluded from driver.
4. ESM evaluation of host-runner waits for the importing driver's pending async
   evaluation; driver is waiting for that dynamic import. No executePlan call is
   reached. With no live handle resolving the cycle, Node exits13 with the warning.

The external guard module is imported before this boundary but its resource
constructor is called only inside executePlan. Project ownership/id allocation,
guard.startOCIResourceGuard, output creation and Docker commands also occur inside
executePlan. Their source path is unreachable through this deadlock. This is not
proof of a functional rollback, a successful cleanup, or a fresh Docker inventory;
no new Docker listing was requested. Root's no-resource observation remains the
actual operational evidence.

Three bounded cold subprocess controls use explicit machine copies of only the
same import/top-level-await boundary. Authority/inventory and execute functions
are inert stubs; there are no Docker imports/calls/resource constructors:

| Cold control | Result |
|---|---|
| CLI driver→dynamic host→static driver cycle |exit13, unsettled await, execute marker absent|
| Import the same host from an unrelated non-CLI entry |exit0, import resolves|
| CLI after moving shared exports to inert proof.mjs |exit0, execute stub reached|

The non-CLI counterexample explains why finite imports of helpers can pass while
the real CLI activation fails. Each subprocess has a3s hard timeout. Initial raw
outputs are preserved; a reviewer string-case assertion in the first Python
wrapper was wrong despite all three expected subprocess results. The assertion
was corrected to lowercase matching and the final controls passed13/0/0.

Minimal corrective OCI04: extract producerMap, verifyIncluded and their required
directory/hash/read-only source dependencies into one inert shared proof helper;
import it from both driver and host-runner. Preserve source maps, path anchors,
authority checks, readiness checks, resource limits, deadlines and whole-attempt
control flow. host-runner must have no import edge back to the CLI driver.
Re-freeze exact helper-inclusive map/index and binding/ACK; independent reviewer
other than this earlier OCI02 author must accept the implementation/gate.

Add a bounded **CLI subprocess** activation regression with inert guard/execute
stubs, asserting one execute invocation and explicit exit result. Also retain the
old-cycle negative reproducer. Pure imports and function validation alone do not
exercise this ESM evaluation state. Do not hide the issue by dropping awaits or
promoting the failed startup to an actual14-control rollback result.

Exact actual driver/host/log/activation-witness hashes and machine-copy controls
are captured locally. Frozen OCI03, original source and root ACK were not edited.
Human content HOLD and full P05 acceptance are unchanged.
