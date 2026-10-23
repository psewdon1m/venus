from pathlib import Path
import json,subprocess,sys,datetime
d=Path('C:/.projects/venus/.artifacts/p05-oci26-reader-probe01');c=json.loads((d/'AUTHORIZATION.json').read_bytes());records=[]
def run(name,args,timeout=15):
 p=subprocess.run(['docker',*args],capture_output=True,timeout=timeout);(d/(name+'.stdout.txt')).write_bytes(p.stdout);(d/(name+'.stderr.txt')).write_bytes(p.stderr);records.append({'name':name,'argv':['docker',*args],'exit':p.returncode});return p
fmt='{"id":{{json .Id}},"name":{{json .Name}},"image":{{json .Image}},"labels":{{json .Config.Labels}},"state":{{json .State.Status}},"running":{{json .State.Running}},"network":{{json .HostConfig.NetworkMode}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"memory":{{json .HostConfig.Memory}},"pids":{{json .HostConfig.PidsLimit}}}'
def inspect(id,name):
 p=run(name,['container','inspect','--format',fmt,id]);assert p.returncode==0;j=json.loads(p.stdout);assert j['id']==id and j['name']=='/'+c['project']and j['image']==c['image']and j['labels']['com.venus.owner']==c['owner']and j['labels']['com.venus.project']==c['project'];assert j['network']=='none'and j['readonly']is True and j['memory']==512*1024**2 and j['pids']==64;return j
if sys.argv[1]=='create':
 assert not(d/'CREATED.json').exists();p=run('create',['create','--pull=never','--name',c['project'],'--label','com.venus.owner='+c['owner'],'--label','com.venus.project='+c['project'],'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','512m','--memory-swap','512m','--cpus','0.5','--pids-limit','64','--log-driver','none','--tmpfs','/evidence:rw,size=8m,mode=0700,uid=1000,gid=1000','--tmpfs','/tmp:rw,size=2m,mode=0700,uid=1000,gid=1000','--mount','type=bind,src='+d.as_posix()+',dst=/probe,readonly','--entrypoint','node',c['image'],'/probe/probe.mjs']);assert p.returncode==0;id=p.stdout.decode().strip();inspect(id,'created-inspect');(d/'CREATED.json').write_text(json.dumps({'id':id,**c},indent=2)+'\n');print(json.dumps({'id':id,'project':c['project'],'owner':c['owner'],'state':'CREATED_NOT_STARTED'}))
elif sys.argv[1]=='run':
 created=json.loads((d/'CREATED.json').read_bytes());id=created['id'];assert inspect(id,'before-start')['state']=='created';result=None;cleanup=False
 try:result=run('worker',['start','-a',id],40)
 finally:
  current=inspect(id,'before-cleanup')
  if current['running']:
   stopped=run('stop-owned',['stop','--time','5',id]);assert stopped.returncode==0;assert not inspect(id,'after-stop')['running']
  removed=run('remove-owned',['rm',id]);assert removed.returncode==0
  empty={}
  for kind,args in [('containers',['ps','-aq']),('networks',['network','ls','-q']),('volumes',['volume','ls','-q'])]:
   p=run('remaining-'+kind,[*args,'--filter','label=com.venus.owner='+c['owner']]);assert p.returncode==0;empty[kind]=p.stdout.decode().split();assert not empty[kind]
  cleanup=True;(d/'TERMINAL.json').write_text(json.dumps({'worker_exit':result.returncode if result else None,'cleanup':'OWNED_EMPTY'if cleanup else'UNKNOWN','remaining':empty,'owner':c['owner'],'project':c['project'],'id':id,'finished_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'whole_OCI':False,'APP':False},indent=2)+'\n')
 assert result.returncode==0,result.returncode;print((d/'TERMINAL.json').read_text())
(d/('COMMANDS-'+sys.argv[1]+'.json')).write_text(json.dumps(records,indent=2)+'\n')
