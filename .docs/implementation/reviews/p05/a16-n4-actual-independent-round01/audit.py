from pathlib import Path
import json,hashlib,subprocess,datetime
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
N=R/'.artifacts/p05-ordinary-real470-probe04/runs/venus-pilot470-b95dd8e59616';M=R/'.artifacts/p05-ordinary-real470-probe04';S=R/'.artifacts/p05-pilot-bundle-source13'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(v,label):
 if not v:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,h):
 need(sha(p)==h,'index');pin(p);d=load(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**v}for n,v in files.items()]
 for v in files:
  q=p.parent/v['path'];need(sha(q)==v['sha256']and q.stat().st_size==v['bytes'],'child '+v['path'])
 return len(files)
ackpath=R/'.artifacts/p05-n4-a16-root-ack01.json';need(sha(ackpath)=='6af32d150bcd2033f1bb92a372063931bb606f570a3523e10ff0dfcbe868046f','N4ACK');a=load(ackpath);pin(ackpath)
need(index(R/'.docs/implementation/evidence/p05/a16-n4-ordinary20-actual01/INDEX.json','3225fe5c8278ff595b4b0ce214d228ca8249aed565bca05b6d0479676ae2c3d8')==10,'archive10')
for pathkey,pinkey in [('method_review_path','method_review_sha256'),('fresh_binding_review','fresh_binding_review_sha256'),('application_review_index','application_review_index_sha256')]:index(Path(a[pathkey]),a[pinkey])
need(a['method_review_sha256']=='b0b043846bfb1e3bccda4cc7f00a4e02f556c983f8da5d1a1e035737db13ca4e','originalMETHOD04')
for n,h in a['method_files'].items():need(sha(M/n)==h,'N4method '+n);pin(M/n)
fpath=Path(a['source_freeze_path']);need(sha(fpath)==a['source_freeze_sha256'],'freeze');f=load(fpath);pin(fpath)
need(f['identity']==a['source_identity']=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13'and len(f['files'])==1870,'A16identity')
for n,h in f['files'].items():need(sha(S/n)==sha(R/n)==h,'frozen A16 '+n)
irpath=Path(a['image_receipt_path']);need(sha(irpath)==a['image_receipt_sha256'],'image receipt');ir=load(irpath);pin(irpath)
need(ir['image']==a['image_id']=='sha256:b2eb45a81156b321a9d21d681c3174e7a286fcda94bebb4a156679fb9b19c0d2'and ir['source_identity']==a['source_identity'],'production tuple')
need(a['runtime_files']=={**ir['image_files_sha256'],'build-metadata.json':ir['build_metadata_sha256']}and len(a['runtime_files'])==123,'123runtimepins')
need(a['source_revision']==a['source_git_commit']=='b6fea8592e0ac5a56a2f0e66f1abc6022026a5fc','cleanGitmetadata')
outer=load(N/'outer-report.json');d=load(N/'probe-report.json');exit=load(R/'.artifacts/p05-n4-a16-run01.exit.json')
need(outer['status']==d['status']==outer['cleanup']=='PASS'and outer['probe_exit']==exit['exit_code']==0,'native PASS0')
need(outer['project']=='venus-pilot470-b95dd8e59616'and outer['root_ack_sha256']==sha(ackpath),'project ACK')
need(outer['source_identity']==d['source_identity']==a['source_identity']and outer['image_id']==d['image_id']==a['image_id'],'native tuple')
need(outer['container_ownership_verified']and outer['cleanup_errors']==[]and outer['diagnostic_capture']=='PASS'and outer['sanitized_diagnostics']==0 and load(N/'server-diagnostics.json')==[],'owner cleanup diagnostics')
need(len(d['profiles'])==1 and d['negative_profiles']==[],'fixedN4 scope');p=d['profiles'][0]
need((p['id'],p['context'],p['mode'],p['N'],p['status'])==('PILOT470-01','online','questions',4,'PASS'),'fixed profile')
rounds=p['rounds'];need(len(rounds)==20 and[x['round_index']for x in rounds]==list(range(1,21))and all(x['state']=='completed'and x['mode']=='questions'for x in rounds),'20orderedrounds')
need(len({x['card_id']for x in rounds})==20 and len({(x['card_id'],x['revision'])for x in rounds})==20,'20distinct IDs/revisions')
need(p['locale_identity']==[{'locale':loc,'card_id':rounds[0]['card_id'],'card_revision':rounds[0]['revision']}for loc in ['ru','en','tr']],'exact first-round locale identity')
for key,n in [('completed_rounds',20),('finishes',20),('skips',0),('requests',473),('WS_connections',4),('rooms_created',1),('rooms_closed',1),('locales_checked_sessions',1),('room_cleanup_failures',0)]:need(d[key]==n,key)
need(d['client_cleanup']=='COMPLETE'and d['entrypoint']=='apps/api/dist/server.js'and d['API_only']and not d['actual_browser']and not d['actual_TLS'],'scope+clientcleanup')
need(d['pack_digest']==a['pack_digest']and d['map_pins']==a['map_pins']and d['owner_authority']==a['owner_authority']and not d['source_override']and not d['syntheticFixtureOnly'],'real470 authority')
descriptor=load(M/'DESCRIPTOR.json');need(descriptor['rate_schedule']['positive_profile_deadline_ms']==600000 and descriptor['expected_completed_rounds']==20 and descriptor['rate_schedule']['retries']==0,'original600s')
probe=(M/'probe.mjs').read_text();need('adult18:false'in probe and "assert([400,403].includes(denied.status))"in probe and "assert([400,403].includes(refused.status))"in probe and 'return receipt(value,id)'in probe,'mandatory adultdenials and exact mutation receipt')
manifestpath=R/'.artifacts/p05-cohorts06-a16-acks01/MANIFEST.json';need(sha(manifestpath)=='3eeae155cbd34538b0711f934be7daee8ccefe612478fa48c5648bfb1f9546f7','6cohortmanifest');manifest=load(manifestpath);pin(manifestpath)
need(manifest['original_profiles']==42 and manifest['complete_rounds']==840 and manifest['YB_all_X_negatives']==2 and manifest['maximum_concurrent_cohorts']==2 and manifest['actual_cohort_runs']==0,'original cohort scope')
review=R/'.docs/implementation/reviews/p05/ordinary06-diagnostic-independent-round01/INDEX.json';index(review,'122d26cf594e289796166542deddb89f6f2d4314e2f499ba554f695c1bd2959f')
cohorts=[c+'/'+m for c in ['online','in_person']for m in ['questions','truth_or_dare','yes_but']];need([v['cohort']for v in manifest['cohorts']]==cohorts,'six fixedaxes')
vary={'status','purpose','method_review_path','method_review_sha256','method_files','cohort','issued_at','scope','N4_600s_positive_prerequisite','maximum_concurrent_cohorts','no_retry_or_reseed','concurrent_workload'}
ackhashes=set()
for row in manifest['cohorts']:
 path=Path(row['path']);need(sha(path)==row['sha256'],'cohort pin');pin(path);ackhashes.add(row['sha256']);v=load(path)
 need({k:x for k,x in v.items()if k not in vary}=={k:x for k,x in a.items()if k not in vary},'unchanged A16 core tuple')
 need(v['purpose']=='ORDINARY470_FIXED_COHORT_06'and v['cohort']==row['cohort']and v['method_review_sha256']==sha(review)and v['method_files']==manifest['method_files']and v['no_retry_or_reseed']and v['maximum_concurrent_cohorts']==2,'cohort authority')
 need(v['N4_600s_positive_prerequisite']=={'outer_report':str(N/'outer-report.json'),'outer_sha256':sha(N/'outer-report.json'),'probe_sha256':sha(N/'probe-report.json'),'completed_rounds':20,'status':'PASS'},'currentN4 prerequisite')
for n,h in manifest['method_files'].items():need(sha(R/'.artifacts/p05-ordinary-real470-probe06'/n)==h,'original06method '+n)
oldprep=(R/'.artifacts/p05-cohorts06-a15-prepare01.py').read_text();newprep=(R/'.artifacts/p05-cohorts06-a16-prepare01.py').read_text()
need(oldprep.replace('a15','a16').replace('A15','A16').replace('056966f74135','b95dd8e59616').strip()==newprep.strip(),'literal-only prepare revision')
priorruns=R/'.artifacts/p05-ordinary-real470-probe06/runs';need(not any(load(p).get('root_ack_sha256')in ackhashes for p in priorruns.glob('*/outer-report.json')),'no actualcohort terminal acceptance yet')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';v=subprocess.run([node,str(O/'cohort-cold.mjs')],cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30)
(O/'cohort-cold.txt').write_bytes(v.stdout);need(v.returncode==0,'existing6cold validators');need(json.loads(v.stdout)['profiles']==42,'42cold')
for p0 in N.iterdir():
 if p0.is_file():pin(p0)
for name in ['.artifacts/p05-n4-a16-run01.txt','.artifacts/p05-n4-a16-run01.exit.json','.artifacts/p05-cohorts06-a16-prepare01.py','.artifacts/p05-cohorts06-a15-prepare01.py']:pin(R/name)
result={'status':'PASS_A16_N4_ACTUAL_COMPONENT_AND_SIX_COLD_COHORT_BINDINGS_NOT_FULL_MATRIX_OR_STAGE','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'source_identity':a['source_identity'],'included_files':1870,'git_commit':a['source_git_commit'],'image':a['image_id'],'project':outer['project'],'actual_rounds':20,'distinct_real470_ids':20,'requests':473,'WS_connections':4,'room_created_closed':1,'skips':0,
 'first_released_locale_identity':['ru','en','tr'],'mandatory_adult_false_create_join_denials':'REACHED_ASSERTIONS_IN_EXACT_METHOD04_PASS','mutation_receipts':'EXACT_SCHEMA_REQUEST_ID_REVISION_ASSERTIONS_REACHED','client_cleanup':'COMPLETE','owned_outer_cleanup':'PASS','safe_HTTP_events':0,'root_exit':0,
 'prospective_cohort_ACKs':6,'cold_profile_count':42,'cold_round_count':840,'cold_YB_negatives':2,'maximum_concurrent_cohorts':2,'cohort_native_actuals_accepted':0,'cold_exit':v.returncode,
 'native_runs_by_reviewer':False,'APP_edits':False,'performance_percent_comparison':False,'zero_ambient_workload_claim':False,'full_stage_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
