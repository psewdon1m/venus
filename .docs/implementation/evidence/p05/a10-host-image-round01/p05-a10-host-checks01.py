from pathlib import Path
import json,os,subprocess,sys,datetime
r=Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
before=inventory(r);freeze=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze07.json').read_text());assert before==freeze['files']
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';env=os.environ.copy();env['PATH']=str(r/'.venv/Scripts')+';'+str(Path(node).parent)+';'+env['PATH'];out=r/'.artifacts/p05-a10-host-checks01';assert not out.exists();out.mkdir()
results=[]
for name,args in [('vitest',[node,'node_modules/vitest/vitest.mjs','run']),('typecheck',[node,'node_modules/typescript/bin/tsc','-b']),('web-typecheck',[node,'node_modules/typescript/bin/tsc','-p','apps/web/tsconfig.json']),('lint',[node,'node_modules/eslint/bin/eslint.js','apps','packages','tools/*.mjs','tests/**/*.mjs'])]:
 with(out/(name+'.txt')).open('w',encoding='utf-8')as stream:p=subprocess.run(args,cwd=r,env=env,stdout=stream,stderr=subprocess.STDOUT)
 results.append({'name':name,'exit':p.returncode});print(name,p.returncode,flush=True)
after=inventory(r);assert before==after
(out/'receipt.json').write_text(json.dumps({'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':identity(before),'source_count':len(before),'before_after_exact':True,'results':results,'stage_PASS':False},indent=2)+'\n',encoding='utf-8')
raise SystemExit(any(v['exit']for v in results))
