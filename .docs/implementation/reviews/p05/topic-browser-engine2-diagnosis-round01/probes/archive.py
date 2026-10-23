from pathlib import Path
import hashlib,json,datetime,shutil,sys
root=Path.cwd();packet=root/'.docs/implementation/evidence/p05/engine2-topic-browser-preflight-01';base=root/'.artifacts/p05-topic-browser-engine2-diagnosis-round01';out=root/'.docs/implementation/reviews/p05/topic-browser-engine2-diagnosis-round01'
def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()
def read(x):return json.loads(x.read_text(encoding='utf8'))
assert sha(packet/'index.json')=='8833bcd66ea2c50ad70f8e7f7ecbe53c3701e5878f18b220a1009e1b4756708e';idx=read(packet/'index.json')
for r in idx['files']:assert sha(packet/r['path'])==r['sha256'],r['path']
m=read(packet/'run/delivery-metadata.json');f=read(packet/'run/failure-details.json');r=read(packet/'run/topic-browser-report.json');runner=read(packet/'run/runner.json')
assert m['status']=='COMPLETE' and m['pending']==0 and m['diagnostic_errors']==0 and all(v==0 for v in m['overflow'].values());assert len(m['http'])==404 and len(m['ws'])==228
assert len([x for x in r['records'] if x['status']=='PASS'])==4 and len([x for x in r['records'] if x['status']=='FAIL'])==1 and len([x for x in r['records'] if x['status']=='NOT_RUN'])==11
assert runner['status']=='FAIL' and runner['cleanup']=='PASS';assert r['cleanup']=='PASS'
posts=[x for x in r['request_metadata'] if x.get('kind')=='respond_topic'];assert len(posts)==2 and {x['locale'] for x in posts}=={'en','tr'} and all(x['status']==200 and x['has_exact_offer_tuple'] for x in posts)
start=f['last_control']['started_monotonic_ms'];timeline=[]
for x in m['http']:
 if x['locale'] not in ['en','tr'] or x['started_native_ms']<108000:continue
 timeline.append({'id':x['id'],'locale':x['locale'],'route':x['route']['kind'],'status':x.get('status'),'request_ms':x['started_native_ms'],'body_ms':x.get('body_complete_native_ms'),'from_last_click_ms':None if x.get('body_complete_native_ms') is None else x['body_complete_native_ms']-start,'body_rev':x.get('dto',{}).get('rev'),'body_state':x.get('dto',{}).get('state'),'prompt_present':x.get('dto',{}).get('prompt_present'),'validator_checks':x.get('validators')})
active=[x for x in m['http'] if x['locale']in['en','tr'] and x['route']['kind']=='conversation' and x.get('dto',{}).get('state')=='active' and x.get('dto',{}).get('prompt_present')]
assert len(active)==0
(base/'timeline.json').write_text(json.dumps({'last_second_click_started_ms':start,'http_timeline':timeline,'active_prompt_dtos_observed_for_pair':len(active),'POST_timing_captured':False,'matcher_exact_start_end_captured':False},indent=2)+'\n')
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
current=inventory();assert identity(current)==idx['source_identity'];assert len(current)==1811
b=read(packet/'run/inputs-before.json');a=read(packet/'run/inputs-after.json');assert b['files']==a['files']==current
out.mkdir(parents=True,exist_ok=False);(out/'inputs').mkdir();(out/'probes').mkdir()
inputs=[]
for n in ['index.json','run/failure-details.json','run/delivery-metadata.json','run/topic-browser-report.json','run/runner.json','run/producer/browser.mjs','run/producer/observations.mjs','run/producer/delivery-diagnostics.mjs']:
 inputs.append({'path':(packet/n).relative_to(root).as_posix(),'sha256':sha(packet/n)});shutil.copyfile(packet/n,out/'inputs'/n.replace('/','__'))
