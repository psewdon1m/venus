from pathlib import Path
import json,subprocess,os,hashlib
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-a16-three-bindings-author01'
data=json.loads((out/'PREPARED.json').read_text());dest={k:Path(v) for k,v in data['destinations'].items()};source=root/'.artifacts/p05-pilot-bundle-source13'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=[]
def run(name,args,cwd=root,expected=0,contains=None):
 result=subprocess.run(args,cwd=cwd,env={**os.environ,'PYTHON':str(root/'.venv/Scripts/python.exe')},capture_output=True,timeout=30)
 (out/(name+'.stdout.txt')).write_bytes(result.stdout);(out/(name+'.stderr.txt')).write_bytes(result.stderr)
 rows.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode,'expected_exit':expected})
 assert result.returncode==expected,(name,result.returncode)
 if contains:assert contains.encode() in result.stderr,(name,result.stderr[:256])
run('controls02',[node,str(out/'controls.mjs')])
for name,p in [('layout-run',dest['layout']/'run.mjs'),('layout-policy',dest['layout']/'runner-policy.mjs'),('author-controls',out/'controls.mjs')]:run('syntax-'+name,[node,'--check',str(p)])
run('lint',[node,str(root/'node_modules/eslint/bin/eslint.js'),'--config',str(root/'eslint.config.mjs'),'--no-ignore',str(dest['layout']/'run.mjs'),str(dest['layout']/'runner-policy.mjs'),str(out/'controls.mjs')])
before=sorted(p.name for p in (source/'.artifacts/p05').iterdir()) if (source/'.artifacts/p05').exists() else []
ociACK=out/'OCI20-PENDING-ACK.json';ociACK.write_bytes((dest['oci']/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes())
run('pending-oci',[node,'--max-old-space-size=192',str(dest['oci']/'driver.mjs'),'--run','--ack='+str(ociACK)],source,1,'NOT_AUTHORIZED')
run('pending-wire',[node,str(dest['wire']/'runner.mjs'),str(dest['wire']/'ROOT-ACK.template.json')],source,1,'NOT_AUTHORIZED')
run('pending-layout',[node,str(dest['layout']/'run.mjs')],source,1,'ROOT_RUN_ACK_REQUIRED')
after=sorted(p.name for p in (source/'.artifacts/p05').iterdir()) if (source/'.artifacts/p05').exists() else []
assert before==after
freeze=json.loads((root/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text())
for n,h in freeze['files'].items():assert hashlib.sha256((source/n).read_bytes()).hexdigest()==h,n
summary={'status':'PASS_COLD_NO_NATIVE','finite_controls':12,'syntax':3,'lint_exit':0,'pending_denials':3,'new_project_outputs':0,'readonly_source_exact':1870,'commands':rows}
(out/'CHECKS.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in summary.items() if k!='commands'}))
