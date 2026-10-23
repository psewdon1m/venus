"""Read-only image-byte probe; no imports of application modules, mounts or network."""
from pathlib import Path
import subprocess,json,hashlib,secrets,datetime,shutil

OUT=Path(__file__).parent.resolve(); B=json.loads((OUT/'BINDING.json').read_bytes()); owner=secrets.token_hex(16)
rows=[];maps={};inspections={}
def run(args,cap=512*1024):
    r=subprocess.run(['docker',*args],capture_output=True,timeout=45)
    assert len(r.stdout)+len(r.stderr)<=cap
    rows.append({'arguments':args,'exit_code':r.returncode,'stdout':r.stdout.decode(errors='replace'),'stderr':r.stderr.decode(errors='replace')})
    assert r.returncode==0,rows[-1]
    return r.stdout
code="""const fs=require('fs'),p=require('path'),c=require('crypto'),a=require('assert/strict');a(!fs.readFileSync('/proc/self/mountinfo','utf8').split('\\n').some(l=>l.split(' ')[4]==='/dev/shm'));const pins=JSON.parse(process.argv[1]),files={};function hash(n){const q=p.resolve('/app',n);a.equal(fs.realpathSync(q),q);a(fs.lstatSync(q).isFile());files[n]=c.createHash('sha256').update(fs.readFileSync(q)).digest('hex');}a.equal(Object.keys(pins).length,64);for(const[n,h]of Object.entries(pins)){hash(n);a.equal(files[n],h,n);}for(const d of ['apps/api/migrations','apps/api/game-migrations','apps/api/catalog-migrations','apps/api/chat-migrations','apps/api/private-topic-migrations','apps/web/dist/assets'])for(const n of fs.readdirSync('/app/'+d).sort()){a(/^[A-Za-z0-9._-]+$/.test(n));hash(d+'/'+n);}hash('apps/web/dist/index.html');let metadata=null;if(fs.existsSync('/app/build-metadata.json')){metadata=JSON.parse(fs.readFileSync('/app/build-metadata.json'));a.equal(typeof metadata.version,'string');a.equal(typeof metadata.source_revision,'string');hash('build-metadata.json');}console.log(JSON.stringify({files,metadata,metadata_absent:metadata===null,compiled64:true}));"""
status='FAIL'
try:
    assert shutil.disk_usage(OUT).free>=10*1024**3+512*1024**2
    for key,image in B['images'].items():
        inspected=json.loads(run(['image','inspect',image]))[0];assert inspected['Id']==image
        inspections[key]={'Id':inspected['Id'],'RepoDigests':inspected.get('RepoDigests'),'Config.Labels':inspected['Config'].get('Labels'),'RootFS':inspected['RootFS']}
        name='venus-oci-readonly-'+owner[:12]+'-'+key.lower()
        args=['create','--ipc','none','--name',name,'--label','com.venus.oci.probe.owner='+owner,'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','128m','--cpus','0.5','--pids-limit','32','--log-driver','none','--entrypoint','node',image,'-e',code,json.dumps(B['compiled_files'],separators=(',',':'))]
        try:
            run(args)
            obj=json.loads(run(['inspect',name]))[0]
            assert obj['Image']==image and obj['Name']=='/'+name and obj['Config']['Labels']['com.venus.oci.probe.owner']==owner
            assert obj['HostConfig']['IpcMode']=='none'
            assert obj['Mounts']==[] and obj['HostConfig']['ReadonlyRootfs'] and obj['HostConfig']['NetworkMode']=='none'
            maps[key]=json.loads(run(['start','-a',name]));obj=json.loads(run(['inspect',name]))[0]
            assert not obj['State']['Running'] and obj['State']['ExitCode']==0
        finally:
            obj=json.loads(run(['inspect',name]))[0]
            assert obj['Image']==image and obj['Config']['Labels']['com.venus.oci.probe.owner']==owner
            if obj['State']['Running']:run(['kill',name])
            run(['rm',name])
    assert run(['ps','-aq','--no-trunc','--filter','label=com.venus.oci.probe.owner='+owner]).strip()==b''
    status='READ_ONLY_IMAGE_BYTE_MAPS_PASS'
finally:
    packet={'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'owner':owner,'images':B['images'],'maps':maps,'inspections':inspections,'functional_RUN':False,'application_imports':0,'network':'none','mounts':[],'builds':0,'pulls':0,'commands':rows}
    target=OUT/'actual-image-maps.json';assert not target.exists();target.write_text(json.dumps(packet,indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':status,'maps':{k:len(v['files']) for k,v in maps.items()},'metadata_absent':{k:v['metadata_absent'] for k,v in maps.items()},'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}))
