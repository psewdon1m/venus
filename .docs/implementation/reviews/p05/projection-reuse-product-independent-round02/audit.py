from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/projection-reuse-product-author-round02');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='1383a75cc6f98aab214fe59badd9af82587d5433f0e8fab435953f106803e829';idx=read(a/'INDEX.json');assert len(idx['files'])==6
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();freeze=read(a/'source-freeze.json');old=read(Path('.docs/implementation/reviews/p05/projection-reuse-product-author-round01/source-freeze.json'))['files'];assert current==freeze['files'] and identity(current)=='732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80' and len(current)==1826
changed=[p for p in current if p in old and current[p]!=old[p]];added=[p for p in current if p not in old];assert changed==['tests/p05-topic-games/temporal-cases.mjs'] and added==['.docs/implementation/p05-source-revision-projection-reuse-02.json'] and all(p in current for p in old)
assert Path(changed[0]).read_bytes()==(a/'temporal-cases.after.mjs.bytes').read_bytes()
failure=Path('.docs/implementation/evidence/p05/projection-reuse-games20-actual-failed01');assert sha((failure/'INDEX.json').read_bytes())=='007d42369fe4d60c45f1a002843f1ed7801e928fb71387937d0276f7558b80c7';fi=read(failure/'INDEX.json');assert len(fi['files'])==21
for f in fi['files']:
 b=(failure/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
receiptpath=Path('.artifacts/p05-projection-reuse-image-binding02/receipt.json');assert sha(receiptpath.read_bytes())=='e6a366ba340f91f91af5ba5bd8c07551f3175ebf4fcae385de3685058c39ffa1';receipt=read(receiptpath);previous=read(Path('.artifacts/p05-projection-reuse-image-binding01/receipt.json'));assert receipt['compiled_files']==previous['compiled_files'] and receipt['migration_files']==previous['migration_files'] and receipt['web_dist_files']==previous['web_dist_files']
assert receipt['image']=='sha256:e076901479f7b7af94d54ada3698cf69a60d39caf57cf78f311945638f589898' and receipt['source_identity']==identity(current)
for name,pin in receipt['source_files'].items():assert sha(Path(name).read_bytes())==pin
for name,pin in receipt['compiled_files'].items():assert sha(Path(name).read_bytes())==pin
print('RECEIPT_COUNTS',[(k,len(v))for k,v in receipt.items() if isinstance(v,dict)])
oldouter=Path('.artifacts/p05-projection-reuse-browser20-run01.mjs').read_bytes();outerpath=Path('.artifacts/p05-projection-reuse-browser20-run02.mjs');outer=outerpath.read_bytes();draftpath=Path('.artifacts/p05-projection-reuse-browser20-binding-draft02.json');draft=read(draftpath)
assert sha(oldouter)=='6ca2dff8b962ed4a870562b46117daa8093549483d4ff446f8aa1e5f35486034' and sha(outer)=='5fc8ea5bce8c6348452d5abedfc7c51a734b17b1b10dde6b6bf26219bb00e2f5' and sha(draftpath.read_bytes())=='aee72dda2251bb48ed2ccf22a021e929c5c9d5c9b38c795fa5e7806dfecba0e5'
expected=oldouter
for before,after in draft['literal_replacements'].items():assert expected.count(before.encode())==1;expected=expected.replace(before.encode(),after.encode())
assert expected==outer and len(draft['literal_replacements'])==4
pins=read(Path('.docs/implementation/evidence/p05/timing-poll-browser20-chromium-actual01/run/producer-pins.json'));assert len(pins)==10
for name,pin in pins.items():assert sha((Path('.artifacts/p05-private-batch-browser-producer20')/name).read_bytes())==pin
for name,path in [('outer.mjs.bytes',outerpath),('draft.json.bytes',draftpath),('image-receipt.json.bytes',receiptpath)]: (r/name).write_bytes(path.read_bytes())
out={'at_utc':datetime.now(timezone.utc).isoformat(),'author_children':6,'source':identity(current),'files':1826,'changed':changed,'added':added,'old_failure_children_verified':21,'app64_SQL7_UI_exact_c454':True,'runtime10_exact':True,'outer_single_literals':4,'new_functional_RUN':False,'full_stage_PASS':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
