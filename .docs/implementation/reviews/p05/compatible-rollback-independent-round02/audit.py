from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,difflib
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/compatible-rollback-author-round02');p=Path('.artifacts/p05-compatible-rollback-producer02');old=Path('.artifacts/p05-compatible-rollback-producer01');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='7bbf51fad73bfe3d4629fda38721a3b49b5344f243c8f3f7bdcb681e3a17552a';idx=read(a/'INDEX.json');assert len(idx['files'])==104
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
assert sha((p/'INDEX.json').read_bytes())=='5778b19607e31246b1fc222da34f2742b59e5e5bdc215194cba9fd18823dca3a';pi=read(p/'INDEX.json');assert len(pi['files'])==99
for name,row in pi['files'].items():
 b=(p/name).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'];assert b==(a/'producer'/name).read_bytes()
assert sha((old/'INDEX.json').read_bytes())=='684f3ea06fb1754c494edf5d3d1123e6ac3c7023e2dedde732386737473f652c'
for name,row in read(old/'INDEX.json')['files'].items():assert sha((old/name).read_bytes())==row['sha256']
binding=read(p/'BINDING.json');prior_binding=read(old/'BINDING.json')
binding_delta={k:{'old':prior_binding.get(k),'new':binding.get(k)}for k in set(binding)|set(prior_binding) if binding.get(k)!=prior_binding.get(k)}
print('BINDING_DELTA',json.dumps(binding_delta))
assert binding['source_identity']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee' and binding['root_run_ack'] is False
for name in ['included-inputs.json','actual-image-maps.json','CONTROL_MATRIX.md','ROOT_RUN_ACK_TEMPLATE.json','dependency-pins.json']:
 assert (p/name).read_bytes()==(old/name).read_bytes(),name
assert len(read(p/'included-inputs.json'))==1823
changes=[]
for name in sorted(set(read(old/'INDEX.json')['files'])|set(pi['files'])):
 if not (old/name).exists() or not(p/name).exists() or (p/name).read_bytes()!=(old/name).read_bytes():changes.append(name)
runtime=[name for name in changes if name.endswith('.mjs') and not name.startswith('author-')]
assert runtime==['browser-child.mjs','contract.mjs','host-runner.mjs']
diff=''
for name in runtime:
 diff+=''.join(difflib.unified_diff((old/name).read_text(encoding='utf-8').splitlines(True),(p/name).read_text(encoding='utf-8').splitlines(True),fromfile='01/'+name,tofile='02/'+name))
(r/'runtime.patch').write_text(diff,encoding='utf-8')
clone=Path('.artifacts/p05-compatible-rollback-independent-review02');assert not clone.exists();shutil.copytree(p,clone)
for name,row in pi['files'].items():assert sha((clone/name).read_bytes())==row['sha256']
(clone/'INDEPENDENT_CLONE_INITIALIZED.json').write_text(json.dumps({'index_sha256':sha((p/'INDEX.json').read_bytes()),'files':99,'status':'OWN_EXCLUDED_FINITE_CLONE_NOT_RUN_ELIGIBLE'})+'\n',encoding='utf-8')
out={'at_utc':datetime.now(timezone.utc).isoformat(),'author_children':104,'producer_mirror_exact':99,'old77_exact':True,'binding_delta':binding_delta,'source':'HISTORICAL_AA1823_NOT_CURRENT_OPTIMIZATION_WIP','runtime_delta':runtime,'all_changed_paths':changes,'new_run':False,'root_ack':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
