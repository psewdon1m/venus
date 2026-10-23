import hashlib
import json
from pathlib import Path
ROOT=Path.cwd();O=Path(__file__).resolve().parent;E=ROOT/'.docs/implementation/evidence/p05/method13-chromium-preflight-01';R=E/'run'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def save(n,v):(O/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
assert sha(E/'INDEX.json')=='187945e028eff2c479ab8ecec4f9798f41119d2818c62d80347792aad8af44ee'
i=read(E/'INDEX.json');assert len(i['files'])==45
for r in i['files']:assert sha(E/r['path'])==r['sha256'] and (E/r['path']).stat().st_size==r['bytes'],r['path']
b=read(R/'inputs-before.json');a=read(R/'inputs-after.json');assert a==b;assert len(b['files'])==1813
r=read(R/'topic-browser-report.json');d=read(R/'delivery-metadata.json');f=read(R/'failure-details.json')
assert [x['status']for x in r['records']]==['PASS']*7+['FAIL']+['NOT_RUN']*8
assert r['cleanup']=='PASS';assert f['actual_fixture']['round_state']=='pending'
event=r['mutation_dispatches'][-1];assert event['control']=='topic-new';assert event['request_observed_monotonic_ms']<event['readiness']['deadline_monotonic_ms']
assert event['failure']=='DISPATCHED_RESPONSE_OR_RECEIPT_FAILURE'
lastmeta=r['request_metadata'][-1];assert lastmeta['kind']=='offer_topic' and lastmeta['status']==409
assert not any(x['control']=='action-accept' for x in r['mutation_dispatches'] if x['click_started_monotonic_ms']>235000)
names=['apps/api/src/topic-games.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/game-copy.ts','packages/relationship-engine/src/private-conversation.ts','packages/relationship-engine/src/topic-planner.ts','tests/p05-topic-games/fixtures.mjs','tests/p05-topic-games/context-fixture.mjs']
pins={n:sha(ROOT/n)for n in names}
for n,h in pins.items():assert b['files'][n]==h,n
save('inputs.json',{'status':'PASS','evidence_INDEX_sha256':sha(E/'INDEX.json'),'verified_evidence_files':45,'source_identity':i['source_identity'],'included_files':1813,'before_after_equal':True,'image':i['image'],'source_pins':pins,'request_helper_sha256':sha(R/'producer/request-emission.mjs')})
safe_rows=[]
for number,row in enumerate(d['http']):
 if row['started_native_ms']>240000 and row['route']['kind'] in ['self-actions','conversation','target']:
  dto=row['dto'];safe_rows.append({'pointer':f'/http/{number}','id':row['id'],'locale':row['locale'],'kind':row['route']['kind'],'start':row['started_native_ms'],'body_complete':row['body_complete_native_ms'],'status':row['status'],'dto':dto})
save('analysis.json',{'status':'CONFIRMED_HTTP409_AND_MISSING_EXACT_ERROR_CODE','actual_fixture':f['actual_fixture'],'last_actual_mutation':event,'last_POST_metadata':lastmeta,'last_six_mutations':r['mutation_dispatches'][-6:],'last_preparations':r['private_preparation'][-2:],'selected_safe_delivery_metadata':safe_rows,'error_code':None,'error_code_observed':False,'request_expected_epoch_observed':False,'request_topic_ids_observed':False,'actual_action_helper_reached':False,'case05_result':r['records'][4],'capture_reason':'Exact request helper asserts status before response.json; delivery diagnostic observes GET routes only; POST metadata omits body/error code. Screenshot localized error is generic.'})
print(json.dumps({'status':'PASS_VERIFICATION_EXACT_DOMAIN_CAUSE_UNRESOLVED','evidence_files':45,'POST_status':409,'before_deadline':True,'actual_action_helper_reached':False}))
