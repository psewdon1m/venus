from pathlib import Path
import json,subprocess,hashlib,datetime
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;RUN=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-p05-oci-ffaaeef4fe2b'
plan=json.loads((RUN/'plan.json').read_text(encoding='utf-8'));owner='2bae434a9f866273ef7e1bfeaee54dc1';assert plan['owner']==owner
commands=[]
def call(args):
 r=subprocess.run(['docker',*args],capture_output=True,text=True,timeout=15);assert len(r.stdout)+len(r.stderr)<256*1024
 commands.append({'arguments':['docker',*args],'exit_code':r.returncode,'stderr':r.stderr});assert r.returncode==0,r.stderr;return r.stdout
ids=call(['ps','-aq','--no-trunc','--filter','label=com.venus.oci.owner='+owner]).split();containers=[]
fmt='{"Id":{{json .Id}},"Name":{{json .Name}},"Image":{{json .Image}},"ConfigImage":{{json .Config.Image}},"Labels":{{json .Config.Labels}},"Running":{{json .State.Running}},"ExitCode":{{json .State.ExitCode}},"Mounts":{{json .Mounts}},"NetworkMode":{{json .HostConfig.NetworkMode}},"ReadonlyRootfs":{{json .HostConfig.ReadonlyRootfs}},"IpcMode":{{json .HostConfig.IpcMode}},"Entrypoint":{{json .Config.Entrypoint}},"Cmd":{{json .Config.Cmd}}}'
for id in ids:
 row=json.loads(call(['inspect','--format',fmt,id]));role=row['Labels']['com.venus.oci.role'];assert row['Id']==id and row['Labels']['com.venus.oci.owner']==owner and row['Name']=='/'+plan['project']+'-'+role.lower()
 assert row['Image']==plan['roles'][role] or role=='db' and row['ConfigImage']==plan['roles']['db'];containers.append(row)
probe_ids=call(['ps','-aq','--no-trunc','--filter','label=com.venus.oci.resource.owner='+owner]).split();assert not probe_ids
volumes=[]
for name in call(['volume','ls','-q','--filter','label=com.venus.oci.owner='+owner]).split():
 row=json.loads(call(['volume','inspect','--format','{"Name":{{json .Name}},"Driver":{{json .Driver}},"Labels":{{json .Labels}},"Options":{{json .Options}}}',name]));assert row['Labels']['com.venus.oci.owner']==owner and row['Name'] in plan['volumes'].values();volumes.append(row)
networks=[]
for id in call(['network','ls','-q','--filter','label=com.venus.oci.owner='+owner]).split():
 row=json.loads(call(['network','inspect','--format','{"Id":{{json .Id}},"Name":{{json .Name}},"Labels":{{json .Labels}}}',id]));assert row['Labels']['com.venus.oci.owner']==owner and row['Name']==plan['network'];networks.append(row)
keepers=[c for c in containers if c['Labels']['com.venus.oci.role']=='keeper'];assert len(keepers)==1;keeper=keepers[0]
assert keeper['Running'] is True and keeper['Image']==plan['images']['A'] and keeper['NetworkMode']=='none' and keeper['ReadonlyRootfs'] is True and keeper['IpcMode']=='none'
assert sorted(x['Destination'] for x in keeper['Mounts'])==['/authority','/control','/evidence','/private','/retained-db','/run/p05-oci-producer'] and all(x['RW'] is False for x in keeper['Mounts'])
assert keeper['Entrypoint']==['node'] and keeper['Cmd']==['/run/p05-oci-producer/ipc-keeper.mjs','--keep']
imports_script="const f=require('fs'),c=require('crypto'),p='/private/modules-A1/harness.mjs',s=f.readFileSync(p,'utf8');console.log(JSON.stringify({path:p,sha256:c.createHash('sha256').update(s).digest('hex'),static_imports:[...s.matchAll(/(?:import[^;]*?from|import)\\s*['\"]([^'\"]+)['\"]/g)].map(m=>m[1])}));"
imports=json.loads(call(['exec',keeper['Id'],'node','-e',imports_script]));assert 'pg' in imports['static_imports']
resolved=json.loads(call(['exec',keeper['Id'],'node','-e',"const {createRequire}=require('module'),r=createRequire('/app/package.json');console.log(JSON.stringify({pg:r.resolve('pg')}));"]));assert resolved['pg'].startswith('/app/node_modules/pg/')
# Module-link only; deliberately never invoke exported harness/composition/listen.
script="import('file:///private/modules-A1/harness.mjs').then(()=>console.log(JSON.stringify({status:'IMPORT_ONLY_OK_NO_HARNESS_CALL'}))).catch(e=>console.log(JSON.stringify({status:'IMPORT_ONLY_REJECTED',name:e.name,code:e.code??null,message:String(e.message).slice(0,1024),url:e.url??null})));"
result=json.loads(call(['exec',keeper['Id'],'node','-e',script]));assert result['status']=='IMPORT_ONLY_REJECTED' and result['code']=='ERR_MODULE_NOT_FOUND' and "package 'pg'" in result['message'] and '/private/modules-A1/harness.mjs' in result['message']
data={'status':'READONLY_OWNER_FORENSICS_COMPLETE_NOT_ACCEPTED_RUN','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'owner':owner,'containers':containers,'volumes':volumes,'networks':networks,'resource_probe_inventory_empty':True,'generated_harness':imports,'image_anchored_package_resolution':resolved,'inert_import_result':result,'commands':commands,'cleanup_executed':False,'private_DB_or_keyring_or_password_read':False,'actual_starts_or_new_containers':False}
(OUT/'owner-forensics.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'status':data['status'],'containers':[(x['Name'],x['Running']) for x in containers],'volume_count':len(volumes),'network_count':len(networks),'inert_import_result':result,'cleanup_executed':False}))
