"""Read-only audit of a completed ordinary registerRooms WS10 component run."""
import json,sys,hashlib,subprocess
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,v):(OUT/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
p=ROOT/'.docs/implementation/evidence/p05/unified-ordinary-ws10-docker-round01';run=p/'run'
assert sha(p/'INDEX.json')=='9080137d70049c1f2fd85f9a9c58b13f64babdd7e6e38a7e17bc636b67c030bb'
idx=load(p/'INDEX.json');assert len(idx['files'])==21 and len({r['path'] for r in idx['files']})==21
for r in idx['files']:
 f=p/r['path'];assert f.is_relative_to(p) and sha(f)==r['sha256'] and f.stat().st_size==r['bytes']
record=load(p/'RECORD.json')
for name,r in record['source_host_files'].items():
 f=run/name;assert sha(f)==r['sha256'] and f.stat().st_size==r['bytes']
freeze=load(ROOT/'.artifacts/p05-unified-source-freeze01.json');assert len(freeze['files'])==1819 and identity(freeze['files'])==freeze['identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
assert inventory()==freeze['files']
before=load(run/'inputs-before.json');assert before==load(run/'inputs-after.json') and before['files']==freeze['files'] and before['identity']==freeze['identity']
assert (run/'inputs-before.json').read_bytes()==(run/'inputs-after.json').read_bytes()
pins=load(run/'producer-pins-before.json');assert len(pins)==3 and pins==load(run/'producer-pins-after.json')
assert (run/'producer-pins-before.json').read_bytes()==(run/'producer-pins-after.json').read_bytes()
for name,h in pins.items():assert sha(Path(name))==h
mp=load(p/'image-source-map.json');assert len(mp)==200 and all(freeze['files'][n]==h for n,h in mp.items())
image='sha256:3cb6a5e518911df05f61ba4f5d76c08fe7d9037642751a3916470a75fd3d55c8'
runner=load(run/'runner.json');project=runner['project']
assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None and runner['image']==image and runner['source_identity']==freeze['identity'] and runner['producer_pins']==pins
assert not runner['full_stage_acceptance'] and not runner['production_server_cmd'] and not runner['browser_cookie_jar_proof']
assert (run/'image-id.txt').read_text().strip()==image and load(run/'image-inspect.json')[0]['Id']==image and image in (run/'build.txt').read_text()
assert record['image']==image and record['checks']==10 and record['source_identity']==freeze['identity'] and record['image_probe_exit_code']==0 and record['image_probe_cleanup']=='AUTO_REMOVED'
cfg=load(run/'compose.json');api=cfg['services']['api'];db=cfg['services']['db']
assert api['image']==image and api['user']=='1000:1000' and api['read_only'] and api['cap_drop']==['ALL'] and api['security_opt']==['no-new-privileges:true']
assert api['mem_limit']=='768m' and api['cpus']==1 and api['pids_limit']==96 and cfg['networks']=={'isolated':{'internal':True}}
assert not api.get('ports') and not db.get('ports') and api['environment']['VENUS_P05_ISOLATED_FIXTURE']=='1'
assert api['command']==['node','tests/p05-topic-lifecycle/ordinary-ws.mjs']
assert len(api['volumes'])==3 and api['volumes'][0]['source'].replace('\\','/').endswith('/.artifacts/p05/'+project)
for mount in api['volumes'][1:]:assert mount['read_only'] and mount['source'] in pins
assert db['image']=='postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8'
live=load(run/'running-db.json');assert len(live)==1 and live[0]['State']['Running'] and live[0]['Config']['Image']==db['image'] and live[0]['Config']['Labels']['com.docker.compose.project']==project
owners={}
for role in ['containers','networks','volumes']:
 rows=load(run/f'cleanup-{role}-inspect.json');assert rows
 for r in rows:assert (r.get('Config',{}).get('Labels') or r.get('Labels'))['com.docker.compose.project']==project
 owners[role]=len(rows)
assert load(run/'resources-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]}
rep=load(run/'ordinary-ws-report.json');expected=[f'P05-OWS-{i:02d}' for i in range(1,11)]
assert rep['schema_version']==1 and rep['suite']=='P05_ORDINARY_ROOM_WS' and rep['status']=='PASS' and rep['runtime_cleanup']=='completed'
assert [r['id'] for r in rep['checks']]==expected and all(r['status']=='PASS' for r in rep['checks'])
assert rep['actual_ordinary_registerRooms_ws'] and rep['actual_postgresql_http_protected_lifecycle'] and rep['synthetic_source_only']
assert not rep['browser_cookie_jar_proof'] and not rep['production_server_cmd'] and not rep['full_p05_pass']
log=(run/'tests.txt').read_text().splitlines();assert log[:10]==[x+' PASS' for x in expected]
assert json.loads(log[-1])=={'suite':rep['suite'],'status':'PASS','checks':10,'cleanup':'completed'}
for i in [4,5,8]:
 d=rep['checks'][i]['detail'];assert d['observation_started_before_transition'] and d['actual_enqueue_boundary_observed'] and d['distinct_enqueue_per_received_frame'] and d['full_payload_sha_and_exact_acl_headers']
 assert d['raw_unknown_private_frames']==0 and d['forbidden_post_boundary_private_callbacks']==0
assert rep['checks'][8]['detail']['received_fresh_pending_frames']==8 and rep['checks'][8]['detail']['received_known_pre_boundary_queued_frames']==1
assert rep['checks'][9]['detail']['actual_pg_lock_wait'] and rep['checks'][9]['detail']['actual_ordinary_privateDelivery_selected'] and rep['checks'][9]['detail']['no_private_after_wait'] and not rep['checks'][9]['detail']['specific_child_assertion_attribution']
fresh={}
for role,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
 cmd=['docker',*args,'--filter','label=com.docker.compose.project='+project];r=subprocess.run(cmd,capture_output=True,text=True,timeout=15)
 assert r.returncode==0 and not r.stdout.strip();fresh[role]={'command':cmd,'exit_code':r.returncode,'ids':[]}
assert inventory()==freeze['files'] and all(sha(Path(n))==h for n,h in pins.items())
save('fresh-owned-inventories.json',{'at_utc':datetime.now(timezone.utc).isoformat(),'project':project,'resources':fresh})
save('audit-results.json',{'status':'PASS_ACTUAL_DIRTY_DOCKER_ORDINARY_WS10_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'index_children_verified':21,'record_run_files_verified':18,'source_identity':freeze['identity'],'source_files':1819,'source_before_after_current_exact':True,'producer_pins_before_after_current_exact':pins,'image':image,'image_source_files_verified':200,'actual_cases':rep['checks'],'cleanup_owners':owners,'cleanup':'PASS','read_only_Docker_inventory_calls':3,'functional_Docker_runs':0,'findings':[],'human_HOLD':'UNCHANGED','full_stage_acceptance':False})
print(json.dumps({'status':'PASS','actual_cases':10,'children_verified':21,'source_files':1819,'image_source_files':200,'cleanup':'PASS','read_only_Docker_inventory_calls':3,'functional_Docker_runs':0}))
