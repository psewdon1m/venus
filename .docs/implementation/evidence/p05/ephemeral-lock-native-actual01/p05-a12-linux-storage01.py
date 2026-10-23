from pathlib import Path
import json,hashlib,subprocess,datetime,secrets
r=Path('C:/.projects/venus');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();f=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze09.json').read_text());receipt=r/'.artifacts/p05-pilot-bundle-image-binding09/receipt.json';binding=json.loads(receipt.read_text());assert binding['source_identity']==f['identity']
files=['apps/api/src/private-topic-ledger.test.ts','apps/api/src/topic-room-lifecycle.test.ts','apps/api/src/topic-ephemeral-lock.test.ts'];source=Path(f['materialized_root']);assert all(sha(source/n)==f['files'][n]for n in files+['vitest.config.ts'])
out=r/'.artifacts/p05-a12-linux-storage01';assert not out.exists();out.mkdir();name='venus-p05-a12-storage-'+secrets.token_hex(6);label='venus.p05.storage='+name
cmd=['create','--name',name,'--label',label,'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','2g','--memory-swap','2g','--cpus','2','--pids-limit','128','--tmpfs','/tmp:rw,exec,size=512m,mode=1777','--tmpfs','/app/node_modules/.vite:rw,size=128m,uid=1000,gid=1000,mode=700','--mount','type=bind,source='+str(source/'vitest.config.ts')+',target=/app/vitest.config.ts,readonly','--entrypoint','node',binding['image'],'node_modules/vitest/vitest.mjs','run','--configLoader','native','--no-cache','--no-file-parallelism','--maxWorkers=1',*files]
report={'status':'FAIL','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_identity':f['identity'],'test_image':binding['image'],'image_receipt_sha256':sha(receipt),'command':['docker',*cmd],'tests':files,'cleanup':'NOT_RUN'};created=False
try:
 q=subprocess.run(['docker',*cmd],capture_output=True,text=True,encoding='utf-8',timeout=60);assert q.returncode==0,q.stderr;created=True
 x=json.loads(subprocess.run(['docker','container','inspect',name],capture_output=True,text=True,check=True).stdout)[0];assert x['Image']==binding['image']and x['Config']['Labels']['venus.p05.storage']==name and x['HostConfig']['ReadonlyRootfs']and x['HostConfig']['NetworkMode']=='none'
 with(out/'tests.txt').open('w',encoding='utf-8')as stream:q=subprocess.run(['docker','start','--attach',name],stdout=stream,stderr=subprocess.STDOUT,timeout=600)
 x=json.loads(subprocess.run(['docker','container','inspect',name],capture_output=True,text=True,check=True).stdout)[0];report['attach_exit']=q.returncode;report['container_exit']=x['State']['ExitCode'];assert q.returncode==0 and x['State']['ExitCode']==0;report['status']='PASS_NATIVE_LINUX_STORAGE_ONLY_NOT_STAGE'
except Exception as e:report['failure']={'type':type(e).__name__,'code':'LINUX_STORAGE_RUN_FAILED'};print(type(e).__name__,flush=True)
finally:
 if created:
  x=json.loads(subprocess.run(['docker','container','inspect',name],capture_output=True,text=True,check=True).stdout)[0];assert x['Image']==binding['image']and x['Config']['Labels']['venus.p05.storage']==name
  q=subprocess.run(['docker','rm','--force',name],capture_output=True,text=True,timeout=30);assert q.returncode==0
 q=subprocess.run(['docker','container','inspect',name],capture_output=True,text=True);assert q.returncode!=0 and 'no such' in q.stderr.lower();report['cleanup']='ABSENT'
 report['source_test_bytes_unchanged']=all(sha(source/n)==f['files'][n]for n in files+['vitest.config.ts']);assert report['source_test_bytes_unchanged'];(out/'receipt.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report),flush=True)
raise SystemExit(0 if report['status'].startswith('PASS')else 1)
