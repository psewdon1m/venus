"""Readonly independently derived actual08 timeline, exact inputs and source pins."""
from pathlib import Path
import hashlib
import json
import datetime

ROOT=Path.cwd()
OUT=Path(__file__).resolve().parent
EVIDENCE=ROOT/'.docs/implementation/evidence/p05/method12-chromium-preflight-01'
RUN=EVIDENCE/'run'
def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def save(name,value):
    (OUT/name).write_text(json.dumps(value,indent=2)+'\n',encoding='utf-8')
assert sha(EVIDENCE/'INDEX.json')=='bacb33c162d316a2ae7b495a3b2196c1f6f67e32f7840af845286ddc9b24c955'
index=json.loads((EVIDENCE/'INDEX.json').read_text(encoding='utf-8'))
assert len(index['files'])==45
for row in index['files']:
    assert sha(EVIDENCE/row['path'])==row['sha256'],row['path']
    assert (EVIDENCE/row['path']).stat().st_size==row['bytes']
before=json.loads((RUN/'inputs-before.json').read_text(encoding='utf-8'))
after=json.loads((RUN/'inputs-after.json').read_text(encoding='utf-8'))
assert before==after
assert before['source_identity_sha256']==index['source_identity']
assert len(before['files'])==1813
source_names=['apps/api/src/topic-games.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts','packages/relationship-engine/src/consent.ts','packages/relationship-engine/src/types.ts','packages/relationship-engine/src/pack.ts']
source_pins={name:sha(ROOT/name) for name in source_names}
for name,digest in source_pins.items():
    assert before['files'][name]==digest,name
report=json.loads((RUN/'topic-browser-report.json').read_text(encoding='utf-8'))
delivery=json.loads((RUN/'delivery-metadata.json').read_text(encoding='utf-8'))
failure=json.loads((RUN/'failure-details.json').read_text(encoding='utf-8'))
assert [r['status'] for r in report['records']]==['PASS']*7+['FAIL']+['NOT_RUN']*8
assert report['cleanup']=='PASS'
assert failure['actual_fixture']['round_state']=='skipped'
round_id=failure['actual_fixture']['round_id']
session_id=failure['actual_fixture']['session_id']
events=[]
for number,row in enumerate(report['mutation_dispatches']):
    if row['click_started_monotonic_ms']>212000:
        events.append({'source_json_pointer':f'/mutation_dispatches/{number}','kind':'actual_ui_mutation','locale':row['locale'],'control':row['control'],'scope':row.get('scope'),'request_observed_monotonic_ms':row.get('request_observed_monotonic_ms'),'result':row['result'],'deadline_monotonic_ms':row.get('readiness',{}).get('deadline_monotonic_ms') if row.get('readiness') else None})
selected=[]
previous={}
for number,row in enumerate(delivery['http']):
    if row['started_native_ms']<216000:
        continue
    dto=row.get('dto') or {}
    if row['route']['kind']=='target' and row['route']['round']==round_id and row['locale'] in ['en','tr']:
        action=dto.get('action')
        key=(dto.get('rev'),action and action.get('state'),action and action.get('own_state'),action and action.get('expires_at'),row['status'])
        if previous.get(row['locale'])!=key:
            selected.append({'pointer':f'/http/{number}','id':row['id'],'locale':row['locale'],'kind':'target_transition','started_native_ms':row['started_native_ms'],'body_complete_native_ms':row['body_complete_native_ms'],'status':row['status'],'rev':dto.get('rev'),'action':action,'invitation':dto.get('invitation')})
        previous[row['locale']]=key
    if row['route']['kind']=='self-actions' and 248000<row['started_native_ms']<258000:
        selected.append({'pointer':f'/http/{number}','id':row['id'],'locale':row['locale'],'kind':'own_near_action_expiry','started_native_ms':row['started_native_ms'],'body_complete_native_ms':row['body_complete_native_ms'],'rev':dto.get('rev'),'server_time':dto.get('server_time'),'expires_at':dto.get('expires_at'),'conversation_actions':dto.get('conversation_actions')})
first_action=next(row for row in events if row['control']=='action-accept')
assert first_action['result']=='EXACT_RECEIPT_VERIFIED'
assert len([row for row in events if row['control']=='action-accept'])==1
last_actions=[row for row in report['request_metadata'] if row['phase']=='truth-dare-new-topic-action-finish' and row.get('scope')=='action']
assert len(last_actions)==1 and last_actions[0]['status']==200
action_targets=[r for r in selected if r['kind']=='target_transition' and r['rev']==28 and r['action']]
assert {r['action']['expires_at'] for r in action_targets}=={'1970-01-01T00:20:55.653Z'}
final_actors=[]
for a in failure['actors']:
    assert a['last_ui_game']['game_rev']==32
    assert a['last_ui_game']['round_state']=='skipped'
    assert a['last_ui_self_actions']['round_actions']['accept_action'] is False
    final_actors.append({'locale':a['locale'],'game_rev':32,'round_state':'skipped','accept_action':False,'live_websockets':a['ws_live']})
save('inputs.json',{'status':'PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'evidence_index_sha256':sha(EVIDENCE/'INDEX.json'),'evidence_files_verified':45,'source_identity':index['source_identity'],'included_files':1813,'before_after_equal':True,'source_pins':source_pins,'image':index['image'],'source_paths_unchanged':True,'screenshots':['run/chromium-en-failure.png','run/chromium-tr-failure.png']})
save('timeline.json',{'status':'ANALYSIS_OF_ACTUAL_FAIL_NOT_NEW_RUN','scope':{'session':session_id,'round':round_id},'actual_mutations':events,'selected_delivery_rows':selected,'topic_phases':[row for row in report['topic_preparation_phases'] if row['started_monotonic_ms']>212000],'final_actor_states':final_actors,'dispatch_count_action_accept':1,'case08_elapsed_ms':report['records'][7]['elapsed_ms'],'limitations':'HTTP ring overflow172/WS ring overflow432 are documented; latest exact target/own/actual mutation records retained. No raw HTTP bodies/internal React cache observed; request times are Node observer times.'})
print(json.dumps({'status':'PASS','evidence_files':45,'actual_action_accept_count':1,'case08':'FAIL','classification':'PENDING_ACTION_DEADLINE_EXHAUSTED_DURING_SERIAL_POSITIVE_PREPARATION'}))
