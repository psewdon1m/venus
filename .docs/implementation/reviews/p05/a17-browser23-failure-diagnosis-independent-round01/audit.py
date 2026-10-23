from pathlib import Path
import json,hashlib,shutil
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
raw=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-topic-browser-1d8e57e097d5'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
sha=lambda b:hashlib.sha256(b).hexdigest();pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
report=read(raw/'topic-browser-report.json');failure=read(raw/'failure-details.json');delivery=read(raw/'delivery-metadata.json');runner=read(raw/'runner.json')
assert [r['status'] for r in report['records']]==['PASS']*8+['FAIL']+['NOT_RUN']*7
assert report['records'][8]['id']=='P05-TB-09' and report['cleanup']=='PASS' and report['page_errors']==[]
assert runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['source_and_producer_unchanged']
f=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json')
before=read(raw/'inputs-before.json');after=read(raw/'inputs-after.json');assert before==after and before['files']==f['files']
assert before['source_identity_sha256']==runner['source_identity']==runner['source_identity_after']==f['identity']
ackpath=R/'.artifacts/p05-browser23-a17-root-ack01.json';ack=read(ackpath)
assert ack['status']=='ROOT_RUN_ACK' and ack['source_identity']==f['identity'] and ack['image']==runner['image']
assert ack['rebinding_review_index_sha256']=='8810dede69eaf9fcea3eddfe6d0d0c11e1deaef86d83f73de992bb142d39b3c0'
assert sha(Path(ack['rebinding_review_index']).read_bytes())==ack['rebinding_review_index_sha256']
assert sha((R/'.artifacts/p05-browser23-a17-run01.mjs').read_bytes())==ack['runner_sha256']
pins=read(raw/'producer-pins.json')
for name,h in pins.items():
 assert sha((raw/'producer'/name).read_bytes())==h
 assert sha((R/'.artifacts/p05-private-batch-browser-producer23'/name).read_bytes())==h
