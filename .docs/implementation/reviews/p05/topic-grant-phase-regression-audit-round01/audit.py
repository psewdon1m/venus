from pathlib import Path
import sys,json,hashlib,datetime,zipfile,subprocess,shutil,copy,re
sys.path.insert(0,'tools')
from stage_inventory import identity
root=Path.cwd();base=Path('.artifacts/p05-grant-phase-regression-audit-round01');out=Path('.docs/implementation/reviews/p05/topic-grant-phase-regression-audit-round01');ep=Path('.docs/implementation/evidence/p05');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text('utf-8'))
names={'host':'grant-phase-host-regression-01','linux':'grant-phase-linux-regression-01','core':'grant-phase-runtime-core-preflight-01','extra':'grant-phase-runtime-extra-preflight-01'}
expected={'host':'b52ff6624c7811369ee9b927af76e95733e44f49ab9424225dd5ba4a4605132e','linux':'67f8c5ec144dc384a7f0ce48649a4211676f2226815f7fe7ca8393f8aab8d6b5','core':'81ca1f5b06e6ca57d17c29af4cfbfaf3b0660a10184375c9e61b1eecd73ab2d8','extra':'17a3c719798ca5009ccec3c63759fc6f1ab2369e4e0529bd75e8fbe9480775f7'}
sourceid='13b24714f3dd2d6e2ea08e911042defb4ce0161b956a9bcc74af533d3795120e';image='sha256:5e30414ad64516422b61f630aa37639fb1920e795e2c7008752131a5c961647e';indexes={};total=0
for key,name in names.items():
 p=ep/name;assert sha(p/'index.json')==expected[key];d=read(p/'index.json');assert d['source_identity']==sourceid and d['included_files']==1813
 for x in d['files']:assert sha(p/x['path'])==x['sha256'] and (p/x['path']).stat().st_size==x['bytes']
 total+=len(d['files']);indexes[key]=d
freeze=ep/'grant-phase-source-freeze-01';files=read(freeze/'inputs.json')['files'];assert identity(files)==sourceid and len(files)==1813
archive=freeze/'included-source.zip';assert sha(archive)=='bf5a870a5438449c6e34710f7ece298546fdf45e3e205989bd349f41b6f2c17e'
with zipfile.ZipFile(archive) as z:
 assert set(z.namelist())==set(files)
 for n,h in files.items():assert hashlib.sha256(z.read(n)).hexdigest()==h
host=ep/names['host'];assert all(v==0 for v in read(host/'commands.json').values());assert '807 passed | 208 skipped' in (host/'test.txt').read_text('utf-8');assert '57 passed (57)' in (host/'test.txt').read_text('utf-8');assert '496 markdown files' in (host/'docs.txt').read_text('utf-8') and '0 errors' in (host/'docs.txt').read_text('utf-8');assert indexes['host']['archive_unit_pass']==7
linux=ep/names['linux'];lr=read(linux/'run/runner.json');assert lr['status']=='PASS' and lr['cleanup']=='completed' and lr['observed_exit_code']==0 and lr['source_unchanged'];assert read(linux/'run/materialized-before.json')==read(linux/'run/materialized-after.json') and read(linux/'run/materialized-before.json')['files']==files
assert read(linux/'run/root-inputs-before.json')==read(linux/'run/root-inputs-after.json') and read(linux/'run/root-inputs-before.json')['files']==files
oldfiles=read(linux/'run/materialized-base.json')['files'];delta=sorted(n for n in files if files[n]!=oldfiles.get(n));assert delta==sorted(lr['materialized_delta']) and len(delta)==10 and not(set(oldfiles)-set(files))
assert all(c['exit_code']==0 for c in read(linux/'run/commands.json'));lt=re.sub(r'\x1b\[[0-9;]*m','',(linux/'run/tests.txt').read_text('utf-8'));assert '1012 passed | 3 skipped' in lt and 'Ran 124 tests' in lt and '\nOK\n' in lt
assert "'--force'" in (linux/'launcher.py').read_text('utf-8') and '78597' in (linux/'run/runtime-script.mjs').read_text('utf-8')
projects=[];summaries={};negative=[]
def valid(d,n,prefix,startup=False):
 assert d['status']=='PASS';assert (d.get('cleanup') if startup else d.get('runtime_cleanup'))=='completed';assert len(d['checks'])==n and {x['id'] for x in d['checks']}=={prefix+f'{i:02}' for i in range(1,n+1)} and all(x['status']=='PASS' for x in d['checks'])
