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
source=inventory();assert len(source)==1813 and identity(source)==h['source_identity']
source_path=A/'raw/p05-method14-request-controls01.mjs'
text=source_path.read_text(encoding='utf-8').replace("'./p05-private-batch-browser-producer14/request-emission.mjs'",repr((P/'request-emission.mjs').as_uri())).replace("'.artifacts/p05-method14-request-controls01.json'",repr((O/'author-rerun.json').as_posix()))
(O/'author-rerun.mjs').write_text(text,encoding='utf-8')
(O/'inputs.json').write_text(json.dumps({'status':'PASS_STATIC_BINDINGS_ONLY','source_identity':identity(source),'included_files':1813,'author_INDEX_sha256':sha(A/'INDEX.json'),'author_HANDOFF_sha256':sha(A/'HANDOFF.json'),'author_files_verified':23,'runtime_pins':h['runtime_pins'],'image':h['image'],'image_available':'NOT_CHECKED_DAEMON_RECOVERY_ROOT_OWNED','browser_cases':'BYTE_EXACT_METHOD13_ALL16_UNCHANGED','author_rerun_adaptation':'Only import URL and result output path; assertions and target method bytes unchanged','author_controls_source_sha256':sha(source_path)},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','source_files':1813,'author_files':23,'runtime_pins':9}))
