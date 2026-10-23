from pathlib import Path
import json,hashlib,datetime,collections
R=Path(__file__).resolve().parents[5];O=Path(__file__).resolve().parent
N=R/'.artifacts/p05-ordinary-real470-probe06/runs/venus-pilot470-04ed27eff134';S=R/'.artifacts/p05-pilot-bundle-source12';P=R/'.artifacts/p05-a15-owned-cpu-profile01'
def load(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def need(x,label):
 if not x:raise AssertionError(label)
inputs={}
def pin(p):inputs[p.relative_to(R).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
def index(p,h):
 need(sha(p)==h,'index');pin(p);d=load(p);files=d['files']
 if isinstance(files,dict):files=[{'path':n,**v}for n,v in files.items()]
 for v in files:
  q=p.parent/v['path'];need(sha(q)==v['sha256']and q.stat().st_size==v['bytes'],'child '+v['path'])
 return len(files)
archive=R/'.docs/implementation/evidence/p05/a15-inperson-questions-cohort06-failed01/INDEX.json'
need(index(archive,'49d2ff04401cbe9265ab77a8f50df08fc4d5761849ad8a5754f4ff77bf0337ba')==11,'archive11')
tpath=R/'.artifacts/p05-cohort06-a15-inperson-questions01.terminal-receipt.json';need(sha(tpath)=='02d1dc99e376dca4a71bce93dc09945dd5de67bc528a1e27775552305936f6cb','terminal receipt');pin(tpath);t=load(tpath)
for v in t['files']:
 q=R/v['path'];need(sha(q)==v['sha256']and q.stat().st_size==v['bytes'],'receipt raw '+v['path']);pin(q)
outer=load(N/'outer-report.json');d=load(N/'probe-report.json');diag=load(N/'server-diagnostics.json');exit=load(R/'.artifacts/p05-cohort06-a15-inperson-questions01.exit.json')
need(outer['status']==d['status']=='FAIL'and outer['probe_exit']==exit['exit_code']==t['exit_code']==1,'terminal FAIL1')
need(outer['cleanup']==t['cleanup']=='PASS'and outer['cleanup_errors']==t['cleanup_errors']==[]and outer['container_ownership_verified']and t['ownership_verified'],'owned cleanup')
need(outer['project']==t['project']=='venus-pilot470-04ed27eff134','project')
need(outer['source_identity']==d['source_identity']==t['source_identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','source')
need(outer['image_id']==d['image_id']==t['image_id']=='sha256:d1eff08f9a3201c087356bef173ab5b5df7ea202125d6e30aceaec090cbe893c','image')
need([x['id']for x in d['profiles']]==['PILOT470-'+str(i)for i in range(22,29)],'fixed IDs')
for i,v in enumerate(d['profiles'],2):
 expected='PASS'if i<=6 else'FAIL'if i==7 else'NOT_RUN';count=20 if i<=6 else 16 if i==7 else 0
 need(v['N']==i and v['context']=='in_person'and v['mode']=='questions'and v['status']==expected,'profile axis/status')
 rounds=v.get('rounds',[]);need(len(rounds)==count and [x['round_index']for x in rounds]==list(range(1,count+1))and all(x['state']=='completed'for x in rounds),'completed rounds')
 need(len({(x['card_id'],x['revision'])for x in rounds})==count,'distinct round cards')
need(sum(len(v.get('rounds',[]))for v in d['profiles'])==d['completed_rounds']==d['finishes']==t['completed_rounds']==116,'116actual finishes')
for k,n in [('requests',2991),('WS_connections',27),('rooms_created',6),('rooms_closed',6)]:need(d[k]==t[k]==n,k)
need(d['client_cleanup']=='COMPLETE'and d['room_cleanup_failures']==0 and d['skips']==0,'client cleanup no skips')
need(d['error']==t['error']and d['error']['assertion_code']=='PROFILE_OR_TOTAL_DEADLINE'and d['error']['elapsed_ms']==1792977,'deadline saved')
need(d['error']['last_request']=={'operation':'self-actions','method':'GET','status':200,'code':None,'duration_ms':1713,'request_id':None,'actor_ordinal':4,'phase':'invitation','round_index':17},'last before cleanup')
need(d['ws_first_fault']is None and t['ws_first_fault']is None and d['diagnostic_trace']=={'phase':'invitation','round_index':17},'saved fault')
need(len(diag)==outer['sanitized_diagnostics']==5 and all(v['event']=='websocket_failed'and v['domain_code']=='ROOM_CLOSED'for v in diag),'diagnostics5')
need(collections.Counter(v['phase']for v in diag)=={'auth_or_heartbeat':2,'poll':3},'diag phases')
ackpath=R/'.artifacts/p05-cohorts06-a15-acks01/in_person-questions.json';ack=load(ackpath);need(sha(ackpath)==outer['root_ack_sha256']==t['root_ack_sha256']=='8f325f7c70f3c3073c2956f4f3f14a275019bd62ed0d851d86a472e953966bbb','ACK')
for n,h in ack['method_files'].items():need(sha(R/'.artifacts/p05-ordinary-real470-probe06'/n)==h,'method pin '+n)
receipt=Path(ack['image_receipt_path']);need(sha(receipt)==ack['image_receipt_sha256'],'production receipt');ir=load(receipt);need(ir['image']==ack['image_id']and ir['source_identity']==ack['source_identity'],'receipt binding');pin(receipt)
need(ack['runtime_files']=={**ir['image_files_sha256'],'build-metadata.json':ir['build_metadata_sha256']}and len(ack['runtime_files'])==123,'production123pins')
need(d['pack_digest']==ack['pack_digest']and d['map_pins']==ack['map_pins']and d['owner_authority']==ack['owner_authority']and not d['source_override']and not d['syntheticFixtureOnly'],'actual470 authority')
cost=R/'.docs/implementation/reviews/p05/a15-owned-profile-cost-independent-round01';need(index(cost/'INDEX.json','f46ce137c38fdcea0429787c07bd90dd0e1ad630d4cbf84f7c717095620f5870')==5,'costreview5')
for v in load(cost/'INPUT-PINS.json')['files']:
 q=(S if v['path'].startswith('apps/')else R)/v['path'];need(sha(q)==v['sha256']and q.stat().st_size==v['bytes'],'old cost input '+v['path']);pin(q)
profile=load(P/'receipt.json');inspect=load(P/'inspect-before.json')
need(inspect==load(P/'inspect-before02.json')==load(P/'inspect-after.json')and inspect['project']==outer['project']and inspect['image']==outer['image_id']and inspect['service']=='app','same inspected owner')
need(inspect['id']=='a9914027f5e1a20e528713fdff6eb5c9985af0459260c45bbf04ad206c39470a'and profile['project']==outer['project'],'same parent container')
need(profile['listener_cleanup']=='EXISTING_PARENT_COHORT_COMPOSE_TEARDOWN'and profile['normal_uninstrumented_cohort_acceptance']is False,'old pending parent relation')
source=(R/'.artifacts/p05-ordinary-real470-probe06/outer.mjs').read_text();need("ownedContainer(value,project)"in source and "docker(['down','--volumes','--remove-orphans','--timeout','10'])"in source and "'network','ls','--quiet','--filter','label=com.docker.compose.project='+project"in source and "'volume','ls','--quiet','--filter','label=com.docker.compose.project='+project"in source,'owned cleanup source guards')
for n in ['outer.mjs','probe.mjs','DESCRIPTOR.json']:pin(R/'.artifacts/p05-ordinary-real470-probe06'/n)
result={'status':'VERIFIED_TERMINAL_FAIL_INSTRUMENTED_COHORT_SAVED_PARENT_TEARDOWN_COMPLETE_NOT_STAGE_PASS','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'project':outer['project'],'source_identity':outer['source_identity'],'image':outer['image_id'],'completed_rounds':116,'N2_to6':'PASS20_EACH','N7':'FAIL16_PROFILE600S_DEADLINE_ROUND17_INVITATION','N8':'NOT_RUN',
 'requests':2991,'WS_connections':27,'rooms_created_closed':6,'client_cleanup':'COMPLETE','outer_cleanup':'PASS','ownership':'VERIFIED_SAVED_INSPECT_AND_OUTER_GUARDS','root_exit':1,
 'safe_ROOM_CLOSED_events':5,'causal_attribution':'NOT_ESTABLISHED','instrumented_performance_acceptance':False,'saved_parent_inspector_teardown':'COMPLETE_ADDITIVE_TERMINAL_QUALIFICATION_NO_NEW_LIVE_CHECK','old_profile_receipt_unchanged':True,
 'native_runs':False,'APP_edits':False,'retries':0,'full_stage_PASS':False}
(O/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');(O/'INPUT_PINS.json').write_text(json.dumps(inputs,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
