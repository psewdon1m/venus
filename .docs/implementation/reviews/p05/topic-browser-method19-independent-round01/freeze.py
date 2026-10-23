from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/topic-browser-method19-author-round01');sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
assert sha((a/'INDEX.json').read_bytes())=='19571371adae56517c12181aee48743e58fbc7fc82cb66123127caf7566c70d8'
idx=read(a/'INDEX.json');assert len(idx['files'])==15
for f in idx['files']:
 b=(a/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
record=read(a/'RECORD.json');previous=read(Path('.docs/implementation/evidence/p05/timing-poll-browser18-chromium-actual03/run/producer-pins.json'))
assert [k for k in record['runtime_pins']if record['runtime_pins'][k]!=previous[k]]==['private-batch-observer.mjs']
for name,pin in record['runtime_pins'].items():assert sha((Path('.artifacts/p05-private-batch-browser-producer19')/name).read_bytes())==pin
author=(a/'p05-method19-controls01.mjs').read_text(encoding='utf-8').replace("await import(process.env.OBSERVER_SOURCE??'./p05-private-batch-browser-producer19/private-batch-observer.mjs')","await import('../../../../../.artifacts/p05-private-batch-browser-producer19/private-batch-observer.mjs')")
(r/'author9-rerun.mjs').write_text(author,encoding='utf-8')
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
for name,file,expected in [('author9-rerun','author9-rerun.mjs',0),('independent-counterexamples','own-body-fault-counterexamples.mjs',1)]:
 args=[node,str(r/file)];p=subprocess.run(args,capture_output=True,timeout=30);(r/(name+'.stdout.txt')).write_bytes(p.stdout);(r/(name+'.stderr.txt')).write_bytes(p.stderr);commands.append({'argv':args,'exit_code':p.returncode,'expected_exit':expected,'stdout':name+'.stdout.txt','stderr':name+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==expected
commands.extend([{'attempt':'inline-counterexample-generation','exit_code':1,'error':'PowerShell ParserError; no code executed','correction':'Generate in owned Python file with exact import relocation only.'},{'attempt':'patch-context','error':'apply_patch context not found; no write','correction':'Read owned file and apply matching context.'}])
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
(r/'HANDOFF.json').write_text(json.dumps({'status':'FINDING_P2_NO_RUN','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'finding':'P05-METHOD19-OWN-RESPONSE-FENCE-001','author_children_verified':15,'runtime_pins_verified':10,'author_current_controls_repeated_PASS':9,'independent_false_ready_counterexamples':3,'method_pass':False,'operational_pass':False,'run_authorization':False,'product_or_producer_writes':False},indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':sha(b)})
(r/'INDEX.json').write_text(json.dumps({'status':'FINDING_P2_NO_RUN','files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'index_sha256':sha((r/'INDEX.json').read_bytes()),'children':len(files),'writes':'COMPLETE'},indent=2))
