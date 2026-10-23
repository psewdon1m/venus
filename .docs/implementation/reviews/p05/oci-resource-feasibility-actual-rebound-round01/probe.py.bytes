"""Finite independently authored OCI resource probe. Cold default. Never pull/build."""
import argparse,hashlib,json,os,re,shutil,subprocess,sys,time,uuid
from pathlib import Path

IMAGE='sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f'
PG='postgres:16.14-bookworm@sha256:64154d0babcb1741988719e703419af0382b19953706149f9872fbd0f438efa8'
SOURCE='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
RESERVE=10*1024**3;HOST_CAP=2*1024**2;NATIVE_RESERVED=298*1024**2
WORKSPACE=Path.cwd().resolve();POLICY=WORKSPACE/'.artifacts/p05-oci-rollback-producer-resume02'
DOCKER=r'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
KEY='com.venus.oci.feasibility.owner'

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def plans():return{'status':'NOT_RUN','images':[IMAGE,PG],'source_identity':SOURCE,'deadline_seconds':180,'work_deadline_seconds':130,'cleanup_reserve_seconds':50,'max_report_bytes':HOST_CAP,'native_reserved_bytes':NATIVE_RESERVED,'native_ledger_mib':{'PG_data':248,'PG_SHM':8,'authority':32,'private':8,'quota_helper':2},'context':'desktop-linux','network':'none','ports':[],'pull':False,'build':False,'controls':['actual native>=10GiB and nonPG IPCnone','actual PG248data+8SHM init/health/mount/statfs','actual readonly keeper6destinations and IPCnone','actual own2MiB tmpfs ENOSPC+prefixdelete','owner-inspected finally cleanup and empty container/volume inventories'],'commands':['image inspect exactA exactPG','volume create localtmpfs248m/32m/8m','create/start/inspect nativeIPCnone+quotahelper','create/start/execpgisready/inspect PGprivateSHM8','create/start/inspect/exec readonlykeeper6mounts','inspect exactowner/name/image then rm-f owncontainers','volume inspect exactowner/options then volume rm ownvolumes','ps/volume ls exactfreshowner empty'],'statistics_RUN':False,'actual_OCI_switches':0}

def check_container(row,owner,project,role,image_id):
 assert row['Name']=='/'+project+'-'+role
 assert row['Config']['Labels'][KEY]==owner
 assert row['Config']['Labels']['com.venus.oci.feasibility.role']==role
 assert row['Image']==image_id
 assert row['HostConfig']['NetworkMode']=='none'
 assert not row['HostConfig'].get('PortBindings')
 if role=='db':assert row['HostConfig']['IpcMode']=='private'and row['HostConfig']['ShmSize']==8*1024**2
 else:assert row['HostConfig']['IpcMode']=='none'

