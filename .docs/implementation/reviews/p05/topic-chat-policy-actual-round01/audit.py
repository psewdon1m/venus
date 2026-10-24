from pathlib import Path
import json,hashlib,zipfile,subprocess,sys,datetime,copy
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path.cwd();p=root/'.docs/implementation/evidence/p05/topic-chat-policy-preflight-02';out=Path(__file__).parent
expected='895fb30bb371397e7fbffa539ad1ae1c44c25630905bedb175867c3500a36a04'
image='sha256:c02fb83839339f0c60b55c7df509e73c6fb774c0a0ed6cc05ab4c746a131fc1c'
def sha(b):return hashlib.sha256(b).hexdigest()
def j(path):return json.loads(Path(path).read_text(encoding='utf-8'))
def save(name,data): (out/name).write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
raw=(p/'index.json').read_bytes();assert sha(raw)=='6c8476a7baf537d4bafbac9142a8053fa62f71bfa2b589a9bcae16e1f8a5e39a'
idx=json.loads(raw);assert len(idx['files'])==len({r['path'] for r in idx['files']})==28
for r in idx['files']:
 b=(p/r['path']).read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256'],r['path']
assert idx['source_identity']==expected and idx['included_files']==1808 and idx['handle']==50387 and idx['exit_code']==0 and idx['checks_pass']==12 and idx['cleanup']=='completed'
before=j(p/'run/inputs-before.json');assert before==j(p/'run/inputs-after.json')==j(p/'run/inputs-after-finally.json')
current=inventory();assert before['files']==current and len(current)==1808 and identity(current)==before['identity']==expected
pins=j(p/'run/producer-pins-before.json');assert pins==j(p/'run/producer-pins-after.json')==j(p/'run/producer-pins-after-finally.json')
producer={Path(k).name:v for k,v in pins.items()};assert producer=={n:sha((p/'producer'/n).read_bytes()) for n in ['integration.mjs','runner.mjs']}
static=j(root/'.docs/implementation/reviews/p05/topic-chat-producer-round04/report.json');assert static['status']=='STATIC_PRODUCER_PREFLIGHT_PASS' and static['reviewer']=='/root/p05_topics_ui' and static['producer_author']=='/root/p05_topics_ui_review'
assert static['source_identity']==expected and static['producer_sha256']['integration']==producer['integration.mjs'] and static['producer_sha256']['runner']==producer['runner.mjs']
for n,key in [('DESIGN.md','design'),('HANDOFF.json','HANDOFF')]:assert sha((p/'producer'/n).read_bytes())==static['producer_sha256'][key]
zpath=(p/idx['source_archive']).resolve();assert sha(zpath.read_bytes())==idx['source_archive_sha256']=='9627fb299dbb42feae8955bb765140acdaf168054c159cae7c87a599f6a23a5b'
with zipfile.ZipFile(zpath) as z:
 assert len(z.namelist())==len(set(z.namelist()))==1808 and set(z.namelist())==set(current)
 for name,digest in current.items():assert sha(z.read(name))==digest,name
 for name in ['apps/api/src/topic-games.ts','apps/api/src/topic-chat-policy.ts','apps/api/src/topic-chat-quota.ts','apps/api/src/topic-game-model.ts','apps/api/src/topic-game-routes.ts','tests/p05-topic-lifecycle/harness.mjs','infra/venus/Dockerfile.p05-tests']:
  if name not in current:continue
  dest=out/'exact-source'/(name+'.bytes');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(z.read(name))
