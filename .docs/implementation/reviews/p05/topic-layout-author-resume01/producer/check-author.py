"""Bounded author controls only. No functional Docker/browser execution."""
from pathlib import Path
import subprocess
import json
import datetime
import hashlib

ROOT=Path('.artifacts/p05-v2-layout-producer-resume01')
NODE='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
attempt=1
while (ROOT/f'author-checks-attempt{attempt:02}.json').exists():
    attempt+=1
rows=[]
for path in sorted(ROOT.glob('*.mjs')):
    cmd=[NODE,'--check',str(path)]
    proc=subprocess.run(cmd,capture_output=True,text=True,timeout=30,check=False)
    rows.append({'scope':'SYNTAX_NO_EXECUTION','argv':cmd,'exit_code':proc.returncode,'stdout':proc.stdout,'stderr':proc.stderr})
for name in ['contract-controls.mjs','author-controls.mjs','keyboard-replay.mjs','runner-replay.mjs']:
    path=ROOT/name
    proc=subprocess.run([NODE,str(path)],capture_output=True,text=True,timeout=45,check=False)
    output=ROOT/f'{name}.attempt{attempt:02}.txt'
    output.write_text(proc.stdout+proc.stderr,encoding='utf-8')
    data=None
    if proc.returncode==0:
        data=json.loads(proc.stdout)
    rows.append({'scope':'AUTHOR_INERT_CONTROLS_NO_FUNCTIONAL_RUN','argv':[NODE,str(path)],'exit_code':proc.returncode,'output':output.name,'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'checks':data.get('count') if data else None})
failed=[r for r in rows if r['exit_code']!=0]
result={'status':'FAIL' if failed else 'PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'rows':rows,'functional_run':False}
(ROOT/f'author-checks-attempt{attempt:02}.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':result['status'],'commands':len(rows),'failed':[r.get('argv') for r in failed],'attempt':attempt}))
raise SystemExit(1 if failed else 0)
