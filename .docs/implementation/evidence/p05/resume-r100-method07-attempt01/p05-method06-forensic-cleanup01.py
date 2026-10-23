"""Verify immutable tar against a fresh owned native-volume read before cleanup."""
import pathlib,json,hashlib,subprocess,tarfile,datetime,shutil
r=pathlib.Path.cwd();out=r/'.docs/implementation/reviews/p05/r100-method06-forensic-export01';assert not out.exists();out.mkdir()
owner='9111e84fc9e4cbbb6b7bdbbdfc99a278';volume='venus-r100-v3-1fb203e0154f-output';name='venus-r100-v3-1fb203e0154f-forensic';image='sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4';root=r/'.artifacts/p05/r100-v3-1fb203e0154f'
assert shutil.disk_usage(out).free>10*1024**3+128*1024**2
def cmd(args,file,timeout=30):
    p=subprocess.run(['docker',*args],capture_output=True,timeout=timeout);(out/file).write_bytes(p.stdout);assert p.returncode==0,p.stderr.decode(errors='replace')[:512];return p.stdout
def own(file):
    rows=json.loads(cmd(['volume','inspect',volume],file));assert len(rows)==1 and rows[0]['Name']==volume and rows[0]['Labels']['com.venus.measurement.owner']==owner
own('volume-before.json');expected=json.loads((root/'control/receipts/native-inventory.json').read_bytes())['files'];order=lambda rows:sorted(rows,key=lambda x:x['path'])
with tarfile.open(root/'archive/native-prefix.tar','r:') as tar:
    files=[];seen=set()
    for m in tar:
        n=m.name.removeprefix('./').rstrip('/')
        if n in ('','.'):continue
        assert not n.startswith('/') and '..' not in n.split('/') and n not in seen and (m.isfile() or m.isdir());seen.add(n)
        if m.isfile():
            b=tar.extractfile(m).read();assert len(b)==m.size;files.append({'path':n,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
    assert order(files)==order(expected)
script="const fs=require('fs'),p=require('path'),c=require('crypto');let a=[];function walk(d){for(const n of fs.readdirSync(d)){const q=p.join(d,n),s=fs.lstatSync(q);if(s.isDirectory())walk(q);else{if(!s.isFile()||s.isSymbolicLink()||s.size>8388608)throw Error('BAD');const b=fs.readFileSync(q);a.push({path:p.relative('/data',q),bytes:b.length,sha256:c.createHash('sha256').update(b).digest('hex')});if(a.length>512)throw Error('CAP');}}}walk('/data');console.log(JSON.stringify(a));"
args=['run','--rm','--name',name,'--label','com.venus.measurement.owner='+owner,'--pull','never','--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','128m','--cpus','1','--pids-limit','48','--mount','type=volume,source='+volume+',target=/data,readonly',image,'node','-e',script]
try:
    fresh=json.loads(cmd(args,'fresh-native-files.json',60));assert order(fresh)==order(expected)
    (out/'tar-verification.json').write_text(json.dumps({'status':'EXACT_TAR_AND_FRESH_NATIVE_104_FILES_VERIFIED','files':files,'tar_sha256':hashlib.sha256((root/'archive/native-prefix.tar').read_bytes()).hexdigest(),'original_run':'NOT_ACCEPTED'},indent=2)+'\n')
    own('volume-before-removal.json');cmd(['volume','rm',volume],'volume-removal.txt')
    assert not cmd(['volume','ls','-q','--filter','label=com.venus.measurement.owner='+owner],'remaining-volumes.txt').strip()
finally:
    q=subprocess.run(['docker','container','inspect',name],capture_output=True)
    if q.returncode==0:
        x=json.loads(q.stdout)[0];assert x['Name']=='/'+name and x['Image']==image and x['Config']['Labels']['com.venus.measurement.owner']==owner;cmd(['container','rm','--force',name],'owned-helper-cleanup.txt')
    else:assert b'No such' in q.stderr
assert not cmd(['ps','-aq','--filter','label=com.venus.measurement.owner='+owner],'remaining-containers.txt').strip()
(out/'REPORT.md').write_text('# METHOD06 forensic prefix verification and cleanup\n\nAll104 staged tar files match the captured inventory and a fresh read-only native-volume scan. Only after exact verification and immediate owner revalidation was that owned volume removed. No owned containers/volumes remain. No engine/selector rerun; original operational attempt stays NOT_ACCEPTED, not supervised export or stage PASS.\n')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
d={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FORENSIC_PREFIX_VERIFIED_CLEANUP_PASS_ORIGINAL_RUN_NOT_ACCEPTED','files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]}
(out/'INDEX.json').write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({'index':sha(out/'INDEX.json'),'files':len(d['files']),'cleanup':'PASS','original_run':'NOT_ACCEPTED'}))
