from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,subprocess,os
r=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
env=os.environ.copy();env['PATH']=str(Path('.venv/Scripts').resolve())+os.pathsep+str(Path(node).parent)+os.pathsep+env['PATH']
commands=[]
for label,args in [('author-byte-audit',[str(Path('.venv/Scripts/python.exe')),str(r/'audit.py')]),('final-binding-audit',[str(Path('.venv/Scripts/python.exe')),str(r/'audit-final.py')]),('independent-boundaries',[node,str(r/'boundaries.mjs')]),('existing-unit-repeat',[node,'node_modules/vitest/vitest.mjs','run','apps/api/src/topic-action-consent.test.ts','apps/api/src/room-socket-poll.test.ts','--reporter=dot']),('outer-syntax',[node,'--check','.artifacts/p05-timing-poll-browser18-run03.mjs'])]:
 p=subprocess.run(args,capture_output=True,timeout=60,env=env);(r/(label+'.stdout.txt')).write_bytes(p.stdout);(r/(label+'.stderr.txt')).write_bytes(p.stderr)
 commands.append({'label':label,'argv':args,'exit_code':p.returncode,'stdout':label+'.stdout.txt','stderr':label+'.stderr.txt','at_utc':datetime.now(timezone.utc).isoformat()});assert p.returncode==0
commands.extend([{'label':'boundaries01','exit_code':1,'error':'AssertionError line-ending delimiter','correction':'Frozen TS member uses LF, not assumed CRLF; exact single insertion removal then whole member equality passed.'},{'label':'final-audit01','exit_code':1,'error':'KeyError source_identity_sha256','correction':'Games20 inputs use identity; corrected representation lookup and still require exact full files+identity.'},{'label':'final-audit02','exit_code':1,'error':'FileNotFoundError Docker-built web output filename on host','correction':'Verify web output against actual prior/new image maps; do not conflate host Vite output names. All64 compiled files independently match host.'}])
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
for src,dst in [('.artifacts/p05-timing-poll-browser18-binding-draft03.json','browser-binding-draft03.json'),('.artifacts/p05-timing-poll-browser18-run03.mjs','browser-outer03.mjs.bytes'),('.docs/implementation/reviews/p05/timing-poll-product-author-round02/image-binding.json','image-binding02.json'),('.docs/implementation/reviews/p05/timing-poll-product-author-round02/source-freeze.json','source-freeze02.json')]:
 (r/dst).write_bytes(Path(src).read_bytes())
handoff={'status':'PASS_SCOPED_PRODUCT_AND_ACTUAL_CORE_AND_OPERATIONAL_REBIND_ONLY','writes':'COMPLETE','at_utc':datetime.now(timezone.utc).isoformat(),'verdicts':{'product_fixes':'PASS_SCOPED_PRODUCT_FIXES','actual_games20':'PASS_ACTUAL_GAMES20_CORE_ONLY','browser18_rebinding':'PASS_OPERATIONAL_BROWSER18_REBIND_ONLY'},'source_identity':'aa1205be262b4ba56374f992481723d68363ff7aa16c28729d4b19d2aac896ee','included_files':1823,'image':'sha256:ef5f432ae3e89b5ef63aef3bc3fb1511208a5be2db559cf801e5dc4f6f243ba5','runtime_helpers_unchanged':10,'independent_existing_units_pass':8,'independent_additional_negative_boundaries_pass':9,'actual_games20_pass':20,'findings':[],'browser_actual_on_current_source':'NOT_RUN','run_authorization':False,'full_stage_acceptance':False,'human_HOLD_preserved':True,'actual18_sole_cause':'NOT_ESTABLISHED'}
(r/'HANDOFF.json').write_text(json.dumps(handoff,indent=2)+'\n',encoding='utf-8')
files=[]
for f in sorted(r.rglob('*')):
 if f.is_file() and f.name!='INDEX.json':
  b=f.read_bytes();files.append({'path':f.relative_to(r).as_posix(),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
(r/'INDEX.json').write_text(json.dumps({'status':handoff['status'],'files':files},indent=2)+'\n',encoding='utf-8')
print(json.dumps({'writes':'COMPLETE','index_sha256':hashlib.sha256((r/'INDEX.json').read_bytes()).hexdigest(),'children':len(files)},indent=2))
