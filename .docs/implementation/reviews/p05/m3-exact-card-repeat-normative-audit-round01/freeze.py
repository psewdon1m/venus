from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
h={'at_utc':at,'status':'NORMATIVE_AUDIT_COMPLETE_EXACT_CARD_ZERO_RETAINED','source':'732ed8407556c3e39e4060fcb0c4985a03f7ad865a9cf642218b39dde182ad80','files':1826,'inputs':15,'current_session_exact_card_maximum':0,'cross_pair_distinct_card_same_family_allowed':True,'new_reproduced_product_defect':False,'M3_corpus_executed':0,'code_changed':False,'owner_choice_required_for_compatible_intersection':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':h['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
