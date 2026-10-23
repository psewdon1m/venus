from pathlib import Path
import json,hashlib,zipfile,subprocess,sys,datetime,ast,copy
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path.cwd();out=Path(__file__).parent;ev=root/'.docs/implementation/evidence/p05'
expected='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571'
sha=lambda b:hashlib.sha256(b).hexdigest()
j=lambda p:json.loads(Path(p).read_text(encoding='utf-8'))
def save(n,v):(out/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
def time(s):return datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
configs=[('topic-games',20,19,'459fd4e32108c5ac247caefd79e714c697c685c7a0c11f039475432dc93bd5a6','topic-games-report.json','P05-TG-'),('topic-lifecycle',16,19,'8e3835c43768b12b6159d51ddbc7cc7cdc0ed5fcfaa0a2ab71e85bc0b7ce5229','topic-lifecycle-report.json','P05-TLC-'),('ordinary-runtime',8,53,'84b5498535537e0d09135aef72c20dc9f31462359d1141cc696b6ae5f792f7a4','report.json','P05-RT-'),('ordinary-ws',10,23,'8a7a0e4f85e96e6be9984931c1e02a475e0843866a2ff65a6471602c4267eaeb','ordinary-ws-report.json','P05-OWS-'),('topic-chat-policy',12,24,'62fc81e9af197d33be445c4e1c5fe432b82cf67f4a5567b31dcb7401f4de8a96','chat-policy-report.json','P05-TCP-')]
current=inventory();assert len(current)==1811 and identity(current)==expected
configs.append(('topic-compatibility',6,25,'9d85db70d851d35b83d6e94f9a647e770da36ddde23b90ab464745206545f9be','compatibility-report.json','P05-COMPAT-'))
freeze=ev/'engine2-source-freeze-01';assert sha((freeze/'index.json').read_bytes())=='4fd48212751f56519258c2261ccf92c651c0002763ea031a6ae8c7259e5c8dbc'
zipsha='5a622f20a18c427cde591b0f0f78a61f52b892b7dec3fff5ff14833d532b82af';assert sha((freeze/'included-source.zip').read_bytes())==zipsha
with zipfile.ZipFile(freeze/'included-source.zip') as z:
 assert len(z.namelist())==len(set(z.namelist()))==1811 and set(z.namelist())==set(current)
 for name,digest in current.items():assert sha(z.read(name))==digest,name
 sourcebytes={name:z.read(name) for name in current}
results=[];reports={}
for kind,count,files,indexhash,reportname,prefix in configs:
 p=ev/('engine2-'+kind+'-preflight-01');idx=j(p/'index.json');assert sha((p/'index.json').read_bytes())==indexhash
 assert len(idx['files'])==len({r['path'] for r in idx['files']})==files
 for r in idx['files']:
  b=(p/r['path']).read_bytes();assert len(b)==r['bytes'] and sha(b)==r['sha256'],(kind,r['path'])
 assert idx['source_identity']==expected and idx['included_files']==1811 and idx['checks_pass']==count and idx['cleanup']=='completed' and idx.get('observed_exit_code',idx.get('exit_code'))==0
 assert idx['source_archive_sha256']==zipsha and (p/idx['source_archive']).resolve()==(freeze/'included-source.zip').resolve()
 before=j(p/'run/inputs-before.json');assert before==j(p/'run/inputs-after.json') and before['identity']==expected and before['files']==current
 if (p/'run/inputs-after-finally.json').exists():assert before==j(p/'run/inputs-after-finally.json')
 report=j(p/'run'/reportname);reports[kind]=report
 assert report['status']=='PASS' and report.get('runtime_cleanup',report.get('cleanup'))=='completed'
 checks={c['id']:c for c in report['checks']};assert len(report['checks'])==len(checks)==count and set(checks)=={prefix+str(i).zfill(2) for i in range(1,count+1)} and all(c['status']=='PASS' for c in checks.values())
 assert report.get('full_p05_pass',report.get('full_stage_acceptance')) is False
 compose=j(p/'run/compose.json');api=compose['services']['app' if kind=='ordinary-runtime' else 'api'];image=idx['image'];assert api['image']==image
 assert api['user']=='1000:1000' and api['read_only'] and api['mem_limit']=='768m' and api['cpus']==1 and api['cap_drop']==['ALL'] and 'NODE_OPTIONS' not in api['environment'] and 'ports' not in api
 assert compose['services']['db']['mem_limit']=='512m' and compose['networks']['isolated']['internal']
 img=j(p/'run/image-inspect.json')[0];fresh=json.loads(subprocess.check_output(['docker','image','inspect',image],text=True))[0];assert img['Id']==fresh['Id']==image and img['Config']==fresh['Config']
 pins={}
 if (p/'run/producer-pins-before.json').exists():
  pin0=j(p/'run/producer-pins-before.json');assert pin0==j(p/'run/producer-pins-after.json')
  if (p/'run/producer-pins-after-finally.json').exists():assert pin0==j(p/'run/producer-pins-after-finally.json')
  for name,digest in pin0.items():
   filename=Path(name).name;assert sha((p/'producer'/filename).read_bytes())==digest;pins[filename]=digest
 elif kind=='ordinary-runtime':
  pins=j(p/'run/test-input-pins.json')
  for name,digest in pins.items():assert current[name]==digest
 else:
  runner=(p/'runner.mjs').read_bytes();assert b"'infra/venus/Dockerfile.p05-tests'" in runner and ('tests/p05-'+kind+'/integration.mjs').encode() in runner;pins['archived_excluded_runner.mjs']=sha(runner)
 project=idx['project'];assert all(not v for v in j(p/'run/resources-after-cleanup.json').values());freshresources={}
 for resource,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
  for item in j(p/f'run/cleanup-{resource}-inspect.json'):assert (item.get('Config',{}).get('Labels') or item.get('Labels'))['com.docker.compose.project']==project
  freshresources[resource]=subprocess.check_output(['docker',*args,'--filter','label=com.docker.compose.project='+project],text=True).split();assert not freshresources[resource]
 for s in compose['secrets'].values():assert not Path(s['file']).exists() and not Path(s['file']).parent.exists()
 if kind=='ordinary-runtime':
  assert 'command' not in api and api['volumes']==['venus-state:/var/lib/venus'] and img['Config']['Cmd']==['node','apps/api/dist/server.js']
  assert report['positive_v2_serving'] is False and report['production_dns_tls'] is False and report['browser_cookie_jar_proof'] is False
  d=lambda n:checks[prefix+str(n).zfill(2)]['detail']
  assert d(1)['production_image']['approved_packs']==d(1)['production_image']['approved_topic_sources']==0 and d(1)['unchanged_image_command']
  assert d(2)['schema']=={'migration_generations':[1,2,3],'checksums_match_image':True,'private_tables':8} and d(2)['actual_server_listening']
  assert d(3)['explicit18_required'] and d(3)['offer_acceptance_required'] and d(3)['refused_creates_no_rows'] and d(3)['private_protocol']==1 and d(3)['topic_birth_rows']==0
  assert d(4)['before']==d(4)['after'] and d(4)['no_root_repair'] and d(4)['protocol2_read_proof'] is False
  for n,phase in [(5,'invalid-flag'),(6,'hold-enabled'),(8,'restored-v2-disabled')]:
   a=d(n);monitor=j(p/f'run/monitor-{phase}.json');inspect=j(p/f'run/{phase}-app-inspect.json');observer=j(p/f'run/{phase}-monitor-inspect.json')
   assert a['exit_code']==inspect['State']['ExitCode']==1 and a['observed_connections']==monitor['connections']==0 and a['observer_live'] and observer['State']['Running'] and observer['State']['Pid']>0
   assert a['observed_attempts']>=a['pre_start_attempts']+5 and a['pre_start_attempts']>0
   assert time(a['pre_start_observation_at'])<time(a['app_started_at'])<time(a['app_finished_at'])<=time(a['post_exit_observation_at'])
   assert a['max_observation_gap_ms']>0 and monitor['max_observation_gap_ms']>0 and a['absolute_no_listen_proof'] is False and a['sampled_state_unchanged'] and a['full_database_equality_proof'] is False
   assert inspect['Config']['Cmd']==img['Config']['Cmd'] and inspect['Image']==image
  assert d(7)['fixture_sql_only'] and d(7)['real_v2_admission'] is False and d(7)['full_backup_restore'] is False
 else:
  runner=j(p/'run/runner.json');assert runner['status']=='PASS' and runner['cleanup']=='completed' and runner['error'] is None and runner['source_identity']==expected and runner['image']==image and runner['project']==project
  assert api['command'][0]=='node' and all(not str(v.get('target','')).endswith('harness.mjs') for v in api['volumes'] if isinstance(v,dict))
  for v in api['volumes']:
   if isinstance(v,dict) and v['target'].startswith('/app/'):
    assert v['read_only'];filename=Path(v['source']).name
    if kind in ['topic-games','topic-lifecycle']:raise AssertionError('Unexpected included-module override')
    assert sha((p/'producer'/filename).read_bytes()) in pins.values()
 terminal=(p/'root-terminal.txt').read_text(encoding='utf-8');assert 'PASS' in terminal and 'cleanup' in terminal
 results.append({'packet':p.name,'index_sha256':indexhash,'indexed_files':files,'root_handle':idx.get('observed_handle',idx.get('handle')),'root_observed_exit_code':0,'checks_pass':count,'image':image,'project':project,'producer_pins':pins,'fresh_owned_cleanup':freshresources,'host_secret_files_absent':True,'same_full_maps':True})
# Full semantic assertion replay of the previous independent chat validator against NEW raw values.
old=Path('.docs/implementation/reviews/p05/topic-chat-policy-actual-round01/audit.py');asttree=ast.parse(old.read_text(encoding='utf-8'));func=next(n for n in asttree.body if isinstance(n,ast.FunctionDef) and n.name=='validate_report');namespace={};exec(compile(ast.Module(body=[func],type_ignores=[]),'EXACT_OLD_VALIDATOR_FUNCTION','exec'),namespace);namespace['validate_report'](reports['topic-chat-policy'])
save('chat-validator-source-pin.json',{'path':str(old),'sha256':sha(old.read_bytes()),'scope':'Only pure validate_report AST function replayed against fresh report; historical I/O not executed'})
tg={c['id']:c['detail'] for c in reports['topic-games']['checks']};assert tg['P05-TG-03']['actual_pg_http_rounds']==100 and tg['P05-TG-03']['history_bytes']>16384 and tg['P05-TG-03']['padded_chunks']>1
assert tg['P05-TG-02']['actual_http_three_modes']==['questions','truth_or_dare','yes_but']
for n in [19,20]:assert tg['P05-TG-'+str(n)]['no_revision_state_or_receipt_mutation']
assert tg['P05-TG-15']['wire_route_is_explicit_fixture_adapter'] and tg['P05-TG-17']['actual_new_node_process'] and tg['P05-TG-17']['pid_distinct'] and tg['P05-TG-17']['external_lifecycle_safety_still_fixture']
tlc={c['id']:c['detail'] for c in reports['topic-lifecycle']['checks']};assert tlc['P05-TLC-04']['padded_bytes']==16384 and tlc['P05-TLC-14']['actual_pg_final_credential_query_wait'] and tlc['P05-TLC-15']['actual_pg_credential_wait_before_private_enqueue'] and tlc['P05-TLC-16']['real_history_and_external_exclusions_retained']
ws={c['id']:c['detail'] for c in reports['ordinary-ws']['checks']}
for n in ['05','06','09']:
 d=ws['P05-OWS-'+n];assert d['observation_started_before_transition'] and d['actual_enqueue_boundary_observed'] and d['full_payload_sha_and_exact_acl_headers'] and d['distinct_enqueue_per_received_frame'] and d['baseline_private_frames_consumed']>0
 assert d['raw_unknown_private_frames']==d['forbidden_post_boundary_private_callbacks']==0 and d['received_full_window_private_frames']==d['received_known_pre_boundary_queued_frames']+d['received_fresh_pending_frames']
for n in ['05','06']:assert ws['P05-OWS-'+n]['post_boundary_private_callbacks']==0
assert ws['P05-OWS-09']['old_refs_enqueued']==0 and ws['P05-OWS-09']['received_fresh_pending_frames']>0 and ws['P05-OWS-09']['protected_ledger_exclusion']
assert ws['P05-OWS-10']['actual_pg_lock_wait'] and ws['P05-OWS-10']['actual_ordinary_privateDelivery_selected'] and ws['P05-OWS-10']['source_outage_during_final_credential_await'] and ws['P05-OWS-10']['no_private_after_wait'] and ws['P05-OWS-10']['specific_child_assertion_attribution'] is False
assert ws['P05-OWS-07']['ordinary_ws_close_code']==ws['P05-OWS-08']['ordinary_ws_closed']==4401
compat=reports['topic-compatibility'];cd={c['id']:c['detail'] for c in compat['checks']}
assert compat['full_process_restart'] is False and compat['production_server_cmd'] is False and compat['full_restore'] is False
assert cd['P05-COMPAT-01']['projection_count_before']>0 and cd['P05-COMPAT-01']['private_ref_count_before']>0
assert cd['P05-COMPAT-03']['projection_count_before']>0 and cd['P05-COMPAT-03']['private_ref_count_before']>0 and cd['P05-COMPAT-03']['projection_count_after']==cd['P05-COMPAT-03']['private_ref_count_after']==0
assert cd['P05-COMPAT-03']['actual_process_restart'] is False and cd['P05-COMPAT-03']['history_snapshot_retained']
for n,status,code in [('04',409,'TOPIC_SNAPSHOT_VERSION_UNSUPPORTED'),('05',503,'TOPIC_HISTORY_UNAVAILABLE')]:
 a=cd['P05-COMPAT-'+n];assert a['code']==code and a['start']=={'status':status,'code':code,'waiting_row_unchanged':True,'new_receipt_count':0}
assert cd['P05-COMPAT-06']['planned_rounds']==20 and cd['P05-COMPAT-06']['actual_http_start']
static=Path('.docs/implementation/reviews/p05/topic-compatibility-producer-round02/report.json');assert j(static)['status']=='STATIC_PRODUCER_PREFLIGHT_PASS'
for r in j(static)['producer_pins']:
 if Path(r['path']).name in ['integration.mjs','runner.mjs']:assert sha((ev/'engine2-topic-compatibility-preflight-01/producer'/Path(r['path']).name).read_bytes())==r['sha256']
assert inventory()==current
save('audit-result.json',{'schema_version':1,'status':'BOUNDED_FRESH_RUNTIME_EVIDENCE_AUDIT_PASS','source_identity':expected,'source_entries_verified':1811,'source_archive_sha256':zipsha,'indexed_artifacts_verified':sum(r['indexed_files'] for r in results),'actual_checks':72,'packets':results,'functional_reruns':0,'image_filesystem_rehash_performed':False,'terminal_exit_provenance':'parent observed same handles terminal0; archived terminal/report independently consistent','full_p05_pass':False,'no_old_PASS_transfer':True})
print(json.dumps({'status':'PASS','packets':6,'indexed_files':sum(r['indexed_files'] for r in results),'cases':72,'source':expected}))
