# REL-11 download jitter — author proof fix14

Status: **PASS_TARGETED_AUTHOR_CHECKS**, not an independent gate or full P07 acceptance.

Only `tools/venus-operator/fetch-release.mjs` changed. Internal `retryDelay` uses built-in `crypto.randomInt` for both network failures and transient HTTP responses. No API, option, exported seam, framework or test change was added.

Network failures and responses without a positive finite numeric Retry-After wait uniformly within the upper half of the existing exponential interval: attempts0/1/2 wait125–250/250–500/500–1000ms. Positive numeric Retry-After keeps its existing minimum (subject to the existing3000ms cap), adds0..backoff jitter, and remains clipped at3000ms. A cap-saturated Retry-After is therefore still3000ms. Four attempts, allowed transient statuses429/502/503/504,15s fetch timeout, maximum body sizes, partial staging, explicit interrupted-download cleanup, final signature/digest/tag verification and activation behavior are unchanged. Per-file network waits remain at most1750ms across3retries; HTTP waits remain at most9000ms under numeric Retry-After, as before.

## Actual checks

- Targeted ESLint downloader: exit0.
- Linux existing case `P06-DOWNLOAD transient503 retries boundedly and never mutates healthy A`: PASS,1executed,0failed; Node reported0skips. All other case names were excluded by `--test-name-pattern=^P06-DOWNLOAD`, not executed and not qualified here. Duration1435.363ms. Existing assertions confirm4requests, final503 failure, destination unpublished, partial staging retained, explicit interruption refusal, healthyA untouched/open with0starts.
- Existing case mocks globalfetch503/Retry-After0. It exercises the actual new random-delay path but does not claim statistical qualification of randomness, numeric-header integration or a full operator-suite PASS.
- Test container used the exact fixture image in INPUTS, read-only bind of the changed source, nonroot/read-only root,1CPU/512MiB/64PID,tmpfs/tmp and `--network none`. No real download/external credentials/Docker socket. `--rm` cleanup completed; own-label inventory empty.

## Consumer/hour scope

`infra/venus/Dockerfile` copies only the explicitly named tools media-inventory, presentation-inventory and delivery-inventory. Neither its build stage nor final stage copies `tools/venus-operator` or fetch-release. `infra/venus/Dockerfile.operator:7` does copy that operator directory. Therefore this fix affects the operator tool payload, not consumer application source/runtime inputs. Future SOURCE_REVISION/build-metadata/image identity rebinding remains the orchestrator's job; this author does not claim future image digests stay equal.

The prior60minute/8client/12game hour ran before this downloader change. It is retained for its exact prior runtime/source inputs; **it did not test the new downloader**. No hour/AV/database/full-suite rerun was executed for this isolated tool change. Independent final review remains separate.

Source before/after, exact input/test/Dockerfile/REL-11 hashes and executed counts are in INPUTS.json. Raw selected-test output is retained in linux-download-test.txt. Rollback is the inverse of this one-file change, retaining the former fixed delays; no service data or activation state was mutated.
