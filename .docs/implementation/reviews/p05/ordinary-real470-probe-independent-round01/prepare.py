from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil
p=Path('.docs/implementation/reviews/p05/ordinary-real470-probe-author-round01');sha=lambda b:hashlib.sha256(b).hexdigest();assert sha((p/'INDEX.json').read_bytes())=='ee9e23ef53440d01133541c01b4006e3d3f9246bc250582dd35c0cdbebbd6cf9';index=json.loads((p/'INDEX.json').read_text())
for name,r in index['files'].items():
 b=(p/name).read_bytes();assert len(b)==r['bytes']and sha(b)==r['sha256']
w=Path('.artifacts/p05-ordinary470-independent01');assert not w.exists();w.mkdir();shutil.copytree(p/'producer',w/'producer')
ack=json.loads((w/'producer/ROOT-ACK.template.json').read_text());checks=[]
for name,expected in [(ack['source_freeze_path'],ack['source_freeze_sha256']),(ack['image_receipt_path'],ack['image_receipt_sha256'])]:assert sha(Path(name).read_bytes())==expected;checks.append({'path':name,'sha256':expected})
source=json.loads(Path(ack['source_freeze_path']).read_text());assert len(source['files'])==1842
for name,pin in source['files'].items():assert sha((Path(ack['source_root'])/name).read_bytes())==(pin if isinstance(pin,str)else pin['sha256'])
receipt=json.loads(Path(ack['image_receipt_path']).read_text());assert receipt['image']==ack['image_id']and receipt['source_identity']==source['identity'];assert len(ack['runtime_files'])==120;assert ack['runtime_files']=={**receipt['image_files_sha256'],'build-metadata.json':receipt['build_metadata_sha256']}
result={'at_utc':datetime.now(timezone.utc).isoformat(),'author_children':len(index['files']),'source_identity':source['identity'],'source_files':1842,'image':ack['image_id'],'actual_root_runtime_pins':120,'root_input_pins':checks,'Docker_commands':0,'actual_RUN':False};(w/'input-verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
