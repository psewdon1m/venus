from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
def verify(root,pin,count):
 assert sha((root/'INDEX.json').read_bytes())==pin
 idx=read(root/'INDEX.json');assert len(idx['files'])==count
 for f in idx['files']:
  b=(root/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256'],f
 return idx
a=Path('.docs/implementation/reviews/p05/timing-poll-product-author-round01');b=Path('.docs/implementation/reviews/p05/timing-poll-product-author-round02');e=Path('.docs/implementation/evidence/p05/timing-poll-games20-docker-round02')
verify(a,'8cd666a25eea8ebfb355ff8561ffa2bedcd48b0b7820ae05b268bebfcfa9b48e',28)
verify(b,'017761047ddaec1226bed43653031266de14fa388600732da1a7be46ef9a31ed',5)
verify(e,'c828b8978505ead661eec4edc2b14bbc68f65bef75ebd58d38f5c028062cc920',21)
f1=read(a/'source-freeze.json');f2=read(b/'source-freeze.json');assert len(f2['files'])==1823 and set(f1['files'])==set(f2['files'])
assert [k for k in f2['files'] if f2['files'][k]!=f1['files'][k]]==['tests/p05-topic-games/cases.mjs']
old=(a/'source/tests/p05-topic-games/cases.mjs').read_text(encoding='utf-8');new=(b/'cases.mjs').read_text(encoding='utf-8')
assert old.replace("(await ok(f,member,base(f)+'/self-actions')).round_actions.finish,index===1", "(await ok(f,a,base(f)+'/self-actions')).round_actions.finish,index===1")==new
assert sha((b/'cases.mjs').read_bytes())==f2['files']['tests/p05-topic-games/cases.mjs']
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==f2['files'] and identity(current)==f2['identity']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee'
for file in ['inputs-before.json','inputs-after.json']:
 inp=read(e/'run'/file);assert inp['files']==f2['files'] and inp['identity']==f2['identity']
record=read(e/'RECORD.json');originalroot=Path('.artifacts/p05/venus-topic-games-5a06bcedd33c')
assert len(record['source_host_files'])==16
for file,pin in record['source_host_files'].items():
 raw=(e/'run'/file).read_bytes();assert len(raw)==pin['bytes'] and sha(raw)==pin['sha256'];assert raw==(originalroot/file).read_bytes()
rep=read(e/'run/topic-games-report.json');assert rep['status']=='PASS' and rep['runtime_cleanup']=='completed'
assert [v['id'] for v in rep['checks']]==['P05-TG-'+str(n).zfill(2) for n in range(1,21)] and all(v['status']=='PASS' for v in rep['checks'])
assert rep['checks'][5]['detail']['topic_pending_elapsed_ms']==29000 and rep['checks'][5]['detail']['action_pending_ms']==30000
assert rep['checks'][5]['detail']['action_accept_after_old_deadline'] is True and rep['checks'][5]['detail']['no_implicit_action_accept'] is True
runner=read(e/'run/runner.json');assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None
assert (e/'p05-timing-poll-games20-exit02.txt').read_text().strip()=='0'
assert read(e/'run/resources-after-cleanup.json')==dict(containers=[],networks=[],volumes=[])
image='sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5'
receipt=read(b/'image-binding.json');prior=read(a/'image-binding.json')
assert sha((b/'image-binding.json').read_bytes())=='052f2ed10ed2c7a698a623dc2aae715bc4f7e8c1301e288e7f24eab5531e1a3e'
assert receipt['image']==runner['image']==(e/'run/image-id.txt').read_text().strip()==image
assert receipt['source_identity']==runner['source_identity']==f2['identity'] and receipt['probe_exit_code']==0 and receipt['source_before_after_unchanged'] is True
assert len(receipt['source_files'])==202 and len(receipt['compiled_files'])==64 and len(receipt['migration_files'])==7 and len(receipt['web_dist_files'])==3 and len(receipt['image_files_sha256'])==269
for k,v in receipt['source_files'].items():assert f2['files'][k]==v
for group in ['compiled_files','web_dist_files']:
 assert receipt[group]==prior[group]
 if group=='compiled_files':
  for k,v in receipt[group].items():assert sha(Path(k).read_bytes())==v
assert receipt['migration_files']==prior['migration_files']
assert {**receipt['source_files'],**receipt['compiled_files'],**receipt['web_dist_files']}==receipt['image_files_sha256']
assert [k for k in receipt['image_files_sha256'] if receipt['image_files_sha256'][k]!=prior['image_files_sha256'].get(k)]==['tests/p05-topic-games/cases.mjs']
draft=Path('.artifacts/p05-timing-poll-browser18-binding-draft03.json');outer=Path('.artifacts/p05-timing-poll-browser18-run03.mjs')
assert sha(draft.read_bytes())=='cb48d9e25d35a1c5eb259e68bc82ed19dd1a70c4dca338d770973bc310d83034'
assert sha(outer.read_bytes())=='fac38b2ce446cd2f4456b1a7d8e97641f3d79f89fb68301c28c4253f94bd11b2'
d=read(draft);assert d['image']==image and d['source_identity']==f2['identity'] and d['included_files']==1823
assert d['status'].startswith('NOT_AUTHORIZED') and d['rebinding_review_index'] is None
oldouter=Path('.artifacts/p05-unified-method18-browser-run01.mjs').read_text(encoding='utf-8');newouter=outer.read_text(encoding='utf-8')
expected=oldouter.replace('sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5',image).replace('.artifacts/p05-unified-method18-root-ack01.json','.artifacts/p05-timing-poll-browser18-root-ack03.json').replace('b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4',f2['identity']).replace('before.files).length,1819','before.files).length,1823')
assert expected==newouter
accepted=read(Path('.docs/implementation/evidence/p05/unified-method18-chromium-actual01/run/producer-pins.json'))
assert d['runtime_pins']==accepted
for k,v in accepted.items():assert sha((Path('.artifacts/p05-private-batch-browser-producer18')/k).read_bytes())==v
assert sha(Path(d['image_receipt']).read_bytes())==d['image_receipt_sha256']=='052f2ed10ed2c7a698a623dc2aae715bc4f7e8c1301e288e7f24eab5531e1a3e'
assert sha(Path(d['independent_review_index']).read_bytes())==d['independent_review_index_sha256']=='87ec16348ba810913f8cc8d603987dd6c8416c83e43261bf349fa3bb89a9e99b'
oldfail=Path(record['previous_failure_index']);verify(oldfail.parent,'65f92cd63b687a4f222cae5fe69f99f654c005189785afbb7b8029d2fe813c85',len(read(oldfail)['files']))
out={'status':'PASS_NARROW_PRODUCT_FIX_AND_ACTUAL_CORE_AND_OPERATIONAL_REBIND_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'author01_children':28,'author02_children':5,'actual_children':21,'actual_original_raw_matches':16,'source_identity':f2['identity'],'source_count':1823,'image':image,'image_receipt_maps':{'source':202,'compiled':64,'migrations_subset':7,'web_dist':3,'union':269},'image_scope':'Existing root actual probe receipt inspected, no independent new Docker image probe','compiled_web_sql_unchanged_from_author01':True,'only_image_path_change':'tests/p05-topic-games/cases.mjs','actual_core_checks':20,'actual_cleanup':'completed empty archived inventory','operational_outer_change':'ONLY_IMAGE_ACKPATH_SOURCE_COUNT_LITERAL_REPLACEMENTS','runtime_helpers_unchanged':10,'browser_run_authorized':False,'browser_actual_current':'NOT_RUN','dirty_tree':True,'full_stage_pass':False}
(r/'audit-final.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
