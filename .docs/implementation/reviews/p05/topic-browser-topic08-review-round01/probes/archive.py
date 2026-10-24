from pathlib import Path
import hashlib,json,datetime,shutil,sys,subprocess
root=Path.cwd();p=root/'.artifacts/p05-topic-browser';base=root/'.artifacts/p05-topic-browser-topic08-review-round01';out=root/'.docs/implementation/reviews/p05/topic-browser-topic08-review-round01'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='e507fecfff015196c2ca668238bdf9cc7bb71ecba2e3bffc6b42dbf0d9a7ddc0';snap=p/'corrected-static-08-final';assert sha(snap/'index.json')=='1d42446fcbfe010e918141168767688c056fe5a0d11562aa53fb23ec8329fc3e'
h=read(p/'HANDOFF.json');idx=read(snap/'index.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
for r in idx['files']:assert sha(snap/r['path'])==r['sha256']
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==h['source_identity'];assert len(source)==1811;assert source==read(p/'source-binding07.json')['files']
for n,v in h['frontend_pins'].items():assert source[n]==v
assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256'];assert h['image']=='sha256:12e6253fee35b1adec1976d9edfb41fddb3fd39eedc3815158aa96c8814f5a5f'
counts={n:len(read(base/n)['rows'])for n in ['topic-ack08-results.json','delivery-results.json','metadata-corrections-results.json']};assert sorted(counts.values())==[14,15,16]
assert all(r['exit']==0 for r in read(base/'rerun-results.json'));assert len(read(base/'probes.json')['rows'])==8;finite=read(base/'finite.json');assert len(finite['unchanged_function_declarations'])==28
modules=['browser.mjs','runtime.mjs','run.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs'];node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
for n in modules:assert subprocess.run([node,'--check',str(p/n)],capture_output=True).returncode==0
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
for n in modules+['HANDOFF.json','DESIGN.md','README.md']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(snap/'index.json',out/'source'/'author-index.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'TOPIC08_STATIC_CORRECTION_PASS_ROOT_RUN_ACK_REQUIRED','scope':'INDEPENDENT_EXCLUDED_BROWSER_PRODUCER_ACK_BARRIER_CORRECTION','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','exact_inputs':inputs,'source_identity':identity(source),'included_files':len(source),'image':h['image'],'snapshot_files_verified':len(idx['files']),'closed_producer_finding':'BROWSER-PRODUCER-TOPIC-ACK-BARRIER','findings':[],'checks':{'own_interleaving_controls':8,'copied_author_control_reruns':counts,'finite_diff':finite,'syntax':6,'allsource_harness_frontpins_equal_before_after':True},'scope_preservation':['Exactly two old topic accept clicks replaced by existing exact mutationClick respond_topic HTTP receipt barriers and same session/round/index minRev coherence reads.','Entire remaining browser file exact07; sixteen case bodies and28 otherfunction declarations unchanged; five othercodefiles exact07 including metadata06 and runnerbinding07.','Zero/first committed ack no-prompt and observer no-private tests preserved; fixed5000 final matcher,20-round bound, no seed/TTL/lease/product changes.'],'limits':['Actual root07 FAIL remains4PASS/05FAIL/11NOT_RUN; original actual cause stays qualified/inconclusive, no product/cache bug claim.','This corrects a confirmed producer race; no new actual browser test executed or future PASS predicted.','Root RUN authorization and independent actual evidence audit are separate. No full P05/human450 acceptance.'],'no_docker_browser_product_or_producer_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Browser08 topic acknowledgement barriers — independent review

**TOPIC08_STATIC_CORRECTION_PASS_ROOT_RUN_ACK_REQUIRED.** The confirmed producer acknowledgement-barrier gap is closed for exact paused08 bytes. Original actual07 FAIL remains unchanged and its full cause stays qualified/inconclusive.

Eight own inert controls reproduce the old two-click/zero-commit race, prove new first/second deferred receipt ordering and committed first-ack no-prompt checks, and reject bad status/request/schema/revision, stale coherence and early prompt. Actual click/mutationClick functions execute with explicit locator/response doubles; the own coherence callback is an assertion double. Copied16 controls also execute the original coherence helper, while15 delivery and14 metadata controls pass. Six syntax checks pass.

Finite comparison proves exactly two replacements in acceptTopics. The remaining browser text,16 case ASTs and28 other function declarations are unchanged; five other modules remain exact07, retaining metadata06 and final runner binding. The fixed5000 matcher, zero/one-ack safety checks, localized labels/prompts, observer denial,20-round bound, seeds, leases and TTL remain intact. Sourceef009/1811, harness/frontend pins and image12e625 binding were verified before/after.

No actual browser/Docker run, product or producer edits occurred. Root may decide new RUN authorization; a future result is a new regression and cannot replace the prior FAIL. Full P05 and human450 remain unaccepted.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert inventory()==source
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.rglob('*'))if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
