from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess
r=Path(__file__).parent;c=Path('.docs/implementation/evidence/p05/topic-map-r4-candidate-01');read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
commands=[]
for label,args in [('independent-binding-audit',['.venv/Scripts/python.exe','-B',str(r/'audit.py')]),('existing-package-check',['.venv/Scripts/python.exe','-B',str(c/'package_candidate.py'),'--check']),('existing-validator',['.venv/Scripts/python.exe','-B',str(c/'validate_candidate.py')])]:
 p=subprocess.run(args,capture_output=True,timeout=30);(r/(label+'.stdout.txt')).write_bytes(p.stdout);(r/(label+'.stderr.txt')).write_bytes(p.stderr)
 commands.append({'label':label,'argv':args,'exit_code':p.returncode,'stdout':label+'.stdout.txt','stderr':label+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==0
commands.extend([{'attempt':'one-off-read','exit_code':1,'error':'UnicodeEncodeError cp1252 stdout','correction':'Explicit UTF8 output only.'},{'attempt':'independent-audit01','exit_code':1,'error':'FileNotFoundError duplicate r4 prefix','correction':'r4 manifest path is workspace-relative.'},{'attempt':'independent-audit02','exit_code':1,'error':'KeyError provenance','correction':'Card authoring field is the provenance hash payload.'},{'attempt':'independent-audit03','exit_code':1,'error':'KeyError space in TSV shorthand','correction':'Ignore whitespace separators, still reject unknown non-whitespace topic codes and require exact tag-set/rationale equality.'}])
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
m=read(c/'private-topic-map.candidate.v1.json');ids={v['id']for v in read(c/'reading160.json')};dispositions=[]
for e in m['entries']:
 if e['card_id'] not in ids:continue
 projection={k:e[k]for k in ['card_id','card_revision','card_sha256','card_raw_sha256','topic_ids','rationale','locale_review']}
 dispositions.append({'card_id':e['card_id'],'topic_projection_sha256':sha(json.dumps(projection,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()),'disposition':'P05-R4-TOPIC-ENOUGHNESS-001'if e['card_id']=='YB-1175'else'NO_ADDITIONAL_TOPIC_FINDING_IN_AGENT_READ','languages':['ru','en','tr'],'all_sides_read':True,'human_approval':False,'full_semantic_acceptance':False})
(r/'review-dispositions160.json').write_text(json.dumps(dispositions,indent=2)+'\n',encoding='utf-8')
handoff={'status':'MECHANICAL_BINDINGS_PASS_TOPIC_FINDING_OPEN_FULL_SEMANTIC_REVIEW_PENDING','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'candidate_index_sha256':'b3a62c3c9a97744010b50a95f575ca3f2a3f1d37800e6744c04ca65fbc482244','findings':['P05-R4-TOPIC-ENOUGHNESS-001'],'reviewed_changed_or_new_topic_entries':160,'exact_text_transfer_count':310,'semantics02':'PENDING_FROZEN_HANDOFF','full_map_semantic_pass':False,'runtime_activation':False,'human_HOLD':True}
(r/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':sha(b)})
(r/'INDEX.json').write_text(json.dumps({'status':handoff['status'],'files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':sha((r/'INDEX.json').read_bytes()),'children':len(files),'writes':'COMPLETE'},indent=2))