report=j(p/'run/chat-policy-report.json')
def validate_report(r):
 assert r['schema_version']==1 and r['suite']=='P05_TOPIC_CHAT_POLICY' and r['status']=='PASS' and r['runtime_cleanup']=='completed'
 assert len(r['checks'])==12;checks={c['id']:c for c in r['checks']};assert len(checks)==12 and set(checks)=={'P05-TCP-'+str(i).zfill(2) for i in range(1,13)} and all(c['status']=='PASS' for c in checks.values())
 assert r['real_postgresql_http_protected_lifecycle'] and r['synthetic_content_source'] and r['explicit_quota_boundary_fixture'] and r['ordinary_production_cmd'] is False and r['browser_cookie_jar'] is False and r['full_p05_pass'] is False
 d=lambda n:checks['P05-TCP-'+str(n).zfill(2)]['detail']
 assert all(d(1).values())
 for n,flag in [(2,True),(3,False)]:assert d(n)['context']=='in_person' and d(n)['flag'] is flag and d(n)['private_verbal_prompt_allowed'] and d(n)['chat_get_post_denied'] and d(n)['snapshot_chat_capability'] is False
 for n,re in [(4,False),(5,True)]:
  a=d(n);assert a['actual_rounds']==a['distinct_round_ids']==20 and a['distinct_ordered_indexes_1_to_20'] and a['actual_database_round_count20'] and a['final_round_terminal'] and a['private_opportunities']==0 and a['immutable_snapshot_bytes_unchanged'] and a['capless_after_reenable'] is re
 for n in [6,7,8]:assert all(v is True for v in d(n).values())
 for n in [9,10]:
  a=d(n);accept=a['action_accepted_before_clock_window'];assert accept['actual_http_action_acceptance'] and accept['actor_accept_posts']==2
  b,c=accept['before'],accept['after'];assert b['action_state']=='pending' and b['round_state']=='pending' and b['action_active_until_ms'] is None and c['action_state']=='active' and c['round_state']=='active'
  assert b['server_time_ms']==c['server_time_ms']<b['action_pending_deadline_ms']==c['action_pending_deadline_ms'] and c['action_active_until_ms']>c['server_time_ms']
  x,y=a['clock_window'];assert x['action_state']==y['action_state']=='active' and x['server_time_ms']<y['server_time_ms']<y['action_active_until_ms'] and x['server_time_ms']//60000<y['server_time_ms']//60000
  for key in ['action_active_until_ms','invitation_active_until_ms','conversation_parent_expires_at_ms']:assert x[key]==y[key]==c[key]
  for key in ['invitation_active_until_ms','conversation_parent_expires_at_ms']:assert b[key]==c[key]
 assert all(d(9)[key] for key in ['fixed_calendar_minute_floor','twelve_per_actor','thirteenth_denied429','peer_independent','next_minute_allowed','real_presence_heartbeats'])
 assert d(10)['clock_window'][1]['server_time_ms']>d(10)['action_accepted_before_clock_window']['before']['action_pending_deadline_ms']
 assert d(10)['actual_http_messages']==34 and all(d(10)[key] for key in ['last32_only','monotonic_current_epoch_sequence','game_revision_unchanged','room_revision_unchanged'])
 assert d(11)['explicit_encrypted_quota_only_fixture_total']==126 and d(11)['natural_http_messages_in_case']==2 and all(d(11)[key] for key in ['not_128_natural_sends','round_budget128_denies129','budget_survives_epoch_change','old_epoch_text_cleared','auth_consent_lifecycle_not_seeded'])
 assert d(12)['scope_GET_AND_POST_FINAL_FENCE'] and all(v is True for v in d(12)['get'].values())
 assert d(12)['post']['exact_new_request_receipts']==0 and all(v is True for k,v in d(12)['post'].items() if k!='exact_new_request_receipts')
 return checks
checks=validate_report(report)
tests=(p/'run/tests.txt').read_text(encoding='utf-8');assert [line for line in tests.splitlines() if line.startswith('P05-TCP-')]==['P05-TCP-'+str(i).zfill(2)+' PASS' for i in range(1,13)]
terminal=(p/'root-terminal.txt').read_text(encoding='utf-8');assert 'TERMINAL {"status":"PASS","cleanup":"completed"' in terminal and 'FAIL' not in terminal
sensitivity=[]
for name,mutate in [
 ('missing_case',lambda r:r['checks'].pop()),
 ('duplicate_case',lambda r:r['checks'].__setitem__(11,copy.deepcopy(r['checks'][10]))),
 ('wrong_source_scope',lambda r:r.__setitem__('ordinary_production_cmd',True)),
 ('extended_action_deadline',lambda r:r['checks'][9]['detail']['clock_window'][1].__setitem__('action_active_until_ms',1300000)),
 ('not_actual_two_actor_accept',lambda r:r['checks'][8]['detail']['action_accepted_before_clock_window'].__setitem__('actor_accept_posts',1)),
 ('unlabelled_seed',lambda r:r['checks'][10]['detail'].__setitem__('not_128_natural_sends',False)),
 ('no_get_wait',lambda r:r['checks'][11]['detail']['get'].__setitem__('actual_final_chat_pg_wait',False)),
 ('no_post_wait',lambda r:r['checks'][11]['detail']['post'].__setitem__('actual_mutation_final_pg_wait',False)),
 ('receipt_not_rolled_back',lambda r:r['checks'][11]['detail']['post'].__setitem__('exact_new_request_receipts',1))]:
 altered=copy.deepcopy(report);mutate(altered)
 try:validate_report(altered)
 except AssertionError:sensitivity.append({'name':name,'status':'EXPECTED_REJECTION'})
 else:raise AssertionError('Verifier accepted altered evidence '+name)
