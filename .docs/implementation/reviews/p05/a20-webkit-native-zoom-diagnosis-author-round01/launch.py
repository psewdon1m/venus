from pathlib import Path
import datetime,hashlib,json,subprocess,uuid
r=Path('C:/.projects/venus'); d=r/'.artifacts/p05-webkit-native-zoom-diagnostic02'
now=lambda:datetime.datetime.now(datetime.timezone.utc).isoformat()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
owner=uuid.uuid4().hex;name='venus-webkit-zoom-diag02-'+owner[:12]
image='sha256:5d976ffbcf579bea9f9b6a51af314e2e23eee995cdaeab0dcf046c541bb63e3a'
receipt={'scope':'ONE_CONSTANT_NATIVE_ZOOM_NOT_APP_OR_UI_GATE','started_utc':now(),'owner':owner,'container':name,'image':image,'calls':[],'exit_code':None,'cleanup':'PENDING','error':None}
def save(): (d/'exit.json').write_text(json.dumps(receipt,indent=2)+'\n')
def docker(*args,timeout=30):
 p=subprocess.run(['docker',*args],capture_output=True,text=True,encoding='utf-8',timeout=timeout)
 receipt['calls'].append({'args':list(args),'exit':p.returncode});save();return p
created=False
try:
 with (d/'preflight.stdout.txt').open('w') as out,(d/'preflight.stderr.txt').open('w') as err:
  p=subprocess.run([str(r/'.venv/Scripts/python.exe'),'-X','utf8','-B',str(r/'.artifacts/p05-a20-manual-preflight02.py'),str(d.relative_to(r)/'preflight.json'),'3'],stdout=out,stderr=err,timeout=60)
 assert p.returncode==0,'PREFLIGHT_FAILED'
 pf=json.loads((d/'preflight.json').read_text());age=(datetime.datetime.now(datetime.timezone.utc)-datetime.datetime.fromisoformat(pf['observed_at'])).total_seconds();assert age<60
 absent=docker('container','inspect',name);assert absent.returncode!=0 and 'No such' in absent.stderr
 args=['create','--pull=never','--name',name,'--label','venus.p05.diagnostic-owner='+owner,'--init','--network','none','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--shm-size','1g','--memory','3g','--memory-swap','3g','--cpus','2','--pids-limit','512','--tmpfs','/tmp:size=1g,mode=1777,exec','--tmpfs','/home/node:size=64m,uid=1000,gid=1000','--mount',f'type=bind,source={d.as_posix()},target=/out','--mount',f'type=bind,source={d.as_posix()},target=/app/diagnostic,readonly','--mount',f'type=bind,source={(r/".artifacts/p05-pilot-bundle-source17/.artifacts/p05-v2-layout-producer-a20-02").as_posix()},target=/app/tests/p05-v2-layout-producer,readonly','--entrypoint','node',image,'/app/diagnostic/probe.mjs']
 p=docker(*args);assert p.returncode==0;created=True
 p=docker('container','inspect',name);assert p.returncode==0;x=json.loads(p.stdout)[0];h=x['HostConfig']
 assert x['Image']==image and x['Config']['Labels']['venus.p05.diagnostic-owner']==owner and h['PidsLimit']==512 and h['Memory']==3221225472 and h['NanoCpus']==2000000000 and h['ReadonlyRootfs'] and h['NetworkMode']=='none'
 (d/'OWNED-RESOURCE-PROOF.json').write_text(json.dumps({'container':name,'owner':owner,'id':x['Id'],'image':image,'cpus':2,'memory_bytes':h['Memory'],'pids':512,'preflight_sha256':sha(d/'preflight.json'),'preflight_age_seconds_at_create':age,'root_authorized':True},indent=2)+'\n')
 p=docker('start','--attach',name,timeout=65);(d/'stdout.txt').write_text(p.stdout);(d/'stderr.txt').write_text(p.stderr);receipt['exit_code']=p.returncode
except Exception as e:
 receipt['error']=type(e).__name__;raise
finally:
 if created:
  p=docker('container','inspect',name);assert p.returncode==0;x=json.loads(p.stdout)[0];assert x['Config']['Labels']['venus.p05.diagnostic-owner']==owner and x['Image']==image
  if not x['State']['Running']:
   p=docker('container','rm',name);assert p.returncode==0
   p=docker('container','inspect',name);assert p.returncode!=0 and 'No such' in p.stderr;receipt['cleanup']='COMPLETE_OWNED_CONTAINER_ABSENT'
  else:receipt['cleanup']='RUNNING_RETAINED_NOT_REMOVED'
 receipt['finished_utc']=now();save()
 print(json.dumps({k:receipt[k] for k in ['container','exit_code','cleanup','error','finished_utc']}))
