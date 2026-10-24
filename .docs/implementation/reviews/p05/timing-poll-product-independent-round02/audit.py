from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
def verify(root,pin,count):
 assert sha((root/'INDEX.json').read_bytes())==pin
 idx=read(root/'INDEX.json');assert len(idx['files'])==count
 for f in idx['files']:
  b=(root/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256'],f
p=Path('.docs/implementation/reviews/p05/timing-poll-product-independent-round01');verify(p,'9419fee5b304cd72b968bf3f898e88ed1c7e716c16905f1d5901ae01b642cbf6',23)
w=Path('.docs/implementation/evidence/p05/timing-poll-ordinary-ws10-docker-round02');h=Path('.docs/implementation/evidence/p05/timing-poll-host-regression-round02')
verify(w,'18c17d83585b61069195673f2f919e205e5d951ca3db4b6d87522c099eceaedd',21);verify(h,'3d10933bcaaddbe41515d0738610cbd86e956e85d0a7f288ba0f030a402180ba',4)
wr=read(w/'RECORD.json');hr=read(h/'RECORD.json');freeze=read(p/'source-freeze02.json');runner=read(w/'run/runner.json')
assert wr['source_identity']==hr['source_identity']==freeze['identity'] and wr['included_files']==hr['included_files']==1823
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
actual=inventory();assert actual==freeze['files'] and identity(actual)==freeze['identity']
assert read(w/'run/inputs-before.json')==read(w/'run/inputs-after.json')
assert read(w/'run/inputs-before.json')['files']==freeze['files']
assert read(w/'image-source-runtime-map.json')==read(p/'image-binding02.json')['image_files_sha256']
assert len(read(w/'image-source-runtime-map.json'))==269
for file,pin in wr['source_host_files'].items():
 b=(w/'run'/file).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'];assert b==(Path('.artifacts/p05')/runner['project']/file).read_bytes()
assert len(wr['source_host_files'])==18
assert (w/'run/image-id.txt').read_text().strip()==runner['image']==wr['image']=='sha256:bc2cb1f6a901080b1da99cdaf853dbfbd4efcdbf8a2ecf92f8a3136ca39c1326'
assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None
assert read(w/'run/resources-after-cleanup.json')==dict(containers=[],networks=[],volumes=[])
assert read(w/'run/producer-pins-before.json')==read(w/'run/producer-pins-after.json')==runner['producer_pins']
for file,pin in runner['producer_pins'].items():assert sha(Path(file).read_bytes())==pin
rep=read(w/'run/ordinary-ws-report.json');assert rep['status']=='PASS' and rep['runtime_cleanup']=='completed'
assert [v['id'] for v in rep['checks']]==['P05-OWS-'+str(n).zfill(2) for n in range(1,11)] and all(v['status']=='PASS' for v in rep['checks'])
assert rep['actual_ordinary_registerRooms_ws'] and rep['actual_postgresql_http_protected_lifecycle'] and rep['synthetic_source_only']
assert not rep['production_server_cmd'] and not rep['browser_cookie_jar_proof'] and not rep['full_p05_pass']
assert hr['command_exit']==0 and hr['files_pass']==59 and hr['tests_pass']==854 and hr['platform_skipped']==208 and hr['per_command_before_inventory_captured'] is False
assert (h/'p05-timing-poll-host-all02-exit.txt').read_text().strip()=='0'
log=(h/'p05-timing-poll-host-all02.txt').read_text(encoding='utf-8');assert '59 passed (59)' in log and '854 passed | 208 skipped (1062)' in log
out={'status':'PASS_ADDITIONAL_ACTUAL_WS10_AND_HOST_REGRESSION_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'parent_review_sha256':'9419fee5b304cd72b968bf3f898e88ed1c7e716c16905f1d5901ae01b642cbf6','ws_children_verified':21,'host_children_verified':4,'ws_raw_original_matches':18,'source_identity':freeze['identity'],'included_files':1823,'current_stage_inventory_exact':True,'ws_image':wr['image'],'browser_image_compatibility':'All269 actual image file hashes equal accepted ef5 browser image receipt, different image IDs explicitly preserved','ws_checks_pass':10,'ws_cleanup':'completed empty archived inventory','host_files_pass':59,'host_tests_pass':854,'host_platform_skips':208,'host_command_exit':0,'host_attribution_limit':'No per-command before inventory; prior frozen source and final exact source inspection, author no-write interval record only','product_or_framework_edits':False,'new_docker_or_functional_run':False,'full_stage_acceptance':False,'writes':'COMPLETE'}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