for packet,suite,file,n,prefix in [('core','games','topic-games-report.json',20,'P05-TG-'),('core','lifecycle','topic-lifecycle-report.json',16,'P05-TLC-'),('extra','ws','ordinary-ws-report.json',10,'P05-OWS-'),('extra','chat','chat-policy-report.json',12,'P05-TCP-'),('extra','compatibility','compatibility-report.json',6,'P05-COMPAT-'),('extra','startup','report.json',8,'P05-RT-')]:
 p=ep/names[packet]/suite;report=read(p/file);valid(report,n,prefix,suite=='startup');runner=report if suite=='startup' else read(p/'runner.json');assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['source_identity']==sourceid
 maps=[read(p/'inputs-before.json'),read(p/'inputs-after.json')];assert maps[0]['files']==maps[1]['files']==files
 if (p/'inputs-after-finally.json').exists():assert read(p/'inputs-after-finally.json')['files']==files
 if (p/'producer-pins-before.json').exists():
  pins=read(p/'producer-pins-before.json');assert pins==read(p/'producer-pins-after.json')
  if (p/'producer-pins-after-finally.json').exists():assert pins==read(p/'producer-pins-after-finally.json')
 assert read(p/'resources-after-cleanup.json')=={'containers':[],'networks':[],'volumes':[]}
 inspected=read(p/'image-inspect.json');assert len(inspected)==1
 if suite!='startup':assert inspected[0]['Id']==image and runner['image']==image
 else:assert report['positive_v2_serving'] is False and report['dirty_preflight'] is True
 for kind in ['containers','networks','volumes']:
  for resource in read(p/f'cleanup-{kind}-inspect.json'):
   labels=resource.get('Config',{}).get('Labels') or resource.get('Labels') or {};assert labels.get('com.docker.compose.project')==runner['project']
 projects.append(runner['project']);summaries[suite]={'checks':n,'status':'PASS','project':runner['project'],'image_Id':inspected[0]['Id']}
 for defect in ['duplicateID','failedcheck','cleanup']:
  bad=copy.deepcopy(report)
  if defect=='duplicateID':bad['checks'][0]['id']=bad['checks'][1]['id']
  if defect=='failedcheck':bad['checks'][0]['status']='FAIL'
  if defect=='cleanup':bad['cleanup' if suite=='startup' else 'runtime_cleanup']='missing'
  rejected=False
  try:valid(bad,n,prefix,suite=='startup')
  except AssertionError:rejected=True
  assert rejected;negative.append({'suite':suite,'tampering':defect,'rejected':True})
# Explicit prior reviewer trouble spots remain covered in this actual run.
ex=ep/names['extra'];w={x['id']:x['detail']for x in read(ex/'ws/ordinary-ws-report.json')['checks']}
for key in ['P05-OWS-05','P05-OWS-06','P05-OWS-09']:
 d=w[key];assert d['observation_started_before_transition'] and d['actual_enqueue_boundary_observed'] and d['full_payload_sha_and_exact_acl_headers'] and d['distinct_enqueue_per_received_frame'] and d['raw_unknown_private_frames']==d['forbidden_post_boundary_private_callbacks']==0
for key in ['P05-OWS-05','P05-OWS-06']:assert w[key]['post_boundary_private_callbacks']==0
chat={x['id']:x['detail'] for x in read(ex/'chat/chat-policy-report.json')['checks']}
for key in ['P05-TCP-04','P05-TCP-05']:assert chat[key]['distinct_round_ids']==20 and chat[key]['distinct_ordered_indexes_1_to_20'] and chat[key]['actual_database_round_count20'] and chat[key]['final_round_terminal']
fence=chat['P05-TCP-12'];assert fence['scope_GET_AND_POST_FINAL_FENCE'] and all(fence['get'].values());post=fence['post'];assert post['exact_new_request_receipts']==0 and all(v is True for k,v in post.items() if k!='exact_new_request_receipts')
# Finite adapters: report/test/compose/cleanup body remains exact pinned originals.
adapter_evidence=[]
for packet in ['core','extra']:
 ack=read(ep/names[packet]/'adapters/root-ack.json')
 for x in ack['adapters']:
  op=Path(x.get('source_runner',x.get('original')));oh=x.get('source_runner_sha256',x.get('original_sha256'));ap=ep/names[packet]/'adapters'/x.get('adapted_runner',x.get('adapter'));ah=x.get('adapted_runner_sha256',x.get('adapter_sha256'))
  assert sha(op)==oh and sha(ap)==ah
  a=op.read_text('utf-8');b=ap.read_text('utf-8');marker="json('compose.json'";assert a[a.index(marker):]==b[b.index(marker):]
  assert sourceid in b and image in b;adapter_evidence.append({'original':op.as_posix(),'original_sha256':oh,'adapter':ap.as_posix(),'adapter_sha256':ah,'test_report_cleanup_tail_exact':True})
