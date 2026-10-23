from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,subprocess
r=Path(__file__).parent
result=subprocess.run(['.venv/Scripts/python.exe',str(r/'audit.py')],capture_output=True,text=True)
(r/'audit-command.txt').write_text(result.stdout+result.stderr+f'\nexit_code={result.returncode}\n',encoding='utf-8')
assert result.returncode==0
at=datetime.now(timezone.utc).isoformat()
handoff={'at_utc':at,'status':'DIAGNOSIS_COMPLETE_ACTUAL_FAIL_PRESERVED','writes':'COMPLETE','report':'REPORT.md','actual_index':'1521e7b6f94e12d9e8627a4d338cc45bedb2d9c5539d10e66073df04adcc18ed','new_functional_run':False,'full_stage_pass':False}
(r/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':handoff['status'],'files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'files':len(files),'writes':'COMPLETE'}))
