from pathlib import Path
import json,hashlib,datetime
r=Path('C:/.projects/venus');o=Path(__file__).parent;sha=lambda b:hashlib.sha256(b).hexdigest()
for path,pin in json.loads((o/'INPUT_PINS.json').read_text()).items():
 b=(r/path).read_bytes();assert len(b)==pin['bytes'] and sha(b)==pin['sha256'],path
a=json.loads((o/'AUDIT.json').read_text());h={**a,'writes':'COMPLETE_STOP','audit_exit':0,'diagnostic_only':True,'runtime_count':27,'source_binding_status':'PASS_STATIC_UNCHANGED_A18_IMAGE_BROWSER26_COMPONENT_BOUND','original_layout01_failure_retained':True}
(o/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n');index={**h,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':{}}
for f in sorted(o.iterdir()):
 if f.is_file() and f.name!='INDEX.json':index['files'][f.name]={'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
assert not (o/'INDEX.json').exists();b=(json.dumps(index,indent=2)+'\n').encode();(o/'INDEX.json').write_bytes(b);print(json.dumps({'INDEX_sha256':sha(b),'children':len(index['files']),'status':index['status'],'producer_runtime_digest':index['producer_runtime_digest']}))
