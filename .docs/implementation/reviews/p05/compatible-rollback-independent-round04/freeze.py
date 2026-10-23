from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
h={'at_utc':at,'status':'PASS_OPERATIONAL_OCI04_REBIND_ONLY_NOT_RUN','producer_index_sha256':'10659a29e2d60f90dfe952d991a29435f20e51f059dd6b4227a18e1b989df666','source':'732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80','files':1826,'accepted02_MJS_equal':23,'A_B_full_anchors_each':76,'binding_controls':9,'actual_RUN':False,'root_ACK':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':h['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
