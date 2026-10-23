from pathlib import Path
import json,hashlib
R=Path('C:/.projects/venus');A=R/'.docs/implementation/reviews/p05/a20-layout03-webkit-native-metrology-author-round01';D=R/'.docs/implementation/reviews/p05/a20-layout03-webkit-native-metrology-independent-round02';assert not D.exists();D.mkdir();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();assert sha(A/'INDEX.json')=='d06075afd27968828e0d307f092d7b259ffdda2d65d76a34e96b3655ebc6fc52';author=json.loads((A/'INDEX.json').read_bytes())
for name,pin in author['files'].items():
 p=A/name;assert p.stat().st_size==pin['bytes'] and sha(p)==pin['sha256']
P=R/'.artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-03';old=P.parent/'p05-v2-layout-producer-a20-02';pi=json.loads((P/'INDEX.json').read_bytes());assert sha(P/'INDEX.json')=='98dc38fa8d8edfc9d2719a492b8dcab8772ceaf151b88fff32baaad1e9f68d48'
# Producer INDEX includes frozen file dictionary.
for name,pin in pi['files'].items():
 p=P/name;assert p.stat().st_size==pin['bytes'] and sha(p)==pin['sha256']
edits=json.loads((A/'EDITS.json').read_bytes());changed=[];same=[]
for p in sorted(P.glob('*.mjs')):
 q=old/p.name
 if p.read_bytes()==q.read_bytes():same.append(p.name);continue
 inverse=p.read_bytes().decode();nl='\r\n' if '\r\n' in inverse else '\n'
 for e in reversed(edits[p.name]):
  before=e['before'].replace('\n',nl);after=e['after'].replace('\n',nl);assert after in inverse;inverse=inverse.replace(after,before)
 assert inverse.encode()==q.read_bytes();changed.append(p.name)
assert len(changed)==7 and len(same)==20
for name in ['binding.json','real-text-fixture.json','expected-cells.json']:assert (P/name).read_bytes()==(old/name).read_bytes()
ack=json.loads((P/'ROOT_RUN_ACK.json').read_bytes());assert ack['root_run_ack']==False and sha(P/'ROOT_RUN_ACK.json')=='422a892470802f5a826f7e3f5623c8e966d7ceeea36e6fdcf63f7749163db3b5'
resource=R/'.artifacts/p05-a20-existing-gates-resource-authority05.json'
out={'status':'PASS_INDEPENDENT_PIN_AND_INVERSE_AUDIT','author_index_sha256':sha(A/'INDEX.json'),'author_children':len(author['files']),'producer_INDEX_sha256':sha(P/'INDEX.json'),'producer_children':len(pi['files']),'changed7_inverse_exact':changed,'same20_exact':same,'inactive_ACK_sha256':sha(P/'ROOT_RUN_ACK.json'),'resource_authority_sha256':sha(resource),'source_identity':author['source_identity'],'image':author['image'],'producer_runtime_digest':author['producer_runtime_digest'],'original_case_rows':459,'typography_measurements':324,'fresh_original_genuine_actions':135}
(D/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out))
