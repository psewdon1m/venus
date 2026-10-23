from pathlib import Path
import hashlib,json,sys
sys.path.insert(0,'tools');import stage_inventory
root=Path.cwd();base=root/'.docs/implementation/evidence/p05/advice-method11-browser-preflight-01';out=root/'.artifacts/p05-action-accept-actual-diagnosis-round01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha(base/'index.json')=='fc44f08b97cf887b0f3285538e847dff16f3524eea46ac9e297dc60cf236b273'
index=read(base/'index.json');assert len(index['files'])==39
for f in index['files']:
 p=base/f['path'];assert p.stat().st_size==f['bytes'] and sha(p)==f['sha256']
before=read(base/'run/inputs-before.json');after=read(base/'run/inputs-after.json');assert before==after
assert before['files']==stage_inventory.inventory() and len(before['files'])==1813
assert stage_inventory.identity(before['files'])=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
pins=read(base/'run/producer-pins.json');assert len(pins)==7
for name,pin in pins.items():assert sha(base/'run/producer'/name)==pin
assert pins['browser.mjs']=='6f09bd209c961fb8abdee51864a742973db21db0d7a145407ed6f9757f4ad670'
r=read(base/'run/topic-browser-report.json');m=read(base/'run/delivery-metadata.json');runner=read(base/'run/runner.json')
assert r['status']=='FAIL' and [x['status'] for x in r['records']]==['PASS']*4+['FAIL']+['NOT_RUN']*11
assert len({x['id'] for x in r['records']})==16 and r['cleanup']==runner['cleanup']=='PASS'
assert r['last_control']['control']=='action-accept' and r['last_control']['locale']=='ru'
assert m['status']=='COMPLETE' and not m['observer_truncated'] and m['pending']==m['diagnostic_errors']==0
assert all(v==0 for v in m['overflow'].values())
http={x['id']:x for x in m['http']}
old=http[354];fresh=http[369];end=http[376];click=r['last_control']['started_monotonic_ms'];until=old['started_native_ms']+min(5000,old['dto']['server_relative_ms'])
assert old['cycle']==56 and fresh['cycle']==end['cycle']==57
assert fresh['body_complete_native_ms']<until<click<end['body_complete_native_ms']
assert fresh['dto']['rev']==http[372]['dto']['rev']==28
assert http[372]['dto']['action']['expires_at']=='1970-01-01T00:18:03.757Z'
assert fresh['dto']['server_time']=='1970-01-01T00:17:51.668Z'
assert http[413]['dto']['server_time']=='1970-01-01T00:18:04.004Z'
assert http[414]['dto']['rev']==29
assert all(p['status']=='READY' for p in r['topic_preparation_phases'])
assert not any(x.get('scope')=='action' and x.get('kind')=='accept' for x in r['request_metadata'])
for kind in ('containers','networks','volumes'):assert not (base/f'run/remaining-{kind}.txt').read_text(encoding='utf-8').strip()
timeline={'old_private_own_request_ms':old['started_native_ms'],'old_private_permission_duration_ms':old['dto']['server_relative_ms'],'old_private_upper_deadline_ms':until,'new_own_response_body_ms':fresh['body_complete_native_ms'],'action_click_ms':click,'click_after_old_deadline_ms':click-until,'new_complete_chat_body_ms':end['body_complete_native_ms'],'action_deadline':http[372]['dto']['action']['expires_at'],'server_time_before_click':fresh['dto']['server_time'],'action_remaining_at_that_server_ms':12089,'later_expiry_server_time':http[413]['dto']['server_time'],'later_rev29_body_ms':http[414]['body_complete_native_ms']}
result={'status':'DIAGNOSIS_COMPLETE_PRODUCER_PRECONDITION_GAP','actual_index_sha256':sha(base/'index.json'),'verified_files':39,'producer_files':7,'source_identity':before['source_identity_sha256'],'included_files':1813,'actual_counts':{'PASS':4,'FAIL':1,'NOT_RUN':11},'cleanup':'PASS','http':len(m['http']),'ws':len(m['ws']),'timeline':timeline,'internal_cache_branch_observed':False,'action_expiry_at_click_proven':False,'source_bound_safe_expired_private_grant_rejection_reproduced':True,'product_defect_proven':False,'full_stage_pass':False}
(out/'audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
