# Exact new production-image install — finite proposal01

**READ_ONLY_PROPOSAL, NOT EXECUTED, NOT PASS.** Source2ec981316025dc3b41b3118d36d788c2e145e50b. New image/config/OCI are unknown until its real build; no fake digest is supplied here. Existing Cinema/Calls checks or a running preflight16 do not award this install check.

Recommendation: if final nonauthors require the current local exact-production install **before** pre-sign inheritance acceptance, invoke the **existing tests/p06/docker-drill.mjs candidate-only branch** directly with its already supported fixture registry input. Use a temporary loopback local registry to give the actual image a genuine allowed RepoDigest. No application/tool edit, new test mechanism, fake identity map or public unsigned image is needed. The same existing fixture generates a temporary Ed25519 key; the owner service key and GitHub secret are never supplied.

## Why this path works

The host wrapper's `--release-candidate` branch always pulls the candidate reference but leaves registryAddress undefined. The underlying existing drill already accepts input.registry and puts it into **fixture trust only** as fixture_registry. verifyRelease allows that exact127.0.0.1:port/venus reference. DockerDriver.ensureImage still requires the real matching RepoDigest, labels and config validation. Consequently a real local tag/push is necessary; merely naming an unpushed local digest GHCR or writing an identity override is not valid.

candidate_only:true creates only A. It uses real provisioning, executorUID1001, operatorUID1002, consumerUID1000, existing image verification/install/health/ACL/isolation, encrypted synthetic seed/read and v4 module/18+V2 probes. It returns **before** browserA/B/fault/rollback loops. No imageB, failing images or browser_image is needed. Fixture-v4 permits absent corresponding-source assets; that is appropriate only for this installation test and proves no real release signature/source-distribution acceptance.

## Dependencies and exact sequence

Wait until the other active media run has released fixed ports7881/7882. Use the frozen clean checkout and its existing Node24.22.1/Python. Production build/inventory/source collection already required by delivery supplies actual version0.0.2 image ID, source/core and labels. Preserve its original build OCI and actual configuration digest separately.

Use an existing operator helper only if its embedded tools/venus-operator, tests/p06/docker-drill.mjs, fixture-worker/provisioning and v4 Compose bytes match the current frozen checkout. Otherwise build the existing `infra/venus/Dockerfile.operator --target fixture` from that checkout using the already pinned Docker29.1.3 CLI digest; this is a small existing cached helper build, not a production change.

The following is a **command recipe**, not a new committed runner. Values marked actual are required from existing real build metadata/inspection. Each native command's exit code must be checked and preserved by the orchestrator; stop on a failed phase.

```powershell
# From the frozen clean checkout; no commands in this proposal were executed.
$nodeExe = 'C:/Temp/venus-p07-toolchain/node-v24.22.1-win-x64/node.exe'
$nonce = ([guid]::NewGuid().ToString('N')).Substring(0,10)
$project = 'venus-p06-' + $nonce
$label = 'net.shmoza.venus.p06=' + $nonce
$registryContainer = $project + '-registry'
$driverContainer = $project + '-driver'
$stateVolume = $project + '-host'
$output = Join-Path (Get-Location) ('.artifacts/exact-install/' + $project)
New-Item -ItemType Directory -Path $output | Out-Null

# Actual current production build output; do not infer config digest from native Id.
$productionImage = '<actual-local-production-image-id>'
$expectedConfigDigest = '<actual-config-digest-verified-by-build-and-export>'
$source = '<actual-40-character-source-commit>'
$core = '<actual-full-64-character-source-identity>'
$helperImage = '<verified-current-operator-fixture-image-id>'

# All state is unique and explicitly labelled; no public push.
docker run -d --name $registryContainer --label $label --cpus 0.5 --memory 128m --pids-limit 64 -p '127.0.0.1::5000' registry:2.8.3
$registryState = @(docker inspect $registryContainer | ConvertFrom-Json)[0]
$port = $registryState.NetworkSettings.Ports.'5000/tcp'[0].HostPort
$registryAddress = '127.0.0.1:' + $port + '/venus'
$transportTag = $registryAddress + ':fixture-' + $nonce + '-a'
docker tag $productionImage $transportTag
docker push $transportTag
$image = @(docker image inspect $transportTag | ConvertFrom-Json)[0]
$reference = @($image.RepoDigests | Where-Object { $_.StartsWith($registryAddress + '@') })
if ($reference.Count -ne 1) { throw 'EXACT_LOCAL_REPODIGEST_REQUIRED' }
$reference = $reference[0]
$transportOCI = $reference.Split('@')[1]

# If a verified export for this exact image/config already exists, reuse its
# receipt. Otherwise save once and call the existing read-only archive verifier.
$archive = Join-Path $output 'actual-image.tar'
docker image save --output $archive $image.Id
$artifact = (& $nodeExe --input-type=module -e 'import {dockerArchiveConfig} from "./tools/venus-operator/image-archive.mjs";console.log(JSON.stringify(dockerArchiveConfig(process.argv[1])))' $archive | ConvertFrom-Json)
if ($artifact.config_digest -ne $expectedConfigDigest) { throw 'CONFIG_CHANGED_DURING_LOCAL_TRANSPORT' }
if ($artifact.labels.'org.opencontainers.image.revision' -ne $source) { throw 'SOURCE_LABEL_MISMATCH' }
if ($artifact.labels.'org.opencontainers.image.version' -ne '0.0.2') { throw 'VERSION_LABEL_MISMATCH' }

# Own host state, matching existing wrapper contract.
docker volume create --label $label $stateVolume
$volume = @(docker volume inspect $stateVolume | ConvertFrom-Json)[0]
$input = @{
  project=$project; nonce=$nonce; label=$label; helper_image=$helperImage
  host_root=$volume.Mountpoint; volume=$stateVolume
  registry=$registryAddress; main_sha=$source; source_identity=$core
  candidate_only=$true; environment='standalone-local-presentations-v4'
  imageA=@{
    reference=$reference; oci_digest=$transportOCI
    config_digest=$expectedConfigDigest; native_id=$image.Id; version='0.0.2'
  }
}
$encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($input | ConvertTo-Json -Depth 8 -Compress)))
$input | ConvertTo-Json -Depth 8 | Set-Content -Encoding utf8 (Join-Path $output 'INPUT.json')
docker run --name $driverContainer --label $label --user '0:0' --read-only --cap-drop ALL --cap-add CHOWN --cap-add FOWNER --cap-add DAC_OVERRIDE --security-opt 'no-new-privileges:true' --cpus 1 --memory 1g --pids-limit 128 --tmpfs '/tmp:rw,size=64m,mode=1777' --mount "type=volume,source=$stateVolume,target=/data" --mount 'type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock' -e HOME=/tmp -e "P06_INPUT=$encoded" --entrypoint node $helperImage tests/p06/docker-drill.mjs
docker cp "${driverContainer}:/data/DRILL-REPORT.json" (Join-Path $output 'DRILL-REPORT.json')
```

