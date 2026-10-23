from pathlib import Path
import subprocess,json,hashlib,datetime,time,shutil
r=Path.cwd();out=r/'.docs/implementation/evidence/p05/recovery-oci04-owned-cleanup01';assert not out.exists();out.mkdir(parents=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
review=r/'.docs/implementation/reviews/p05/oci04-actual-diagnosis-round01';assert sha(review/'INDEX.json')=='f112e7787d6356c0857ad735cc956ddf85f532504c506f06972ec60fdfd0e8a2';plan=json.loads((review/'CLEANUP_PLAN.json').read_text());old=json.loads((review/'owner-forensics.json').read_text());owner=plan['owner'];project=plan['project'];start=time.monotonic();commands=[]
archive=r/'.docs/implementation/evidence/p05/recovery-oci04-actual-failed01';assert sha(archive/'INDEX.json')=='37e937593908062706da60b8ca312765699f4433c28672c612cb8b2dec1413fe'
for row in json.loads((archive/'INDEX.json').read_text())['files']:assert sha(archive/row['path'])==row['sha256']
def run(args,timeout=15):
 assert time.monotonic()-start<120
 q=subprocess.run(['docker',*args],capture_output=True,timeout=timeout);commands.append({'arguments':args,'exit_code':q.returncode,'stdout_bytes':len(q.stdout),'stderr_bytes':len(q.stderr)});assert q.returncode==0,('DOCKER_FAILURE',args,q.returncode);return q.stdout.decode().strip()
def inspect(args):return json.loads(run(args))
def view(v):return {'Id':v['Id'],'Name':v['Name'],'Image':v['Image'],'ConfigImage':v['Config']['Image'],'Labels':v['Config']['Labels'],'Running':v['State']['Running'],'ExitCode':v['State']['ExitCode'],'Mounts':v['Mounts'],'NetworkMode':v['HostConfig']['NetworkMode'],'ReadonlyRootfs':v['HostConfig']['ReadonlyRootfs'],'IpcMode':v['HostConfig']['IpcMode'],'Entrypoint':v['Config']['Entrypoint'],'Cmd':v['Config']['Cmd']}
oldby={v['Id']:v for v in old['containers']};remaining=set(oldby)
def inventory(kind,label='com.venus.oci.owner'):
 args={'containers':['ps','-aq','--no-trunc'],'volumes':['volume','ls','-q'],'networks':['network','ls','-q','--no-trunc']}[kind]
 return set(run([*args,'--filter',f'label={label}={owner}']).split())
def container(ident,allow_stopped=False):
 v=view(inspect(['inspect',ident])[0]);expect=oldby[ident];assert v['Labels']['com.venus.oci.owner']==owner and v['Labels']['com.venus.oci.project']==project
 for field in expect:
  if allow_stopped and field in ('Running','ExitCode'):continue
  assert v[field]==expect[field],('CONTAINER_DRIFT',ident,field)
 if allow_stopped:assert not v['Running']
 return v
result={'status':'FAIL_RETAINED_MANUAL_CLEANUP_REQUIRED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'owner':owner,'project':project,'archive_index_sha256':sha(archive/'INDEX.json'),'diagnosis_index_sha256':sha(review/'INDEX.json'),'host_failed_prefix_unchanged':True,'private_volume_export':False,'commands':commands}
try:
 assert inventory('containers')==remaining;assert inventory('volumes')=={v['Name'] for v in plan['volumes_after_no_attachments']};assert inventory('networks')=={v['Id'] for v in plan['network_after_no_containers']};assert not inventory('containers','com.venus.oci.resource.owner')
 for ident in remaining:container(ident)
 keeper=plan['stop_only_running_keeper'];container(keeper);run(['stop','--time','5',keeper],20)
 for ident in remaining:container(ident,True)
 for item in plan['containers_after_verified_stopped']:
  assert inventory('containers')==remaining;container(item['id'],True);run(['rm',item['id']]);remaining.remove(item['id'])
 assert not inventory('containers')
 for item in plan['volumes_after_no_attachments']:
  v=inspect(['volume','inspect',item['Name']])[0]
  for field in ['Name','Driver','Labels','Options']:assert v[field]==item[field],('VOLUME_DRIFT',field)
  assert not run(['ps','-aq','--filter','volume='+item['Name']]);run(['volume','rm',item['Name']])
 for item in plan['network_after_no_containers']:
  v=inspect(['network','inspect',item['Id']])[0]
  for field in ['Id','Name','Labels']:assert v[field]==item[field]
  assert not v['Containers'];run(['network','rm',item['Id']])
 assert not inventory('containers') and not inventory('volumes') and not inventory('networks') and not inventory('containers','com.venus.oci.resource.owner')
 result['status']='PASS_EXACT_OWNED_EPHEMERAL_RESOURCES_REMOVED_ORIGINAL_RUN_STILL_FAIL';result['cleanup']='completed';result['owner_inventories']='EMPTY';result['native_probe_inventory']='EMPTY'
except Exception as e:
 result['error']={'class':type(e).__name__,'args':str(e)[:2000]};raise
finally:
 result['elapsed_s']=time.monotonic()-start
 (out/'RECORD.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8',newline='\n');shutil.copyfile(r/'.artifacts/p05-oci04-owned-cleanup01.py',out/'cleanup.py')
 (out/'REPORT.md').write_text('# OCI04 exact-owned cleanup\n\n'+result['status']+'\n\nThe failed host prefix and immutable actual archive remain unchanged. Only the independently inspected exact owner container IDs, three ephemeral tmpfs volume names/options and network ID were eligible. The only running readonly keeper was stopped with a bounded5s stop before removal. No start, new container, global prune or other owner action was issued. No private database, password or keyring value was exported. This cleanup does not promote the failed OCI04 run.\n',encoding='utf-8',newline='\n')
 (out/'INDEX.json').write_text(json.dumps({'status':result['status'],'files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]},indent=2)+'\n',encoding='utf-8',newline='\n')
 print(json.dumps({'status':result['status'],'index_sha256':sha(out/'INDEX.json'),'commands':len(commands)}))
