from pathlib import Path
import json,hashlib,collections,shutil,sys,re
r=Path('C:/.projects/venus');o=Path(__file__).parent;s=r/'.artifacts/p05-pilot-bundle-source15';raw=s/'.artifacts/p05/venus-topic-browser-de8366c9d2b9';pins={};sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':sha(b)};return b
def js(p):return json.loads(read(p))
q=js(raw/'topic-browser-report.json');d=js(raw/'delivery-metadata.json');runner=js(raw/'runner.json');ackpath=r/'.artifacts/p05-browser26-a18-root-ack01.json';ack=js(ackpath)
assert sha(read(ackpath))=='e12f4b02fb73490ad6d7d0791457fd598543acf4e63515eb1b32af57e3f68c67'
assert ack['status']=='ROOT_RUN_ACK' and ack['independent_review_index_sha256']=='5428a7321f04a9dfd660fc9b5476941a568991d1e45ef64e44456ba946a36a00'
assert sha(read(r/'.artifacts/p05-browser26-a18-run01.mjs'))==ack['runner_sha256']=='2036d8b31aa2f1feb2084a94bfc28c84b2e18dff9d77dc5e56f67dce8599e870'
for key in ['independent_review_index','rebinding_review_index','image_receipt','application_review_index']:assert sha(read(Path(ack[key])))==ack[key+'_sha256']
assert ack['rebinding_review_index_sha256']=='6ba12785c55f5cdb547717902a4a397794fee3899f58d1ba909d3afa7a24cd5d'
for path,h in ack['application_reviews'].items():assert sha(read(Path(path)))==h
exit=js(r/'.artifacts/p05-browser26-a18-run01.exit.json');assert exit['exit_code']==0
assert runner['status']=='PASS' and runner['cleanup']=='PASS' and runner['error'] is None and runner['source_and_producer_unchanged']
assert runner['project']==raw.name and q['status']==q['cleanup']=='PASS'
ids=['P05-TB-'+str(i).zfill(2) for i in range(1,17)]
names=['HTTPS-three-contexts','adult18-ui-admission','own-settings-isolation','questions-private-invitation','bilateral-topic-no-early-prompt','structured-advice-edit-revoke','epoch-chat-other-question','truth-dare-new-topic-action-finish','yes-but-condition-fresh-consent','own-pause-resume','websocket-disconnect-safety','native-elapsed-wall-rollback','source-outage-safety','held-response-new-epoch','permanent-exclusion-own-only','final-real-storage-summary']
assert [x['id'] for x in q['records']]==ids and [x['name'] for x in q['records']]==names and all(x['status']=='PASS' for x in q['records'])
assert not q['page_errors'] and not q.get('failure') and not q.get('failure_details')
for key in ['page_errors_overflow','request_metadata_overflow','private_ticket_failure_overflow','topic_readiness_overflow']:assert not q.get(key,False)
assert not q.get('private_ticket_failures',[])
f=js(r/'.artifacts/p05-pilot-bundle-source-freeze15.json');before=js(raw/'inputs-before.json');after=js(raw/'inputs-after.json')
assert before==after and before['files']==f['files'] and len(before['files'])==1872
assert before['source_identity_sha256']==runner['source_identity']==runner['source_identity_after']==ack['source_identity']==f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'
for path,h in f['files'].items():assert sha((s/path).read_bytes())==h,path
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
current=inventory();assert current==f['files'] and identity(current)==f['identity']
assert ack['image']==runner['image']==read(raw/'image-id.txt').decode().strip()=='sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616'
receipt=js(Path(ack['image_receipt']));assert receipt['source_identity']==f['identity'] and receipt['image']==runner['image'] and receipt['included_files']==1872
runtime=js(raw/'producer-pins.json');assert len(runtime)==9 and runtime==ack['runtime_pins']
for name,h in runtime.items():assert sha(read(raw/'producer'/name))==h==sha(read(r/'.artifacts/p05-private-batch-browser-producer26'/name))
digest=sha(('\n'.join(n+' '+h for n,h in sorted(runtime.items()))+'\n').encode());assert digest=='0c5cb34b10d3fa57d2fc400c472149da4bd847b30450d300362ed4b6c47ae3ba'
fixture=js(raw/'fixture-diff.json');original=read(raw/'harness-original.mjs');derivative=read(raw/'harness-derivative.mjs')
assert sha(original)==fixture['original_sha256']==f['files']['tests/p05-topic-lifecycle/harness.mjs']
transformed=original
for change in fixture['exact_semantic_replacements']:
 b=change['before'].encode();assert transformed.count(b)==1;transformed=transformed.replace(b,change['after'].encode())
