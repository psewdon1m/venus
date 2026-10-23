from pathlib import Path
import json,hashlib,zipfile
root=Path.cwd();p=root/'.docs/implementation/evidence/p05/ordinary-ws-preflight-02';base=root/'.artifacts/p05-ordinary-ws-review';raw=(p/'index.json').read_bytes();assert hashlib.sha256(raw).hexdigest()=='28139483edeed8f13369900f72d14dbfb07aa16ed22f79030176d1175a9c2a66';idx=json.loads(raw)
for r in idx['files']:
 b=(p/r['path']).read_bytes();assert len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256'],r['path']
before=json.loads((p/'run/inputs-before.json').read_text());after=json.loads((p/'run/inputs-after.json').read_text());assert before==after and len(before['files'])==1803;assert hashlib.sha256(json.dumps(before['files'],sort_keys=True,separators=(',',':')).encode()).hexdigest()==idx['source_identity']==before['identity'];assert (p/'run/producer-pins-before.json').read_bytes()==(p/'run/producer-pins-after.json').read_bytes()
pins=json.loads((p/'run/producer-pins-before.json').read_text());expected={Path(k).name:v for k,v in pins.items()};assert expected=={name:hashlib.sha256((p/'producer'/name).read_bytes()).hexdigest() for name in ['integration.mjs','runner.mjs','observation.mjs']}
zpath=(p/idx['source_archive']).resolve();assert hashlib.sha256(zpath.read_bytes()).hexdigest()==idx['source_archive_sha256']
with zipfile.ZipFile(zpath) as z:
 assert len(z.namelist())==1803 and set(z.namelist())==set(before['files'])
 for name,digest in before['files'].items():assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
report=json.loads((p/'run/ordinary-ws-report.json').read_text());checks={c['id']:c for c in report['checks']};assert len(checks)==10 and all(c['status']=='PASS' for c in checks.values())
for n in ['05','06','09']:
 d=checks['P05-OWS-'+n]['detail'];assert d['observation_started_before_transition'] and d['actual_enqueue_boundary_observed'] and d['full_payload_sha_and_exact_acl_headers'] and d['distinct_enqueue_per_received_frame'];assert d['raw_unknown_private_frames']==d['forbidden_post_boundary_private_callbacks']==0
for n in ['05','06']:assert checks['P05-OWS-'+n]['detail']['post_boundary_private_callbacks']==0
nine=checks['P05-OWS-09']['detail'];assert nine['post_boundary_private_callbacks']==nine['received_full_window_private_frames']==nine['received_fresh_pending_frames']==6;assert nine['old_refs_enqueued']==0 and nine['successful_durable_narrow_observed']
ten=checks['P05-OWS-10']['detail'];assert ten['matched'] and ten['actual_pg_lock_wait'] and ten['actual_ordinary_privateDelivery_selected'] and ten['source_outage_during_final_credential_await'] and ten['no_private_after_wait'];assert ten['specific_child_assertion_attribution'] is False and ten['direct_dispatch_race_adjunct'] is False
runner=json.loads((p/'run/runner.json').read_text());assert runner['image']==idx['image'] and runner['cleanup']=='completed' and runner['status']=='PASS';assert all(not v for v in json.loads((p/'run/resources-after-cleanup.json').read_text()).values());img=json.loads((p/'run/image-inspect.json').read_text())[0];assert img['Id']==idx['image'];compose=json.loads((p/'run/compose.json').read_text());assert compose['services']['api']['image']==idx['image'] and compose['services']['api']['read_only'] and compose['services']['api']['user']=='1000:1000' and compose['networks']['isolated']['internal'];assert compose['services']['api']['cap_drop']==['ALL']
project=runner['project']
for kind in ['containers','networks','volumes']:
 for item in json.loads((p/f'run/cleanup-{kind}-inspect.json').read_text()):assert (item.get('Config',{}).get('Labels') or item.get('Labels'))['com.docker.compose.project']==project
image_inputs={n:d for n,d in before['files'].items() if n.startswith(('apps/','packages/','tests/')) or n in ['package.json','package-lock.json','.npmrc','tsconfig.json','tsconfig.base.json']};(base/'frozen-image-inputs.json').write_text(json.dumps(image_inputs,indent=2)+'\n')
result={'index_sha256':hashlib.sha256(raw).hexdigest(),'indexed_artifacts_verified':len(idx['files']),'included_source_zip_files_verified':1803,'source_identity':idx['source_identity'],'source_archive_sha256':idx['source_archive_sha256'],'image':idx['image'],'producer_pins':expected,'same_before_after':True,'checks_pass':10,'windows_metrics_verified':True,'pg_wait_selector_and_result_verified':True,'ownership_cleanup_verified':True,'image_input_count':len(image_inputs),'known_separate_product_finding_open':'TG-CHAT-001','full_p05_pass':False};(base/'actual02-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