Required result: driver exit0, report.statusPASS and P06-INSTALL / P06-ACTUAL-V4-CANDIDATE-MODULES plus existing runtimeUID/ACL/isolation checks PASS. Preserve actual report and source/image/config/OCI/helper identities, exit codes and owned cleanup. The report is **CURRENT_LOCAL_EXACT_PRODUCTION_INSTALL_WITH_FIXTURE_TRUST**, not signed-service acceptance, full current recovery or production deployment.

Docker local push can produce an OCI manifest wrapper different from the original build index. Record both original build OCI and local transport OCI; the actual configuration digest/labels must remain equal. Do not claim equality of distinct digests. Later genuine GHCR release still needs its own exact published-image install. If export/config identity fails, retain FAIL and investigate; do not set config_digest=Id or disable Driver checks.

## Cleanup contract

Use the existing wrapper's exact ownership pattern: custom label net.shmoza.venus.p06=nonce for registry/driver/executor/operator/state and com.docker.compose.project=project for service containers/networks/volatile named volumes. Inspect each exact resource and verify its label before removal. Copy only the safe report, never `/data` keys/credentials. Remove owned containers with their anonymous volumes, then owned Compose networks/volatile volumes. On PASS remove this own stateVolume; on FAIL retain its synthetic state and mark it. Remove only this new transportTag if desired; retain the actual production image for remaining delivery checks. No global prune, image-ID deletion, unscoped volume removal or Docker auth changes. No consumer receives Docker socket; only the existing fixture orchestrator/executor does.

## Alternative: workflow phase, with explicit pending state

The existing release workflow legitimately executes the **genuine GHCR exact-image install after pre-sign gate and before service-key loading/signature**. This satisfies the required order for a final artifact check when REL-04/05 and associated final-artifact obligations are explicitly PENDING_FINAL_SIGNED_ARTIFACT_ONLY in pre-sign, the final reviewers accept the phase split, and the job must succeed before signing. It is not permission to invent a pre-sign local install PASS or award full P07 while publication/install remains pending.

If a prior review made its inheritance conditional on **an already completed current production install**, deferring it silently to the workflow does not satisfy that condition. Either obtain the bounded local test above or obtain a new explicit conditional pre-sign disposition from both nonauthors, keeping the exact new-image installation unclosed until the real workflow receipt. Final acceptance follows actual signature/published-byte and anonymous image/asset evidence. This path does not require any public unsigned preliminary upload beyond the workflow's existing gated build step.

Preferred immediate path for the existing strict local conditional: local-only registry + direct existing candidate-only drill. Preferred public release path remains the unmodified strict workflow. Neither path uses the real signing secret during local installation.