assert sha(ex/'startup-runner.mjs')==files['tools/p05-runtime.mjs']
# No new functional run: only current absence queries for exact old project labels.
resource_checks=[]
for project in projects:
 for kind,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
  p=subprocess.run(['docker',*args,'--filter','label=com.docker.compose.project='+project],capture_output=True,text=True);assert p.returncode==0 and not p.stdout.strip();resource_checks.append({'project':project,'kind':kind,'remaining':[]})
lincheck=subprocess.run(['docker','ps','-aq','--filter','label=venus.p05.project='+lr['project']],capture_output=True,text=True);assert lincheck.returncode==0 and not lincheck.stdout.strip()
for volume in read(linux/'run/owned-volume.json'):
 q=subprocess.run(['docker','volume','inspect',volume],capture_output=True,text=True);assert q.returncode!=0 and 'no such' in q.stderr.lower()
out.mkdir(parents=True,exist_ok=False)
for key,name in names.items():
 p=ep/name/'index.json';q=out/'inputs'/key/'index.json';q.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,q)
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
status='BOUNDED_ARCHIVED13B_HOST_LINUX_CORE_EXTRA_AUDIT_PASS'
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','source_identity':sourceid,'included_files':1813,'archive_indexes':expected,'files_hashed':total,'sourceZIP1813hashes_verified':True,'current_workspace_source_is_not_claimed13b':True,'host':{'js_pass':807,'platform_skip':208,'files':57,'archive_unit':7,'docs_markdown':496,'docs_errors':0,'scope':'Root frozen-source witness; no per-command input inventories'},'linux':{'js_pass':1012,'platform_skip':3,'python_pass':124,'materialized_delta':10,'cleanup':'completed','qualification':'Older pinned quality image, exact materialized13b maps beforeafter plus one excluded78597B archive; not full quality/currentwholeevidencetree. Full ownership inspect executed by pinned launcher, only volume name persisted; current volume absent independently checked.'},'actual_suites':summaries,'finite_adapters':adapter_evidence,'negative_evidence_checks':negative,'owned_project_resource_queries':resource_checks,'findings':[],'limits':['Source13b archived only; root current1274 is a separate revision and inherits no actualPASS. No reviewer functionalDockerRUN/source/producerwrites.','Games explicitly synthetic lifecycle seams; lifecycle realPG/HTTP/filesystem namedfaults; WS realordinaryroute syntheticcontent; chat quota boundary fixture; compatibility authenticated metadata edit is not actual oldengine execution.','Startup uses unchanged production CMD/defaultV1 and HOLDnegative V2 admission, not positiveV2serving/browsercookiejar/publicDNS/TLS.','Host platforms skips are not passes; Linux is exactmaterializedunit regression, not fullfreshquality image. Raw private/credentials omitted as intended.','No browser matrix/human450/fullP05/P06production/completegates claim.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8');(out/'REPORT.md').write_text('''# Archived13b host/Linux/core/extra: independent bounded audit

**BOUNDED_ARCHIVED13B_HOST_LINUX_CORE_EXTRA_AUDIT_PASS.** Four exact packet indexes and all173 listed files plus1813 full source ZIP entries were verified. This audit binds historical13b; current root1274 is separate and inherits no actualPASS. No reviewer functional run occurred.

Host logs show57files/807PASS/208platformSKIP, archive7PASS and496Markdown0errors, with zero lint/types/test/docs command exits. This uses root's frozen-source witness; per-command inventories were not captured. Linux has1012JS PASS/3SKIP and124Python PASS after force build. Its older pinned image was materialized with ten exact included deltas and one pinned excluded plan; before/after maps equal13b. This is exact-source unit regression, not full fresh quality image or current entire evidence tree. The pinned launcher checks ownership; only the volume name was retained, and its current absence was independently verified.

Actual reports contain exact distinct IDs: Games20, lifecycle16, ordinaryWS10, chat12, compatibility6, productionstartup8, allPASS/cleanup completed. Complete per-suite source maps match frozen ZIP; producer maps remain equal where captured. Finite adapters retain exact original compose/test/report/cleanup tails, changing only exactsource fences and immutableimage reuse; startup runner is byte-exact included tools/p05-runtime.mjs. Canonical inspected image IDs are distinguished from input aliases. Eighteen tampered report variants (duplicateID/failure/missingcleanup) are rejected. Current read-only exactproject queries find no old container/network/volume.

OWS05/06/09 retain before-transition/full-payload/ACL/one-to-one enqueue proof with no forbidden callbacks. Chat capless controls count20 distinct IDs/indexes and terminal DB rows; GET and POST finalSQL fences retain rollback/no-receipt/no-canary proof. Startup defaultV1 and HOLDnegative V2 admission use production CMD, not positiveV2 serving. Compatibility metadata edit does not execute an oldengine; Games synthetic lifecycle seams, namedfaults and quota fixtures stay explicit. No browser/human450/fullP05/P06/production claim is made.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(out.rglob('*'))if p.is_file()];(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'files_hashed':total,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
