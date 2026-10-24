from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,hashlib,secrets,sys
r=Path.cwd();sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory
ctx=json.loads((r/'.artifacts/p05-renewal-freeze-context01.json').read_bytes());assert inventory()==ctx['files']
image='sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4'
owner=secrets.token_hex(16);name='venus-p05-observer-pin-'+owner[:12];out=r/'.artifacts/p05-observer-image-probe01';out.mkdir()
sources=['apps/web/src/topic-state.ts','apps/web/src/presentation-clock.ts','apps/web/src/game-controls.ts','apps/web/src/game-state.ts']
registration={'created_at':datetime.now(timezone.utc).isoformat(),'purpose':'READONLY_OBSERVER_SOURCE_PINS_NOT_FUNCTIONAL_RUN','owner':owner,'name':name,'image':image,'files':sources,'source_identity':ctx['identity']}
(out/'registration.json').write_text(json.dumps(registration,indent=2)+'\n',encoding='utf8');calls=[]
def docker(args,allow=False):
    p=subprocess.run(['docker',*args],capture_output=True,text=True,encoding='utf8',timeout=30)
    calls.append({'argv':args,'exit_code':p.returncode,'stdout':p.stdout,'stderr':p.stderr})
    if not allow:assert p.returncode==0,(args[0],p.returncode)
    return p
status='FAIL';created=False;cleanup='NOT_RUN'
try:
    info=json.loads(docker(['image','inspect',image]).stdout)[0];assert info['Id']==image
    js="const fs=require('node:fs'),c=require('node:crypto'),files="+json.dumps(sources)+";console.log(JSON.stringify(Object.fromEntries(files.map(p=>[p,c.createHash('sha256').update(fs.readFileSync('/app/'+p)).digest('hex')]))));"
    docker(['create','--name',name,'--label','com.venus.p05.observer.owner='+owner,'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','128m','--cpus','1','--pids-limit','32','--log-driver','none',image,'node','-e',js]);created=True
    detail=json.loads(docker(['inspect',name]).stdout)[0]
    assert detail['Image']==image and detail['Config']['Labels']['com.venus.p05.observer.owner']==owner
    assert detail['HostConfig']['ReadonlyRootfs'] and not detail['Mounts']
    pins=json.loads(docker(['start','-a',name]).stdout)
    assert pins=={p:hashlib.sha256((r/p).read_bytes()).hexdigest() for p in sources}
    terminal=json.loads(docker(['inspect',name]).stdout)[0];assert terminal['State']['ExitCode']==0 and not terminal['State']['OOMKilled']
    (out/'pins.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf8');status='PASS'
finally:
    try:
        if created:
            detail=json.loads(docker(['inspect',name]).stdout)[0];assert detail['Image']==image and detail['Config']['Labels']['com.venus.p05.observer.owner']==owner
            docker(['rm',name])
        assert not docker(['ps','-aq','--filter','label=com.venus.p05.observer.owner='+owner]).stdout.strip();cleanup='PASS'
    finally:
        assert inventory()==ctx['files']
        (out/'calls.json').write_text(json.dumps(calls,indent=2)+'\n',encoding='utf8')
        (out/'result.json').write_text(json.dumps({**registration,'status':status,'cleanup':cleanup,'source_unchanged':True,'functional_run':False,'Docker_calls':len(calls)},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':status,'cleanup':cleanup,'image':image,'source_pins':len(sources)}))
