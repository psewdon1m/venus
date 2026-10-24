from pathlib import Path
import json,sys
r=Path(__file__).parent;read=lambda p:json.loads(p.read_text(encoding='utf-8'));receipt=read(r/'image-receipt.json.bytes');prior=read(Path('.artifacts/p05-projection-reuse-image-binding01/receipt.json'))
union={}
for key in ['source_files','compiled_files','migration_files','web_dist_files','pg_dependency_files']:
 for name,pin in receipt[key].items():
  if name in union:assert union[name]==pin
  union[name]=pin
assert union==receipt['image_files_sha256'] and len(union)==272
assert receipt['changed_image_paths']==['tests/p05-topic-games/temporal-cases.mjs'] and receipt['app_imports']==0 and receipt['build_metadata_absent'] is True
assert receipt['probe_exit_code']==receipt['build_observed_exit']==0 and receipt['probe_cleanup']=='AUTO_REMOVED'
failure=Path('.docs/implementation/evidence/p05/projection-reuse-games20-actual-failed01');assert read(failure/'image-byte-binding.json')['image_files_sha256']==prior['image_files_sha256']
report=read(failure/'run/topic-games-report.json');assert [v['status']for v in report['checks']]==['PASS']*13+['FAIL']
runner=read(failure/'run/runner.json');assert runner['status']=='FAIL' and runner['cleanup']=='completed'
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==read(Path('.artifacts/p05-projection-reuse-source-freeze02.json'))['files'] and identity(current)==receipt['source_identity'] and len(current)==1826
(r/'final-check.json').write_text(json.dumps({'image_unique_pins':272,'two_pg_anchors':receipt['pg_dependency_files'],'no_app_imports':True,'metadata_absence':True,'actual_failed_image270_exact_prior_receipt':True,'actual_failure':'13PASS/14FAIL/6NOTRUN_CLEANUP_COMPLETED_PRESERVED','source_after_finite_unchanged':True,'new_actual_RUN':False},indent=2)+'\n',encoding='utf-8');print('PASS272pins/oldFAIL/source1826unchanged')