assert len(fixture['exact_semantic_replacements'])==2 and transformed==derivative and sha(derivative)==fixture['derivative_sha256'] and q['fixture']==fixture
assert fixture['synthetic_source_only'] and not fixture['production_approval'] and q['synthetic_fixture_only'] and not q['production_approval'] and not q['real_devices'] and not q['full_matrix']
assert d['status']==q['delivery_diagnostics']['status']=='COMPLETE' and not d['observer_truncated']
assert d['pending']==d['diagnostic_errors']==d['cancelled_observers']==d['native_body_cancellations']==d['unknown_ws_types']==0
assert d['failure_counts']=={'HTTP_BODY':0,'VALIDATOR':0,'WS_PARSE':0}
assert d['overflow']==q['delivery_diagnostics']['overflow']=={'http':1467,'ws':1317,'observer_work':0,'conversation':0}
assert len(d['http'])==1024 and len(d['ws'])==256 and not d['validator_proof']['cache_accept_observed'] and not d['validator_proof']['react_auth_boundary_observed']
mut=q['mutation_dispatches'];assert len(mut)==260 and all(x['result']=='EXACT_RECEIPT_VERIFIED' and x['response_status']==200 for x in mut)
assert len(mut)<=2048 and len(q['request_metadata'])<=2048
assert len(q['private_preparation'])==112 and all(x['status']=='READY' for x in q['private_preparation'])
assert len(q['topic_readiness'])==50 and all(x['result']=='READY' and x['same_observation'] and x['own_scope_matches'] and all(x['dom'].values()) for x in q['topic_readiness'])
assert len(q['topic_preparation_phases'])==39 and all(x['status']=='READY' and not x['failed_actors'] and set(x['expected_actors'])==set(x['completed_actors']) and x['elapsed_ms']<x['budget_ms']==8000 for x in q['topic_preparation_phases'])
assert len(q['action_preparation_phases'])==5
for x in q['action_preparation_phases']:assert x['status']=='READY' and x['finished_monotonic_ms']<x['deadline_monotonic_ms'] and x['budget_ms']==12000
for x in mut:
 if x.get('readiness'):
  v=x['readiness'];assert v['ready'] and not v['observer_overflow'] and v['pending_observers']==v['body_errors']==0 and v['observer_model_only'] and not v['cache_accept_observed']
  assert x['request_observed_monotonic_ms']<v['deadline_monotonic_ms']<=v['phase_deadline_monotonic_ms']
assert len(q['advice_mutation_receipts'])==5 and all(x['expected_tuple_verified'] for x in q['advice_mutation_receipts'])
assert [x['kind'] for x in q['advice_mutation_receipts']]==['offer_advice','respond_advice','offer_advice','respond_advice','revoke_advice']
conditions=[x for x in mut if x['control']=='game-condition-submit'];assert len(conditions)==2
second=conditions[-1];prep=[x for x in q['private_preparation'] if x['control'] in ['game-condition-input','game-condition-submit'] and conditions[0]['request_observed_monotonic_ms']<x['started_monotonic_ms']<second['request_observed_monotonic_ms']]
assert len(prep)==2 and prep[0]['phase_deadline_monotonic_ms']==prep[1]['phase_deadline_monotonic_ms']==second['readiness']['phase_deadline_monotonic_ms'] and 0<prep[0]['phase_deadline_monotonic_ms']-prep[0]['started_monotonic_ms']<=8000
post=[x for x in q['request_metadata'] if x['phase']=='yes-but-condition-fresh-consent'];last=max(i for i,x in enumerate(post) if x['path'].endswith('/condition'));following=post[last+1:]
assert [x['kind'] for x in following[:4]]==['respond_topic','respond_topic','accept','accept'] and following[4]['path'].endswith('/finish') and all(x['status']==200 for x in following)
details=[x['detail'] for x in q['records']]
for k in ['https_loopback','three_isolated_contexts','real_react_dom']:assert details[0][k]
assert details[0]['locales']==['ru','en','tr'] and details[1]['adult_rows']==3 and details[1]['distinct_browser_sessions'] and details[1]['explicit_both_checkboxes']
assert all(c['secure'] and c['httpOnly'] and c['sameSite']=='Strict' and 'value' not in c for a in details[1]['cookie_descriptors'] for c in a['cookies'])
assert details[2]['own_allow_isolation'] and details[3]['observer_private_empty'] and details[4]['zero_and_one_accept_no_prompt'] and details[4]['both_accept_localized_prompt'] and details[4]['observer_no_private_projection']
assert details[5]['exact_advice_receipts']==5 and details[5]['recipient_no_early_preview'] and details[5]['edit_new_optin'] and details[5]['revoke_cleared']
assert details[6]['real_epoch_chat'] and details[6]['other_question_clears_before_fresh_bilateral_accept']
assert details[7]['primary_choice_ui'] and details[7]['requires_action_consent'] and details[7]['primary_finish_ui']
assert details[8]['secondary_condition_edit'] and details[8]['fresh_topic_and_action_consent'] and details[8]['requires_action_consent'] and not details[8]['preaccepted_action_validated'] and details[8]['primary_finish_ui']
assert all(details[9].values()) and details[10]['actual_ws_disconnect'] and details[10]['own_safety_remains'] and details[10]['actual_stop']
clock=details[11];assert all(clock[k] for k in ['native_performance_unmodified','no_virtual_timers','real_http_responses_buffered','ws_alive_and_no_game_transport_errors'])
assert len(clock['elapsed'])==2 and all(x['native_elapsed_ms']>=6000 and x['wall_delta_ms']<-3500000 for x in clock['elapsed'])
assert details[12]['actual_declared_source_fixture_fault'] and details[12]['production_catalog_outage_continuity_not_proven'] and details[12]['source_independent_stop']
held=details[13];assert all(held[k] for k in ['held_real_backend_private_prompt','released_after_new_epoch','late_read_no_old_prompt_advice_chat','new_epoch'])
assert len(held['private_payload_hashes'])==2 and all(re.fullmatch('[0-9a-f]{64}',h) for h in held['private_payload_hashes'])
released=[x for x in q['transport'] if x['kind']=='released_real_backend_response' and x.get('private_payload') and not x['aborted']]
assert {x['body_sha256'] for x in released}==set(held['private_payload_hashes']) and all(x['status']==200 and x['epoch']==held['old_epoch'] for x in released)
assert all(details[14].values()) and details[15]['actual_pg_external_lifecycle'] and details[15]['keyboard_tab_smoke'] and not details[15]['full_keyboard_matrix']
assert {k:int(v) for k,v in details[15]['counts'].items()}=={'births':1,'members':3,'own_preferences':3,'adult_acceptances':3}
assert len(q['private_setup_sessions'])==8 and all(x['attempt']==1 and x['max_sessions']==3 and x['round_bound']==20 and x['outcome']=='PRIVATE_SELECTED' for x in q['private_setup_sessions'])
events=[]
for line in read(raw/'browser-tests.txt').decode('utf8').splitlines():
 try:events.append(json.loads(line))
 except json.JSONDecodeError:pass