for n in ['apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts']:
 inputs.append({'path':n,'sha256':sha(root/n)});shutil.copyfile(root/n,out/'inputs'/n.replace('/','__'))
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/'probes'/p.name)
report={'schema_version':1,'status':'CONFIRMED_PRODUCER_BARRIER_GAP_ACTUAL_CAUSE_INCONCLUSIVE','scope':'INDEPENDENT_ARCHIVED_ENGINE2_BROWSER07_FAIL_DIAGNOSIS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','producer_author':'/root/p05_topics_ui','exact_inputs':inputs,'actual_packet_files_verified':len(idx['files']),'source_identity':identity(current),'included_files':len(current),'actual_result':{'status':'FAIL','PASS':4,'FAIL':1,'NOT_RUN':11,'cleanup':'PASS','metadata':'COMPLETE','HTTP':404,'WS':228},'finding':{'id':'BROWSER-PRODUCER-TOPIC-ACK-BARRIER','severity':'P2','problem':'acceptTopics awaits UI clicks but not matching topic POST/receipt completion; zero/one-ack negative checks and final prompt matcher can run before corresponding commits.','exact_inert_reproduction':{'clicks_completed':2,'committed_acks':0,'zero_one_negative_checks':6,'prompt_matcher_started':True},'qualified_actual_cause':'Actual receipts both200 exacttuples by capture, but POST native times and exact matcher boundaries absent. No active prompt conversation DTO observed for EN/TR; completedserialbatch/cacheaccept not observed. Do not assert product/cache defect or full causal proof.'},'checks':{'exact_archived_helper_race_reproduced':1,'existing_exact_response_barrier_and_coherence_checks':2,'all_packet_hashes_verified':True,'source_before_after_current_equal':True},'proposed_correction':{'scope':'EXCLUDED_PRODUCER_ONLY_ROOT_ACK_REQUIRED','changes':['Use existing mutationClick for both topic-accept actions with exact POST conversation/commands route and kind respond_topic.','After each exactreceipt200 matching request_id, require coherentGame same session/round/index and minRev receipt.game_rev.','Retain zero-ack and first-ack no-prompt checks, fullunion label checks, both localized prompts and observer denial.','Retain same5000 prompt matcher, all16 scenarios, planner bound20, seed/TTL/leases; no polling/reseeding until a successful session or product weakening.'],'verification':'New immutable checkpoint, own exact old/new interleaving controls, independent review and rootACK before actual rerun. A future PASS is a new regression, not replacement of this FAIL.'},'no_docker_browser_product_producer_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Engine2 browser07 FAIL — independent diagnosis

**CONFIRMED_PRODUCER_BARRIER_GAP_ACTUAL_CAUSE_INCONCLUSIVE.** All37 actual packet hashes were verified. The run remains4PASS/05FAIL/11NOT_RUN with cleanupPASS on ef009/1811/image12e625. Complete metadata contains404 HTTP/228 WS observations, zero errors/overflow/pending.

The exact archived acceptTopics/click helpers enter the final prompt matcher after two UI clicks even when both topic mutation receipts remain unresolved. The first-ack negative check can also precede its commit. One deterministic inert interleaving reproduces this; two controls verify existing mutationClick waits the exact POST/request receipt and coherentRound enforces the receipt revision. This is a producer synchronization finding.

Actual EN/TR topic POSTs both returned200 with exact offer tuples by failure capture. The last second-click start is110102.739ms. EN current revision30 body completes112145.919ms; EN self-actions observation id403 completes115786.319ms and TR target id404 completes115911.493ms. These are observation IDs, not HTTP403/404 statuses: both responses are200. No active prompt-bearing conversation DTO for the pair appears in the complete metadata. The frontend serial current→self-actions→target→conversation→chat batch was not demonstrated complete. POST completion times and exact matcher start/end were not captured, so this does not prove the full actual cause or a cache/UI defect.

Recommended excluded-only correction: both topic accepts use existing mutationClick exactrespond_topic receipt binding, followed by same-round coherentGame at receipt minRev. Preserve zero/one-ack no-prompt, all labels/localized prompts/observer denial, fixed5000 matcher,16 scenarios,20-round bound, seeds, leases and TTL. Root authorization, corrected immutable producer review and a new actual run remain required. Preserve this FAIL; a future PASS cannot retroactively replace it. No product edits or Docker/browser execution occurred in this review.
''',encoding='utf8')
for q in inputs:assert sha(root/q['path'])==q['sha256']
assert inventory()==current
files=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n')
print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
