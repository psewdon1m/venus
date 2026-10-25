# P09 dependency subgate — independent round 02

Reviewer: `/root/contract_review`. Exact source: `aece0a7269313d5362090fde9556540f60add5f4`. Date: 2026-10-25 Europe/Istanbul; exact UTC observations/hashes are in INPUTS.json. Round01 HOLD is preserved.

**PASS_QUALIFIED_LOCAL_PROFILE_WITH_RELEASE_HOLDS.** Source/notices, exact-artifact inventory and the bounded advisory/configuration assessment support the current isolated local functional profile. No demonstrated reachable HIGH blocker was found in the reviewed media configuration. This is **not** complete license/CVE clearance, public redistribution readiness, a fresh runtime result, P09 exit or P07 PASS. Configuration-dependent dispositions below are mandatory boundaries, not permission to silently expose new protocols/features.

## What changed since round01

**DEP01 closed for the local packaging scope.** Production Dockerfile now copies the pinned server LICENSE/NOTICE into `/usr/share/licenses/venus/livekit-server-1.13.10`. The corresponding exact hashes match the primary upstream bytes from round01. The browser public third-party index has all **18** package/version nodes, including RxJS and the installed @types peer, with both protocol and jose versions retained. Independently checked all **21** license/notice files against their index/source hashes. Protobuf includes both Apache and BSD texts with the exact provenance discovered in round01: protobuf-es `c75ab915…`, upstream version 27.0, Protocol Buffers `a978b757…`. The lock remains `76b51e7a0daa4695bad1b349d32ca5564216cfa1e2fbd236cbc446b0183fee3b`, so the prior 18-tarball/3,968-file integrity proof still describes that npm closure. Vite public assets and Docker's built web-dist copy provide the browser-distribution path; final public delivery must retain/verify those files.

**DEP03 closed by explicit trust qualification.** ADR-036 now distinguishes an official publisher artifact plus digest/embedded build metadata from independent source attestation. Reproducible build/SLSA verification is not claimed. This is an acceptable stated local trust boundary, not a newly proven source build.

**DEP02 inventory completed; public-release obligations remain.** Actual production inventory is now available, separately from the browser fixture. Read-only image inspection confirms `venus-p09-production:aece0a72` at `sha256:762e37d260a478596859c350306c5cca12ae8776e9d4d543a587ee59418ef5de`, with the exact source revision label. Build output, image-id file and inventory hashes are captured. Inventory reports binary SHA-256 `5153d7ce95fb2f2ffb455a0e4ac464be2c94a38c77c99fd728f9c61748a11381`, 81,133,440 bytes, Go **1.27.1**, CGO=0, Linux/amd64 and **123 linked module records**, including three actual LiveKit replacements. Binary/build records match the separately captured fixture. The reviewed exporter reads build-info bytes without executing the media binary; this report did not independently rebuild it.

Production uses **Node 24.22.0 / Debian 12**, **88 installed binary packages / 63 source-package identities**, not the fixture's larger browser OS and not upstream Alpine. The source-aware dpkg capture was bound to this exact image. The upstream Docker stage contributes only the Go binary. Go module/fork license collection and complete Debian/Node redistribution material remain required before a new public binary distribution; root server Apache text does not cover every linked dependency.

## Go advisories: precise ranges and current reachability

