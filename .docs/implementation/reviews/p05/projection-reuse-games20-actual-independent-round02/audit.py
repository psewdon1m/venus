from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;p=Path('.docs/implementation/evidence/p05/projection-reuse-games20-docker-round02');read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((p/'INDEX.json').read_bytes())=='87f01456f5f07daaa09f218ef376cae56f086759fa1f04479d31247a977dd912';idx=read(p/'INDEX.json');assert len(idx['files'])==21
for f in idx['files']:
 b=(p/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
record=read(p/'RECORD.json');runner=read(p/'run/runner.json');original=Path('.artifacts/p05')/runner['project']
for name,row in record['raw_files'].items():
 b=(p/'run'/name).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256'] and b==(original/name).read_bytes()
assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None and runner['full_stage_acceptance'] is False
before=read(p/'run/inputs-before.json');assert before==read(p/'run/inputs-after.json') and before['identity']=='732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80' and len(before['files'])==1826
report=read(p/'run/topic-games-report.json');assert [v['id']for v in report['checks']]==['P05-TG-'+str(i).zfill(2)for i in range(1,21)] and all(v['status']=='PASS' for v in report['checks']);assert report['status']=='PASS' and report['runtime_cleanup']=='completed' and report['full_p05_pass'] is False
checks={v['id']:v['detail']for v in report['checks']}
assert checks['P05-TG-14']=={'actual_http_polls':112,'unchanged_read_reuses_revision':True,'near_expiry_emits_fresh_reference':True,'latest_ref_count':1,'recipient_revision_unaffected_by_other_actor':True,'no_global_sequence_wire':True}
assert checks['P05-TG-15']['actual_ws_bytes'] and checks['P05-TG-16']['actual_http_pg_final_credential_wait'] and checks['P05-TG-17']['actual_new_node_process']
receiptpath=Path('.artifacts/p05-projection-reuse-image-binding02/receipt.json');assert sha(receiptpath.read_bytes())==record['image272_reference_receipt_sha256']=='e6a366ba340f91f91af5ba5bd8c07551f3175ebf4fcae385de3685058c39ffa1';receipt=read(receiptpath);assert record['image_files_sha256']==receipt['image_files_sha256'] and len(record['image_files_sha256'])==272
assert runner['image']==record['image']=='sha256:9c84a3893beb0075bc608c4ef88f2759ed53034c8557dcb17857af9551484d29' and runner['image']!=receipt['image'];assert (p/'run/image-id.txt').read_text().strip()==runner['image']
assert record['build_metadata_absent'] and record['probe_exit']==0 and record['probe_cleanup']=='AUTO_REMOVED' and record['entire_image_layer_equivalence_claimed'] is False
for kind in ['containers','networks','volumes']:
 for obj in read(p/f'run/cleanup-{kind}-inspect.json'):
  labels=obj['Config']['Labels'] if kind=='containers' else obj['Labels'];assert labels['com.docker.compose.project']==runner['project']
assert read(p/'run/resources-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]};assert (p/'exit.txt').read_text().strip()=='0'
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==before['files'] and identity(current)==before['identity']
out={'at_utc':datetime.now(timezone.utc).isoformat(),'status':'PASS_ACTUAL_SYNTHETIC_GAMES20_ONLY','children_verified':21,'raw_original_pairs':len(record['raw_files']),'source':before['identity'],'files':1826,'checks_pass':20,'cleanup':'completed_EMPTY_RECORDED_OWNER_INVENTORY','component_image':runner['image'],'current_image':receipt['image'],'critical_bytepins_equal':272,'metadata_absent_observed':True,'whole_image_equality_claimed':False,'new_Docker_RUN':False,'full_stage_PASS':False,'qualification':'Real PG/HTTP with explicit synthetic source/clock/lifecycle seams; TG15 wire route fixture adapter, not ordinary browser/roomWS integration.'}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');(r/'selected-controls.json').write_text(json.dumps({k:checks[k]for k in ['P05-TG-14','P05-TG-15','P05-TG-16','P05-TG-17']},indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
