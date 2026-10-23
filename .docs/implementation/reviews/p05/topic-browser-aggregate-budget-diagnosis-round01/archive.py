import sys,pathlib,json,hashlib,datetime,shutil
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
b=pathlib.Path('.docs/implementation/evidence/p05/storage503-topic-browser-preflight-01');own=pathlib.Path('.artifacts/p05-topic-browser-aggregate-budget-diagnosis-round01');out=pathlib.Path('.docs/implementation/reviews/p05/topic-browser-aggregate-budget-diagnosis-round01')
h=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text('utf-8-sig'))
assert h(b/'index.json')=='20f70eaad561f16e2ba7c3bd3c64f4369caf1410e26f6a1fcefa25a4b6ae39b9'
idx=read(b/'index.json')
for x in idx['files']:assert h(b/x['path'])==x['sha256'] and (b/x['path']).stat().st_size==x['bytes']
r=read(b/'run/topic-browser-report.json');d=read(b/'run/delivery-metadata.json');f=read(b/'run/failure-details.json')
assert len(idx['files'])==38 and d['status']=='COMPLETE' and d['pending']==0 and d['diagnostic_errors']==0 and not d['observer_truncated'] and all(v==0 for v in d['overflow'].values())
assert len(d['http'])==397 and len(d['ws'])==249
assert [sum(x['status']==s for x in r['records']) for s in ['PASS','FAIL','NOT_RUN']]==[4,1,11] and r['cleanup']=='PASS'
posts=[x for x in r['request_metadata'] if x.get('kind')=='respond_topic'];assert len(posts)==2 and all(x['status']==200 and x['has_exact_offer_tuple'] for x in posts)
fx=f['actual_fixture'];assert fx['game_rev']==36
convs=[x for x in d['http'] if x['route']['kind']=='conversation' and x.get('dto',{}).get('round')==fx['round_id']]
assert not any(x.get('dto',{}).get('rev')==36 or x.get('dto',{}).get('prompt_present') for x in convs)
last={locale:max((x for x in convs if x['locale']==locale),key=lambda x:x['body_complete_native_ms']) for locale in ['ru','tr']}
assert last['ru']['id']==388 and last['tr']['id']==390 and all(x['dto']['rev']==35 and x['dto']['state']=='pending' and x['validators']['request_ui'] for x in last.values())
assert all(x['dto']['rev']<36 for x in d['http'] if x['route']['kind']=='self-actions' and x.get('dto',{}).get('rev') is not None)
files=inventory();sid=identity(files);assert sid=='1d3a2ba1aa0c79ad223c89094e6def087036abcf327fb46ba42956a68ffbc6f0' and len(files)==1813
assert len(read(own/'probes.json')['rows'])==8
out.mkdir(parents=True,exist_ok=False);inputs=[]
paths=[b/x for x in ['index.json','receipt.json','run/topic-browser-report.json','run/failure-details.json','run/delivery-metadata.json','run/runner.json','run/producer/browser.mjs','run/producer/observations.mjs']]+[pathlib.Path(x) for x in ['apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts','apps/web/src/game-state.ts','.docs/10_IMPLEMENTATION_PLAN.md']]
for p in paths:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':h(p)})
for name in ['probes.mjs','probes.json','archive.py']:shutil.copyfile(own/name,out/name)
timeline=[{'id':x['id'],'locale':x['locale'],'kind':x['route']['kind'],'status':x.get('status'),'started_native_ms':x['started_native_ms'],'body_native_ms':x.get('body_complete_native_ms'),'rev':x.get('dto',{}).get('rev'),'state':x.get('dto',{}).get('state'),'prompt_present':x.get('dto',{}).get('prompt_present'),'validators':x.get('validators')} for x in d['http'] if x['started_native_ms']>=74400]
(out/'timeline.json').write_text(json.dumps(timeline,indent=2)+'\n','utf-8')
status='ACTUAL_SHARED_PREPARATION_BUDGET_FAIL_CONFIRMED_PRODUCT_CAUSE_UNPROVEN'
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','scope':'INDEPENDENT_ARCHIVE_SOURCE_DIAGNOSIS_AND_PROSPECTIVE_METHOD_DESIGN_ONLY','exact_inputs':inputs,'actual_packet_files_verified':38,'source_identity':sid,'included_files':len(files),'image':idx['image'],'actual_result':{'PASS':4,'FAIL':1,'NOT_RUN':11,'cleanup':'PASS','HTTP':397,'WS':249,'diagnostics':'COMPLETE'},'topic_readiness':r['topic_readiness'],'post_second_initial_poll_timeout_ms':809.0309710000001,'last_poll_remaining_ms':84.00686100000166,'R36_active_prompt_HTTP_DTO_observed':False,'R36_self_actions_HTTP_DTO_observed':False,'R36_private_WS_metadata_observed':True,'cache_acceptance_observed':False,'localized5000_matcher_reached':False,'own_exact_helper_and_cache_inert_checks':8,'product_lease_expiry_or_shape_rejection_proven':False,'prospective_method_requires_root_FIX_ACK':True,'prospective_method_changes_existing_shared8s_criterion':True,'old09_failure_remains_FAIL':True,'no_product_producer_or_functional_Docker_writes':True,'full_stage_pass':False,'failed_own_preparation_attempts':['python alias unavailable; explicit .venv Python corrected','own probe missing closing brace; syntax corrected','own positive fixture lacked f.game_rev; fixture corrected','archive import initially lacked tools on sys.path; corrected before any archive writes']}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8')
(out/'REPORT.md').write_text('''# Browser09 actual: independent aggregate budget diagnosis

**ACTUAL_SHARED_PREPARATION_BUDGET_FAIL_CONFIRMED_PRODUCT_CAUSE_UNPROVEN.** All38 archive hashes and current source1d3a/1813 were independently verified. The run remains4PASS/05FAIL/11NOT_RUN, cleanupPASS. Diagnostics COMPLETE:397 HTTP/249 WS, no pending/overflow/errors. Both exact topic acknowledgements returned200 and revision36 was observed. The5000 localized content assertion was never reached.

The shared8s preparation clock had spent39.479ms at first readiness and5667.087ms at second readiness. After the second receipt/coherent snapshot, the post-commit readiness poll began with809.031ms available. Its last recorded attempt was7915.990ms aggregate elapsed with84.007ms left; these are different observations. Final RU/TR conversation responses were valid pending revision35, completed79598.007/80303.764 native ms. Current revision36 arrived81549.035/81953.576ms. No revision36 active conversation/prompt or self-actions body was observed before close. Revision36 private WS metadata exists, but the panel obtains private values through its serial HTTP batch; WS receipt is not cache acceptance.

The exact panel reads current, self-actions, target, conversation and optional chat before TopicCache.accept. Shape/timing diagnostics do not observe that accept. The unchanged cache bounds permission at request-start plus at most5000ms and rejects an expired completed batch. This archive cannot prove a valid active batch was rejected, nor eventual UI success. No client/product defect or acceptable production latency is established.

Eight own inert controls execute the exact archived helper/read-only DOM callback and unchanged TopicCache with explicit virtual time. A post-commit prompt arriving2900ms after that phase starts fails the original shared aggregate budget after809ms; the same helper with a prospective separate absolute phase budget accepts it. Wrong scope, never-ready control, late response and original expired shared stage still reject. Exact cache probes retain5s expiry. This is source-bound design evidence, not an actual browser result.

The earlier shared8s method was explicitly reviewed and is implemented correctly. Its FAIL must stay immutable. No product requirement identified in the accepted plan establishes8s across both actors, receipts/coherence and prompt readiness. A prospective correction requires root FIX_ACK and an explicit versioned functional test criterion: one absolute8s own-scope/minRev/DOM readiness phase before each protected ack; then one new absolute8s post-second-commit phase shared by both actors, preferably concurrent. Never reset per poll/actor or silently retry. Preserve first-ack no-prompt and repeat immediately before second click, exact receipts/scopes, all16cases/full labels/observer denial, seeds and existing5000 localized matchers/permission leases. Log each native phase start/deadline and total elapsed with bounded safe observations. Any phase timeout remains FAIL. This changes the declared functional preparation criterion before a fresh RUN; it does not prove5s or8s end-to-end product availability. Such performance claims require a separate preregistered profile.

No product/producer writes, browser execution or functional Docker RUN occurred. Historical failures, human450 HOLD and full P05 remain separate. Own preparation failures are retained in report.json: unavailable Python alias, missing brace, missing fixture revision and archive import path were corrected before final8PASS/archive creation.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':h(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':h(out/'index.json'),'files':len(entries)}))
