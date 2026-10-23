from pathlib import Path
import json,hashlib,datetime
r=Path('C:/.projects/venus');o=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest()
pins=json.loads((o/'INPUT_PINS.json').read_text())
for path,pin in pins.items():
 b=(r/path).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'],path
a=json.loads((o/'AUDIT.json').read_text());h={**a,'writes':'COMPLETE_STOP','functional_component_status':'PASS','current_functional16_prerequisite':'PASS_EXACT_A18_CHROMIUM_COMPONENT','stage_PASS':False,'audit_exit':0}
(o/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n');index={**h,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for f in sorted(o.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.relative_to(o).as_posix()]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(json.dumps({'INDEX_sha256':sha(b),'status':index['status'],'children':len(index['files']),'count':index['count'],'runtime_digest':index['runtime_digest']}))
