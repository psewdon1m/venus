import hashlib
import json
from pathlib import Path
import sys

ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
AUTHOR=ROOT/'.docs/implementation/reviews/p05/topic-browser-method13-preparation-round01'
P=ROOT/'.artifacts/p05-private-batch-browser-producer13'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(AUTHOR/'INDEX.json')=='702b7182e5b921a6bde978f8909184ad55b2bf12d9868e9589690c9a076e8cf5'
idx=json.loads((AUTHOR/'INDEX.json').read_text(encoding='utf-8'))
assert len(idx['files'])==22
for r in idx['files']:
 assert sha(AUTHOR/r['path'])==r['sha256'],r['path']
h=json.loads((AUTHOR/'HANDOFF.json').read_text(encoding='utf-8'))
for n,d in h['runtime_pins'].items():assert sha(P/n)==d,n
sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
files=inventory();assert len(files)==1813;assert identity(files)==h['source_identity']
old=ROOT/'.artifacts/p05-private-batch-browser-producer12'
for n,d in h['runtime_pins'].items():
 if n!='browser.mjs':assert sha(old/n)==d,n
source=AUTHOR/'raw/p05-method13-controls01.mjs'
text=source.read_text(encoding='utf-8').replace("'../node_modules/typescript/lib/typescript.js'",repr((ROOT/'node_modules/typescript/lib/typescript.js').as_uri())).replace("'.artifacts/p05-method13-controls01.json'",repr((OUT/'author-rerun.json').as_posix()))
(OUT/'author-rerun.mjs').write_text(text,encoding='utf-8')
(OUT/'inputs.json').write_text(json.dumps({'status':'PASS','source_identity':identity(files),'included_files':len(files),'author_INDEX_sha256':sha(AUTHOR/'INDEX.json'),'author_HANDOFF_sha256':sha(AUTHOR/'HANDOFF.json'),'author_files_verified':22,'runtime_pins':h['runtime_pins'],'image':h['image'],'actual_run':False,'author_rerun_adaptations':'Only TypeScript import URL and result output path; assertions/target files unchanged','author_controls_sha256':sha(source)},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PASS','files':len(files),'author_files':22,'runtime_pins':len(h['runtime_pins'])}))
