from pathlib import Path
import hashlib,json,subprocess,os
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-layout12-author01'
snapshot=root/'.artifacts/p05-pilot-bundle-source12'
parent=snapshot/'.artifacts/p05-v2-layout-producer-resume11';child=parent.with_name('p05-v2-layout-producer-resume12')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha=lambda data:hashlib.sha256(data).hexdigest()
rows=[]
def run(name,cmd,cwd=root,expected=0):
 p=subprocess.run(cmd,cwd=cwd,env={**os.environ,'PYTHON':str(root/'.venv/Scripts/python.exe')},capture_output=True,timeout=30)
 (out/(name+'.stdout.txt')).write_bytes(p.stdout);(out/(name+'.stderr.txt')).write_bytes(p.stderr)
 rows.append({'name':name,'argv':cmd,'cwd':str(cwd),'exit_code':p.returncode,'expected_exit':expected})
 assert p.returncode==expected,(name,p.returncode,p.stderr[:256])
 return p
run('controls02',[node,str(out/'controls.mjs')])
for f in sorted(child.glob('*.mjs')):run('syntax-'+f.stem,[node,'--check',str(f)])
run('lint02',[node,str(root/'node_modules/eslint/bin/eslint.js'),'--config',str(root/'eslint.config.mjs'),'--no-ignore',str(child/'probe-policy.mjs'),str(child/'run.mjs'),str(out/'controls.mjs')])
names=sorted(f.name for f in parent.glob('*.mjs'));assert len(names)==27
for name in names:
 a=(parent/name).read_bytes();b=(child/name).read_bytes()
 if name=='run.mjs':assert b==a.replace(b'p05-v2-layout-producer-resume11',b'p05-v2-layout-producer-resume12')
 elif name=='probe-policy.mjs':
  prefix=b[:b.index(b'// Literal diagnostic labels only.')]
  prefix=prefix.replace(b"\nimport {types} from 'node:util';\nimport {fileURLToPath} from 'node:url';\n",b'')
  assert prefix==a[:a.index(b'export function safeFailure(error)')]
 else:assert a==b,name
assert (parent/'binding.json').read_bytes()==(child/'binding.json').read_bytes()
for name in ['expected-cells.json','real-text-fixture.json','DESIGN.md']:
 assert (parent/name).read_bytes()==(child/name).read_bytes()
before=sorted(p.name for p in (snapshot/'.artifacts/p05').iterdir())
p=run('pending-ack',[node,str(child/'run.mjs')],snapshot,1)
assert b'ROOT_RUN_ACK_REQUIRED' in p.stderr
assert before==sorted(p.name for p in (snapshot/'.artifacts/p05').iterdir())
assert json.loads((child/'ROOT_RUN_ACK.json').read_text())['root_run_ack'] is False
freeze=json.loads((root/'.artifacts/p05-pilot-bundle-source-freeze12.json').read_text())
for name,pin in freeze['files'].items():
 data=(snapshot/name).read_bytes();assert sha(data)==pin['sha256'] and len(data)==pin['bytes'],name
assert len(freeze['files'])==1869
receipt=root/'.artifacts/p05-pilot-bundle-image-binding12/receipt.json'
assert sha(receipt.read_bytes())=='53b227006b685cc87bf47fe9b34ccafd05eabe9968d4976afc7707aba334bfff'
summary={'status':'PASS_AUTHOR_COLD_ONLY_NOT_NATIVE','finite_controls':16,'syntax_modules':len(names),'unchanged_mjs':25,'run_change':'dirname_literal_only','policy_other_functions':'BYTE_EXACT','binding_fixtures_design':'BYTE_EXACT','source_files_exact':1869,'pending_ack_exit':1,'no_output_allocation':True,'commands':rows}
(out/'CHECKS.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in summary.items() if k!='commands'}))
