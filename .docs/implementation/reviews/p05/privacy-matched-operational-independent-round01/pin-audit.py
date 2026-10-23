from pathlib import Path
import json,hashlib,shutil
r=Path('C:/.projects/venus');a=r/'.docs/implementation/reviews/p05/privacy-matched-operational-author-round01';o=r/'.docs/implementation/reviews/p05/privacy-matched-operational-independent-round01';o.mkdir(exist_ok=False)
pins={}
def read(p,h=None):
 p=Path(p);p=p if p.is_absolute() else r/p;b=p.read_bytes();s=hashlib.sha256(b).hexdigest()
 if h:assert h==s,(str(p),s,h)
 pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':s};return b
def load(p,h=None):return json.loads(read(p,h))
v=load(a/'INDEX.json','4879b96dab9cf6ee7b89ba6d3ed011d25afa80e0bcc51dd44a2504b514be54ed')
for f in v['files']:assert len(read(a/f['path'],f['sha256']))==f['bytes']
b=load(a/'binding.json');work=r/'.artifacts/p05-privacy-matched-operational01';template=load(a/'p05-privacy-matched-root-ack.template02.json')
assert template['status']=='PENDING_ROOT_RUN_ACK' and template['no_actual_approval'] is True
for n,h in template['producer_pins'].items():read(work/n,h)
assert len(template['producer_pins'])==9
for n,h in b['range02_producer_pins'].items():read(r/'.artifacts/p05-pilot-corpus-ranges02'/n,h)
assert len(b['range02_producer_pins'])==37
read('.artifacts/p05-fixedrange-host03.mjs',b['shared_host_sha256'])
read('.artifacts/p05-privacy-matched-host01.mjs',template['host_runner_sha256'])
for n in ['consumer.mjs','matched-model.mjs']:assert read(work/n)==read(r/'.artifacts/p05-privacy-matched01'/n)
read('.docs/implementation/reviews/p05/privacy-matched-independent-round01/INDEX.json',b['method_review_sha256'])
c=load(a/'PURE-CLOSURE-A9-A11.json',b['pure_closure_A9_A11_sha256']);assert c['runtime_module_count']==28
for suffix in ['06','07','08']:
 receipt=load(f'.artifacts/p05-pilot-bundle-image-binding{suffix}/receipt.json');freeze=load(f'.artifacts/p05-pilot-bundle-source-freeze{suffix}.json')
 for n,h in c['runtime_modules'].items():assert receipt['image_files_sha256'][n]==h
 for n,h in c['source_modules'].items():assert receipt['source_files'][n]==h
 assert freeze['files']['package-lock.json']==c['package_lock_sha256']
assert c['actual_run_target_source']==b['source_identity'] and c['actual_run_target_image']==b['image']
prereg=load(a/'PREREG.json');assert prereg['cases']==84 and prereg['native_recorded_models']==prereg['native_replay_models']==336 and prereg['comparisons']==168 and prereg['worker_ms']==3600000
assert b['original7section_worker_ms_UNCHANGED']==1200000
shared=read('.artifacts/p05-fixedrange-host03.mjs').decode();assert "],1205000)" in shared
for n in ['controls.mjs','matched-worker.mjs','consumer.mjs','matched-model.mjs','binding.json','PREREG.json']:assert read(work/n)==read(a/n)
result={'status':'PINS_ONLY_VERIFIED_NOT_OPERATIONAL_ACCEPTANCE_YET','author_children':len(v['files']),'own_producer_pins':9,'parent_range_pins':37,'pure_workspace_modules':28,'accepted_domain_consumer_model_exact':True,'domain_method_selfaccepted':False,'actual_target':'A9','closure_equivalence':'A9_A10_A11_PURE_ONLY_NOT_APP','prereg_counts':[84,168,336,336],'caps_worker_ms':3600000,'original7_worker_ms_unchanged':1200000,'pins':pins}
(o/'pin-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
shutil.copyfile(r/'.artifacts/p05-matched-operational-review01.py',o/'pin-audit.py')
print(json.dumps({k:v for k,v in result.items() if k!='pins'},indent=2))
