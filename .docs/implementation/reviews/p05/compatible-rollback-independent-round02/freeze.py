from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
handoff={'at_utc':at,'status':'PASS_METHOD_ONLY_HISTORICAL_AA_BINDING_NOT_RUN','finding':'P05-ROLLBACK-EXPORT-FAULT-001_CLOSED_FOR_EXACT02','author_index_sha256':'7bbf51fad73bfe3d4629fda38721a3b49b5344f243c8f3f7bdcb681e3a17552a','producer_index_sha256':'5778b19607e31246b1fc222da34f2742b59e5e5bdc215194cba9fd18823dca3a','independent_repeated_author_controls':173,'additional_independent_groups':4,'actual_RUN':False,'root_ACK':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':handoff['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