for name,h in ack['runtime_pins'].items():assert pins[name]==h
assert (raw/'image-id.txt').read_text().strip()==ack['image']
assert read(R/'.artifacts/p05-browser23-a17-run01.exit.json')['exit_code']==1
for n in ['remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:assert (raw/n).read_bytes()==b''
action=report['action_preparation_phases'][-1];mutation=report['mutation_dispatches'][-1]
assert action['status']=='READY' and [a['game_rev'] for a in action['actors']]==[40,41]
assert mutation['control']=='game-condition-submit' and mutation['locale']=='ru' and mutation['response_status']==409
assert mutation['domain_error_code'] is None and mutation['domain_error_code_unlisted'] is True
assert mutation['readiness']['ready'] and mutation['readiness']['observer_model_only'] and not mutation['readiness']['cache_accept_observed']
assert mutation['request_observed_monotonic_ms']<mutation['readiness']['deadline_monotonic_ms']
actual=failure['actual_fixture'];secondary=failure['actors'][0]
assert secondary['locale']=='ru' and secondary['last_ui_game']['game_rev']==secondary['last_ui_self_actions']['game_rev']==40
assert secondary['last_ui_game']['round_state']=='pending' and secondary['last_ui_self_actions']['round_actions']['propose_condition']
assert actual['game_rev']==41 and actual['round_state']=='active'
assert secondary['member_id'] in actual['actors'] and secondary['member_id']!=actual['primary_member_id']
assert delivery['status']=='COMPLETE' and delivery['diagnostic_errors']==delivery['pending']==0 and not delivery['observer_truncated']
assert delivery['failure_counts']=={'HTTP_BODY':0,'VALIDATOR':0,'WS_PARSE':0}
emission=mutation['request_observed_monotonic_ms']
currents=[x for x in delivery['http'] if x['locale']=='ru' and x['route']['kind']=='current' and x.get('dto',{}).get('session')==actual['session_id']]
pre=[x for x in currents if x.get('body_complete_native_ms',float('inf'))<emission]
post=[x for x in currents if x.get('dto',{}).get('rev')==41]
lastpre=max(pre,key=lambda x:x['body_complete_native_ms']);assert lastpre['dto']['rev']==40
first41=min(post,key=lambda x:x['response_native_ms']);assert first41['response_native_ms']>emission
ws=[x for x in delivery['ws'] if x['locale']=='ru' and (x.get('payload_scope') or {}).get('session')==actual['session_id'] and (x.get('payload_scope') or {}).get('rev')==41]
assert ws and min(x['received_native_ms'] for x in ws)>emission
# The passive HTTP observer intentionally captures only GET scope metadata.
assert all(x['method']=='GET' for x in delivery['http'])
out_raw=O/'raw';out_raw.mkdir(exist_ok=True)
for n in ['topic-browser-report.json','failure-details.json','delivery-metadata.json','runner.json','browser-tests.txt','compose-cleanup.txt','remaining-containers.txt','remaining-networks.txt','remaining-volumes.txt']:
 shutil.copyfile(raw/n,out_raw/n)
for n in ['p05-browser23-a17-run01.txt','p05-browser23-a17-run01.exit.json']:shutil.copyfile(R/'.artifacts'/n,out_raw/n)
rawpins={str(p.relative_to(raw)).replace('\\','/'):pin(p) for p in sorted(raw.rglob('*')) if p.is_file()}
(O/'RAW-PINS.json').write_text(json.dumps({'raw_root':str(raw),'files':rawpins,'root_ACK':pin(ackpath)},indent=2)+'\n',encoding='utf-8')
source_paths=['apps/api/src/topic-games.ts','apps/api/src/topic-game-routes.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/game-copy.ts']
source_pins={n:f['files'][n] for n in source_paths}
for n,h in source_pins.items():assert sha((R/'.artifacts/p05-pilot-bundle-source14'/n).read_bytes())==h
result={'status':'RETAINED_NATIVE_FAIL_WITH_CONFIRMED_METHOD_PREPARATION_GAP_APPLICATION_CAUSE_NOT_PROVED',
 'source_identity':f['identity'],'image':runner['image'],'root_ACK':pin(ackpath),'counts':{'PASS':8,'FAIL':1,'NOT_RUN':7},'cleanup':'PASS_EMPTY_OWNED',
 'failure_control':'game-condition-submit','response_status':409,'observed_error_code':None,'observed_error_code_unlisted':True,'observed_request_expected_rev':None,
 'action_final_receipt_rev':41,'secondary_passive_current_and_actions_rev':40,'fixture_rev':41,'fixture_round_state':'active',
 'action_phase_finished_ms':action['finished_monotonic_ms'],'condition_dispatch_ms':emission,
 'dispatch_after_final_phase_ms':emission-action['finished_monotonic_ms'],'last_secondary_current_before_dispatch':{'rev':40,'started_ms':lastpre['started_native_ms'],'response_ms':lastpre['response_native_ms']},
 'first_retained_secondary_current41_response_ms':first41['response_native_ms'],'first_retained_secondary_WS41_ms':min(x['received_native_ms'] for x in ws),
 'code_inference':'REVISION_CONFLICT and expected_rev40 strongly fit source/order; exact request/response body and direct React revision are not retained.',
 'confirmed_setup_gap':'acceptActionsUi returns final minRev41 after host/backend coherence; case09 discards it, prepares from secondary observed40, without post-consent secondary minRev barrier.',
 'recommendation':'Retain committed minRev and require existing bounded normalPrivateReady for exact secondary/session/round/minRev before editing and submitting; preserve intended value/deadline/exact200/no retry checks.',
 'source_pins':source_pins,'producer_files_verified':len(pins),'diagnostic_tail_overflows':delivery['overflow'],'safe_projection_only':True,'native_actions':0,'APP_edits':False}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:result[k] for k in ['status','counts','cleanup','action_final_receipt_rev','secondary_passive_current_and_actions_rev','condition_dispatch_ms','observed_error_code','observed_request_expected_rev']}))
