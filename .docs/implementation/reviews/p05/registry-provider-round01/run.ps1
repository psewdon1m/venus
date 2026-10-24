$ErrorActionPreference='Stop'
$base=Split-Path -Parent $PSCommandPath
$image='sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0'
$id=[Guid]::NewGuid().ToString('N').Substring(0,12)
$volume='venus-p05-life-review-'+$id
$init=$volume+'-init'; $run=$volume+'-test'; $label='venus.p05.registry-provider-review='+$id
$source=(Resolve-Path (Join-Path $base 'private-topic-ledger.ts')).Path
$test=(Resolve-Path (Join-Path $base 'independent.test.ts')).Path
$security=(Resolve-Path (Join-Path $base 'security.ts')).Path
$lifecycle=(Resolve-Path (Join-Path $base 'topic-room-lifecycle.ts')).Path
$registry=(Resolve-Path (Join-Path $base 'topic-room-registry.ts')).Path
$preferences=(Resolve-Path (Join-Path $base 'private-topic-preferences.ts')).Path
$rooms=(Resolve-Path (Join-Path $base 'rooms.ts')).Path
$bootstrap=@'
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const paths=['apps/api/src/private-topic-ledger.ts','apps/api/src/independent.test.ts','apps/api/src/security.ts','apps/api/src/topic-room-lifecycle.ts','apps/api/src/topic-room-registry.ts','apps/api/src/private-topic-preferences.ts','apps/api/src/rooms.ts'];
console.log(JSON.stringify({kind:'exact-image-inputs',node:process.version,uid:process.getuid(),hashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))}));
fs.writeFileSync('/tmp/vitest-ledger.config.mjs',"export default {cacheDir:'/tmp/vite-cache',test:{include:['/app/apps/api/src/independent.test.ts'],cache:false,fsModuleCache:false,testTimeout:120000}};");
const result=cp.spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','apps/api/src/independent.test.ts','--config','/tmp/vitest-ledger.config.mjs','--reporter','verbose'],{stdio:'inherit'});process.exit(result.status??1);
'@
$descriptor=@{kind='INDEPENDENT_FROZEN_LINUX_REVIEW';timestamp=[DateTimeOffset]::Now.ToString('o');image=$image;id=$id;volume=$volume;init=$init;run=$run;binds=@($source,$test,$security,$lifecycle,$registry,$preferences,$rooms);bootstrap=$bootstrap;source_sha256=(Get-FileHash $source).Hash.ToLower();test_sha256=(Get-FileHash $test).Hash.ToLower();security_sha256=(Get-FileHash 'C:\.projects\venus\apps\api\src\security.ts').Hash.ToLower()}
$descriptor|ConvertTo-Json -Depth 8|Set-Content (Join-Path $base 'descriptor.json')
& docker image inspect $image | Set-Content (Join-Path $base 'image-inspect.json')
& docker volume create --label $label $volume | Set-Content (Join-Path $base 'volume-create.txt');if($LASTEXITCODE){throw 'volume create failed'}
& docker volume inspect $volume | Set-Content (Join-Path $base 'volume-inspect.json')
$owned=(& docker volume inspect $volume|ConvertFrom-Json)[0];if($owned.Labels.'venus.p05.registry-provider-review' -ne $id){throw 'wrong volume label'}
& docker create --name $init --label $label --label venus.p05.role=registry-provider-review-init --user 0:0 --read-only --cap-drop ALL --cap-add CHOWN --security-opt no-new-privileges:true --network none --memory 128m --cpus 0.5 --pids-limit 32 --mount ('type=volume,src='+$volume+',dst=/state') $image node -e "const f=require('node:fs');f.chmodSync('/state',448);f.chownSync('/state',1000,1000);console.log('owned volume prepared')" | Set-Content (Join-Path $base 'init-create.txt');if($LASTEXITCODE){throw 'init create failed'}
& docker start -a $init 2>&1 | Tee-Object (Join-Path $base 'init.txt');if($LASTEXITCODE){throw 'init failed'}
& docker inspect $init | Set-Content (Join-Path $base 'init-inspect.json')
& docker create --name $run --label $label --label venus.p05.role=registry-provider-review-test --user 1000:1000 --read-only --cap-drop ALL --security-opt no-new-privileges:true --network none --memory 768m --cpus 1 --pids-limit 96 --tmpfs /tmp:size=128m,mode=1777 --env TOPIC_LEDGER_TEST_ROOT=/state --env HOME=/tmp --env XDG_DATA_HOME=/tmp/xdg-data --mount ('type=volume,src='+$volume+',dst=/state') --mount ('type=bind,src='+$source+',dst=/app/apps/api/src/private-topic-ledger.ts,readonly') --mount ('type=bind,src='+$test+',dst=/app/apps/api/src/independent.test.ts,readonly') --mount ('type=bind,src='+$security+',dst=/app/apps/api/src/security.ts,readonly') --mount ('type=bind,src='+$lifecycle+',dst=/app/apps/api/src/topic-room-lifecycle.ts,readonly') --mount ('type=bind,src='+$registry+',dst=/app/apps/api/src/topic-room-registry.ts,readonly') --mount ('type=bind,src='+$preferences+',dst=/app/apps/api/src/private-topic-preferences.ts,readonly') --mount ('type=bind,src='+$rooms+',dst=/app/apps/api/src/rooms.ts,readonly') $image node -e $bootstrap | Set-Content (Join-Path $base 'test-create.txt');if($LASTEXITCODE){throw 'test create failed'}
& docker inspect $run | Set-Content (Join-Path $base 'test-inspect-before.json')
& docker start -a $run 2>&1 | Tee-Object (Join-Path $base 'tests.txt');$testExit=$LASTEXITCODE
& docker inspect $run | Set-Content (Join-Path $base 'test-inspect-after.json')
$after=@{source_sha256=(Get-FileHash $source).Hash.ToLower();test_sha256=(Get-FileHash $test).Hash.ToLower();test_exit=$testExit}
$after|ConvertTo-Json|Set-Content (Join-Path $base 'after.json')
if($after.source_sha256 -ne $descriptor.source_sha256 -or $after.test_sha256 -ne $descriptor.test_sha256){throw 'source drift'}
foreach($container in @($run,$init)) {
  $obj=(& docker inspect $container|ConvertFrom-Json)[0];if($obj.Config.Labels.'venus.p05.registry-provider-review' -ne $id -or $obj.State.Running){throw 'unsafe cleanup'}
  & docker rm $container | Add-Content (Join-Path $base 'cleanup.txt');if($LASTEXITCODE){throw 'container cleanup failed'}
}
$obj=(& docker volume inspect $volume|ConvertFrom-Json)[0];if($obj.Labels.'venus.p05.registry-provider-review' -ne $id){throw 'unsafe volume cleanup'}
& docker volume rm $volume | Add-Content (Join-Path $base 'cleanup.txt');if($LASTEXITCODE){throw 'volume cleanup failed'}
& docker ps -aq --filter ('label='+$label) | Set-Content (Join-Path $base 'remaining-containers.txt')
& docker volume ls -q --filter ('label='+$label) | Set-Content (Join-Path $base 'remaining-volumes.txt')
exit $testExit