Queried the maintained [Go vulnerability database](https://go.dev/doc/security/vuln/database), its module index and exact candidate OSV records. Considered original/effective replacement identities, stdlib and toolchain. Version matches are not proof that a package/function is linked or reachable. INPUTS.json retains exact ranges, source hashes and per-ID dispositions. No exploit or long scan was run.

| Candidate | Exact range/result | Current profile disposition |
|---|---|---|
| GO-2026-6443 (grpc xDS missing-authority panic) | Final grpc **1.84.0 is outside** the affected dev-branch intervals; their fixes precede final 1.84.0. | Excluded. The module-index latest-fixed shortcut was only an initial candidate, not an affected-version verdict. |
| GO-2026-6604 | Windows Root/junction functions; affected Go branches include 1.27.1. | Not this Linux binary. |
| GO-2026-6601/6602 | cmd/go checksum handling, fixed 1.27.2 on this branch. | Build-tool issues, not the distributed media runtime. Publisher build trust stays qualified. |
| GO-2026-5932 | Unmaintained x/crypto/openpgp, no fixed version. | No OpenPGP feature in this media profile; module presence alone does not establish use of that subpackage. |
| GO-2026-6599/6600 | html/template escaping; fixed 1.27.2. | No untrusted template/rendering route exposed by the media gateway. |
| GO-2026-6603/6610/6611/6612/6617 | HTTP/2 memory/framing/CPU/flow-control/crash issues. Go 1.27.1 and x/net 0.59.0 are within the affected ranges; fixes are Go 1.27.2 / x/net 0.60.0. | The supervisor reconstructs HTTP/1 requests and WebSocket connections. No HTTP/2 frames or arbitrary proxy requests pass through; ICE TCP/UDP is a separate protocol. Reassess before any H2 exposure. |
| GO-2026-6605/6613 | HTTP/1 CONNECT desynchronization; fixed 1.27.2. | Fixed GET RTC / POST RoomService routes, no CONNECT/forward-proxy handler. |
| GO-2026-6608/6609 | Multipart/MIME or FileServer/ServeContent Range parsing; fixed 1.27.2. | Those SFU handlers are not exposed by the strict RTC/RoomService gateway. |
| GO-2026-6607 / CVE-2026-97031 | Go crypto/tls ECH handshake amplification; fixed 1.27.2. | No media TLS listener or TURN-TLS. Pion DTLS is a separate stack; its existence does not expose this Go TLS ECH path. |
| GO-2026-6809 / CVE-2026-111943 | crypto/x509 Certificate.Verify trust-store defense; Go 1.27.1 is affected, fixed **1.27.3** (other branch 1.26.10). | Reviewed WebRTC peer path uses certificate fingerprints, not PKI chain Verify. New outbound HTTPS/CA-verifying integrations require a fresh disposition. |

The key source/configuration boundaries were independently inspected: supervisor `launch()` binds SFU HTTP to container loopback, disables TURN and external STUN; HTTP forwarding regenerates HTTP/1 with fixed methods/paths; WS terminates/reopens rather than tunneling arbitrary HTTP. In the **effective** fork [dtlstransport.go](https://raw.githubusercontent.com/livekit/webrtc-pion/v4.2.18-warp.6/dtlstransport.go), lines 464/466 and 545–564 configure custom peer verification and perform ParseCertificate→fingerprint validation, rather than Certificate.Verify. This is not a waiver of fingerprint/authentication checks and not a claim that disabled optional integrations have been tested. Three replacements remain separate module identities; absence of a fork-path DB entry is not proof of equivalence to every upstream fix.

The official [latest LiveKit release API](https://api.github.com/repos/livekit/livekit/releases/latest), successfully read directly, still returns **v1.13.10**, published 2026-10-14. There is no newer released official patch artifact to recommend at this observation. Prefer an official patched release when available. If a new delivery exposes currently excluded TLS/H2 paths or needs a rebuilt binary before then, a narrowly declared rebuild from the pinned source with Go >=1.27.3 and x/net >=0.60.0 is the small correction to consider; publish a new binary/source/license identity and renew compatibility checks. Do not upgrade unaffected grpc final 1.84.0 just because of the dev-branch false positive, invent a patch release or label a Venus rebuild an official upstream binary.

## Node and Debian: bounded disposition, not zero-CVE

The official [October 21 Node security release](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) fixes HIGH issues in **24.22.1**. Current 24.22.0 predates it. Relevant prerequisites are:

- CVE-2026-105482: attacker-controlled NUL-containing dns.resolve/reverse names.
- CVE-2026-105483 / CVE-2026-106069: TLS identity checks with noncanonical/fullwidth/leading-zero IP hosts.
- CVE-2026-111497: malformed Brotli decoded by node:zlib can corrupt memory.
- Other bulletin issues concern HTTP-client keepalive reuse, noncanonical TLS names, custom startup snapshots/SEA entropy, and permission-model realpath restrictions.

The reviewed P09 path uses fixed internal plain HTTP/WS endpoints, no arbitrary DNS/TLS target, Brotli operation, untrusted script, custom snapshot/SEA or Perl command. Own internal HTTP peers are not arbitrary external response servers. Body limits alone would not neutralize a decompressor defect; absence of that processing path is the relevant restriction. This is source/configuration assessment, not a claim of demonstrated exploitation or an all-repository security verdict. **Patch Node to 24.22.1 at an explicit bounded toolchain/base-image revision before a new public signed delivery**, then check the actual image again.

A read-only official registry query verified a candidate `node:24.22.1-bookworm-slim`: index `sha256:55fb5f5a527ea2c5c4a95f963e48ef90aa38c7b346054fdc8ee9957a2b55d205`, Linux/amd64 manifest `sha256:2dd9a4f758e173b65fee15388f7706af6fb01ef50cf7a2c0538711d67a6981ae`. Response digest matches bytes. It was not pulled, installed, built or accepted here.

For Debian, directly read the maintained [security tracker JSON](https://security-tracker.debian.org/tracker/data/json), matched installed **source** identities and compared source versions. There are 837 bookworm records across these sources: 100 source-level unresolved entries are **not** 100 proven affected installed-binary findings. Their tracker labels are 40 unimportant, one low, 59 not-yet-assigned; low/no-DSA is not synonymous with safe. The 13 installed-older-than-fixed candidates all map to source Perl 5.36.0-7+deb12u3 versus u4; several describe modules not necessarily included in perl-base. No Perl/archive extraction/untrusted shell path is used by current P09, and no new-media network blocker was demonstrated. Keep the IDs/statuses and source mapping for release refresh; this is not a comprehensive native-code call-graph audit or blanket OS clearance. Static Go CGO=0 also prevents simply attributing unrelated shared-library APIs to the SFU.

## Remaining mandatory boundaries

Local qualification remains valid only for the reviewed isolated Linux profile: strict HTTP/1/WS gateway, no direct SFU HTTP/TLS/H2, no TURN, no optional outbound integrations, no arbitrary processing/scripts, current source/admission/retirement fences and the exact binary/image family. Runtime P09 must independently corroborate those boundaries; this subgate did not run it.

Before a new public signed release: apply the explicit Node patch/pin revision; refresh exact-image advisories and Go/config dispositions; provide the full linked-module/fork license/NOTICE material and applicable Debian source/redistribution obligations; retain publisher/digest trust qualification or add real source attestation. Full P09, signed delivery and final P07 remain separate. Existing release0.0.1 and historical HOLD/FAIL proofs are untouched. There is no permission to reclassify missing public/device evidence as PASS.

## Verification limits, journal and stop

Only metadata/network reads, source/license hashing and direct version/range comparisons were performed. No package install, image pull/build, new container, application test, long statistics or source/test-framework change. Read-only image inspect succeeded for the production image. Files and upstream response hashes are in INPUTS.json; own INDEX binds this report and journal.

Research failures are preserved: a bounded first JSON fetch was too small for Debian's 86 MB response; a Windows default-codepage write then rejected a Unicode description and truncated only the reviewer's draft INPUTS. It was reconstructed from the exact inputs and re-read with explicit UTF-8. A diagnostic print encountered a null Debian description and was corrected. Failed tool-page opens were replaced by successful direct primary HTTPS reads. None affected app/source/other agents' files or counted as an application failure/pass. After final hashes: **COMPLETE_STOP**.
