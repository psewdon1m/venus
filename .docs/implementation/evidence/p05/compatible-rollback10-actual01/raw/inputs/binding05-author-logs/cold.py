from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib,sys
sys.stdout.reconfigure(encoding='utf-8')
work=Path(__file__).parent.resolve();base=Path('.artifacts/p05-engine3-bundle-source01').resolve();p=base/'.artifacts/p05-compatible-rollback-producer05';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';results=[]
def run(name,args,expected=0):
 start=datetime.now(timezone.utc).isoformat();q=subprocess.run([node,*args],cwd=base,capture_output=True,timeout=45);(work/(name+'.stdout')).write_bytes(q.stdout);(work/(name+'.stderr')).write_bytes(q.stderr);r={'name':name,'argv':[node,*args],'cwd':str(base),'at_utc':start,'exit_code':q.returncode,'expected_exit_code':expected,'stdout_sha256':hashlib.sha256(q.stdout).hexdigest(),'stderr_sha256':hashlib.sha256(q.stderr).hexdigest()};results.append(r);(work/'commands.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf-8');assert q.returncode==expected,r;print(name,q.returncode)
run('binding09',[str(p/'author-rebind-controls.mjs')])
run('describe',[str(p/'driver.mjs'),'--describe'])
ack=work/'unauthorized-ack.json';ack.write_bytes((p/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes())
run('unauthorized-refusal',['--max-old-space-size=192',str(p/'driver.mjs'),'--run','--ack='+str(ack)],1)
script="const x=await import("+json.dumps((p/'source-proof.mjs').as_uri())+");const r=await x.verifyIncluded();console.log(JSON.stringify({identity:r.identity,files:Object.keys(r.files).length}));"
run('exact-included',['--input-type=module','-e',script])
syntax=[]
for f in sorted(p.glob('*.mjs')):
 q=subprocess.run([node,'--check',str(f)],cwd=base,capture_output=True,timeout=15);syntax.append({'file':f.name,'exit_code':q.returncode,'stderr':q.stderr.decode('utf-8')});assert q.returncode==0,syntax[-1]
(work/'syntax.json').write_text(json.dumps(syntax,indent=2)+'\n',encoding='utf-8')
run('binding-lint',[str(Path('node_modules/eslint/bin/eslint.js').resolve()),'--config',str(p/'eslint.config.mjs'),str(p/'author-rebind-controls.mjs')])
summary={'status':'PASS_AUTHOR_COLD_BINDING_ONLY_NOT_RUN','commands':results,'syntax_files':len(syntax),'binding_controls':9,'actual_Docker_commands':0,'actual_DB_connections':0,'actual_browser_launches':0,'root_ACK':False,'runtime_link':{'path':str(base/'.venv'),'target':'C:/ .projects/venus/.venv'.replace('/ ', '/'),'type':'Junction','excluded_from_source':True},'at_utc':datetime.now(timezone.utc).isoformat()}
(p/'cold-checks.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps(summary,indent=2))
