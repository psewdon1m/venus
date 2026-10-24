from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib
r=Path(__file__).parent;commands=[]
for name,args in [('actual-audit',['.venv/Scripts/python.exe','-B',str(r/'audit.py')]),('lease-counterexample',['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe',str(r/'lease-counterexample.mjs')])]:
 p=subprocess.run(args,capture_output=True,timeout=30);(r/(name+'.stdout.txt')).write_bytes(p.stdout);(r/(name+'.stderr.txt')).write_bytes(p.stderr);commands.append({'argv':args,'exit_code':p.returncode,'stdout':name+'.stdout.txt','stderr':name+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==0
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
(r/'HANDOFF.json').write_text(json.dumps({'status':'DIAGNOSIS_COMPLETE_PREDICATE_MISMATCH_REPRODUCED_ACTUAL_FAIL_PRESERVED','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'finding':'P05-BROWSER18-ACCEPTED-LEASE-001','finding_scope':'TEST_PREDICATE','chat_status':'HTTP200_VALID_NOT_ERROR','product_defect_proven':False,'actual_counts':{'PASS':5,'FAIL':1,'NOT_RUN':10},'producer_fix':'PENDING_SEPARATE_AUTHOR_REVIEW','new_functional_run':False,'full_stage_pass':False},indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'status':'DIAGNOSIS_COMPLETE_PREDICATE_MISMATCH_REPRODUCED_ACTUAL_FAIL_PRESERVED','files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'children':len(files),'writes':'COMPLETE'},indent=2))
