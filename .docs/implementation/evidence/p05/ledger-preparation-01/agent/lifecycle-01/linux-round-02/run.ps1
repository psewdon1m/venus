$ErrorActionPreference='Stop'
$base=Split-Path -Parent $PSCommandPath
$image='sha256:556d347fef81d48334642ff1318aa5f7fe4999b605e8bd6d8f3d25e71bcc19b0'
$id=[Guid]::NewGuid().ToString('N').Substring(0,12)
$volume='venus-p05-room-lifecycle-'+$id
$init=$volume+'-init'; $run=$volume+'-test'; $label='venus.p05.room-lifecycle='+$id
$source=(Resolve-Path (Join-Path $base '../private-topic-ledger.ts')).Path
$test=(Resolve-Path (Join-Path $base '../private-topic-ledger.test.ts')).Path
$moduleSource=(Resolve-Path (Join-Path $base '../topic-room-lifecycle.ts')).Path
$moduleTest=(Resolve-Path (Join-Path $base '../topic-room-lifecycle.test.ts')).Path
$bootstrap=@'
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const paths=['apps/api/src/private-topic-ledger.ts','apps/api/src/private-topic-ledger.test.ts','apps/api/src/security.ts','apps/api/src/topic-room-lifecycle.ts','apps/api/src/topic-room-lifecycle.test.ts'];
console.log(JSON.stringify({kind:'exact-image-inputs',node:process.version,uid:process.getuid(),hashes:Object.fromEntries(paths.map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')]))}));
fs.writeFileSync('/tmp/vitest-ledger.config.mjs',"export default {cacheDir:'/tmp/vite-cache',test:{include:['/app/apps/api/src/private-topic-ledger.test.ts','/app/apps/api/src/topic-room-lifecycle.test.ts'],cache:false,fsModuleCache:false,testTimeout:120000}};");
const result=cp.spawnSync(process.execPath,['node_modules/vitest/vitest.mjs','run','--maxWorkers','1','--config','/tmp/vitest-ledger.config.mjs','--reporter','verbose'],{stdio:'inherit'});process.exit(result.status??1);
'@
$descriptor=@{kind='SCOPED_SCRATCH_LINUX_PREFLIGHT';timestamp=[DateTimeOffset]::Now.ToString('o');image=$image;id=$id;volume=$volume;init=$init;run=$run;binds=@($source,$test,$moduleSource,$moduleTest);module_sha256=(Get-FileHash $moduleSource).Hash.ToLower();module_test_sha256=(Get-FileHash $moduleTest).Hash.ToLower();bootstrap=$bootstrap;source_sha256=(Get-FileHash $source).Hash.ToLower();test_sha256=(Get-FileHash $test).Hash.ToLower();security_sha256=(Get-FileHash 'C:\.projects\venus\apps\api\src\security.ts').Hash.ToLower()}
$descriptor|ConvertTo-Json -Depth 8|Set-Content (Join-Path $base 'descriptor.json')
& docker image inspect $image | Set-Content (Join-Path $base 'image-inspect.json')
& docker volume create --label $label $volume | Set-Content (Join-Path $base 'volume-create.txt');if($LASTEXITCODE){throw 'volume create failed'}
& docker volume inspect $volume | Set-Content (Join-Path $base 'volume-inspect.json')
$owned=(& docker volume inspect $volume|ConvertFrom-Json)[0];if($owned.Labels.'venus.p05.room-lifecycle' -ne $id){throw 'wrong volume label'}
& docker create --name $init --label $label --label venus.p05.role=ledger-init --user 0:0 --read-only --cap-drop ALL --cap-add CHOWN --security-opt no-new-privileges:true --network none --memory 128m --cpus 0.5 --pids-limit 32 --mount ('type=volume,src='+$volume+',dst=/state') $image node -e "const f=require('node:fs');f.chmodSync('/state',448);f.chownSync('/state',1000,1000);console.log('owned volume prepared')" | Set-Content (Join-Path $base 'init-create.txt');if($LASTEXITCODE){throw 'init create failed'}
& docker start -a $init 2>&1 | Tee-Object (Join-Path $base 'init.txt');if($LASTEXITCODE){throw 'init failed'}
& docker inspect $init | Set-Content (Join-Path $base 'init-inspect.json')
& docker create --name $run --label $label --label venus.p05.role=ledger-test --user 1000:1000 --read-only --cap-drop ALL --security-opt no-new-privileges:true --network none --memory 768m --cpus 1 --pids-limit 96 --tmpfs /tmp:size=128m,mode=1777 --env TOPIC_LEDGER_TEST_ROOT=/state --env HOME=/tmp --env XDG_DATA_HOME=/tmp/xdg-data --mount ('type=volume,src='+$volume+',dst=/state') --mount ('type=bind,src='+$source+',dst=/app/apps/api/src/private-topic-ledger.ts,readonly') --mount ('type=bind,src='+$test+',dst=/app/apps/api/src/private-topic-ledger.test.ts,readonly') --mount ('type=bind,src='+$moduleSource+',dst=/app/apps/api/src/topic-room-lifecycle.ts,readonly') --mount ('type=bind,src='+$moduleTest+',dst=/app/apps/api/src/topic-room-lifecycle.test.ts,readonly') $image node -e $bootstrap | Set-Content (Join-Path $base 'test-create.txt');if($LASTEXITCODE){throw 'test create failed'}
& docker inspect $run | Set-Content (Join-Path $base 'test-inspect-before.json')
& docker start -a $run 2>&1 | Tee-Object (Join-Path $base 'tests.txt');$testExit=$LASTEXITCODE
& docker inspect $run | Set-Content (Join-Path $base 'test-inspect-after.json')
$after=@{module_sha256=(Get-FileHash $moduleSource).Hash.ToLower();module_test_sha256=(Get-FileHash $moduleTest).Hash.ToLower();source_sha256=(Get-FileHash $source).Hash.ToLower();test_sha256=(Get-FileHash $test).Hash.ToLower();test_exit=$testExit}
$after|ConvertTo-Json|Set-Content (Join-Path $base 'after.json')
if($after.module_sha256 -ne $descriptor.module_sha256 -or $after.module_test_sha256 -ne $descriptor.module_test_sha256 -or $after.source_sha256 -ne $descriptor.source_sha256 -or $after.test_sha256 -ne $descriptor.test_sha256){throw 'source drift'}
foreach($container in @($run,$init)) {
  $obj=(& docker inspect $container|ConvertFrom-Json)[0];if($obj.Config.Labels.'venus.p05.room-lifecycle' -ne $id -or $obj.State.Running){throw 'unsafe cleanup'}
  & docker rm $container | Add-Content (Join-Path $base 'cleanup.txt');if($LASTEXITCODE){throw 'container cleanup failed'}
}
$obj=(& docker volume inspect $volume|ConvertFrom-Json)[0];if($obj.Labels.'venus.p05.room-lifecycle' -ne $id){throw 'unsafe volume cleanup'}
& docker volume rm $volume | Add-Content (Join-Path $base 'cleanup.txt');if($LASTEXITCODE){throw 'volume cleanup failed'}
& docker ps -aq --filter ('label='+$label) | Set-Content (Join-Path $base 'remaining-containers.txt')
& docker volume ls -q --filter ('label='+$label) | Set-Content (Join-Path $base 'remaining-volumes.txt')
exit $testExit
