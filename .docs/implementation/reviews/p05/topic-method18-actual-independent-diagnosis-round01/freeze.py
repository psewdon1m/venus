from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess
r=Path(__file__).parent
commands=[]
for name,args in [('actual-audit02',['.venv/Scripts/python.exe',str(r/'audit.py')]),('ws-counterexample03',['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe',str(r/'ws-queue-counterexample.mjs')])]:
 p=subprocess.run(args,capture_output=True,timeout=30);(r/(name+'.stdout.txt')).write_bytes(p.stdout);(r/(name+'.stderr.txt')).write_bytes(p.stderr)
 commands.append({'argv':args,'exit_code':p.returncode,'stdout':name+'.stdout.txt','stderr':name+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==0
commands.extend([
 {'attempt':'counterexample01','exit_code':1,'error':'NOT_EXACT_ACTUAL18_SOURCE','reason':'Concurrent root product fix changed live source; fail-closed pin prevented execution. Subsequently reconstructed exact old bytes and verified full SHA91d566be against b244 and Docker beforebytes.'},
 {'attempt':'counterexample02','exit_code':1,'error':'HANDLER_BOUNDARY','reason':'Windows CRLF delimiter; extraction normalization only, source SHA still checks original raw bytes.'},
 {'attempt':'actual-audit01','exit_code':1,'error':'FileNotFoundError DESIGN.md','reason':'Frozen archive names markdown DESIGN.md.bytes; corrected resolver only.'},
 {'attempt':'one-off-read','exit_code':1,'error':'UnicodeDecodeError cp1252','reason':'Safe UTF8 diagnostic read was missing explicit encoding; corrected explicit UTF8. No packet/product mutation.'},
])
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
record={'status':'DIAGNOSIS_COMPLETE_ACTUAL_FAIL_PRESERVED','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'findings':['P05-PRIVATE-ACTION-TTL-001','P05-WS-POLL-STARVATION-001'],'actual_sole_cause':'NOT_ESTABLISHED','source':'b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4','actual_cases':{'PASS':7,'FAIL':1,'NOT_RUN':8},'product_edits':False,'docker_or_browser_runs':False,'stage_pass':False}
(r/'HANDOFF.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'status':record['status'],'files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'children':len(files),'writes':'COMPLETE'},indent=2))
