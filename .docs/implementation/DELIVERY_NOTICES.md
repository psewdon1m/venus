# Distribution material for the next Venus release

This is an implementation contract for the **new** delivery candidate. Existing0.0.1 and all accepted evidence remain unchanged. Source collection is not a security scan, professional legal approval or a claim of zero CVEs.

The service image must retain `/usr/share/doc/*/copyright`, actual Node/npm notices and `/usr/share/licenses/venus/livekit-server-1.13.11/{LICENSE,NOTICE}`. Browser-distributed notices remain reachable under `/third-party/media/`; the full source asset also covers all installed application packages, including React/browser dependencies beyond that earlier media-only index.

## Exact inputs and commands

After the complete implementation freeze, build the production candidate with exact `SOURCE_REVISION` and `RELEASE_VERSION`. Run its copied inventory script under the existing read-only/nonnetwork container boundary, capturing stdout to `actual-inventory.json`:

```text
node /app/tools/delivery-inventory.mjs
```

This reads actual `build-metadata.json`, Node version, npm package manifests and license bytes, installed Debian binary/source versions and copyright bytes, and Go binary embedded build information. It never executes the media binary or downloaded package code. Root records the exact image ID/OCI/config separately; a JSON file cannot attest its own container invocation.

From the clean checkout, using Node24.22.1 and Python standard library only:

```text
node tools/delivery-sources.mjs --inventory .artifacts/delivery/actual-inventory.json --image sha256:<actual-image-id> --source <clean-40-character-source-commit> --output .artifacts/delivery/sources-v0.0.2
```

`PYTHON` may select the existing Python executable. The output directory must be new. No install/build/syntax/lint/test occurs in this script; it only reads inventory, downloads source from permitted primary endpoints and inspects archives without extracting or executing them.

Outputs:

- `SOURCE-INDEX.json`: exact image/source/inventory binding, per-source URL/SHA256, npm integrity, verified Go h1 sums, Debian `.dsc`→source member hashes, per-owner notice mappings and failures.
- `notices/`: original full license/NOTICE/copyright bytes with SHA256 filenames; no lossy encoding conversion.
- `sources/`: original source archives with SHA256 filenames, including Debian original archives and exact Debian patchsets.
- `sources.tar`: a flat USTAR asset containing the index, notice map and complete archives/texts; no downloaded path becomes a bundle member name.
- `SOURCES-RECEIPT.json`: bundle size/hash and inventory/index hashes to bind to the new release delivery receipt or signed input policy.

Publish the source tar and receipt with the **same new release** as the corresponding binary and verify anonymous downloaded bytes. Root must make the new release pre-sign gate require this exact source receipt; mere generation of a file does not sign it. A mutable external latest-source link and an unsupported written source offer are insufficient substitutes for the included matching source. Consumers retain index, sources and notices together. If any required source, checksum, notice or exact package identity is unavailable, the tool exits nonzero with **HOLD**, retaining partial material and exact failed identities. It never declares legal or zero-CVE clearance.

## Collection scope and bounds

The asset includes a Git archive of the exact Venus commit: tracked root build/config files plus apps/packages/infra/tools/tests/.github/.docs/contracts and this delivery contract. Historical evidence and journals are intentionally excluded; included pathspecs and commit are recorded in SOURCE-INDEX. No source is read from a dirty filesystem for this archive.

Node24.22.1 source includes bundled npm11.19.1 and Node dependencies; the official release SHA256 is checked. Go1.27.3 standard-library/toolchain source is verified against official release metadata. The official LiveKit1.13.11 source commit is `385aa40f9292fe1db8caad87301e4b285b7c198a`. For every actual linked Go dependency, the **effective replacement path/version** is used and the module ZIP hash is recomputed using Go's h1 directory algorithm. This does not independently attest an official publisher binary source build.

Every actual application npm package receives its official registry source tarball; SHA512 integrity and its installed package manifest identity/hash are checked. Node-bundled npm dependency material comes from the exact Node source archive and actual bundled notices. Yarn, if present in the actual base image, is collected separately from its official release. Debian sources are selected by actual dpkg **source version**, retaining epochs in `.dsc` identity and matching each source member against `.dsc` SHA256/size. Current Debian pools are preferred; official snapshot metadata is the fallback for exact removed versions. Source archives include Debian's patchsets, not just original upstream tarballs.

Limits: three concurrent HTTP tasks; HTTPS allowlist with at most six redirects;90-second request/body deadline;384MiB per download;1800MiB unique source total;30-minute total collection deadline. Archive inspection uses isolated Python stdlib,120-second process timeout,150000 members,512MiB per declared member,3GiB declared expansion,4MiB per notice and64MiB accumulated notice bytes. Archives are read without extraction; absolute/traversal member names, duplicate members, devices and FIFOs are rejected. Relative source symlinks are retained only inside the opaque original archive and never followed/extracted. Output tar uses fixed safe hashed names and is bounded below GitHub's2GiB asset maximum. A bound failure is retained as HOLD; limits are not silently increased.

## Known Poppler advisory

[CVE-2026-107705](https://security-tracker.debian.org/tracker/CVE-2026-107705) remains **unfixed** for the selected Debian package. The specific overflow requires an attacker-controlled AESV3/R6 password longer than127bytes. Official22.12 CLI sources use33-byte password buffers; Venus invokes fixed `pdfinfo`/`pdftoppm` argv without `-opw`/`-upw`, accepts no API password, supplies no interactive stdin, and rejects encrypted metadata. That prerequisite is excluded by this route; the package is not relabelled fixed and arbitrary PDF parsing is not declared safe. Root must corroborate encrypted-input rejection and fixed argv on the actual candidate in the impacted checks. The existing hostile-renderer guardian, quotas, timeout and cleanup boundaries remain mandatory. New password-bearing features or alternate parser entry points require a new review.

Preza adaptation provenance remains `aeca0de85a54ca8c30ff9c7143f9352fdddfdecf`, `api/app/storage.py:render_pdf`; copied/reworked Venus files identify the origin. Owner repository reuse authorization is not an invented upstream license.
