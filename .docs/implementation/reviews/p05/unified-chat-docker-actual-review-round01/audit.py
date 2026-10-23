"""Read-only finite audit of two completed Docker component receipts; no functional run."""
import sys,json,hashlib,subprocess
from pathlib import Path
from datetime import datetime,timezone
sys.stdout.reconfigure(encoding='utf8')
ROOT=Path.cwd(); OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def save(name,v):(OUT/name).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
freeze=load(ROOT/'.artifacts/p05-unified-source-freeze01.json')
assert len(freeze['files'])==1819 and identity(freeze['files'])==freeze['identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
current=inventory();assert current==freeze['files']
specs=[('games',20,'TG','91ccb357e69afea78ce1f5c22cc393b98be45ae5163d68ec24b5d40cc737a619','sha256:e081feba66118113f5deb6bd2e19ee977de3d5e0389d0d6726c9b13006a56c82'),('lifecycle',16,'TLC','f293dfab697a1eef7c3f6f45620061d1c846fab1659bfa2e827b5bfaaa5881e9','sha256:83ee9a0977d1236aca10e5af3020f903a4c7356f911def9c60dfdc9128e6e868')]
results=[]; maps=[]; fresh=[]
for kind,count,prefix,indexhash,image in specs:
 p=ROOT/f'.docs/implementation/evidence/p05/unified-{kind}{count}-docker-round01';run=p/'run'
 assert sha(p/'INDEX.json')==indexhash
 index=load(p/'INDEX.json');assert len(index['files'])==19 and len({r['path'] for r in index['files']})==19
 for row in index['files']:
  f=p/row['path'];assert f.is_relative_to(p) and f.stat().st_size==row['bytes'] and sha(f)==row['sha256']
 record=load(p/'RECORD.json');assert record['checks']==count and record['source_identity']==freeze['identity'] and record['image']==image and record['human_content_HOLD'] and not record['full_stage_acceptance']
 for row in record['source_host_files']:
  f=run/row['path'];assert sha(f)==row['sha256'] and f.stat().st_size==row['bytes']
 before=load(run/'inputs-before.json');after=load(run/'inputs-after.json')
 assert before==after and before['files']==freeze['files'] and before['identity']==freeze['identity']
 assert (run/'inputs-before.json').read_bytes()==(run/'inputs-after.json').read_bytes()
 mp=load(p/'image-source-map.json');assert len(mp)==200 and all(freeze['files'][n]==h for n,h in mp.items());maps.append(mp)
 runner=load(run/'runner.json');project=runner['project']
 assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None and runner['source_identity']==freeze['identity'] and runner['image']==image and runner['full_stage_acceptance'] is False
 assert (run/'image-id.txt').read_text().strip()==image and load(run/'image-inspect.json')[0]['Id']==image
 assert image in (run/'build.txt').read_text() and load(run/'image-inspect.json')[0]['Config']['User']=='1000:1000'
 cfg=load(run/'compose.json');api=cfg['services']['api'];db=cfg['services']['db']
 assert api['image']==image and api['read_only'] and api['user']=='1000:1000' and api['cap_drop']==['ALL'] and api['security_opt']==['no-new-privileges:true']
 assert api['mem_limit']=='768m' and api['cpus']==1 and api['pids_limit']==96 and api['environment']['VENUS_P05_ISOLATED_FIXTURE']=='1'
 assert cfg['networks']=={'isolated':{'internal':True}} and not api.get('ports') and not db.get('ports')
 assert api['command']==['node',f'tests/p05-topic-{kind}/integration.mjs'] and api['volumes'][0]['source'].replace('\\','/').endswith('/.artifacts/p05/'+project)
 assert db['image']=='postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8'
 running=load(run/'running-db.json');assert len(running)==1 and running[0]['Config']['Image']==db['image'] and running[0]['State']['Running']
 assert running[0]['Config']['Labels']['com.docker.compose.project']==project
 ownercounts={}
 for role in ['containers','networks','volumes']:
  owned=load(run/f'cleanup-{role}-inspect.json');assert owned
  for r in owned:assert (r.get('Config',{}).get('Labels') or r.get('Labels'))['com.docker.compose.project']==project
  ownercounts[role]=len(owned)
 assert load(run/'resources-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]}
 report=load(run/f'topic-{kind}-report.json');checks=report['checks'];ids=[r['id'] for r in checks]
 assert ids==[f'P05-{prefix}-{i:02d}' for i in range(1,count+1)] and all(r['status']=='PASS' for r in checks)
 assert report['status']=='PASS' and report['runtime_cleanup']=='completed' and not report['full_p05_pass']
 lines=[]
 for line in (run/'tests.txt').read_text().splitlines():
  try:lines.append(json.loads(line))
  except json.JSONDecodeError:pass
 assert lines[-1]['status']=='PASS' and lines[-1]['checks']==count and lines[-1]['cleanup']=='completed'
 if kind=='games':
  contexts=checks[4]['detail']['unified_private_text_chat'];assert [r['context'] for r in contexts]==['online','in_person']
  assert all(v is True for row in contexts for k,v in row.items() if k!='context')
  assert len(contexts[0])==15 and report['external_lifecycle_source_safety']=='EXPLICIT_FIXTURE_SEAMS_NOT_INTEGRATION_ACCEPTANCE'
 else:assert report['actual_postgresql_http_linux_lifecycle'] and not report['browser_cookie_jar_proof'] and not report['full_pg_dump_restore']
 # Optional fresh read-only project inventories. No resources are allocated or stopped.
 observed={}
 for role,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
  command=['docker',*args,'--filter','label=com.docker.compose.project='+project]
  r=subprocess.run(command,capture_output=True,text=True,timeout=15)
  assert r.returncode==0 and not r.stdout.strip();observed[role]={'command':command,'exit_code':r.returncode,'ids':[]}
 fresh.append({'project':project,'observed_at_utc':datetime.now(timezone.utc).isoformat(),'resources':observed})
 results.append({'suite':kind,'actual_cases':count,'case_ids':ids,'index_sha256':indexhash,'children_verified':19,'record_run_files_verified':16,'source_identity':freeze['identity'],'source_files':1819,'image':image,'image_source_files_verified':200,'before_after_byte_exact':True,'source_current_exact':True,'project':project,'cleanup_owner_counts':ownercounts,'cleanup_complete':True,'terminal_report_PASS':True,'negative_fixture_error_rows':len([r for r in lines if r.get('synthetic_fixture_error') is True]),'case_details':checks})
assert maps[0]==maps[1]
save('fresh-owned-inventories.json',fresh)
save('audit-results.json',{'status':'PASS_ACTUAL_DIRTY_DOCKER_GAMES20_LIFECYCLE16_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'suites':results,'functional_Docker_runs_by_reviewer':0,'read_only_Docker_inventory_calls':6,'source_stable_after':inventory()==freeze['files'],'findings':[],'full_stage_acceptance':False,'human_content_HOLD':'UNCHANGED'})
print(json.dumps({'status':'PASS','cases':36,'index_children':38,'source_files':1819,'image_source_files_each':200,'fresh_inventory_calls':6,'full_stage_acceptance':False}))
