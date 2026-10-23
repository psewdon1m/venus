from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib
r=Path(__file__).parent;commands=[];node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
for label,args in [('audit',['.venv/Scripts/python.exe',str(r/'audit.py')]),('independent-five',[node,str(r/'independent-five-controls.mjs')]),('author13-repeat',[node,str(r/'author13-rerun.mjs')]),('outer-syntax',[node,'--check','.artifacts/p05-timing-poll-browser20-run01.mjs'])]:
 p=subprocess.run(args,capture_output=True,timeout=30);(r/(label+'.stdout.txt')).write_bytes(p.stdout);(r/(label+'.stderr.txt')).write_bytes(p.stderr);commands.append({'argv':args,'exit_code':p.returncode,'stdout':label+'.stdout.txt','stderr':label+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==0
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
(r/'HANDOFF.json').write_text(json.dumps({'status':'PASS_METHOD_ONLY_AND_OPERATIONAL_REBIND_ONLY','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'closed_finding':'P05-METHOD19-OWN-RESPONSE-FENCE-001','independent_previous_counterexamples_now_PASS':3,'independent_stale_response_controls_PASS':2,'author13_repeated_PASS':13,'source_identity':'aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee','source_count':1823,'image':'sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5','observer_sha256':'adc56af2e11c684fc8839b19f1c4f064424278a8697c5b2592c42ba400f5adb0','outer_sha256':'11c8e6f7ae91a61c901b141962be70dcd125a03b3d62f58d85400f9893d6eac1','actual_browser':'NOT_RUN','run_authorized':False,'full_stage_pass':False},indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'status':'PASS_METHOD_ONLY_AND_OPERATIONAL_REBIND_ONLY','files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'children':len(files),'writes':'COMPLETE'},indent=2))
