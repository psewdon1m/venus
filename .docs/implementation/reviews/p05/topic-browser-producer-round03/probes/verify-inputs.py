from pathlib import Path
import json,hashlib,sys
root=Path.cwd();base=root/'.artifacts/p05-topic-browser';out=root/'.artifacts/p05-topic-browser-review-round03';handoff=json.loads((base/'HANDOFF.json').read_text())
for n,d in handoff['pins'].items():assert hashlib.sha256((base/n).read_bytes()).hexdigest()==d,n
assert hashlib.sha256((root/'tests/p05-topic-lifecycle/harness.mjs').read_bytes()).hexdigest()==handoff['harness_sha256'];sys.path.insert(0,str(root/'tools'));from stage_inventory import inventory,identity
files=inventory();assert identity(files)==handoff['source_identity'] and len(files)==1808
raw=(root/'tests/p05-topic-lifecycle/harness.mjs').read_text();replacements=[('new PrivateTopicPreferences(rooms,registry,pins)','new PrivateTopicPreferences(rooms,registry,pins,source.map.topics)'),('privateTopics:preferences,logger:false',"privateTopics:preferences,roomCreationProtocol:2,staticRoot:resolve('apps/web/dist'),logger:false")]
for a,b in replacements:assert raw.count(a)==1;raw=raw.replace(a,b)
result={'source_identity':identity(files),'included_files':len(files),'harness_sha256':handoff['harness_sha256'],'derivative_sha256':hashlib.sha256(raw.encode()).hexdigest(),'exact_two_replacements':True,'producer_pins':handoff['pins'],'image_expected':handoff['image']};(out/'verified-inputs-before.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='producer_pins'},indent=2))
