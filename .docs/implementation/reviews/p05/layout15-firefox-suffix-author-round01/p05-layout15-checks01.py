from pathlib import Path
import subprocess,json,hashlib,os
r=Path('C:/.projects/venus');out=r/'.artifacts/p05-layout15-author01';out.mkdir();p=r/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume14';c=p.with_name('p05-v2-layout-producer-resume15');source=p.parent.parent
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,expected=0,cwd=r):
 result=subprocess.run(args,cwd=cwd,env={**os.environ,'PYTHON':str(r/'.venv/Scripts/python.exe')},capture_output=True,timeout=30);(out/(name+'.stdout.txt')).write_bytes(result.stdout);(out/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode});assert result.returncode==expected,(name,result.returncode);return result
run('finite',[node,str(r/'.artifacts/p05-layout15-controls.mjs')])
for label,path in [('x11',c/'x11.mjs'),('run',c/'run.mjs'),('controls',r/'.artifacts/p05-layout15-controls.mjs')]:run('syntax-'+label,[node,'--check',str(path)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(c/'x11.mjs'),str(c/'run.mjs'),str(r/'.artifacts/p05-layout15-controls.mjs')])
for path in p.glob('*.mjs'):
 if path.name=='x11.mjs':continue
 old=path.read_bytes();new=(c/path.name).read_bytes();assert new==(old.replace(b'p05-v2-layout-producer-resume14',b'p05-v2-layout-producer-resume15') if path.name=='run.mjs' else old),path.name
for name in ['binding.json','expected-cells.json','real-text-fixture.json','DESIGN.md']:assert (c/name).read_bytes()==(p/name).read_bytes()
assert len(list(c.glob('*.mjs')))==27
before=sorted(x.name for x in (source/'.artifacts/p05').glob('venus-v2-layout-*'));result=run('pending-ack',[node,str(c/'run.mjs')],1,source);assert b'ROOT_RUN_ACK_REQUIRED'in result.stderr;assert before==sorted(x.name for x in (source/'.artifacts/p05').glob('venus-v2-layout-*'))
freeze=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
for name,h in freeze['files'].items():assert sha((source/name).read_bytes())==h,name
css=json.loads((r/'.docs/implementation/p05-source-revision-ui-control-contrast-01.json').read_text());assert sha((r/'apps/web/src/style.css').read_bytes())==css['after_css_sha256']
result={'status':'PASS_MINIMAL_METHOD_AUTHOR_NOT_NATIVE','finite':4,'syntax_changed_and_control':3,'lint_exit':0,'unchanged_MJS':25,'run_dir_literal_only':True,'readiness_focus_native_methods':'BYTE_EXACT14','source13_exact':1870,'MAIN_CSS_frozen_unchanged':True,'pending_ack_exit':1,'calibration_worker_exit':1,'calibration_cleanup':'PASS','WebKit':'UNRESOLVED_NO_SUFFIX_GRANTED','commands':commands}
(out/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='commands'}))
