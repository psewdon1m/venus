from pathlib import Path
import copy, hashlib, json, sys
sys.path.insert(0, 'tools')
import stage_inventory
ROOT=Path.cwd()
BASE=ROOT/'.docs/implementation/evidence/p05/renewal-topic-browser-preflight-01'
OUT=ROOT/'.artifacts/p05-advice-browser-diagnosis-round01'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
expected='c78abdd790091954765cc9d80166394e585b6b4431e6945e17842dd11caaafd7'
assert sha(BASE/'index.json')==expected
idx=read(BASE/'index.json')
assert len(idx['files'])==42
for f in idx['files']:
 p=BASE/f['path'];assert sha(p)==f['sha256'];assert p.stat().st_size==f['bytes']
before=read(BASE/'run/inputs-before.json');after=read(BASE/'run/inputs-after.json')
assert before==after
source='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
assert len(before['files'])==1813 and stage_inventory.identity(before['files'])==source
current=stage_inventory.inventory();assert current==before['files']
pins=read(BASE/'run/producer-pins.json')
assert len(pins)==7
for name,h in pins.items():assert sha(BASE/'run/producer'/name)==h
report=read(BASE/'run/topic-browser-report.json');meta=read(BASE/'run/delivery-metadata.json')
runner=read(BASE/'run/runner.json')
def actual_guard(r,m):
 assert r['status']=='FAIL' and r['cleanup']=='PASS'
 assert len(r['records'])==16 and len({x['id'] for x in r['records']})==16
 assert [x['status'] for x in r['records']]==['PASS']*5+['FAIL']+['NOT_RUN']*10
 assert r['last_control']['control']=='advice-accept' and r['last_control']['locale']=='tr'
 assert m['status']=='COMPLETE' and m['pending']==0 and not m['observer_truncated']
 assert m['diagnostic_errors']==0 and all(v==0 for v in m['overflow'].values())
actual_guard(report,meta)
assert runner['source_identity']==source==runner['source_identity_after']
assert runner['source_and_producer_unchanged'] and runner['cleanup']=='PASS'
assert idx['observed_exit_code']==1 and idx['observed_handle']==56780
http={x['id']:x for x in meta['http']}
assert len(meta['http'])==395 and len(meta['ws'])==254
conv=http[388];chat=http[392];own=http[385];target=http[395]
assert conv['locale']=='tr' and conv['status']==200 and conv['cycle']==chat['cycle']==own['cycle']==52
assert conv['dto']['rev']==34 and conv['dto']['revision']==6 and conv['dto']['epoch']==1
assert conv['dto']['state']=='active' and conv['dto']['advice_counts']['received_accepted']==1
assert all(conv['validators'][k] for k in ('request_ui','response_ui','response_tuple','route_binding'))
assert not conv['validators']['cache_accept_observed']
assert chat['validators']['chat'] and chat['validators']['corresponding_actual_conversation']
assert chat['since_self_actions_ms']<5000
assert target['dto']['action']['state']=='pending'
assert target['dto']['action']['expires_at']=='1970-01-01T00:18:09.234Z'
assert http[394]['dto']['server_time']=='1970-01-01T00:18:02.182Z'
requests=[x for x in report['request_metadata'] if x['phase']=='structured-advice-edit-revoke' and x['kind']]
assert any(x['kind']=='offer_advice' and x['status']==200 for x in requests)
assert any(x['kind']=='respond_advice' and x['status']==200 for x in requests)
browser=(BASE/'run/producer/browser.mjs').read_text(encoding='utf-8')
case=browser.split('await check(6,async()=>{',1)[1].split('await check(7,',1)[0]
assert "await click(receiver,'advice-accept')" in case and 'mutationClick' not in case
assert "toContainText('SYNTHETIC ADVICE ONE')" in case
assert "timeout:5000" in browser or "timeout: 5000" in browser
for n in ('containers','networks','volumes'):assert not (BASE/f'run/remaining-{n}.txt').read_text(encoding='utf-8').strip()
negatives=[]
for label,mut in [
 ('false_case06_pass',lambda r,m:r['records'][5].update(status='PASS')),
 ('duplicate_case_id',lambda r,m:r['records'][5].update(id=r['records'][4]['id'])),
 ('cleanup_missing',lambda r,m:r.update(cleanup=None)),
 ('incomplete_diagnostics',lambda r,m:m.update(status='INCOMPLETE')),
 ('pending_observer',lambda r,m:m.update(pending=1)),
 ('overflow_hidden',lambda r,m:m.update(observer_truncated=True)),
]:
 r=copy.deepcopy(report);m=copy.deepcopy(meta);mut(r,m)
 try:actual_guard(r,m)
 except AssertionError:negatives.append(label)
 else:raise AssertionError('false acceptance '+label)
result={'status':'BOUNDED_ACTUAL_DIAGNOSIS_PASS_BROWSER_GATE_REMAINS_FAIL',
 'actual_index_sha256':expected,'actual_files_verified':42,'source_identity':source,'included_files':1813,
 'current_source_verified':True,'source_before_after_equal':True,'producer_files_verified':7,
 'image':runner['image'],'actual_cases':{'PASS':5,'FAIL':1,'NOT_RUN':10},'cleanup':'PASS',
 'diagnostics':{'status':meta['status'],'http':395,'ws':254,'overflow':meta['overflow'],'pending':meta['pending']},
 'timeline':{'accept_click_start_ms':report['last_control']['started_monotonic_ms'],
 'accepted_conversation_body_ms':conv['body_complete_native_ms'],'complete_chat_body_ms':chat['body_complete_native_ms'],
 'fresh_batch_ms':chat['since_self_actions_ms'],'action_remaining_at_latest_server_ms':7052,
 'precise_matcher_start_observed':False,'precise_react_paint_observed':False,'cache_accept_observed':False},
 'mutation_http_metadata':requests,'negative_guards_rejected':negatives,
 'cause_qualification':'Confirmed producer lacks commit/coherent-own-UI precondition; exact TSX deferred-HTTP counterexample and later actual screenshot establish timing race is feasible. Actual React/cache sequence was not instrumented. No new product defect proven; action expiry does not explain first failure.',
 'full_stage_pass':False}
(OUT/'audit.json').write_text(json.dumps(result,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'actual_files':42,'negative_controls':len(negatives),'source':source}))
