import json,hashlib,secrets,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
r=Path.cwd();sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
f=inventory();assert identity(f)=='ef009b7c3cf262028bc9dc20c6f06798d125d864ac19bb530e9b038a3701c571'
name='venus-p05-linux-units-'+secrets.token_hex(6);o=r/'.artifacts/p05'/name;o.mkdir()
def save(n,v):(o/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
def run(args,log,timeout=1200):
 with (o/log).open('wb') as stream:q=subprocess.run(['docker',*args],stdout=stream,stderr=subprocess.STDOUT,timeout=timeout)
 if q.returncode:raise RuntimeError(log+' exit '+str(q.returncode))
save('inputs-before.json',{'identity':identity(f),'files':f});print('START '+name,flush=True)
v={'schema_version':1,'created_at':datetime.now(timezone.utc).isoformat(),'status':'FAIL','scope':'LINUX_DOCKER_UNIT_TESTS_NOT_FULL_QUALITY','project':name,'source_identity':identity(f),'included_files':len(f),'command':['tsc -b --force','npm test'],'full_stage_acceptance':False}
try:
 image='sha256:17ab5bf821f60523c882d634ace69b708d999f80a57fc06322dd326a200dfdbb'
 previous=json.loads((r/'.artifacts/p05/venus-p05-linux-units-c1d6294c1583/inputs-before.json').read_bytes());assert previous['files']==f
 v['image']=image;v['image_provenance']='Previous same-source build; maps identical, original image inspect retained in attempt01'
 (o/'image-id.txt').write_text(image+'\n',encoding='utf-8')
 inspect=subprocess.run(['docker','image','inspect',image],capture_output=True,check=True);(o/'image-inspect.json').write_bytes(inspect.stdout)
 print('IMAGE '+image,flush=True)
 run(['run','--rm','--name',name,'--label','venus.p05.project='+name,'--platform','linux/amd64','--network','none','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','2g','--cpus','2','--tmpfs','/tmp:rw,exec,size=512m,mode=1777','--tmpfs','/home/node:rw,size=64m,uid=1000,gid=1000,mode=700',image,'node','--input-type=module','-e',"import{execFileSync}from'node:child_process';execFileSync(process.execPath,['node_modules/typescript/bin/tsc','-b','--force'],{stdio:'inherit'});execFileSync('npm',['test'],{stdio:'inherit'});"],'tests.txt')
 v['status']='PASS';v['observed_exit_code']=0
except Exception as e:v['error']=str(e)
finally:
 try:
  q=subprocess.run(['docker','container','inspect',name],capture_output=True,text=True)
  if q.returncode==0:
   a=json.loads(q.stdout);assert len(a)==1 and a[0]['Config']['Labels'].get('venus.p05.project')==name
   run(['container','rm','--force',name],'forced-cleanup.txt',30)
  else:assert 'No such' in q.stderr
  q=subprocess.run(['docker','ps','-aq','--filter','label=venus.p05.project='+name],capture_output=True,text=True,check=True);assert not q.stdout.strip();save('remaining-containers.json',q.stdout.split());v['cleanup']='completed'
 except Exception as e:v['cleanup']='FAIL';v['cleanup_error']=str(e);v['status']='FAIL'
 after=inventory();save('inputs-after.json',{'identity':identity(after),'files':after});v['source_unchanged']=after==f
 if after!=f:v['status']='FAIL'
 save('runner.json',v);print('TERMINAL '+json.dumps(v),flush=True)
sys.exit(0 if v['status']=='PASS' else 1)
