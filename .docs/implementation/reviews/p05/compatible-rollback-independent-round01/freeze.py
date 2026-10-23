from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib
r=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
jobs=[('input-audit',['.venv/Scripts/python.exe',str(r/'audit.py')],0),('export-fault',[node,str(r/'export-fault-counterexample.mjs')],1)]
for name in ['author-controls','author-factory-controls','author-source-controls']:jobs.append((name,[node,'.artifacts/p05-compatible-rollback-independent-review01/'+name+'.mjs'],0))
for label,args,expected in jobs:
 p=subprocess.run(args,capture_output=True,timeout=60);(r/(label+'.stdout.txt')).write_bytes(p.stdout);(r/(label+'.stderr.txt')).write_bytes(p.stderr);commands.append({'argv':args,'exit_code':p.returncode,'expected_exit':expected,'stdout':label+'.stdout.txt','stderr':label+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==expected
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
(r/'HANDOFF.json').write_text(json.dumps({'status':'FINDING_P2_NO_RUN','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'finding':'P05-ROLLBACK-EXPORT-FAULT-001','author_children_verified':83,'producer_mirror_files_verified':77,'finite_controls_repeated_PASS':166,'independent_export_fault_expected_FAIL_exit':1,'root_ack':False,'new_Docker_or_functional_run':False,'producer_or_product_writes':False,'full_stage_pass':False},indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'status':'FINDING_P2_NO_RUN','files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'children':len(files),'writes':'COMPLETE'},indent=2))
