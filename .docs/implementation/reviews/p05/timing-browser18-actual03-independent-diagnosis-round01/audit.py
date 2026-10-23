from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,collections
r=Path(__file__).parent;p=Path('.docs/implementation/evidence/p05/timing-poll-browser18-chromium-actual03');run=p/'run';read=lambda f:json.loads(f.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((p/'INDEX.json').read_bytes())=='68987282f74c5bae68322ae6e4662dca571f7bc391e8c0b78fbd55ff37d2e2cf'
idx=read(p/'INDEX.json');assert len(idx['files'])==49
for f in idx['files']:
 b=(p/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
rawmap=read(p/'raw-path-map.json');assert len(rawmap)==40;runner=read(run/'runner.json');original=Path('.artifacts/p05')/runner['project']
for f in rawmap:
 b=(p/f['archived']).read_bytes();assert sha(b)==f['sha256'] and b==(original/f['original']).read_bytes()
before=read(run/'inputs-before.json');assert before==read(run/'inputs-after.json')
assert len(before['files'])==1823 and before['source_identity_sha256']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee'
assert runner['source_and_producer_unchanged'] and runner['cleanup']=='PASS' and runner['status']=='FAIL'
assert (run/'image-id.txt').read_text().strip()==runner['image']=='sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5'
pins=read(run/'producer-pins.json');assert len(pins)==10
for f,h in pins.items():assert sha((run/'producer'/(f+'.bytes' if f.endswith('.md') else f)).read_bytes())==h
rep=read(run/'topic-browser-report.json');failure=read(run/'failure-details.json');d=read(run/'delivery-metadata.json')
assert [x['status']for x in rep['records']]==['PASS']*5+['FAIL']+['NOT_RUN']*10
assert failure['message']=='OBSERVER_READY_DEADLINE' and failure['actual_fixture']['game_state']==failure['actual_fixture']['round_state']=='active' and failure['actual_fixture']['game_rev']==36
failed=rep['private_preparation'][-1];assert failed['control']=='advice-offer' and failed['status']=='FAILED' and failed['failed_readiness']['cycle_id']==48
assert failed['failed_readiness']['parts']==dict(own=True,target=True,conversation=True,chat=False,chat_required=True)
rows=[v for v in d['http']if v['locale']=='en'and v['started_native_ms']>113000]
chats=[v for v in rows if v['route']['kind']=='chat'];assert [v['id']for v in chats]==[555,575,591]
assert all(v['status']==200 and v['dto']['state']=='active' and v['dto']['error_code'] is None and v['validators']['chat'] is True for v in chats)
assert chats[1]['body_complete_native_ms']<failed['phase_deadline_monotonic_ms']<chats[2]['body_complete_native_ms']
edit,fill=rep['private_preparation'][-3:-1];assert edit['control']=='advice-edit' and fill['control']=='advice-input' and edit['status']==fill['status']=='READY'
assert fill['snapshot']['cycle_id']==46 and fill['snapshot']['deadline_monotonic_ms']>119406
assert all(v['response_status']==200 and v['result']=='EXACT_RECEIPT_VERIFIED' for v in rep['mutation_dispatches'])
assert rep['mutation_dispatches'][-1]['control']=='advice-accept'
for name in ['topic-games-panel.tsx','topic-state.ts','game-controls.ts']:
 f='apps/web/src/'+name;b=Path(f).read_bytes();assert sha(b)==before['files'][f];dest=r/'source'/f;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
timeline={'qualification':'Safe native/server DTO projections; no actual cache.accept or final input value was observed. Diagnostic HTTP cycle numbers73–75 differ from observer own-batch sequence46–48.','game_fixture':failure['actual_fixture'],'edit':edit,'fill':fill,'failed_offer':failed,'en_http_after113s':[{k:v.get(k)for k in ['id','route','cycle','started_native_ms','body_complete_native_ms','status','request_ui','response_ui','dto','validators']}for v in rows],'metadata_flags':{k:d[k]for k in ['status','observer_truncated','pending','diagnostic_errors','overflow']},'mutation_count':len(rep['mutation_dispatches']),'last_mutation':rep['mutation_dispatches'][-1],'unknown':['actual React cache.accept timestamps','final input value/editing state','per-iteration readiness/DOM decision history']}
(r/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n',encoding='utf-8')
out={'status':'DIAGNOSIS_COMPLETE_PREDICATE_MISMATCH_REPRODUCED_ACTUAL_FAIL_PRESERVED','at_utc':datetime.now(timezone.utc).isoformat(),'actual_children_verified':49,'raw_original_pairs':40,'source_entries_unchanged':1823,'producer_pins_verified':10,'cases':dict(collections.Counter(v['status']for v in rep['records'])),'cleanup_receipt':'PASS','en_chat_http_valid200_ids':[v['id']for v in chats],'last_chat_completed_after_deadline':True,'finding':'P05-BROWSER18-ACCEPTED-LEASE-001','product_defect_proven':False,'product_or_producer_writes':False,'docker_or_browser_run':False,'full_stage_pass':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
