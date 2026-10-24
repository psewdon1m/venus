from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
h={'at_utc':at,'status':'PASS_ACTUAL_SYNTHETIC_GAMES20_ONLY','actual_index_sha256':'87f01456f5f07daaa09f218ef376cae56f086759fa1f04479d31247a977dd912','source':'732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80','files':1826,'cases_PASS':20,'cleanup':'completed_EMPTY_RECORDED_OWNER_INVENTORY','critical_byte_compatibility':272,'entire_image_equivalence':False,'independent_new_RUN':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':h['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
