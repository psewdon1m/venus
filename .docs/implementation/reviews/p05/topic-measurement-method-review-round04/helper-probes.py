"""Finite explicitly registered helpers; never producer/selector/R100/prepare/run."""
import json,hashlib,subprocess,time,datetime
from pathlib import Path
ROOT=Path.cwd().resolve();OUT=Path(__file__).parent;reg=json.loads((OUT/'OWNED_RESOURCES.json').read_bytes());owner=reg['owner'];prefix=reg['container_prefix'];volume=reg['volume'];image=reg['image'];rows=[];created=[];volume_created=False
snap=Path(reg['snapshot_directory']);snap.mkdir(exist_ok=False)
source=ROOT/'.docs/implementation/reviews/p05/topic-measurement-method-preparation-round04/exact-source/r100-v3-volume.mjs.bytes'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='4d6d570a6b3b7a21787a6516990812b8146011568b77843d8686ccca60e996fc'
(snap/'r100-v3-volume.mjs').write_bytes(source.read_bytes())
def docker(args,timeout=30,allow_failure=False):
    t=time.monotonic();r=subprocess.run(['docker',*args],capture_output=True,timeout=timeout)
    assert len(r.stdout)+len(r.stderr)<=65536,'HELPER_CAPTURE_BOUND'
    row={'arguments':args,'exit_code':r.returncode,'stdout':r.stdout.decode('utf8',errors='replace'),'stderr':r.stderr.decode('utf8',errors='replace'),'wall_ms':(time.monotonic()-t)*1000};rows.append(row)
    if not allow_failure:assert r.returncode==0,row
    return r
def inspect_container(name):
    obj=json.loads(docker(['inspect',name]).stdout)[0]
    assert obj['Name']=='/'+name and obj['Config']['Labels']['com.venus.measurement.owner']==owner and obj['Image']==image
    return obj
def inspect_volume():
    obj=json.loads(docker(['volume','inspect',volume]).stdout)[0]
    assert obj['Name']==volume and obj['Driver']=='local' and obj['Labels']['com.venus.measurement.owner']==owner and obj.get('Options') in (None,{})
    return obj
def helper(number,user,args,positive=True,root=False):
    name=prefix+'-helper'+str(number)
    command=['create','--name',name,'--label','com.venus.measurement.owner='+owner,'--label','com.venus.measurement.purpose='+reg['purpose'],'--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--memory','128m','--cpus','1','--pids-limit','48','--log-driver','none','--user',user]
    if root:command+=['--cap-add','CHOWN']
    command+=['--mount','type=volume,src='+volume+',dst=/venus-output,volume-nocopy=true','--mount','type=bind,src='+str(snap.resolve())+',dst=/review,readonly','--entrypoint','node',image,*args]
    docker(command);created.append(name);obj=inspect_container(name)
    mount=next(m for m in obj['HostConfig']['Mounts'] if m['Target']=='/venus-output');assert mount['VolumeOptions']['NoCopy'] is True
    result=docker(['start','-a',name],allow_failure=True);obj=inspect_container(name);assert not obj['State']['Running']
    assert (obj['State']['ExitCode']==0)==positive
    docker(['rm',name]);created.remove(name)
    return result
status='NOT_ACCEPTED'
try:
    assert not docker(['ps','-aq','--filter','name='+prefix]).stdout.strip()
    assert not docker(['volume','ls','-q','--filter','name='+volume]).stdout.strip()
    assert not docker(['ps','-aq','--filter','label=com.venus.measurement.owner='+owner]).stdout.strip()
    docker(['volume','create','--driver','local','--label','com.venus.measurement.owner='+owner,'--label','com.venus.measurement.purpose='+reg['purpose'],volume]);volume_created=True;inspect_volume()
    bindings=['--owner='+owner,'--volume='+volume,'--image='+image]
    boot=helper(1,'0:0',['/review/r100-v3-volume.mjs','--bootstrap',*bindings],root=True)
    probe=helper(2,'1000:1000',['/review/r100-v3-volume.mjs','--probe',*bindings])
    helper(3,'0:0',['/review/r100-v3-volume.mjs','--probe',*bindings],positive=False)
    helper(4,'1000:1000',['-e',"require('node:fs').writeFileSync('/venus-output/inert.bin',Buffer.from('TEST'),{flag:'wx'});console.log('INERT_4_BYTES_CREATED');"])
    helper(5,'1000:1000',['/review/r100-v3-volume.mjs','--probe',*bindings],positive=False)
    helper(6,'1000:1000',['-e',"const fs=require('node:fs'),crypto=require('node:crypto');const b=fs.readFileSync('/venus-output/inert.bin');if(b.toString()!=='TEST')throw Error('TEST_BYTES_CHANGED');console.log(JSON.stringify({bytes:b.length,sha256:crypto.createHash('sha256').update(b).digest('hex')}));fs.unlinkSync('/venus-output/inert.bin');if(fs.readdirSync('/venus-output').length)throw Error('NOT_EMPTY');"])
    status='PASS_REGISTERED_HELPERS_ONLY_NOT_R100'
finally:
    for name in list(created):
        obj=inspect_container(name)
        if obj['State']['Running']:docker(['kill',name])
        inspect_container(name);docker(['rm',name])
    if volume_created:inspect_volume();docker(['volume','rm',volume])
    remaining_containers=docker(['ps','-aq','--filter','label=com.venus.measurement.owner='+owner]).stdout.decode().strip()
    remaining_volumes=docker(['volume','ls','-q','--filter','label=com.venus.measurement.owner='+owner]).stdout.decode().strip()
    assert not remaining_containers and not remaining_volumes
    result={'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'registered_owner':owner,'image':image,'actual_helpers':6,'all_commands':rows,'remaining_owned_containers':remaining_containers,'remaining_owned_volumes':remaining_volumes,'cleanup':'PASS_EXACT_OWNED_RESOURCES_ONLY','selector_invocations':0,'R100_attempts':0,'statistics_RUN':False}
    (OUT/'helper-probes-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8');print(json.dumps({k:v for k,v in result.items() if k!='all_commands'}))
