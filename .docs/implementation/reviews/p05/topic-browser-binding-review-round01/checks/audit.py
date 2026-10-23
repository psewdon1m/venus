from pathlib import Path
import json,hashlib,zipfile,datetime,sys,shutil
root=Path.cwd();p=root/'.artifacts/p05-topic-browser';base=root/'.artifacts/p05-topic-browser-binding-review-round01';out=root/'.docs/implementation/reviews/p05/topic-browser-binding-review-round01';packet=root/'.docs/implementation/evidence/p05/engine2-topic-games-preflight-01'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
assert sha(p/'HANDOFF.json')=='57180427deb4e35056ab001eadff49bbe07247c8afb22ea4a12762fbf1cac431';snap=p/'corrected-static-07';assert sha(snap/'index.json')=='d053487887714e42db13c8d593de8d72aa0608592cda7070cb4bd1779dd15e1f'
si=read(snap/'index.json')
for f in si['files']:assert sha(snap/f['path'])==f['sha256'],f['path']
h=read(p/'HANDOFF.json');inputs=[]
for n,v in h['pins'].items():assert sha(p/n)==v;inputs.append({'path':(p/n).relative_to(root).as_posix(),'sha256':v})
before=(p/'corrected-static-06/run.mjs').read_text(encoding='utf8');after=(p/'run.mjs').read_text(encoding='utf8');diff=read(p/'binding07-finite-diff.json')
for r in diff['replacements']:assert before.count(r['before'])==1;before=before.replace(r['before'],r['after'])
assert before==after
for n in ['browser.mjs','runtime.mjs','observations.mjs','frontend-validators.mjs','delivery-diagnostics.mjs']:assert (p/n).read_bytes()==(p/'corrected-static-06'/n).read_bytes()
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
current=inventory();source=identity(current);assert source==h['source_identity'];assert len(current)==1811;binding=read(p/'source-binding07.json');assert current==binding['files']
idx=read(packet/'index.json')
for f in idx['files']:assert sha(packet/f['path'])==f['sha256'],f['path']
b=read(packet/'run/inputs-before.json');a=read(packet/'run/inputs-after.json');assert b['files']==a['files']==current
assert b['identity']==a['identity']==source
archive=packet.parent/'engine2-source-freeze-01/included-source.zip';assert sha(archive)==idx['source_archive_sha256']
with zipfile.ZipFile(archive)as z:
 assert set(z.namelist())==set(current)
 for n,v in current.items():assert hashlib.sha256(z.read(n)).hexdigest()==v,n
image=h['image'];observed=read(base/'image-inspect.json');retained=read(packet/'run/image-inspect.json')[0];assert observed['Id']==retained['Id']==image==idx['image'];assert observed['Config']==retained['Config'];assert observed['RootFS']==retained['RootFS']
assert observed['Config']['WorkingDir']=='/app';assert observed['Config']['User']=='1000:1000'
log=(packet/'run/build.txt').read_text(encoding='utf8');assert image in log and 'COPY tests tests' in log and 'COPY apps apps' in log and 'vite build' in log and 'dist/index.html' in log
assert current['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256']
for n,v in h['frontend_pins'].items():assert current[n]==v
assert all(r['status']=='PASS' for r in read(base/'guards.json')['rows'])
out.mkdir(parents=True,exist_ok=False);(out/'inputs').mkdir();(out/'checks').mkdir()
for n in ['HANDOFF.json','run.mjs','binding07-finite-diff.json','source-binding07.json']:shutil.copyfile(p/n,out/'inputs'/n)
shutil.copyfile(snap/'index.json',out/'inputs'/'author-index.json');shutil.copyfile(packet/'index.json',out/'inputs'/'image-build-evidence-index.json')
for n in ['run/build.txt','run/image-inspect.json','run/inputs-before.json','run/inputs-after.json']:shutil.copyfile(packet/n,out/'inputs'/n.replace('/','__'))
for n in ['guards.mjs','guards.json','image-inspect.json','audit.py']:shutil.copyfile(base/n,out/'checks'/n)
report={'schema_version':1,'status':'FINAL_BINDING07_STATIC_PASS_ROOT_RUN_ACK_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'EXACT_THREE_LITERAL_RUNNER_BINDING_PLUS_RETAINED_BUILD_SOURCE_EVIDENCE','reviewer':'/root/p05_topics_ui_review','author':'/root/p05_topics_ui','source_identity':source,'included_files':len(current),'image':image,'exact_inputs':inputs,'checks':{'exact_runner_replacements':3,'other_code_files_identical06':5,'own_bad_good_guard_controls':6,'all_current_source_map_equals_build_before_after':True,'sourceZIP_entries_and_hashes_verified':1811,'image_readonly_inspect_matches_retained_config_layers':True,'harness_and_frontendpins_exact':True,'metadata06_report':'87aa8bb79d1db4ce3a9b00bdfe0ee37f7aa2d36a500a9f53f211d5e78269e037'},'findings':[],'limits':['Image binding is retained complete build-source maps/logs plus current read-only image inspect. No container created and no /app/dist bitwise extraction performed.','Original16 scenarios and metadata06 gates unchanged, but new actual browser regression has not run.','Do not attribute future run to old895, infer original05 cause, or promote human450/fullP05. Root RUN ACK remains necessary.'],'no_docker_functional_run_product_or_producer_writes':True,'full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
(out/'REPORT.md').write_text('''# Final browser binding07 — independent finite review

**FINAL_BINDING07_STATIC_PASS_ROOT_RUN_ACK_REQUIRED.** Exactly three runner literals change from accepted06: source ef009,1811 files and image12e625. The remaining five code files are byte-identical, preserving metadata06 and the16 scenarios.

Six exact guard probes pass: current binding accepted; wrong source, old/additional file counts and wrong image rejected. All snapshot hashes were checked. Current full1811-file map equals the build before/after maps; every source ZIP entry/hash matches. Read-only Docker image inspection matches the retained image ID/config/layers. Retained build logs show copied apps/tests and Vite dist build; harness/frontend pins bind the reviewed sources.

No test container or functional run was started. This is build/source receipt binding, not bitwise extraction of image /app/dist. Root may now decide RUN authorization; actual browser results, original05 cause, human450 and full P05 remain unaccepted. Future results belong to ef009, not old895.
''',encoding='utf8')
for r in inputs:assert sha(root/r['path'])==r['sha256']
assert inventory()==current
files=[{'path':q.relative_to(out).as_posix(),'bytes':q.stat().st_size,'sha256':sha(q)} for q in sorted(out.rglob('*')) if q.is_file()]
(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n')
print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
