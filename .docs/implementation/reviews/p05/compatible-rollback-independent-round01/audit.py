from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys,shutil
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/compatible-rollback-author-round01');p=Path('.artifacts/p05-compatible-rollback-producer01');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda f:json.loads(f.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='b9e3c6ec1fd1b0409f50c91a7f032dd8d8079ac0204dc65c5d5ed42998b06370';idx=read(a/'INDEX.json');assert len(idx['files'])==83
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
assert sha((p/'INDEX.json').read_bytes())=='684f3ea06fb1754c494edf5d3d1123e6ac3c7023e2dedde732386737473f652c';pi=read(p/'INDEX.json');assert len(pi['files'])==77
for name,row in pi['files'].items():
 b=(p/name).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'];assert b==(a/'producer'/name).read_bytes();assert not(p/name).is_symlink()
binding=read(p/'BINDING.json');included=read(p/'included-inputs.json');sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==included and identity(current)==binding['source_identity']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee' and len(current)==1823
assert binding['images']==dict(A='sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5',B='sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5')
assert binding['root_run_ack'] is False
assert binding['prior_source_identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
maps=read(p/'actual-image-maps.json');assert maps['images']==binding['images']
for role in ['A','B']:
 actual=maps['maps'][role]['files'];assert all(actual[k]==v for k,v in binding['per_image_compiled'][role].items()) and len(binding['per_image_compiled'][role])==64
assert [k for k,v in binding['per_image_compiled']['A'].items() if v!=binding['per_image_compiled']['B'][k]]==['apps/api/dist/room-routes.js','apps/api/dist/topic-games.js']
for group in ['A','B']:
 for path,pin in maps['maps'][group]['files'].items():
  if '/dist/' in path and ('relationship-engine/'in path or 'web/'in path) or path.endswith('.sql'):
   assert maps['maps']['A']['files'][path]==maps['maps']['B']['files'][path]
clone=Path('.artifacts/p05-compatible-rollback-independent-review01')
if not clone.exists():shutil.copytree(p,clone)
for name,row in pi['files'].items():
 # Initial clone check is performed before its isolated result JSONs are rerun.
 if not(clone/'INDEPENDENT_CLONE_INITIALIZED.json').exists():assert sha((clone/name).read_bytes())==row['sha256']
(clone/'INDEPENDENT_CLONE_INITIALIZED.json').write_text(json.dumps({'source_index_sha256':sha((p/'INDEX.json').read_bytes()),'source_files':77,'scope':'OWNED_EXCLUDED_FINITE_CONTROL_CLONE_ONLY_NOT_RUN_ELIGIBLE'},indent=2)+'\n',encoding='utf-8')
out={'status':'INPUT_BINDINGS_VERIFIED_EXPORT_FAULT_FINDING_OPEN','at_utc':datetime.now(timezone.utc).isoformat(),'author_children':83,'producer_files_mirror_exact':77,'source_identity':binding['source_identity'],'included_files':1823,'images':binding['images'],'compiled_each':64,'compiled_delta':['apps/api/dist/room-routes.js','apps/api/dist/topic-games.js'],'engine_SQL_UI_exact_A_B':True,'root_ack':False,'functional_run':False,'finite_control_clone':str(clone),'finding':'P05-ROLLBACK-EXPORT-FAULT-001'}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
