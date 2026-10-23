$ErrorActionPreference='Stop'
$base=Join-Path (Get-Location) '.docs/implementation/evidence/p05/directory-allocator-review-01'
$owner='venus-independent-dirs-'+[guid]::NewGuid().ToString('N').Substring(0,12)
$args=@('create','--name',$owner,'--label',('venus.review.owner='+$owner),'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','768m','--cpus','1','--pids-limit','64','--tmpfs','/tmp:size=128m,mode=1777','--tmpfs','/home/node:size=32m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vite-temp:size=16m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vite:size=16m,uid=1000,gid=1000','--tmpfs','/app/node_modules/.vitest-cache:size=32m,uid=1000,gid=1000')
foreach($name in 'topic-room-directories.ts','topic-room-directories.test.ts','security.ts'){$args+=@('--mount',('type=bind,source='+(Join-Path $base ('source/'+$name))+',target=/app/apps/api/src/'+$name+',readonly'))}
$args+=@('--mount',('type=bind,source='+(Join-Path $base 'independent.test.ts')+',target=/app/apps/api/src/review-directory.test.ts,readonly'),'--mount',('type=bind,source='+(Join-Path $base 'vitest.config.mjs')+',target=/app/vitest.config.mjs,readonly'),'sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472','node','node_modules/vitest/vitest.mjs','run','--config','vitest.config.mjs','--reporter=verbose')
$created=$false
try {
 docker @args *> (Join-Path $base 'create-01.txt')
 if($LASTEXITCODE -ne 0){throw 'Container create failed'}
 $created=$true
 docker start -a $owner *> (Join-Path $base 'tests-01.txt')
 $testExit=$LASTEXITCODE
 docker inspect $owner | Set-Content -LiteralPath (Join-Path $base 'inspect-01.json') -Encoding utf8
 [pscustomobject]@{owner=$owner;test_exit=$testExit;image='sha256:68980ea56c41bfbbfed14c3d7c168194b22483a5d66a429bd7cd5d60a53b0472';checked_at=[DateTimeOffset]::Now.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $base 'run-receipt-01.json') -Encoding utf8
 Get-Content -LiteralPath (Join-Path $base 'tests-01.txt')
}finally {
 if($created){
  $actual=docker inspect $owner --format '{{index .Config.Labels "venus.review.owner"}}'
  if($actual -ne $owner){throw 'Review ownership mismatch'}
  docker rm $owner *> (Join-Path $base 'cleanup-01.txt')
  if($LASTEXITCODE -ne 0){throw 'Owned container cleanup failed'}
  $remaining=@(docker ps -aq --filter ('label=venus.review.owner='+$owner))
  [pscustomobject]@{owner=$owner;remaining=$remaining;checked_at=[DateTimeOffset]::Now.ToString('o')} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $base 'remaining-01.json') -Encoding utf8
 }
}
exit $testExit