def run(ack_path):
 ack=json.loads(Path(ack_path).read_bytes());assert ack['kind']=='ROOT_OCI_RESOURCE_FEASIBILITY_ACK'and ack['status']=='AUTHORIZED'
 assert ack['attempts']==1 and ack['probe_sha256']==sha(__file__)and ack['images']==[IMAGE,PG]
 assert ack['source_identity']==SOURCE and ack['deadline_seconds']==180 and ack['host_report_cap_bytes']==HOST_CAP and ack['native_reserved_bytes']==NATIVE_RESERVED
 assert ack['independent_method_review_index_sha256']=='789492910f6cbaea7e7b936eae3bd803333fe0b14b64a240ff80e43d12a621b0'
 assert ack['statistics_RUN']is False and ack['actual_OCI_switches']==0
 pins=json.loads(Path(__file__).with_name('input-pins.json').read_bytes())
 for name,h in pins.items():assert sha(WORKSPACE/name)==h,name
 sys.path.insert(0,str(WORKSPACE/'tools'));from stage_inventory import inventory,identity
 assert identity(inventory())==SOURCE,'CURRENT_INCLUDED_SOURCE_CHANGED'
 assert shutil.disk_usage(WORKSPACE).free>=RESERVE+HOST_CAP
 start=time.monotonic();owner=uuid.uuid4().hex;project='venus-oci-resource-'+uuid.uuid4().hex[:12]
 root=WORKSPACE/'.artifacts/p05'/project;assert not root.exists();root.mkdir();containers={};volumes={};records=[];checks=[];image_ids={};result={'status':'NOT_ACCEPTED','owner':owner,'project':project,'plan':plans(),'cleanup':'PENDING'}
 def bounded(args,timeout=30,expect=0,cleanup=False):
  left=(180 if cleanup else 130)-(time.monotonic()-start);assert left>0,'PROBE_DEADLINE'
  assert shutil.disk_usage(WORKSPACE).free>=RESERVE+HOST_CAP,'ACTUAL_HOST_RESERVE'
  # Every command has finite capture; all records are charged to2MiB report limit.
  r=subprocess.run([DOCKER,'--context','desktop-linux',*args],capture_output=True,timeout=min(timeout,left))
  assert len(r.stdout)+len(r.stderr)<=65536,'CLI_CAPTURE_CAP'
  records.append({'args':args,'exit_code':r.returncode,'stdout':r.stdout.decode('utf8','replace'),'stderr':r.stderr.decode('utf8','replace')});assert len(json.dumps(records).encode())<=HOST_CAP-131072,'HOST_REPORT_CAP'
  if expect is not None:assert r.returncode==expect,{'args':args,'code':r.returncode,'stderr':r.stderr.decode('utf8','replace')}
  return r.stdout.decode().strip()
 def inspect(role,cleanup=False):
  name=project+'-'+role;row=json.loads(bounded(['inspect',name],cleanup=cleanup))[0];check_container(row,owner,project,role,image_ids['PG'if role=='db'else'A']);return row
 def labels(role):return['--label',KEY+'='+owner,'--label','com.venus.oci.feasibility.role='+role]
 def mount(key,dest,readonly=False):return['--mount','type=volume,src='+volumes[key]+',dst='+dest+',volume-nocopy'+(',readonly'if readonly else'')]
 def create(role,args,pg=False):
  argv=['create','--name',project+'-'+role,*labels(role),'--network','none','--log-driver','none','--cpus','1'if pg else'0.25','--memory','512m'if pg else'64m','--pids-limit','128'if pg else'32']
  argv+=['--ipc','private','--shm-size','8m']if pg else['--ipc','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true']
  bounded([*argv,*args]);containers[role]=True;return inspect(role)
 try:
  for key,ref in [('A',IMAGE),('PG',PG)]:image_ids[key]=json.loads(bounded(['image','inspect',ref]))[0]['Id']
  assert image_ids['A']==IMAGE
  native="const f=require('fs'),a=require('assert/strict');const m=f.readFileSync('/proc/self/mountinfo','utf8');a(!m.split('\\n').some(l=>l.split(' ')[4]==='/dev/shm'));const s=f.statfsSync('/app',{bigint:true});a(s.bavail*s.bsize>=10n*1024n**3n);console.log(JSON.stringify({native_free:String(s.bavail*s.bsize),mountinfo:m}));"
  create('native',['--entrypoint','node',IMAGE,'-e',native]);native_result=bounded(['start','-a',project+'-native']);assert json.loads(native_result)['native_free'];assert inspect('native')['State']['ExitCode']==0;checks.append('ACTUAL_NATIVE_RESERVE_AND_IPC_NONE')
  for key,size in [('db',248),('authority',32),('private',8)]:
   name=project+'-'+key;bounded(['volume','create','--driver','local','--label',KEY+'='+owner,'--opt','type=tmpfs','--opt','device=tmpfs','--opt','o=size='+str(size)+'m,mode=0700',name]);volumes[key]=name
  create('db',[*mount('db','/var/lib/postgresql/data'),'--env','POSTGRES_DB=venus','--env','POSTGRES_USER=venus','--env','POSTGRES_HOST_AUTH_METHOD=trust',PG,'-c','max_wal_size=64MB','-c','min_wal_size=32MB','-c','shared_buffers=32MB'],pg=True);bounded(['start',project+'-db'])
  until=time.monotonic()+60
  while True:
   bounded(['exec',project+'-db','pg_isready','-U','venus','-d','venus'],expect=None)
   if records[-1]['exit_code']==0:break
   assert time.monotonic()<until,'PG_HEALTH_DEADLINE'
   time.sleep(.5)
  pg_mount=bounded(['exec',project+'-db','cat','/proc/self/mountinfo']);assert any(l.split(' ')[4]=='/dev/shm'and' - tmpfs 'in l for l in pg_mount.splitlines())
  blocks,size=map(int,bounded(['exec',project+'-db','stat','-f','-c','%b:%S','/dev/shm']).split(':'));assert blocks*size==8*1024**2
  assert bounded(['exec',project+'-db','psql','-U','venus','-d','venus','-At','-c','SELECT 1'])=='1'
  blocks,size=map(int,bounded(['exec',project+'-db','stat','-f','-c','%b:%S','/var/lib/postgresql/data']).split(':'));assert blocks*size==248*1024**2;checks.append('ACTUAL_PG248_INIT_HEALTH_SHM8')
  for n in ['inputs','evidence','control']:(root/n).mkdir()
  for n in ['ipc-keeper.mjs','ipc-policy.mjs']:shutil.copyfile(POLICY/n,root/'inputs'/n)
  binds=[]
  for local,dest in [('inputs','/run/p05-oci-producer'),('evidence','/evidence'),('control','/control')]:binds+=['--mount','type=bind,src='+str(root/local)+',dst='+dest+',readonly']
  keeper=create('keeper',[*binds,*mount('db','/retained-db',True),*mount('authority','/authority',True),*mount('private','/private',True),'--entrypoint','node',IMAGE,'/run/p05-oci-producer/ipc-keeper.mjs','--keep']);assert len(keeper['Mounts'])==6 and all(not m['RW']for m in keeper['Mounts']);assert sorted(m['Destination']for m in keeper['Mounts'])==['/authority','/control','/evidence','/private','/retained-db','/run/p05-oci-producer'];bounded(['start',project+'-keeper']);inspect('keeper')
  bounded(['exec',project+'-keeper','node','-e',"const a=require('assert/strict'),f=require('fs');a(!f.readFileSync('/proc/self/mountinfo','utf8').split('\\n').some(l=>l.split(' ')[4]==='/dev/shm'));for(const p of ['/evidence/denied','/authority/denied','/private/denied','/retained-db/denied']){let e;try{f.writeFileSync(p,'DENY',{flag:'wx'});}catch(x){e=x.code;}a(['EROFS','EACCES'].includes(e));}console.log('READONLY_KEEPER_ACTUAL_PASS');"]);checks.append('ACTUAL_KEEPER6_READONLY_IPC_NONE')
  quota="const f=require('fs'),a=require('assert/strict');a(!f.readFileSync('/proc/self/mountinfo','utf8').split('\\n').some(l=>l.split(' ')[4]==='/dev/shm'));const disk=f.statfsSync('/app',{bigint:true});a(disk.bavail*disk.bsize>=10n*1024n**3n);const s=f.statfsSync('/quota',{bigint:true});a.equal(s.blocks*s.bsize,2n*1024n**2n);const fd=f.openSync('/quota/owned','wx');let error=null,wrote=0;try{for(let i=0;i<48;i++){wrote+=f.writeSync(fd,Buffer.alloc(65536));}}catch(e){error=e.code;}finally{f.closeSync(fd);}a.equal(error,'ENOSPC');a(wrote<=2*1024**2);f.unlinkSync('/quota/owned');a.equal(f.readdirSync('/quota').length,0);console.log(JSON.stringify({status:'ACTUAL_2MiB_OWNED_TMPFS_ENOSPC_PASS',written:wrote,error}));"
  create('quota',['--tmpfs','/quota:size=2m,mode=1777','--entrypoint','node',IMAGE,'-e',quota]);bounded(['start','-a',project+'-quota']);assert inspect('quota')['State']['ExitCode']==0;checks.append('ACTUAL_2MIB_OWNED_TMPFS_ENOSPC')
  result['status']='PASS_BOUNDED_RESOURCE_FEASIBILITY_ONLY'
 except Exception as e:result['error']={'name':type(e).__name__,'message':str(e)}
 finally:
  errors=[]
  try:
   ids=bounded(['ps','-aq','--no-trunc','--filter','label='+KEY+'='+owner],cleanup=True).split()
   assert all(re.fullmatch('[0-9a-f]{64}',i)for i in ids)and len(ids)==len(set(ids))
   for cid in ids:
    r=json.loads(bounded(['inspect',cid],cleanup=True))[0];role=r['Config']['Labels']['com.venus.oci.feasibility.role'];assert role in ['native','db','keeper','quota'];check_container(r,owner,project,role,image_ids['PG'if role=='db'else'A']);containers[role]=True
   for name in bounded(['volume','ls','-q','--filter','label='+KEY+'='+owner],cleanup=True).split():
    key=next((key for key in ['db','authority','private']if name==project+'-'+key),None);assert key;volumes[key]=name
  except Exception as e:errors.append({'discovery':str(e)})
  for role in reversed(list(containers)):
   try:inspect(role,True);bounded(['rm','-f',project+'-'+role],cleanup=True)
   except Exception as e:errors.append({'role':role,'error':str(e)})
  for key,name in volumes.items():
   try:
    row=json.loads(bounded(['volume','inspect',name],cleanup=True))[0];assert row['Name']==name and row['Labels'][KEY]==owner and row['Driver']=='local';assert row['Options']=={'type':'tmpfs','device':'tmpfs','o':'size='+str({'db':248,'authority':32,'private':8}[key])+'m,mode=0700'};bounded(['volume','rm',name],cleanup=True)
   except Exception as e:errors.append({'volume':name,'error':str(e)})
  try:
   empty_containers=bounded(['ps','-aq','--no-trunc','--filter','label='+KEY+'='+owner],cleanup=True);empty_volumes=bounded(['volume','ls','-q','--filter','label='+KEY+'='+owner],cleanup=True);assert not empty_containers and not empty_volumes
  except Exception as e:errors.append({'inventory':str(e)})
  result.update({'cleanup':'completed'if not errors else'FAILED_RETAINED_MANUAL_CLEANUP_REQUIRED','cleanup_errors':errors,'checks':checks,'commands':records,'elapsed_seconds':time.monotonic()-start,'full_OCI14_RUN':False,'statistics_RUN':False,'human470':'HOLD_UNCHANGED'})
  if errors:result['status']='NOT_ACCEPTED'
  if identity(inventory())!=SOURCE:result['status']='NOT_ACCEPTED';result['source_changed_after']=True
  b=(json.dumps(result,indent=2)+'\n').encode();assert len(b)<=HOST_CAP;assert sum(p.stat().st_size for p in root.rglob('*')if p.is_file())+len(b)<=HOST_CAP
  if shutil.disk_usage(WORKSPACE).free>=RESERVE+HOST_CAP:(root/'report.json').write_bytes(b)
  print(json.dumps({'status':result['status'],'cleanup':result['cleanup'],'root':str(root),'checks':checks,'elapsed_seconds':result['elapsed_seconds'],'error':result.get('error')}))
 return 0 if result['status']=='PASS_BOUNDED_RESOURCE_FEASIBILITY_ONLY' else 1

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--run-with-ack');args=parser.parse_args()
 if args.run_with_ack:sys.exit(run(args.run_with_ack))
 print(json.dumps(plans(),indent=2))
