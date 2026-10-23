from pathlib import Path
import sys,subprocess,json
r=Path('C:/.projects/venus');f=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text());kind=sys.argv[1];assert kind in ['test','production'];prefix='p05-pilot-bundle-'+('production-'if kind=='production'else'');args=['docker','build','--progress=plain','-f','infra/venus/Dockerfile'if kind=='production'else'infra/venus/Dockerfile.p05-tests']
args+=['--build-arg','SOURCE_REVISION='+f['git_source_commit']]if kind=='production'else['--target','runtime'];args+=['--iidfile',str(r/'.artifacts'/(prefix+'image13.txt')),'.']
with(r/'.artifacts'/(prefix+'build13.txt')).open('w',encoding='utf-8')as o:p=subprocess.run(args,cwd=f['materialized_root'],stdout=o,stderr=subprocess.STDOUT)
(r/'.artifacts'/(prefix+'build13-exit.txt')).write_text(str(p.returncode)+'\n',encoding='utf-8');print(kind,p.returncode);raise SystemExit(p.returncode)
