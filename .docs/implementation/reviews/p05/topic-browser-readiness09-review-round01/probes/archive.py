from pathlib import Path
import json,hashlib,datetime,shutil,sys,subprocess
root=Path.cwd();p=root/'.artifacts/p05-topic-browser';base=root/'.artifacts/p05-topic-browser-readiness09-review-round01';out=root/'.docs/implementation/reviews/p05/topic-browser-readiness09-review-round01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='394a88af2d1b9946cdee8fdcb771d3d2cd7e863d2fb0d3b655296705f3de59bf';snap=p/'corrected-static-09';assert sha(snap/'index.json')=='253074421eb04a90904af1ceb4a2fa6415b97bca47bebd882d8f672f4d2f1bc3';h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v,n;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
idx=read(snap/'index.json')
for r in idx['files']:assert sha(snap/r['path'])==r['sha256']
assert len(read(base/'probes.json')['rows'])==13;author=read(base/'topic-readiness09-results.json');assert len(author['rows'])==32 and all(r['status']=='PASS'for r in author['rows']);finite=read(base/'finite.json');assert finite['unchanged_cases']==16 and len(finite['unchanged_functions'])==28
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)=='1d3a2ba1aa0c79ad223c89094e6def087036abcf327fb46ba42956a68ffbc6f0';assert len(source)==1813;assert source==read(root/'.artifacts/p05-storage503-freeze-context01.json')['files']
for n,v in h['frontend_pins'].items():assert source[n]==v
assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256'];modules=['browser.mjs','runtime.mjs','run.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs'];node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
for n in modules:assert subprocess.run([node,'--check',str(p/n)],capture_output=True).returncode==0
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
for n in modules+['HANDOFF.json','DESIGN.md','README.md']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(snap/'index.json',out/'source'/'author-index.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'READINESS09_COMPONENT_STATIC_PASS_FRESH_BINDING_RUN_HOLD','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'AUTHOR_DISJOINT_EXCLUDED_BROWSER_OWN_UI_PRECONDITION_REVIEW','reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','exact_inputs':inputs,'historical_author_source_identity':h['source_identity'],'historical_author_files':h['included_files'],'current_root_source_identity':identity(source),'current_root_files':len(source),'snapshot_files_verified':len(idx['files']),'findings':[],'closed_producer_finding':'BROWSER-PRODUCER-OWN-UI-READINESS','checks':{'own_actualhelper_DOMcallback_controls':13,'copied_author_interleaving_controls':32,'syntax':6,'finite_diff':finite,'frontend_and_harness_exact_historical_pins':True},'timing_contract':['One shared absolute native8s deadline starts before first readiness and survives both receipts/coherence steps and both participants prompt readiness. No fresh deadline for second actor/prompt.','Actual external receipt/coherence awaits retain existing request timeouts; the8s stage is checked after waits and must reject exhausted preparation, not a claim every awaited operation is interrupted at8s wall clock.','Exact localized5000 content matchers remain unchanged; readiness adds a declared functional precondition, not an original5s end-to-end UI availability proof.','Zero/first-committed-ack absence and repeat immediately before secondclick; full labels/observer denial/all16/rootboundaries/TTL/leases/seeds retained.'],'limits':['Current source changed by root fromef0091811 to1d3a1813 while frontend/harness remained exact. Module/static acceptance does not promote old whole-source/image proof.','Old runner unchanged and own inert guard confirms it refuses newsource. Fresh inventory/image/producer binding review and rootRUN ACK required.','No actual browser/Docker execution or product/producer writes; prior actualFAILs preserved, productcauseunproven.','Human450/fullP05 remainunaccepted.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8');(out/'REPORT.md').write_text('''# Browser09 own-UI readiness — independent review

**READINESS09_COMPONENT_STATIC_PASS_FRESH_BINDING_RUN_HOLD.** The producer readiness finding is closed for exact09 code. Thirteen own actual-helper/DOM-callback controls and32 copied source-bound interleaving controls pass; six syntax checks pass. All author/snapshot hashes were verified.

Only acceptTopics and new topicUiReady change. Sixteen case bodies,28 other function declarations and five other modules remain exact08. The helper combines observed same own scope/minRev, active state and actual DOM room/round/visible/enabled checks; observation changes or late callbacks reject. Tests cover delayed5070 readiness, wrong/stale/hidden/disabled states, same absolute deadline across actors, expiry and bounded128 safe diagnostics. Committed first-ack no-prompt is repeated immediately before secondclick. Both HTTP receipts/coherence and unchanged5000 localized matchers remain.

One shared native8s preparation deadline is reused through both acknowledgements and prompt readiness. It is checked after existing external waits; it does not interrupt every network operation at8s. This is an explicit functional readiness budget, not a5s end-to-end availability proof or permission-lease extension.

Root integrated accepted backend/docs changes during review: current source is1d3a/1813, while frontend/harness pins remain exact. Historical author source/image bindings still nameef009/1811; the unchanged runner refuses the new source in an own guard probe. Fresh image/inventory binding review and root RUN authorization are required. No browser/Docker run or product/producer writes occurred. Historical FAILs, unproven product cause, human450 and full P05 remain separate.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert source==inventory()
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
