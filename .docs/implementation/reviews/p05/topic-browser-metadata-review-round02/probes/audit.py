from pathlib import Path
import json,hashlib,shutil,datetime,sys,subprocess
root=Path.cwd();base=root/'.artifacts/p05-topic-browser-metadata-review-round02';p=root/'.artifacts/p05-topic-browser';out=root/'.docs/implementation/reviews/p05/topic-browser-metadata-review-round02'
def sha(x):return hashlib.sha256(x.read_bytes()).hexdigest()
def read(x):return json.loads(x.read_text(encoding='utf8'))
assert sha(p/'HANDOFF.json')=='dcfa900e19ac507bf1860b5ed9896dfe4c56e3b198cbfd04f3639381acd66fc6'
snap=p/'corrected-static-06';assert sha(snap/'index.json')=='579274cee9949898bae6cb2245ba48c98c570e02dde541786d6b91e4269998ec'
idx=read(snap/'index.json')
for f in idx['files']:assert sha(snap/f['path'])==f['sha256']
h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
for n,v in h['frontend_pins'].items():assert sha(root/n)==v;inputs.append({'path':n,'sha256':v})
assert sha(root/'tests/p05-topic-lifecycle/harness.mjs')==h['harness_sha256']
for n in ['browser.mjs','runtime.mjs','observations.mjs','frontend-validators.mjs']:assert (p/n).read_bytes()==(p/'corrected-static-05'/n).read_bytes()
for n in ['probes.json','author-delivery-results.json']:assert all(r['status']=='PASS' for r in read(base/n)['rows'])
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)=='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571';assert len(source)==1811
node=r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe'
for n in ['browser.mjs','runtime.mjs','run.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs']:
 r=subprocess.run([node,'--check',str(p/n)],capture_output=True,text=True);assert r.returncode==0,(n,r.stderr)
out.mkdir(parents=True,exist_ok=False);(out/'source').mkdir();(out/'probes').mkdir()
for n in h['pins']:shutil.copyfile(p/n,out/'source'/n)
shutil.copyfile(p/'HANDOFF.json',out/'source'/'HANDOFF.json');shutil.copyfile(snap/'index.json',out/'source'/'author-index.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/'probes'/q.name)
report={'schema_version':1,'status':'METADATA_CORRECTIONS_STATIC_PASS_RUN_HOLD','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'INDEPENDENT_CHECKPOINT06_METADATA_ONLY_STATIC','author':'/root/p05_topics_ui','reviewer':'/root/p05_topics_ui_review','exact_inputs':inputs,'handoff_sha256':sha(p/'HANDOFF.json'),'snapshot_sha256':sha(snap/'index.json'),'snapshot_files_verified':len(idx['files']),'source_identity':identity(source),'source_files':len(source),'findings':[],'closed_findings':['METADATA-R01-UI_SCOPE_OVERRIDE','METADATA-R02-UNBOUNDED_PENDING','METADATA-R03-MISSING_V2_TYPE'],'checks':{'own_inert_controls':16,'copied_delivery_controls':15,'syntax':6,'browser_runtime_loader_observations_byte_identical_to05':True,'case_bodies_AST_unchanged':16,'flow_helper_AST_check':'20 explicitly enumerated flow functions plus entire browser bytes identical to05; prior06 author claim21 preserved separately'},'failed_attempts':['Copied old15 fixture initially failed only strict overflow-object equality after two new zero counters; original14PASS1FAIL result retained; updated expected explicit zeros,15PASS. No product issue inferred.'],'limits':['No Docker/browser RUN or old actual05 cause diagnosis.','Runner still refuses current source: old895/1808/image00c46 hard guard. Must refresh exact new image/source/producer pins and independently review before root RUN ACK.','Bounded observer jobs may stay pending until real body settles after close; late effects fenced, retention capped and INCOMPLETE rejects full run. Application responses never cancelled.','No cache.accept/React auth-boundary observation claimed.','Human450 HOLD and fullP05 remain separate.'],'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Metadata checkpoint06 — independent repeat review

**METADATA_CORRECTIONS_STATIC_PASS_RUN_HOLD.** All three round01 P2 findings are closed for these exact producer bytes. The immutable prior FAIL remains unchanged.

Sixteen own inert controls pass, including reproduced old failures and corrected observed request/response UI tuples, separate route binding, body-read admission before pending cap, late-close and cycle fences, bounded conversation retention, known V2/unknown WS type privacy and five runner completeness predicates. Fifteen copied delivery controls pass; initial old fixture strict overflow equality failed on two added zero counters and is retained before the fixture update. Six script syntax checks pass. Exact frontend loader/harness pins and all author snapshot hashes were verified. Browser/runtime/observations/loader bytes remain identical to05;16 case ASTs and20 explicitly enumerated flow functions also compare equal to04 (whole browser equality preserves the wider prior flow review).

The source is ef009/1811, but the runner still intentionally refuses it with an old895/image guard. Final new source/image/producer binding requires refresh and independent review before root RUN authorization. No Docker or browser ran here; no UI product defect or original browser05 cause is inferred. Pending unresolved bodies retain only bounded observer work, late writes are fenced and incomplete diagnostics fail the runner. Cache acceptance/React authority and full P05 are outside this static gate; human450 HOLD remains.
''',encoding='utf8')
for f in inputs:assert sha(root/f['path'])==f['sha256']
assert identity(inventory())==identity(source)
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)} for q in sorted(out.rglob('*')) if q.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n')
print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
