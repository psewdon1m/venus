from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
def verify(root,pin,count):
 assert sha((root/'INDEX.json').read_bytes())==pin;idx=read(root/'INDEX.json');assert len(idx['files'])==count
 for f in idx['files']:
  b=(root/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
a1=Path('.docs/implementation/reviews/p05/topic-browser-method20-author-round01');a2=Path('.docs/implementation/reviews/p05/topic-browser-method20-author-round02');old=Path('.docs/implementation/reviews/p05/topic-browser-method19-author-round01')
verify(a1,'e270d48b956a716313e52d0fa15e1f3f6c390a6c60dc5b7925741620cb18d170',14);verify(a2,'8381104847bcb52073539f68123484583cb0b775f3c9b9b514f16ca1d7686633',8);verify(old,'19571371adae56517c12181aee48743e58fbc7fc82cb66123127caf7566c70d8',15)
record=read(a2/'RECORD.json');working=Path('.artifacts/p05-private-batch-browser-producer20');oldpins=read(old/'RECORD.json')['runtime_pins']
assert [k for k in record['runtime_pins']if record['runtime_pins'][k]!=oldpins[k]]==['private-batch-observer.mjs']
for k,v in record['runtime_pins'].items():assert sha((working/k).read_bytes())==v
before=(old/'observer19.mjs.bytes').read_text(encoding='utf-8');after=(a2/'observer20-round02.mjs.bytes').read_text(encoding='utf-8')
expected=before.replace("complete:false,reason:'BATCH_INCOMPLETE'","complete:false,ownResponseArrived:false,reason:'BATCH_INCOMPLETE'").replace("   const work=(async()=>{","   if(record.route.kind==='own'&&record.batch){record.batch.ownResponseArrived=true;if(record.batch===s.batch)s.accepted=null;}\n   const work=(async()=>{").replace("!s.batch.own&&s.batch.reason!=='HTTP_REJECTED'","!s.batch.ownResponseArrived&&s.batch.reason!=='HTTP_REJECTED'")
assert expected==after and sha((a2/'observer20-round02.mjs.bytes').read_bytes())=='adc56af2e11c684fc8839b19f1c4f064424278a8697c5b2592c42ba400f5adb0'
outer=Path('.artifacts/p05-timing-poll-browser20-run01.mjs');assert sha(outer.read_bytes())==record['outer_sha256']=='11c8e6f7ae91a61c901b141962be70dcd125a03b3d62f58d85400f9893d6eac1'
previous=Path('.artifacts/p05-timing-poll-browser18-run03.mjs').read_text(encoding='utf-8')
assert previous.replace('p05-private-batch-browser-producer18','p05-private-batch-browser-producer20').replace('p05-timing-poll-browser18-root-ack03.json','p05-timing-poll-browser20-root-ack01.json')==outer.read_text(encoding='utf-8')
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert identity(current)==record['source_identity']=='aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee' and len(current)==record['source_files']==1823
assert record['image']=='sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5'
out={'status':'PASS_METHOD_ONLY_AND_OPERATIONAL_REBIND_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'author20_intermediate_children':14,'author20_final_children':8,'prior19_children':15,'runtime_pins':record['runtime_pins'],'source_identity':record['source_identity'],'source_entries':1823,'image':record['image'],'outer_sha256':record['outer_sha256'],'closed_finding':'P05-METHOD19-OWN-RESPONSE-FENCE-001','exact_runtime_change':'Only batch ownResponseArrived field, synchronous current-own-response accepted retirement, snapshot response-arrival condition. No model.clear added.','outer_diff':'ONLY_PRODUCER_AND_ROOT_ACK_PATHS_VS_ACCEPTED_AA_EF5_OUTER','actual_browser_current_method':'NOT_RUN','run_authorization':False,'full_stage_pass':False}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
