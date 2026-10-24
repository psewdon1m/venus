from pathlib import Path
import json,hashlib,datetime
o=Path(__file__).parent;r=Path('C:/.projects/venus');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
assert not (o/'INDEX.json').exists();checks=read(o/'CHECKS.json');assert checks['original_ordered_requirements']==44 and checks['all44_15_9_acceptance_false']
parent=r/'.docs/implementation/evidence/p05/a17-closure-matrix-draft01';assert sha(parent/'INDEX.json')=='b9357befbb4f69aa02069e297b579867c809effa0625f92c0bb2590fcd1ce6f3'
requirements=read(o/'REQUIREMENTS44.json');assert len(requirements['rows'])==44 and all(not x['full_requirement_acceptance'] for x in requirements['rows'])
for group in ['exit_p05','critical_e2e_04_section8']:assert all(not x['acceptance'] for x in read(o/'GATES_AND_E2E.json')[group])
assert all(not x['acceptance'] for x in read(o/'CI_RIP.json')['rows'])
files={p.relative_to(o).as_posix():{'type':'regular_file','bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(o.rglob('*')) if p.is_file() and p.name!='INDEX.json'}
index={'status':'AUTHOR_A18_FACTS_DRAFT_NOT_FINAL_ACCEPTANCE','source_identity':requirements['source_identity'],'included_files':1872,'source_git_commit':'8f16c23a29ca6637ce6ef359fcf76398709549b2','image':'sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616','production_image':'sha256:faffbd1531d2b85c0dc085a8f56800c0f5cae15ee63137ade5be4d11a881431a','original_ordered_requirements':44,'UX':19,'retired':72,'EXIT':5,'E2E':10,'CI':9,'all_acceptance_false':True,'stage_PASS':False,'APP_acceptance':False,'owned_writes':'COMPLETE_STOP','created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files}
(o/'INDEX.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf8');print(json.dumps({'INDEX_sha256':sha(o/'INDEX.json'),'children':len(files),'total_child_bytes':sum(x['bytes'] for x in files.values()),'status':index['status'],'requirements':44,'all_acceptance_false':True}))
