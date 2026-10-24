$directoryRun = Join-Path (Get-Location) ('.artifacts/p05-directory-component-' + [guid]::NewGuid().ToString('N').Substring(0,12))
New-Item -ItemType Directory -Path $directoryRun | Out-Null
$componentNames=@('topic-room-directories.ts','topic-room-directories.test.ts','security.ts')
foreach($componentName in $componentNames){Copy-Item -LiteralPath ('apps/api/src/'+$componentName) -Destination (Join-Path $directoryRun $componentName)}
"export default {cacheDir:'/tmp/vite-cache',test:{include:['apps/api/src/topic-room-directories.test.ts'],testTimeout:120000}};" | Set-Content -LiteralPath (Join-Path $directoryRun 'vitest.config.mjs') -Encoding utf8
$componentPins=foreach($componentName in $componentNames){@{path=$componentName;sha256=(Get-FileHash -LiteralPath (Join-Path $directoryRun $componentName) -Algorithm SHA256).Hash.ToLowerInvariant()}}
$componentPins | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directoryRun 'source-pins.json') -Encoding utf8
$containerName='venus-topic-dirs-'+[guid]::NewGuid().ToString('N').Substring(0,12)
$dockerArguments=@('create','--name',$containerName,'--label',('venus.component.owner='+$containerName),'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','768m','--cpus','1','--pids-limit','64','--tmpfs','/tmp:size=128m,mode=1777','--tmpfs','/home/node:size=32m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vite-temp:size=16m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vite:size=16m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vitest-cache:size=32m,uid=1000,gid=1000')
foreach($componentName in $componentNames){$dockerArguments+=@('--mount',('type=bind,source='+(Join-Path $directoryRun $componentName)+',target=/app/apps/api/src/'+$componentName+',readonly'))}
$dockerArguments+=@('--mount',('type=bind,source='+(Join-Path $directoryRun 'vitest.config.mjs')+',target=/app/vitest.config.mjs,readonly'),'sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472','node','node_modules/vitest/vitest.mjs','run','--config','vitest.config.mjs')
$created=$false
try{
 docker @dockerArguments *> (Join-Path $directoryRun 'create.txt')
 if($LASTEXITCODE -ne 0){throw 'Create failed'}
 $created=$true
 docker start -a $containerName *> (Join-Path $directoryRun 'tests.txt')
 $testExit=$LASTEXITCODE
 docker inspect $containerName | Set-Content -LiteralPath (Join-Path $directoryRun 'inspect.json') -Encoding utf8
 Get-Content -LiteralPath (Join-Path $directoryRun 'tests.txt')
 [pscustomobject]@{directory=$directoryRun;container=$containerName;test_exit=$testExit;scope='EXACT_THREE_SOURCE_SNAPSHOTS_COMPONENT_ONLY'} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $directoryRun 'receipt.json') -Encoding utf8
 if($testExit -ne 0){throw 'Component tests failed'}
}finally{
 if($created){
  $owned=docker inspect $containerName --format '{{index .Config.Labels "venus.component.owner"}}'
  if($owned -ne $containerName){throw 'Ownership mismatch'}
  docker rm $containerName *> (Join-Path $directoryRun 'cleanup.txt')
  if($LASTEXITCODE -ne 0){throw 'Cleanup failed'}
  docker ps -aq --filter ('label=venus.component.owner='+$containerName) | Set-Content -LiteralPath (Join-Path $directoryRun 'remaining.txt') -Encoding utf8
 }
 Write-Output $directoryRun
}
