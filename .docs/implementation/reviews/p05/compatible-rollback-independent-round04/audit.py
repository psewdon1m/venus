from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys,shutil,subprocess
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/compatible-rollback-author-round04');p=Path('.artifacts/p05-compatible-rollback-producer04');old=Path('.artifacts/p05-compatible-rollback-producer02');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='f0f5c875b30ade311582b5a762b4c046f76c7543f6ab3a7c4805ec91acca72e9';idx=read(a/'INDEX.json');assert len(idx['files'])==145
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
assert sha((p/'INDEX.json').read_bytes())=='10659a29e2d60f90dfe952d991a29435f20e51f059dd6b4227a18e1b989df666';pi=read(p/'INDEX.json');assert len(pi['files'])==140
for name,row in pi['files'].items():
 b=(p/name).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'] and b==(a/'producer'/name).read_bytes()
carry=read(p/'METHOD_CARRY.json');assert len(carry['unchanged_MJS_files'])==23
for row in carry['unchanged_MJS_files']:assert (p/row['path']).read_bytes()==(old/row['path']).read_bytes() and sha((p/row['path']).read_bytes())==row['sha256']
binding=read(p/'BINDING.json');maps=read(p/'actual-image-maps.json');assert sha((p/'actual-image-maps.json').read_bytes())==binding['expanded_actual_image_UI_migration_maps_sha256']=='badcbb553055434b4c05ae4e1a48d3de8c8d02e58e87e57e14b49185321c845b';assert maps['images']==binding['images']
assert binding['images']=={'A':'sha256:e076901479f7b7af94d54ada3698cf69a60d39caf57cf78f311945638f589898','B':'sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5'}
for key in ['A','B']:
 m=maps['maps'][key];assert len(m['files'])==76 and m['compiled64'] and m['metadata_absent'] and m['metadata'] is None
 assert len(binding['per_image_compiled'][key])==64
 assert all(m['files'][name]==pin for name,pin in binding['per_image_compiled'][key].items())
 ref=maps['source_receipts'][key];rp=Path(ref['path']);assert sha(rp.read_bytes())==ref['sha256'];receipt=read(rp);assert receipt['image']==binding['images'][key]
 observed=dict(receipt['image_files_sha256'])
 for extra in read(p/'additional-image-readonly-pins.json').values():
  if extra['image']==binding['images'][key]:
   assert extra['exit_code']==0
   for name,pin in extra['observed']['files'].items():
    if name in observed:assert observed[name]==pin
    observed[name]=pin
 assert all(observed[name]==pin for name,pin in m['files'].items())
assert maps['maps']['B']['files']==read(old/'actual-image-maps.json')['maps']['B']['files']
assert maps['maps']['A']['files']==read(p/'pinned-inputs/previous03-actual-image-maps.json.bytes')['maps']['A']['files']
for name,pin in binding['per_image_compiled']['A'].items():assert sha(Path(name).read_bytes())==pin
assert binding['root_run_ack'] is False and binding['resource_profile']=='QRB_BOUND_ONLY_1' and binding['private_policies']=={'A':'ROOM-TOPIC-2','B':'ROOM-TOPIC-2'}
ack=read(p/'ROOT_RUN_ACK_TEMPLATE.json');assert ack['status']=='NOT_AUTHORIZED' and ack['root_run_ack'] is False and ack['images']==binding['images'] and ack['source_identity']==binding['source_identity'] and ack['application_source_review_source']==binding['source_identity']
assert ack['attempts']==1 and ack['whole_ms']==900000 and ack['total_cap_bytes']==512*1024**2 and ack['reserve_bytes']==10*1024**3 and ack['expanded_image_map_sha256']==binding['expanded_actual_image_UI_migration_maps_sha256']
for path,pin in [('.docs/implementation/reviews/p05/compatible-rollback-independent-round02/INDEX.json','d68260aa874d047e55bb826f48b859e1d94faea289e0d809c2c32d06c9d8dfd7'),('.docs/implementation/reviews/p05/projection-reuse-product-independent-round01/INDEX.json','064ee1158fc15e1f281c690d6099293f65a5f6ea1ddb1810749ae4d8e196ec6a'),('.docs/implementation/reviews/p05/projection-reuse-product-independent-round02/INDEX.json','bfa41440459c38ec200ad065fe00c47d4299e030a85bea250d3fdf1062129b5e')]:assert sha(Path(path).read_bytes())==pin and read(Path(path))['status'].startswith('PASS')
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==read(p/'included-inputs.json') and identity(current)==binding['source_identity']=='732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80' and len(current)==1826
clone=Path('.artifacts/p05-compatible-rollback-independent-review04');assert not clone.exists();shutil.copytree(p,clone)
argv=['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe',str(clone/'author-rebind-controls.mjs')];result=subprocess.run(argv,capture_output=True,text=True);(r/'binding-controls.stdout.txt').write_text(result.stdout,encoding='utf-8');(r/'binding-controls.stderr.txt').write_text(result.stderr,encoding='utf-8');(r/'COMMAND.json').write_text(json.dumps({'argv':argv,'exit_code':result.returncode,'at_utc':datetime.now(timezone.utc).isoformat()},indent=2)+'\n',encoding='utf-8');assert result.returncode==0
for name,row in pi['files'].items():assert sha((p/name).read_bytes())==row['sha256']
assert inventory()==current
out={'at_utc':datetime.now(timezone.utc).isoformat(),'status':'PASS_OPERATIONAL_OCI04_REBIND_ONLY_NOT_RUN','author_children':145,'producer_exact_mirror_files':140,'accepted02_MJS_equal':23,'A_full_anchor_map':76,'B_full_anchor_map':76,'A_anchors_equal03':True,'B_anchors_equal02':True,'source_identity':binding['source_identity'],'source_files':1826,'binding_controls':9,'exit_code':0,'unchanged173_repeated':False,'actual_Docker_RUN':False,'root_ACK':False,'full_P05_PASS':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2));print(result.stdout)