assert [x['id'] for x in events if x.get('status')=='PASS' and x.get('id','').startswith('P05-TB-')]==ids
assert events[-1]['status']==events[-1]['cleanup']=='PASS' and events[-1]['executed']==events[-1]['planned']==16
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:assert read(raw/n)==b''
assert len(q['screenshots'])==24 and len({x['file'] for x in q['screenshots']})==24
for x in q['screenshots']:assert read(raw/x['file']).startswith(b'\x89PNG\r\n\x1a\n')
for path in sorted(raw.rglob('*')):
 if path.is_file():read(path)
read(r/'AGENTS.md');read(r/'.docs/implementation/reviews/p05/a17-browser24-actual-independent-round01/INDEX.json')
export=o/'raw';export.mkdir(exist_ok=True)
for n in ['runner.json','browser-tests.txt','compose-cleanup.txt','fixture-diff.json','remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:
 b=read(raw/n);(export/n).write_bytes(b)
for n in ['p05-browser26-a18-run01.txt','p05-browser26-a18-run01.exit.json']:(export/n).write_bytes(read(r/'.artifacts'/n))
safe={'project':raw.name,'counts':{'PASS':16,'FAIL':0,'NOT_RUN':0},'records':q['records'],'delivery_diagnostics':q['delivery_diagnostics'],'native_clock':clock,'private_old_epoch_release_hashes':held['private_payload_hashes'],'exact_mutation_receipts':260,'advice_receipts':5,'private_preparations_READY':112,'topic_readiness_READY':50,'topic_phases_READY':39,'action_phases_READY':5,'second_condition_shared_deadline_ms':prep[0]['phase_deadline_monotonic_ms'],'second_condition_dispatch_ms':second['request_observed_monotonic_ms'],'full_private_HTTP_bodies_archived':False}
(o/'SAFE_PROOF.json').write_text(json.dumps(safe,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n')
out={'status':'PASS_COMPONENT_ONLY','source_identity':f['identity'],'included_files':1872,'image':runner['image'],'project':raw.name,'runtime_count':9,'runtime_digest':digest,'count':16,'records':16,'counts':{'PASS':16,'FAIL':0,'NOT_RUN':0},'root_exit':0,'cleanup':'PASS','source_and_producer_before_after_exact':True,'current_source_verified':True,'method_review_sha256':ack['independent_review_index_sha256'],'ACK_sha256':sha(read(ackpath)),'source_backend_binding_qualification_sha256':ack['rebinding_review_index_sha256'],'diagnostic_status':'COMPLETE','diagnostic_errors':0,'pending':0,'cancelled_observers':0,'native_body_cancellations':0,'observer_truncated':False,'bounded_history_evictions':d['overflow'],'exact_mutation_receipts':260,'request_metadata':len(q['request_metadata']),'native_clock_ms':[x['native_elapsed_ms'] for x in clock['elapsed']],'private_payload_archival':'NONE_RAW_HTTP_BODIES_NOT_ARCHIVED','synthetic_fixture_only':True,'engine':'chromium','browser_version':q['browser_version'],'locales':['ru','en','tr'],'findings':[],'native_actions':0,'APP_producer_ACK_Git_edits':False,'full_layout_or_stage_PASS':False}
(o/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out))
