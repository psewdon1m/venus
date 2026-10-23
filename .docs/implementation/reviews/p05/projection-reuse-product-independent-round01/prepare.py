from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,sys
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/projection-reuse-product-author-round01');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='d641b3d8aba90cbdd965ca46b1aa8830513afe1754e673f1dc601acbedbd6128';idx=read(a/'INDEX.json');assert len(idx['files'])==18
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();freeze=read(a/'source-freeze.json');assert current==freeze['files'] and identity(current)==freeze['identity']=='c454631da2b2ede99241555273a35d7b0b4124c76f30ab3632bf2ba48d540d40' and len(current)==1825
old=read(Path('.artifacts/p05-compatible-rollback-producer02/included-inputs.json'));changed=[p for p in current if p in old and current[p]!=old[p]];added=[p for p in current if p not in old];assert changed==['apps/api/src/topic-games.ts'] and set(added)=={'.docs/implementation/p05-source-revision-projection-reuse-01.json','apps/api/src/topic-projection-reuse.test.ts'} and all(p in current for p in old)
assert sha((a/'image-receipt.json').read_bytes())=='e0c99a63d62d69c152bb3a989267a89910a1d0a5f0fd80281e64d3fe0b073921'
receipt=read(a/'image-receipt.json');print('RECEIPT_KEYS',list(receipt))
root=Path('.artifacts/p05-projection-reuse-independent01');root.mkdir(parents=True,exist_ok=True)
original=Path('apps/api/src/topic-projection-reuse.test.ts').read_text(encoding='utf-8');adapted=original.replace("'./topic-games.js'","'../../apps/api/src/topic-games.js'").replace("'./rooms.js'","'../../apps/api/src/rooms.js'").replace("'./security.js'","'../../apps/api/src/security.js'").replace("'./topic-game-model.js'","'../../apps/api/src/topic-game-model.js'")
(root/'projection.test.ts').write_text(adapted+'\n'+(r/'extra-tests.ts.bytes').read_text(encoding='utf-8'),encoding='utf-8')
(root/'vitest.config.mts').write_text("import base from '../../vitest.config.ts';\nexport default {...base,test:{...base.test,include:['.artifacts/p05-projection-reuse-independent01/projection.test.ts']}};\n",encoding='utf-8')
(r/'adaptation.json').write_text(json.dumps({'original_test_sha256':sha(original.encode()),'adapted_test_sha256':sha((root/'projection.test.ts').read_bytes()),'only_original_adaptation':'Four relative source import/mock path targets; appended independent6 boundary tests','author_children':18,'current_source':freeze['identity'],'included_files':1825,'changed':changed,'added':added,'at_utc':datetime.now(timezone.utc).isoformat()},indent=2)+'\n',encoding='utf-8')
print('PASS input/source bindings; own finite test ready')
