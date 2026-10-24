from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
h={'at_utc':at,'status':'PASS_SCOPED_TG14_ORACLE_IMAGE_BINDING_AND_METHOD20_REBIND_ONLY','source':'732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80','files':1826,'image':'sha256:e076901479f7b7af94d54ada3698cf69a60d39caf57cf78f311945638f589898','outer_sha256':'5fc8ea5bce8c6348452d5abedfc7c51a734b17b1b10dde6b6bf26219bb00e2f5','independent_inert_oracle_controls':5,'actual_RUN':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':h['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