runner=j(p/'run/runner.json');assert runner['image']==idx['image']==image and runner['cleanup']=='completed' and runner['status']=='PASS' and runner['error'] is None and runner['source_identity']==expected and runner['producer_pins']==pins
img=j(p/'run/image-inspect.json')[0];fresh=json.loads(subprocess.check_output(['docker','image','inspect',image],text=True))[0];assert img['Id']==fresh['Id']==image and img['Config']==fresh['Config']
compose=j(p/'run/compose.json');api=compose['services']['api'];assert api['image']==image and api['read_only'] and api['user']=='1000:1000' and api['mem_limit']=='768m' and api['cpus']==1 and api['pids_limit']==96 and api['cap_drop']==['ALL'] and api['security_opt']==['no-new-privileges:true']
assert compose['services']['db']['mem_limit']=='512m' and compose['networks']['isolated']['internal'] and 'NODE_OPTIONS' not in api['environment'] and 'ports' not in api
assert api['command']==['node','tests/p05-topic-lifecycle/chat-policy.mjs'] and {v['target'] for v in api['volumes']}=={'/artifacts','/app/tests/p05-topic-lifecycle/chat-policy.mjs'}
assert next(v for v in api['volumes'] if v['target'].endswith('chat-policy.mjs'))['read_only'] is True
assert all(not v for v in j(p/'run/resources-after-cleanup.json').values());project=runner['project'];assert project=='venus-topic-chat-policy-69dbed48212f';freshresources={}
for kind,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
 for item in j(p/f'run/cleanup-{kind}-inspect.json'):assert (item.get('Config',{}).get('Labels') or item.get('Labels'))['com.docker.compose.project']==project
 resources=subprocess.check_output(['docker',*args,'--filter','label=com.docker.compose.project='+project],text=True).split();assert not resources;freshresources[kind]=resources
for s in compose['secrets'].values():assert not Path(s['file']).exists() and not Path(s['file']).parent.exists()
old=root/'.docs/implementation/evidence/p05/topic-chat-policy-preflight-01';assert sha((old/'index.json').read_bytes())=='858cf94b2d112a1f04cdf3cb3d076b81f1c168ba9b11370699cdbd6ecb5744e5'
for r in j(old/'index.json')['files']:
 b=(old/r['path']).read_bytes();assert sha(b)==r['sha256'] and len(b)==r['bytes']
oldreport=j(old/'run/chat-policy-report.json');assert oldreport['status']=='FAIL' and len(oldreport['checks'])==10 and oldreport['checks'][-1]['status']=='FAIL'
imageinputs={n:d for n,d in current.items() if n.startswith(('apps/','packages/','tests/')) or n in ['package.json','package-lock.json','.npmrc','tsconfig.json','tsconfig.base.json']};save('frozen-image-inputs.json',imageinputs)
result={'schema_version':1,'status':'EVIDENCE_AUDIT_PASS_IMAGE_HASH_PROBE_PENDING','source_identity':expected,'included_inputs':1808,'index_sha256':sha(raw),'indexed_artifacts_verified':28,'source_archive_sha256':idx['source_archive_sha256'],'image':image,'root_handle':50387,'root_exit_code':0,'terminal_exit_provenance':'parent observed same exec handle terminal0; archived report/terminal independently consistent','producer_pins':producer,'same_before_after_finally':True,'checks_pass':12,'clock_controls':{n:checks['P05-TCP-'+n]['detail'] for n in ['09','10']},'quota_boundary':checks['P05-TCP-11']['detail'],'late_fences':checks['P05-TCP-12']['detail'],'evidence_validator_sensitivity':sensitivity,'fresh_owned_cleanup':freshresources,'secret_temp_absent':True,'historical_fail_retained':True,'image_input_count':len(imageinputs),'functional_docker_reruns':0,'static04_report_sha256':sha((root/'.docs/implementation/reviews/p05/topic-chat-producer-round04/report.json').read_bytes()),'scope':'Actual realPG/protected HTTP lifecycle chat policy/quota/synthetic content/manual Cookie; not ordinary production CMD/browser/full restore/whole P05'}
save('evidence-audit.json',result);save('current-inventory.json',{'identity':expected,'files':current});print(json.dumps({'indexed':28,'source_entries':1808,'cases':12,'sensitivity_controls':len(sensitivity),'image_inputs':len(imageinputs),'cleanup':freshresources}))
