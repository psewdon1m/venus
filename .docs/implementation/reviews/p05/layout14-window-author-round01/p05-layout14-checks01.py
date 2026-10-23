from pathlib import Path
import subprocess,hashlib,json,os
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-layout14-author01';out.mkdir()
source=root/'.artifacts/p05-pilot-bundle-source13';parent=source/'.artifacts/p05-v2-layout-producer-resume13';child=parent.with_name('p05-v2-layout-producer-resume14')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,expected=0,cwd=root):
 p=subprocess.run(args,cwd=cwd,env={**os.environ,'PYTHON':str(root/'.venv/Scripts/python.exe')},capture_output=True,timeout=30)
 (out/(name+'.stdout.txt')).write_bytes(p.stdout);(out/(name+'.stderr.txt')).write_bytes(p.stderr)
 commands.append({'name':name,'args':args,'cwd':str(cwd),'exit_code':p.returncode});assert p.returncode==expected,(name,p.returncode)
 return p
run('finite',[node,str(root/'.artifacts/p05-layout14-controls.mjs')])
for name,p in [('x11',child/'x11.mjs'),('run',child/'run.mjs'),('controls',root/'.artifacts/p05-layout14-controls.mjs')]:run('syntax-'+name,[node,'--check',str(p)])
run('lint',[node,str(root/'node_modules/eslint/bin/eslint.js'),'--config',str(root/'eslint.config.mjs'),'--no-ignore',str(child/'x11.mjs'),str(child/'run.mjs'),str(root/'.artifacts/p05-layout14-controls.mjs')])
for p in parent.glob('*.mjs'):
 data=(child/p.name).read_bytes();old=p.read_bytes()
 if p.name=='run.mjs':assert data==old.replace(b'p05-v2-layout-producer-resume13',b'p05-v2-layout-producer-resume14')
 elif p.name=='x11.mjs':
  before=old[:old.index(b'export async function windowFor')];after=old[old.index(b'export async function native200'):]
  assert data[:data.index(b'// Only the exact native suffix')]==before
  assert data[data.index(b'export async function native200'):]==after
 else:assert data==old,p.name
for name in ['binding.json','DESIGN.md','expected-cells.json','real-text-fixture.json']:assert (child/name).read_bytes()==(parent/name).read_bytes()
assert len(list(child.glob('*.mjs')))==27
before=sorted(p.name for p in (source/'.artifacts/p05').glob('venus-v2-layout-*'))
p=run('pending-ack',[node,str(child/'run.mjs')],1,source);assert b'ROOT_RUN_ACK_REQUIRED'in p.stderr
after=sorted(p.name for p in (source/'.artifacts/p05').glob('venus-v2-layout-*'));assert before==after
freeze=json.loads((root/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for name,h in freeze['files'].items():assert sha((source/name).read_bytes())==h,name
summary={'status':'PASS_AUTHOR_FINITE_AND_BINDING_ONLY_NOT_LAYOUT','finite':11,'syntax':3,'lint_exit':0,'unchanged_MJS':25,'changed_MJS':['x11.mjs','run.mjs'],'preserved_launch_native200_reset_screenshot':'BYTE_EXACT','binding_expectedcells_fixture_design':'BYTE_EXACT','pending_ack_exit':1,'new_layout_output':0,'source_files_exact':1870,'commands':commands}
(out/'CHECKS.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in summary.items() if k!='commands'}))
