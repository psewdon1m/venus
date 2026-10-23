from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,collections
r=Path(__file__).parent;p=Path('.docs/implementation/evidence/p05/timing-poll-browser20-chromium-actual01');run=p/'run';read=lambda f:json.loads(f.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((p/'INDEX.json').read_bytes())=='1521e7b6f94e12d9e8627a4d338cc45bedb2d9c5539d10e66073df04adcc18ed';idx=read(p/'INDEX.json');assert len(idx['files'])==51
for f in idx['files']:
 b=(p/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
runner=read(run/'runner.json');rawmap=read(p/'raw-path-map.json');original=Path('.artifacts/p05')/runner['project']
for f in rawmap:
 b=(p/f['archived']).read_bytes();assert sha(b)==f['sha256'] and b==(original/f['original']).read_bytes()
before=read(run/'inputs-before.json');assert before==read(run/'inputs-after.json') and len(before['files'])==1823 and before['source_identity_sha256']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee'
assert runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['source_and_producer_unchanged']
assert (run/'image-id.txt').read_text().strip()==runner['image']=='sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5'
pins=read(run/'producer-pins.json');assert len(pins)==10
for f,h in pins.items():assert sha((run/'producer'/(f+'.bytes' if f.endswith('.md')else f)).read_bytes())==h
assert pins['private-batch-observer.mjs']=='adc56af2e11c684fc8839b19f1c4f064424278a8697c5b2592c42ba400f5adb0'
rep=read(run/'topic-browser-report.json');failure=read(run/'failure-details.json');delivery=read(run/'delivery-metadata.json')
assert [v['status']for v in rep['records']]==['PASS']*6+['FAIL']+['NOT_RUN']*9
assert failure['actual_fixture']['game_rev']==39 and failure['actual_fixture']['game_state']==failure['actual_fixture']['round_state']=='active'
failed=rep['private_preparation'][-1];assert failed['control']=='action-accept' and failed['failed_readiness']['reason']=='MODEL_REJECTED' and failed['failed_readiness']['complete'] is True
assert failed['failed_readiness']['http']==dict(own=200,target=200,conversation=200,chat=200)
batch=[v for v in delivery['http']if v['locale']=='tr' and v['cycle']==69];parts={v['route']['kind']:v for v in batch};assert set(parts)=={'current','self-actions','target','conversation','chat'}
assert all(v['status']==200 for v in batch)
own=parts['self-actions'];last=parts['chat'];duration=5000;elapsed=last['body_complete_native_ms']-own['started_native_ms'];until=own['started_native_ms']+duration
assert own['dto']['server_relative_ms']==duration and elapsed>duration
assert parts['target']['validators']['request_ui'] and parts['conversation']['validators']['request_ui'] and last['validators']['chat']
timeline={'batch69':batch,'observer_failed':failed,'last_first_actor_receipt':rep['mutation_dispatches'][-1],'actual_fixture':failure['actual_fixture'],'sufficient_expiry_constraint':{'own_started_native_ms':own['started_native_ms'],'own_permission_duration_ms':duration,'latest_possible_lease_until_ms':until,'last_chat_complete_native_ms':last['body_complete_native_ms'],'batch_elapsed_ms':elapsed,'already_expired_by_ms':last['body_complete_native_ms']-until},'qualification':'Safe projected DTOs and source inequality. Actual model internal floors and first return branch are not recorded; expiry alone suffices to guarantee rejection. Actual React cache.accept not observed.'}
(r/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n',encoding='utf-8')
for file in ['apps/web/src/topic-state.ts','apps/web/src/topic-games-panel.tsx','apps/api/src/topic-games.ts']:
 b=Path(file).read_bytes();assert sha(b)==before['files'][file];dest=r/'source'/file;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
out={'status':'DIAGNOSIS_COMPLETE_CORRECT_EXPIRED_BATCH_REJECTION_ACTUAL_FAIL_PRESERVED','at_utc':datetime.now(timezone.utc).isoformat(),'children_verified':51,'raw_original_matches':len(rawmap),'source_entries_unchanged':1823,'runtime_pins_verified':10,'cases':dict(collections.Counter(v['status']for v in rep['records'])),'cleanup':'PASS','primary_sufficient_reason':'FINAL_BATCH_EXCEEDS_UNCHANGED5S_OWN_PERMISSION','batch_elapsed_ms':elapsed,'overrun_ms':elapsed-duration,'new_predicate_bug_proven':False,'localized_app_defect':'NOT_YET_LOCALIZED; observed app read freshness feasibility failure','new_Docker_or_browser_run':False,'full_stage_pass':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
