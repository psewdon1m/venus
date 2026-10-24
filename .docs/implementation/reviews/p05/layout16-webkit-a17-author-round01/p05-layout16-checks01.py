from pathlib import Path
import json,subprocess,hashlib,os
r=Path('C:/.projects/venus');out=r/'.artifacts/p05-layout16-author01';out.mkdir();p=r/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume15';c=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16';source=c.parent.parent
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,expected=0,cwd=r):
 result=subprocess.run(args,cwd=cwd,env={**os.environ,'PYTHON':str(r/'.venv/Scripts/python.exe')},capture_output=True,timeout=30);(out/(name+'.stdout.txt')).write_bytes(result.stdout);(out/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode});assert result.returncode==expected,(name,result.returncode);return result
run('finite',[node,str(r/'.artifacts/p05-layout16-controls.mjs')])
targets=[c/'x11.mjs',c/'run.mjs',c/'runner-policy.mjs',r/'.artifacts/p05-layout16-controls.mjs']
for i,path in enumerate(targets):run('syntax-'+str(i),[node,'--check',str(path)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',*[str(x) for x in targets]])
unchanged=0
for path in p.glob('*.mjs'):
 if path.name=='x11.mjs':continue
 old=path.read_bytes();new=(c/path.name).read_bytes()
 if path.name=='run.mjs':assert new==old.replace(b'p05-v2-layout-producer-resume15',b'p05-v2-layout-producer-resume16').replace(b'FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED',b'FINAL_A17_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace(b'FINAL_A16_BINDING_REQUIRED',b'FINAL_A17_BINDING_REQUIRED')
 elif path.name=='runner-policy.mjs':assert new==old.replace(b'assert.equal(binding.included_files,1870)',b'assert.equal(binding.included_files,1871)')
 else:assert old==new;unchanged+=1
assert unchanged==24
for name in ['expected-cells.json','real-text-fixture.json','DESIGN.md']:assert (c/name).read_bytes()==(p/name).read_bytes()
freezePath=r/'.artifacts/p05-pilot-bundle-source-freeze14.json';receiptPath=r/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';freeze=json.loads(freezePath.read_text());receipt=json.loads(receiptPath.read_text());binding=json.loads((c/'binding.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
assert binding['source_identity']==receipt['source_identity']==freeze['identity'];assert binding['image']==receipt['image'];assert binding['root_build_receipt_sha256']==sha(receiptPath.read_bytes());assert binding['source_snapshot_sha256']==sha(freezePath.read_bytes());assert binding['included_files']==1871
for name,h in freeze['files'].items():assert sha((source/name).read_bytes())==h,name
before=sorted(x.name for x in (source/'.artifacts/p05').glob('venus-v2-layout-*'));pending=run('pending-ack',[node,str(c/'run.mjs')],1,source);assert b'ROOT_RUN_ACK_REQUIRED'in pending.stderr;assert before==sorted(x.name for x in (source/'.artifacts/p05').glob('venus-v2-layout-*'))
result={'status':'PASS_TARGETED_METHOD_BINDING_ONLY_NOT_NATIVE','finite':4,'syntax_changed_and_control':4,'lint_exit':0,'MJS_total':27,'raw_unchanged_MJS':24,'binding_literal_MJS':['run.mjs','runner-policy.mjs'],'readiness_focus_native_methods':'BYTE_EXACT15','A17_source_exact':1871,'pending_ack_exit':1,'no_new_layout_output':True,'calibration_scope':'Owned WebKit childPID and exact Playwright prefix measured; not layout/nativezoomPASS','commands':commands};(out/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='commands'}))
