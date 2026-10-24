from pathlib import Path
from datetime import datetime,timezone
import hashlib,json
r=Path(__file__).parent;at=datetime.now(timezone.utc).isoformat()
handoff={'at_utc':at,'status':'PASS_SCOPED_PRODUCT_AND_IMAGE_BINDING_AND_METHOD20_OPERATIONAL_REBIND_ONLY','author_index_sha256':'d641b3d8aba90cbdd965ca46b1aa8830513afe1754e673f1dc601acbedbd6128','source_identity':'c454631da2b2ede99241555273a35d7b0b4124c76f30ab3632bf2ba48d540d40','included_files':1825,'image':'sha256:9e1a7ee66230b3b5c362a4f5f08fff6bef04899e10796129392fe7a28ab5e355','outer_sha256':'6ca2dff8b962ed4a870562b46117daa8093549483d4ff446f8aa1e5f35486034','independent_unit_tests':15,'unit_exit':0,'runtime10_unchanged':True,'actual_run':False,'latency_improvement_proven':False,'full_stage_PASS':False,'writes':'COMPLETE'}
(r/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':handoff['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
