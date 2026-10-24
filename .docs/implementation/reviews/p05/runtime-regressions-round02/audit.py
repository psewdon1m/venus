from pathlib import Path
import json,hashlib,zipfile,subprocess,re,collections,datetime,sys
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
base=Path('.docs/implementation/evidence/p05');out=Path('.docs/implementation/reviews/p05/runtime-regressions-round02')
expected='895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04';facts={};pins=[]
for name,count,kind,idxhash in [('topic-games-preflight-07',20,'games','72a9ed7e6e3bc0ae12ff845e75cae2567cf822f17b9e99eaa43a5e578f6f3580'),('topic-lifecycle-preflight-04',16,'lifecycle','55ab8eb54512ce7810294d40061e222aec18ec43322bb7eacf0994993903b6d1'),('topic-games-host-regression-03',744,'host','e52991e4c2a084f0aaf94ec3e5f4f2796750dbf3583f768a17cdce933d064dc6')]:
 p=base/name;raw=(p/'index.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==idxhash;idx=json.loads(raw)
 for row in idx['files']:
  b=(p/row['path']).read_bytes();assert len(b)==row['bytes'] and hashlib.sha256(b).hexdigest()==row['sha256'],(name,row['path'])
 receipt=json.loads((p/'receipt.json').read_text(encoding='utf-8'));assert receipt['source_identity']==expected and receipt['included_files']==1808 and receipt['exit_code']==0
 pins.append({'packet':name,'index_sha256':idxhash,'files_verified':len(idx['files'])})
 before=json.loads((p/('inputs-before.json' if kind=='host' else 'run/inputs-before.json')).read_text(encoding='utf-8'));after=json.loads((p/('inputs-after.json' if kind=='host' else 'run/inputs-after.json')).read_text(encoding='utf-8'));assert before==after and before['identity']==expected and len(before['files'])==1808 and identity(before['files'])==expected
 if kind=='host':
  assert receipt['tests_pass']==744 and receipt['tests_skip_platform']==208 and receipt['files_pass']==56;rawout=(p/'host-tests.txt').read_text(encoding='utf-8');assert '744 passed' in rawout and '208 skipped' in rawout;facts[kind]={'packet':name,'index_files_verified':len(idx['files']),'tests_pass':744,'platform_skip':208,'files_pass':56,'handle':receipt['handle'],'source_entries':1808};continue
 report=json.loads((p/'run'/('topic-games-report.json' if kind=='games' else 'topic-lifecycle-report.json')).read_text(encoding='utf-8'));assert report['status']=='PASS' and len(report['checks'])==count and len(set(c['id'] for c in report['checks']))==count and all(c['status']=='PASS' for c in report['checks']);assert report['runtime_cleanup']=='completed' and report['full_p05_pass'] is False
 runner=json.loads((p/'run/runner.json').read_text(encoding='utf-8'));assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['image']==receipt['image'] and runner['source_identity']==expected
 config=json.loads((p/'run/compose.json').read_text(encoding='utf-8'));api=config['services']['api'];assert api['image']==receipt['image'] and api['cpus']==1 and api['mem_limit']=='768m' and api['read_only'] and config['networks']['isolated']['internal'];assert all(v['target']=='/artifacts' for v in api['volumes']);assert 'NODE_OPTIONS' not in api['environment'];assert api['command']==['node','tests/p05-topic-'+('games' if kind=='games' else 'lifecycle')+'/integration.mjs']
 archived=json.loads((p/'run/image-inspect.json').read_text(encoding='utf-8'))[0];current=json.loads(subprocess.check_output(['docker','image','inspect',receipt['image']],text=True))[0];assert current['Id']==archived['Id']==receipt['image'];assert current['Config']==archived['Config']
 project=runner['project'];resources={}
 for category,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
  found=subprocess.check_output(['docker',*args,'--filter','label=com.docker.compose.project='+project],text=True).split();assert not found,(project,category,found);resources[category]=found
 assert all(not v for v in json.loads((p/'run/resources-after-cleanup.json').read_text()).values())
 absent={}
 for key,v in config['secrets'].items():
  secret=Path(v['file']);assert not secret.exists() and not secret.parent.exists();absent[key]={'file_exists':False,'parent_exists':False}
 for category in ['containers','networks','volumes']:
  for item in json.loads((p/('run/cleanup-'+category+'-inspect.json')).read_text(encoding='utf-8')):assert (item.get('Config',{}).get('Labels') or item.get('Labels'))['com.docker.compose.project']==project
 text=(p/'run/tests.txt').read_text(encoding='utf-8');codes=collections.Counter(json.loads(line)['error_code'] for line in text.splitlines() if line.startswith('{') and json.loads(line).get('synthetic_fixture_error'));summary=json.loads(text.strip().splitlines()[-1]);assert summary['status']=='PASS' and summary['checks']==count and summary['cleanup']=='completed'
 if kind=='games':assert dict(codes)=={'CONVERSATION_STALE':1,'CHOICE_LOCKED':1,'STALE':2,'TOPIC_CONSENT_REQUIRED':1,'IDEMPOTENCY_CONFLICT':7,'CHOICE_NOT_AVAILABLE':1,'ROUND_NOT_ACTIVE':1,'ROUND_ACTOR_REQUIRED':1,'CONSENT_PROPOSAL_STALE':1,'REVISION_CONFLICT':1,'AUTH_REQUIRED':1,'CONVERSATION_UNAVAILABLE':1}
 facts[kind]={'packet':name,'index_files_verified':len(idx['files']),'source_identity':expected,'source_entries':1808,'image':receipt['image'],'project':project,'handle':receipt['handle'],'unique_pass':count,'producer_command':api['command'],'producer_scope':'Generated/excluded runner.mjs pinned by evidence index; included test/source bytes pinned by full sourceZIP','runner_sha256':hashlib.sha256((p/'runner.mjs').read_bytes()).hexdigest(),'raw_expected_error_codes':dict(codes),'fresh_resources':resources,'secret_temp_absent':absent,'scope':runner['scope']}
zipath=base/'topic-games-preflight-07/included-source.zip';zsha=hashlib.sha256(zipath.read_bytes()).hexdigest();assert zsha=='9627fb299dbb42feae8955bb765140acdaf168054c159cae7c87a599f6a23a5b'
files=inventory();assert identity(files)==expected and len(files)==1808
with zipfile.ZipFile(zipath) as z:
 assert len(z.namelist())==len(set(z.namelist()))==1808 and set(z.namelist())==set(files)
 for name,sha in files.items():assert hashlib.sha256(z.read(name)).hexdigest()==sha,name
 assert hashlib.sha256(z.read('tests/p03/fixtures.mjs')).hexdigest()=='2aafb7bf856a6cef9499924a9439f44e9f62665ea4078805d696566308a114dd'
 for name in ['tests/p05-topic-games/context-fixture.mjs','tests/p05-topic-games/fixtures.mjs','tests/p05-topic-games/integration.mjs','tests/p05-topic-games/temporal-cases.mjs','tests/p05-topic-lifecycle/harness.mjs','tests/p05-topic-lifecycle/integration.mjs','infra/venus/Dockerfile.p05-tests']:
  b=z.read(name);dest=out/'exact-source'/(name+'.bytes');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
result={'schema_version':1,'status':'BOUNDED_FRESH_REGRESSION_EVIDENCE_PASS','reviewer':'/root/p05_topic_games_review','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':expected,'source_zip_sha256':zsha,'full_source_entries_verified':1808,'packet_pins':pins,'facts':facts,'new_docker_test_reruns':0,'fresh_owned_cleanup_empty':True,'new_source_transfer':'Fresh895 executions; old1d4de7 proof and failed4d99 fixture attempt preserved, not reused','not_claimed':['dedicatedchat12','ordinaryproductionpositiveV2','browsercookiejar','fullPgDumprestore','newsemantic C2/M3','human450approval','clean-stagePASS']}
(out/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(out/'current-inventory.json').write_text(json.dumps({'identity':expected,'files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'verified_index_files':[x['files_verified'] for x in pins],'fresh_pass':[facts['games']['unique_pass'],facts['lifecycle']['unique_pass'],facts['host']['tests_pass']],'source_entries':1808,'error_codes':facts['games']['raw_expected_error_codes']}))
