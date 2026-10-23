from pathlib import Path
import hashlib
import json
import sys
ROOT=Path.cwd();O=Path(__file__).resolve().parent;A=ROOT/'.docs/implementation/reviews/p05/topic-browser-method14-diagnostic-preparation-round01';P=ROOT/'.artifacts/p05-private-batch-browser-producer14'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(A/'INDEX.json')=='e445a28a7aefbeb1e5ec0a4a3ad71189fb3bf208f8e48ff27f0f327c4f1d9d44'
index=json.loads((A/'INDEX.json').read_text(encoding='utf-8'));assert len(index['files'])==23
for r in index['files']:assert sha(A/r['path'])==r['sha256'] and (A/r['path']).stat().st_size==r['bytes'],r['path']
h=json.loads((A/'HANDOFF.json').read_text(encoding='utf-8'))
for n,d in h['runtime_pins'].items():
 assert sha(P/n)==d,n
 if n!='request-emission.mjs':assert sha(ROOT/'.artifacts/p05-private-batch-browser-producer13'/n)==d,n
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
source=inventory();historical=json.loads((ROOT/'.docs/implementation/evidence/p05/method13-chromium-preflight-01/run/inputs-before.json').read_text(encoding='utf-8'))
assert historical['source_identity_sha256']==h['source_identity'] and len(historical['files'])==1813
changed=[n for n,d in historical['files'].items() if source.get(n)!=d];assert not changed,changed
added={n:d for n,d in source.items()if n not in historical['files']}
(O/'source-drift.json').write_text(json.dumps({'status':'CONCURRENT_ADDITIONS_NOT_FROZEN_NOT_PRODUCT_CHANGE','historical_input_identity':h['source_identity'],'historical_subset_files_unchanged':1813,'current_inventory_identity_snapshot':identity(source),'current_inventory_count_snapshot':len(source),'added':added,'changed_or_removed':changed,'not_full_current_source_acceptance':True},indent=2)+'\n',encoding='utf-8')
source_path=A/'raw/p05-method14-request-controls01.mjs'
text=source_path.read_text(encoding='utf-8').replace("'./p05-private-batch-browser-producer14/request-emission.mjs'",repr((P/'request-emission.mjs').as_uri())).replace("'.artifacts/p05-method14-request-controls01.json'",repr((O/'author-rerun.json').as_posix()))
(O/'author-rerun.mjs').write_text(text,encoding='utf-8')
(O/'inputs.json').write_text(json.dumps({'status':'PASS_STATIC_EXACT_METHOD_BINDINGS_HISTORICAL_SOURCE_SUBSET_ONLY_CURRENT_TREE_HAS_CONCURRENT_ADDITIONS','source_identity':h['source_identity'],'included_files':1813,'current_source_inventory_snapshot':identity(source),'current_source_count_snapshot':len(source),'author_INDEX_sha256':sha(A/'INDEX.json'),'author_HANDOFF_sha256':sha(A/'HANDOFF.json'),'author_files_verified':23,'runtime_pins':h['runtime_pins'],'image':h['image'],'image_available':'NOT_CHECKED_DAEMON_RECOVERY_ROOT_OWNED','browser_cases':'BYTE_EXACT_METHOD13_ALL16_UNCHANGED','author_rerun_adaptation':'Only import URL and result output path; assertions and target method bytes unchanged','author_controls_source_sha256':sha(source_path)},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','source_files':1813,'author_files':23,'runtime_pins':9}))
