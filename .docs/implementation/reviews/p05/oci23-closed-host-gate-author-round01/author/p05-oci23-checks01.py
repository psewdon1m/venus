from pathlib import Path
import subprocess,json,hashlib,sys
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source14';p=s/'.artifacts/p05-compatible-rollback-producer22';c=s/'.artifacts/p05-compatible-rollback-producer23';w=r/'.artifacts/p05-oci23-author01';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,cwd=r):
 result=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30);(w/(name+'.stdout.txt')).write_bytes(result.stdout);(w/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode});assert result.returncode==0,(name,result.returncode);return result
run('finite-final',[node,str(r/'.artifacts/p05-oci23-controls.mjs')])
for name,path in [('browser',c/'browser-child.mjs'),('control',r/'.artifacts/p05-oci23-controls.mjs')]:run('syntax-'+name,[node,'--check',str(path)])
run('lint-final',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(c/'browser-child.mjs'),str(r/'.artifacts/p05-oci23-controls.mjs')])
sha=lambda b:hashlib.sha256(b).hexdigest()
files=lambda d:{f.relative_to(d).as_posix():{'type':'regular_file','bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}for f in sorted(d.rglob('*'))if f.is_file()and f.name!='INDEX.json'}
a,b=files(p),files(c);assert set(a)==set(b);assert[n for n in a if a[n]!=b[n]]==['browser-child.mjs'];assert len([n for n in a if n.endswith('.mjs')])==40
assert json.loads((c/'BINDING.json').read_bytes())['root_run_ack']is False;assert json.loads((c/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes())['status']=='NOT_AUTHORIZED'
diag=r/'.docs/implementation/reviews/p05/oci22-a17-failure-diagnosis-independent-round01/INDEX.json';assert sha(diag.read_bytes())=='5dcf6ca4ab7d371df84ae1e12e12c1e2ce84915aa546df89938dedc20d3bf938'
actual=json.loads(run('source-inventory',[sys.executable,'-B','-c','import sys,json;sys.path.insert(0,"tools");from stage_inventory import inventory,identity;f=inventory();print(json.dumps({"files":f,"identity":identity(f)}))'],s).stdout)
binding=json.loads((c/'BINDING.json').read_bytes());assert actual['identity']==binding['source_identity'];assert len(actual['files'])==1871;assert actual['files']==json.loads((c/'included-inputs.json').read_bytes())
(w/'CHECKS.json').write_text(json.dumps({'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','finite':8,'syntax':2,'lint_exit':0,'source_count':1871,'source_identity':actual['identity'],'only_changed_child':'browser-child.mjs','other39_MJS':'BYTE_EXACT22','all_other_children':'BYTE_EXACT22','root_run_ack':False,'APP_changes':False,'native_operations':0,'commands':commands},indent=2)+'\n')
print(json.dumps({'status':'PASS_AUTHOR_COLD_ONLY','finite':8,'syntax':2,'lint_exit':0,'source_count':1871,'all_other_children_exact':len(b)-1,'browser':b['browser-child.mjs']}))
