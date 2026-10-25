# Independent current distribution source security05

**PASS_NEW_CURRENT_DISTRIBUTION_SOURCE_COMPONENT_NOT_STAGE_OR_SIGNING. No new actionable finding.** This bounded additive review accepts source05 for clean3dbfdfa10285369c37ca21b8602a623b2a3dee9e/corefc809e91f8385e15d501e09fc7a2b06eb40c6f547e67da320e483a37ebbb9af4 and actual production build04. Old security02/source04 acceptance stays restricted to14c; it is not silently rebound. No P07, signature/publication or production acceptance follows.

## Actual image and new artifact identity

Read-only C HEAD/status independently shows exact clean3dbf; saved source identity isfc809e91… . Exported production image OCI index/engine identity isd52fcc6252ed18ad49382a66d928a90bba478702dd12749d277e14d82e46653f, platform manifestc3e2b94df6e96f4ba8bab9c8ebf024e6e7f77cf8c393deaa9b0679945782396f and actual configurationdafb8daba787289d6683fa9e8e63eab9818afb0470a4a9cce4e2813d89517cb0. These are distinct identifiers. I read the exported OCI metadata blobs without running/extracting the image, checked index→manifest→configuration digests and source/version labels matching3dbf/0.0.2 and actual inspect metadata.

Actual inventory SHA172a07a838807308dd195d0a61532db1482f59e8778c60dc8f94ccb1a888d607 binds current build0.0.2/3dbf, Node24.22.1 and Go1.27.3. Source index SHA841733086d7c080237d2e1177d2ee676dcbd6063fe5b0e111056531b19855dbb and receipt agree. New sources.tar is724928000bytes, independently streamed SHAe3933cb5a410921e31c5d72b6ab012b15dcd4d8398e9ec3643b0703baf290422. Existing actual Poppler production-boundary receipt records1PASS0FAIL; this reviewer did not rerun it.

## Bounded delta versus already audited source04

All564 non-Venus archive rows have exactly the same metadata multiset as source04, including URLs/kinds/identities/size/SHA/file pins. All976 non-Venus notice mappings likewise match.23Venus notice content/name/size/hash pins are unchanged; only their commit-qualified owner/origin changes to3dbf. Concurrent collection ordering differs and is correctly compared as a complete multiset, preserving duplicate row multiplicities.

The new outer tar has exactly1038expected unique regular-file members:565unique source archives,471deduplicated notice files representing999mappings, and2metadata files. No unsafe/duplicate/unexpected member name or size was accepted. Every outer member payload was hashed by streaming read and matched both the exact source-index pin and on-disk file. The outer tar hash and membership were therefore actually checked, not inferred from receipt fields. Unchanged third-party source payloads were hash-checked, with no repeated internal semantic inspection/extraction/execution of565archives.

Collector reports463verified cache hits/701862364bytes/rejected0 from its prior owned source set. This explains reuse; I did not independently measure external network transfer and do not label total output bytes as network download. Existing collector/cache source/strict source identity rules remain; no URL was requested or redownloaded by this reviewer.

## Exact new Venus Git archive

The new Venus archive isc2015b68d877489019d50ded49287e3b316d7c5ea67e1d45b9aab5a096b1a1eb,18728960bytes.578members comprise500regular files and78directories. All500regular payloads match exact selected3dbf Git blobs, independently read using readonly ls-tree/cat-file batch. Every selected Git file is present and there are no extra regular files, symlinks or unsafe paths. This check executes no archived source and extracts nothing to disk.

Included pathspecs cover apps/api, apps/web, packages, infra, tools, tests, third-party, .github, root build/package/config files and .docs/contracts/DELIVERY_NOTICES. Required build/runtime sources and third-party media material are present. Both third-party/livekit-server-1.13.11/LICENSE andNOTICE are explicitly present; the previous F-S01 omission is not reintroduced. All23Venus notice records preserve their actual text pins. Historical evidence/journals are intentionally outside this code/build source archive; this does not remove required build paths.

## Limits and handoff

This accepts current exact source/material identity and notice coverage, using source04's prior full dependency interpretation for unchanged third-party identities. It is not reproducible-build attestation, zero-CVE/secret scan or professional legal approval. Full118 promotion, real hour/other P07 checks, exact production Driver installation, final CI, genuine signature and anonymous public image/source roundtrip are separate evidence. Owner signing key was not accessed. Immutable0.0.1 and old seals remain unchanged.

No tests, Docker, build, network/redownload, archive execution/extraction, code/ROOT/C/Git/manifest mutation or new framework was performed. Read-only comparisons/hashes exit0. Initial ordered arrays differed due collection order; exact multiset equality with multiplicities resolved it, with no artifact change. Own journal/input pins recorded. COMPLETE_STOP after INDEX.
