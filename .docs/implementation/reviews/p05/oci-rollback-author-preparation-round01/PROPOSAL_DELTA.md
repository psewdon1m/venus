# OCI proposal01 · prospective metadata amendment

Status: AUTHOR DESIGN DELTA / NOT_RUN. Original [proposal01](../previous-oci-rollback-proposal-round01/PROPOSAL.md), SHA `8f32334fdaa7ce82ec01ba0c8517d89ae42eacef297e03bcb7e1546456908fc8`, remains unchanged. Root explicitly authorized this prospective amendment before implementation execution on 2026-10-19.

The pinned A/B candidates are test-runtime images built by the P05 Dockerfile, which runs npm build without the production Dockerfile's build-metadata step. They may have no `build-metadata.json` or source revision OCI label. Absence must be recorded as observed absence, malformed present metadata must fail, and neither field may be invented. This author has not inspected or run either image during producer preparation.

OCI01 source provenance is therefore: pinned external A/B build/source receipts, actual canonical image inspection, exact64 compiled byte maps, actual UI index/asset bytes and migration SQL/checksum maps. Any present actual metadata/labels are preserved as additional observations. A configured environment string is insufficient evidence of running image identity.

OCI02's VersionDTO is explicitly **synthetic fixture-configured and image-bound**, not independently verified production build metadata. Protected HTTPS/static probes must compare the DTO with the reviewed fixture config and separately compare served index/JS/CSS bytes with the actual image maps. Report keys use `fixture_version_DTO_bound`. No claim of an ordinary production-positive V2 server or approved release follows.

Fourteen IDs, A1→B2→A3, same DB/external authority, private narrowing/revocation, receipt semantics, known prior UI defect, resource512MiB/900s ceiling, root ACK requirement and human HOLD are unchanged. Resource guard512/900 and expanded actual image maps remain explicit NOT_READY. No Docker/build/pull/API/browser/selector/actual RUN was performed for this amendment.
