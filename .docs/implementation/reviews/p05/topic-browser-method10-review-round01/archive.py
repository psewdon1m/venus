from pathlib import Path
import sys,json,hashlib,datetime,shutil,subprocess
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path('.artifacts/p05-topic-browser');base=Path('.artifacts/p05-topic-browser-method10-review-round01');out=Path('.docs/implementation/reviews/p05/topic-browser-method10-review-round01')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text('utf-8-sig'))
assert sha(root/'HANDOFF.json')=='f9bf1731f8f3f897ee342d7cc7b029e812265cd477e4189cdcdf7847d44582a8'
assert sha(root/'browser.mjs')=='ab4ff3441240d186f7634acbb01891f1a5f20f18a800cb456fe3bcb64f702c01'
idx=root/'corrected-static-10/index.json';assert sha(idx)=='1ab00f609a11bdb24184095f62696fd90e9bfec84a9381f7cbdcb4a9efc2f00b'
for x in read(idx)['files']:
 p=idx.parent/x['path'];assert sha(p)==x['sha256'] and p.stat().st_size==x['bytes']
handoff=read(root/'HANDOFF.json')
for name,digest in handoff['pins'].items():assert sha(root/name)==digest,name
files=inventory();sid=identity(files);assert sid=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4' and len(files)==1813
before=read(Path('.docs/implementation/evidence/p05/storage503-topic-browser-preflight-01/run/inputs-before.json'))['files']
pins=['tests/p05-topic-lifecycle/harness.mjs','apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts','apps/web/src/presentation-clock.ts']
for name in pins:
 if name=='apps/web/src/presentation-clock.ts':continue
 assert files[name]==before[name],name
# Source file is presentation-clock.ts only if actually present; avoid inventing a filename.
clock='apps/web/src/presentation-clock.ts' if 'apps/web/src/presentation-clock.ts' in files else 'apps/web/src/presentation-clock.tsx'
if clock in files:assert files[clock]==before[clock]
checks=[]
for name in ['browser.mjs','runtime.mjs','run.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs']:
 p=subprocess.run(['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe','--check',str(root/name)],capture_output=True,text=True);assert p.returncode==0,(name,p.stderr);checks.append({'file':name,'exit_code':p.returncode})
(base/'syntax.json').write_text(json.dumps(checks,indent=2)+'\n','utf-8')
assert len(read(base/'probes.json')['rows'])==13 and all(x['status']=='PASS' for x in read(base/'probes.json')['rows'])
assert sum(x['PASS'] for x in read(base/'rerun-results.json'))==113
out.mkdir(parents=True,exist_ok=False)
inputs=[]
for p in [root/'HANDOFF.json',idx]+[root/n for n in ['browser.mjs','run.mjs','runtime.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs','README.md','phases10-browser.diff','phases10-static-result.json','lint-phases10.json']]+[Path('.docs/implementation/evidence/p05/storage503-topic-browser-preflight-01/run/producer/browser.mjs')]+[Path(n) for n in pins if Path(n).exists()]:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':sha(p)})
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
status='METHOD10_COMPONENT_STATIC_PASS_FRESH_SOURCE_IMAGE_BINDING_RUN_HOLD'
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','producer_author':'/root/p05_topics_ui','findings':[],'exact_inputs':inputs,'snapshot_files_verified':len(read(idx)['files']),'handoff_pins_verified':len(handoff['pins']),'current_source_identity':sid,'included_files':1813,'unchanged_frontend_harness_from_prior1d_source':True,'historical_handoff_source_image':'1d3a1813/a0b_NOT_CURRENT_RUN_AUTHORITY','checks':{'own_cooperative_scheduler_actual_three_functions_and_DOM_callback':13,'rerun_author_controls':read(base/'rerun-results.json'),'finite_diff':read(base/'finite.json'),'syntax':checks,'original5s_permission_and5000content_matcher_unchanged':True},'method':'Three distinct absolute8s functional readiness phases. Post-second receipt/coherence phase is one shared deadline for both actors, simultaneous and allSettled-drained; no per-poll/actor reset. Total allocated readiness24s excludes original external wait timeouts and is not an end-to-end SLO.','limits':['Own scheduler uses explicit virtual time/DOM and HTTP receipt/coherence doubles, not actual browser/cache acceptance. Copied113controls are reruns and not13 additional independent implementations.','Earlier09 correct shared8s actualFAIL remains immutable. Method10 changes criterion before freshRUN under rootACK; no product latency/availability/cachebug assertion.','Source changed to e9b9/1813; historical1d/a0b runner rejects it. Fresh exactsource/image finitebinding +rootRUNACK required. No Docker/browser run or product/producer writes by reviewer.','Human450/fullP05/production and otherbrowserengines are separate.'],'own_failed_preparation_attempts':['Initial deepStrictEqual of VM realm array rejected equal structural keys; fixture assertion normalized with host Array.from, rerun13PASS.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8')
(out/'REPORT.md').write_text('''# Browser method10: independent static review

**METHOD10_COMPONENT_STATIC_PASS_FRESH_SOURCE_IMAGE_BINDING_RUN_HOLD.** Exact HANDOFFf9bf1731/browserab4ff344/snapshot1ab00f60 and all declared snapshot/HANDOFF hashes were verified. No findings. Own13 cooperative-scheduler controls execute the exact three changed/new functions and actual read-only DOM callback with explicit time/DOM/HTTP receipt/coherence doubles. Independently rerun author36 current method controls plus77 prior controls all pass. Six syntax checks pass.

The finite diff changes only acceptTopics and topicUiReady plus new topicReadinessPhase. All16case ASTs,28 other function declarations and five runtime modules remain exact09. Two exact mutation receipt/coherence barriers, all no-prompt negatives including immediately before second click, full labels, observer denial, unchanged5000 localized content assertions and5s permission leases remain. Diagnostic phase/readiness lists each cap128; only IDs/scopes/native timings/status/booleans are added.

Each pre-ack phase allocates one native absolute8s bound. The third phase is created only after second exact receipt and coherent revision; both actors share its same object/deadline and start concurrently. Promise.allSettled drains both before propagating failure, so first rejection cannot leave another readiness poll alive during cleanup. Own scheduler verifies total readiness over8s succeeds across distinct phases, slow second post actor gets no new8s, wrong scope/room/disabled/changing observation and early prompt/wrong content reject, pre-ack timeouts issue zero/one ack, and first post rejection waits for other actor to settle. No source/permission lease is extended.

This is a versioned functional preparation criterion, not a24s total wallclock or5s/8s end-to-end product availability claim. Original external wait timeouts remain between phases. The earlier shared8s method and actualFAIL remain immutable. Neither old archive nor this static review proves a cache bug or eventual UI availability.

Current source is e9b9/1813; frontend/harness are exact prior1d source. Historical HANDOFF/runner still bind1d/a0b and an independent VM guard rejects current e9b9. Fresh source/image binding review and rootRUNACK are required before actual execution. No product/producer writes or functional Docker/browser run occurred. Human450 and full P05 remain separate.

One own preparation failure was an assertion comparing cross-realm VM arrays with deepStrictEqual; host Array.from normalization corrected the assertion and final13 checks pass. It did not require a producer change.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
