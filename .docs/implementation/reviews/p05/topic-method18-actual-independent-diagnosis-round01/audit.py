from pathlib import Path
import json,hashlib,collections,shutil
from datetime import datetime,timezone
r=Path(__file__).parent;p=Path('.docs/implementation/evidence/p05/unified-method18-chromium-actual01');run=p/'run'
read=lambda f:json.loads(f.read_text(encoding='utf-8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((p/'INDEX.json').read_bytes())=='2b68eb2ca9649e6d334817960f10387e4770a87424d6778c1883fa7b3e95e472'
index=read(p/'INDEX.json');assert len(index['files'])==52
for f in index['files']:
 b=(p/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256'],f
paths=read(p/'raw-path-map.json');assert len(paths)==43
originalroot=Path('.artifacts/p05/venus-topic-browser-c27c248147e6')
for f in paths:
 a=(p/f['archived']).read_bytes();assert sha(a)==f['sha256']
 assert (originalroot/f['original']).read_bytes()==a,f['original']
before=read(run/'inputs-before.json');after=read(run/'inputs-after.json');assert before==after
freeze=read(Path('.artifacts/p05-unified-source-freeze01.json'))
assert before['files']==freeze['files'] and len(before['files'])==1819
assert before['source_identity_sha256']==freeze['identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
pins=read(run/'producer-pins.json');assert len(pins)==10
for f,h in pins.items():assert sha((run/'producer'/(f+'.bytes' if f.endswith('.md') else f)).read_bytes())==h
runner=read(run/'runner.json');report=read(run/'topic-browser-report.json');failure=read(run/'failure-details.json');delivery=read(run/'delivery-metadata.json')
assert runner['status']=='FAIL' and runner['cleanup']=='PASS' and runner['source_and_producer_unchanged'] is True
assert (run/'image-id.txt').read_text().strip()==runner['image']=='sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5'
assert [v['status'] for v in report['records']]==['PASS']*7+['FAIL']+['NOT_RUN']*8
assert failure['actual_fixture']['game_state']=='paused' and failure['actual_fixture']['round_state']=='stopped' and failure['actual_fixture']['game_rev']==40
assert failure['message']=='OBSERVER_READY_DEADLINE'
assert len(report['mutation_dispatches'])==84
assert all(v['result']=='EXACT_RECEIPT_VERIFIED' and v['response_status']==200 for v in report['mutation_dispatches'])
assert not any(v['control']=='action-accept' for v in report['mutation_dispatches'] if v['click_started_monotonic_ms']>250000)
failed=report['private_preparation'][-1];assert failed['control']=='action-accept' and failed['failed_readiness']['reason']=='BATCH_INCOMPLETE'
assert failed['failed_readiness']['parts']==dict(own=True,target=False,conversation=False,chat=False,chat_required=False)
assert len(report['private_setup_sessions'])==2
sourcepins={}
for file,src in [('apps/api/src/room-routes.ts',r/'room-routes.actual18.ts.bytes'),('apps/api/src/topic-games.ts',Path('.docs/implementation/reviews/p05/unified-private-chat-author-round01/source/apps/api/src/topic-games.ts')),('apps/api/src/rooms.ts',Path('apps/api/src/rooms.ts')),('apps/api/src/topic-content-availability.ts',Path('apps/api/src/topic-content-availability.ts')),('packages/relationship-engine/src/consent.ts',Path('packages/relationship-engine/src/consent.ts')),('apps/web/src/room-shell.tsx',Path('apps/web/src/room-shell.tsx'))]:
 b=src.read_bytes();assert sha(b)==freeze['files'][file],file
 dest=r/'source'/file;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);sourcepins[file]=sha(b)
timeline={
 'clock_qualification':'Native performance clock and fixture server clock have different origins; no fixed native255+30 expiry inference. Server-time fields are authoritative for deadlines.',
 'late_mutations':[{k:v.get(k) for k in ['locale','control','kind','scope','click_started_monotonic_ms','request_observed_monotonic_ms','result','response_status']} for v in report['mutation_dispatches'] if v['click_started_monotonic_ms']>245000],
 'late_ru_http':[{k:v.get(k) for k in ['locale','route','started_native_ms','body_complete_native_ms','status','dto']} for v in delivery['http'] if v['locale']=='ru' and v['route']['kind']!='current' and 270000<v['started_native_ms']<294000],
 'last_pongs':[{k:v.get(k) for k in ['locale','received_native_ms','type']} for v in delivery['ws'] if v['type']=='pong' and v['received_native_ms']>280000],
 'first_rev40':[{k:v.get(k) for k in ['locale','received_native_ms','type','room_rev','payload_scope']} for v in delivery['ws'] if v['type']=='game.snapshot' and v.get('payload_scope',{}).get('rev')==40][:3],
 'failed_action_preparation':failed,'actual_fixture':failure['actual_fixture'],
 'action_phases':report['action_preparation_phases'],'topic_phases':report['topic_preparation_phases'][-3:],
 'unknown':['server pause_reason','DB heartbeat and presence transitions','server WS close/reconnect reason and generation','exact transaction dispatch/fence that first expired','actual poll service time/backlog depth'],
}
(r/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n',encoding='utf-8')
result={'status':'PASS_INDEPENDENT_DIAGNOSIS_INPUT_AUDIT_NOT_STAGE_PASS','at_utc':datetime.now(timezone.utc).isoformat(),'actual_index_sha256':sha((p/'INDEX.json').read_bytes()),'children_verified':52,'original_raw_byte_matches':43,'source_entries_unchanged':1819,'producer_pins_verified':10,'source_pins':sourcepins,'case_counts':dict(collections.Counter(v['status'] for v in report['records'])),'mutation_receipts_200':84,'cleanup_receipt':'PASS','browser_version':report.get('browser_version'),'qualification':'Read-only archived actual inspection and finite source model; no Docker/browser rerun, no product modifications, no full stage acceptance.'}
(r/'audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
