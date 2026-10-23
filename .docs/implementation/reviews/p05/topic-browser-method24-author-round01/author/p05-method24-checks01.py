from pathlib import Path
import subprocess,json,hashlib
r=Path('C:/.projects/venus');out=r/'.artifacts/p05-method24-author01';out.mkdir();node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';browser=r/'.artifacts/p05-private-batch-browser-producer24/browser.mjs';control=r/'.artifacts/p05-method24-controls.mjs';commands=[]
def run(name,args):
 p=subprocess.run(args,cwd=r,capture_output=True,timeout=30);(out/(name+'.stdout.txt')).write_bytes(p.stdout);(out/(name+'.stderr.txt')).write_bytes(p.stderr);commands.append({'name':name,'argv':args,'exit_code':p.returncode});assert p.returncode==0,(name,p.returncode)
run('finite',[node,str(control)])
for name,path in [('browser',browser),('control',control)]:run('syntax-'+name,[node,'--check',str(path)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(browser),str(control)])
p=r/'.artifacts/p05-private-batch-browser-producer23';c=browser.parent;sha=lambda b:hashlib.sha256(b).hexdigest();names=sorted(x.name for x in c.glob('*.mjs'));assert len(names)==9 and len(list(p.glob('*.mjs')))==9
for name in names:
 if name!='browser.mjs':assert (p/name).read_bytes()==(c/name).read_bytes(),name
before=(p/'browser.mjs').read_bytes();after=browser.read_bytes();a=before.index(b' await check(9,');b=before.index(b' await check(10,',a);x=after.index(b' await check(9,');y=after.index(b' await check(10,',x);assert before[:a]==after[:x] and before[b:]==after[y:]
diag=r/'.docs/implementation/reviews/p05/a17-browser23-failure-diagnosis-independent-round01/INDEX.json';assert sha(diag.read_bytes())=='5007752aba66494263ae5651aebe4aff26fcfdf8fcd35fd2484b52f5b70fb292'
result={'status':'PASS_AUTHOR_COLD_ONLY_NOT_NATIVE','finite':8,'syntax_changed_plus_control':2,'lint_exit':0,'runtime_MJS':9,'other_MJS_byte_exact23':8,'all_other15_cases_and_helpers':'BYTE_EXACT23','shared_edit_preparation_ms':8000,'APP_edits':False,'native':False,'active_ACK':False,'diagnosis_sha256':sha(diag.read_bytes()),'commands':commands};(out/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='commands'}))
