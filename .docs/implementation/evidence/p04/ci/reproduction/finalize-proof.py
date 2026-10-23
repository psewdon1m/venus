"""Bind actual independent reports, then execute both gate scopes honestly."""
import hashlib,json,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone

root=Path(sys.argv[1]).resolve()
directory=root/'.docs/implementation/evidence/p04/ci'
def desc(path):
    return {'path':path.relative_to(root).as_posix(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def save(path,value):
    with path.open('x',encoding='utf-8',newline='\n') as stream:
        json.dump(value,stream,ensure_ascii=False,indent=2);stream.write('\n')

packet=json.loads((directory/'technical-packet-template.json').read_bytes())
packet.pop('assembly_state')
packet['protection']=desc(directory/'main-protection.json')
packet['reviews']=[desc(root/'.docs/implementation/reviews/p04'/name) for name in ['final-implementation.json','final-evidence.json']]
path=directory/'technical-gate.json'
save(path,packet)
checks=[]
for command,name,expected in [('verify-technical','technical-verification.txt',0),('verify','full-exit-verification.txt',1)]:
    args=[sys.executable,'-B','tools/p04_gate.py',command,'--packet',path.relative_to(root).as_posix()]
    result=subprocess.run(args,cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    out=directory/name
    with out.open('xb') as stream:stream.write(result.stdout)
    print(result.stdout.decode('utf-8'),end='')
    checks.append({'command':args[2:],'actual_exit_code':result.returncode,'output':desc(out)})
    assert result.returncode==expected,(command,result.returncode)
    if command=='verify':assert b'EXIT-P04 human/editorial/rights evidence remains missing' in result.stdout
save(directory/'gate-evaluation.json',{'schema_version':1,'evaluated_at_utc':datetime.now(timezone.utc).isoformat(),'source_sha':packet['source_sha'],'source_identity_sha256':packet['source_identity_sha256'],'technical_packet':desc(path),'technical_scope':'P04-TECHNICAL-1','technical_status':'PASSED','full_gate':'EXIT-P04','full_gate_status':'BLOCKED_EXTERNAL','blockers':['P04-HUMAN-REVIEW: real competent editorial/safety/rights/RU/EN/TR decisions and reconstructed reviewed pack missing'],'checks':checks,'public_release_authorized':False})
