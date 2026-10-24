from pathlib import Path
import subprocess,json,hashlib,sys
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source14';p=s/'.artifacts/p05-compatible-rollback-producer26';c=p.with_name('p05-compatible-rollback-producer27');w=r/'.artifacts/p05-oci27-author01';w.mkdir();node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[];sha=lambda b:hashlib.sha256(b).hexdigest()
def run(name,args,cwd=r,expected=0):
 result=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30);(w/(name+'.stdout.txt')).write_bytes(result.stdout);(w/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode});assert result.returncode==expected,(name,result.returncode);return result
run('finite',[node,str(r/'.artifacts/p05-oci27-controls.mjs')])
changed=['bound-profile.mjs','bootstrap.mjs','host-runner.mjs','driver.mjs','contract.mjs','resource-lease.mjs'];targets=[c/n for n in changed]+[r/'.artifacts/p05-oci27-controls.mjs']
for i,target in enumerate(targets):run('syntax-'+str(i),[node,'--check',str(target)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',*[str(t)for t in targets]])
files=lambda base:{f.relative_to(base).as_posix():{'type':'regular_file','bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}for f in sorted(base.rglob('*'))if f.is_file()and f.name!='INDEX.json'}
a,b=files(p),files(c);assert set(b)-set(a)=={'RESOURCE_PROFILE27.md'};assert sorted(n for n in a if a[n]!=b[n])==sorted(changed+['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','PROFILE.json']);assert len([n for n in b if n.endswith('.mjs')])==40
binding=json.loads((c/'BINDING.json').read_bytes());assert binding['root_run_ack']is False;assert binding['resource_profile']=='QRB_BOUND_ONLY_2_BROWSER_PIDS256';ack=r/'.artifacts/p05-oci27-unissued-ack01.json';ack.write_bytes((c/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes());assert json.loads(ack.read_bytes())['root_run_ack']is False
(c/'INDEX.json').write_text(json.dumps({'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','source_identity':binding['source_identity'],'resource_profile':binding['resource_profile'],'files':b},indent=2)+'\n')
result=run('pendingACK-early-refusal',[node,'--max-old-space-size=192',str(c/'driver.mjs'),'--run','--ack='+str(ack)],s,1);assert b'NOT_ACCEPTED_BEFORE_OR_DURING_PLAN'in result.stderr
sys.path.insert(0,str(s/'tools'));from stage_inventory import inventory,identity
actual=inventory(s);assert identity(actual)==binding['source_identity']and len(actual)==1871;assert actual==json.loads((c/'included-inputs.json').read_bytes())
data={'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','focused_cold_groups':4,'syntax':7,'lint_exit':0,'source_count':1871,'source_identity':identity(actual),'resource_profile':binding['resource_profile'],'PID_limits':{'browser':256,'other_roles':128,'native_free':32},'runtime_MJS':40,'changed_MJS':changed,'other34_MJS':'BYTE_EXACT26','whole_OCI_trial':False,'APP_changes':False,'root_run_ack':False,'pendingACK_exit':1,'commands':commands};(w/'CHECKS.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({k:v for k,v in data.items()if k!='commands'}))
