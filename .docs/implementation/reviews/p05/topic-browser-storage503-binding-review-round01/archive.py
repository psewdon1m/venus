from pathlib import Path
import json,hashlib,datetime,shutil,sys
root=Path.cwd();p=root/'.artifacts/p05-topic-browser';base=root/'.artifacts/p05-topic-browser-storage503-binding-review-round01';out=root/'.docs/implementation/reviews/p05/topic-browser-storage503-binding-review-round01';authority=root/'.artifacts/p05-storage503-browser-root-binding01.json'
def sha(q):return hashlib.sha256(q.read_bytes()).hexdigest()
def read(q):return json.loads(q.read_text(encoding='utf8'))
assert sha(authority)=='9862a0f79da2925f29e50b226794a22991df34ddb3b9f15147ade083b12a764b';a=read(authority);assert sha(p/'HANDOFF.json')==a['producer_handoff_sha256']=='394a88af2d1b9946cdee8fdcb771d3d2cd7e863d2fb0d3b655296705f3de59bf';assert sha(p/'run.mjs')==a['after_runner_sha256']=='dc53dfe983de43fcfe956b48e55db666e5594af0b889ac03cd9d5bb79586f7c5'
old=root/'.docs/implementation/reviews/p05/topic-browser-readiness09-review-round01/source/run.mjs';assert sha(old)==a['before_runner_sha256'];expected=old.read_text(encoding='utf8')
for before,after in a['exact_replacements']:assert expected.count(before)==1;expected=expected.replace(before,after)
assert expected==(p/'run.mjs').read_text(encoding='utf8');h=read(p/'HANDOFF.json')
for n,v in h['pins'].items():
 if n!='run.mjs':assert sha(p/n)==v,n
assert len(read(base/'guards.json')['rows'])==6
sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
source=inventory();assert identity(source)==a['source_identity']=='1d3a2ba1aa0c79ad223c89094e6def087036abcf327fb46ba42956a68ffbc6f0';assert len(source)==1813
for n,v in h['frontend_pins'].items():assert source[n]==v
assert source['tests/p05-topic-lifecycle/harness.mjs']==h['harness_sha256'];build=root/'.artifacts/p05-storage503-image-build-receipt01.json';assert sha(build)==a['build_receipt_sha256'];r=read(build);assert r['image']==a['image'];assert sha(root/'.docs/implementation/reviews/p05/topic-restore-storage503-binding-review-round01/index.json')=='5b9a074b9a04256ef9d72010023601cfc578e90f4b23e9292596014e6ba9c0d8'
out.mkdir(parents=True,exist_ok=False)
for n in['HANDOFF.json','run.mjs']:shutil.copyfile(p/n,out/n)
shutil.copyfile(authority,out/'root-authority.json');shutil.copyfile(build,out/'build-image-receipt.json')
for q in base.iterdir():
 if q.is_file():shutil.copyfile(q,out/q.name)
report={'schema_version':1,'status':'BROWSER09_NEW_STORAGE503_BINDING_STATIC_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','scope':'ONLY_THREE_ROOT_AUTHORIZED_RUNNER_LITERALS_CURRENT_SOURCE_IMAGE_NOT_ACTUAL_BROWSER','authority_sha256':sha(authority),'runner_sha256':sha(p/'run.mjs'),'source_identity':identity(source),'included_files':len(source),'image':a['image'],'findings':[],'checks':{'exact_runner_literal_replacements':3,'all_other_authorfilepins_and_handoff_unchanged':True,'own_current_wrong_source_count_image_guard_tests':6,'frontend_harness_exact':True},'image_binding':'Same newsourceZIP/buildreceipt/current readonlyimage.Id independently checked in restore-storage503-binding index5b9a; no further image extraction or functional container run.','limits':['Readiness09/static boundaries retained; historicalefHANDOFF remains provenance and root authority JSON bindsnew1d3a1813/a0b runner.','Root may authorize actual run; priorFAILs, actualTGHTTP503closure, human450/fullP05 remain separate.'],'full_stage_pass':False};(out/'report.json').write_text(json.dumps(report,indent=2)+'\n');(out/'REPORT.md').write_text('''# Browser09 new source/image binding — independent finite review

**BROWSER09_NEW_STORAGE503_BINDING_STATIC_PASS.** Exactly three runner literals change: source1d3a,1813 files and imagea0b416. All other author pins/HANDOFF remain exact09. Six own current/wrong source/count/image guards pass; frontend/harness pins remain exact.

The same source ZIP/build receipt/read-only image.Id were independently checked in restore binding report5b9a. This finite check starts no functional container and extracts no further image files. Root may authorize the actual run. Prior FAILs, unchanged readiness/content/security conditions, actual storage503 regression, human450 and full P05 remain separate.
''',encoding='utf8');assert inventory()==source
files=[{'path':q.name,'bytes':q.stat().st_size,'sha256':sha(q)}for q in sorted(out.iterdir())if q.is_file()];(out/'index.json').write_text(json.dumps({'status':report['status'],'files':files},indent=2)+'\n');print(json.dumps({'status':report['status'],'files':len(files),'index_sha256':sha(out/'index.json')}))
