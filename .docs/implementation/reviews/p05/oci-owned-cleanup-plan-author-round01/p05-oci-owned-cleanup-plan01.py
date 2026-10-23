from pathlib import Path
import json,hashlib,re,subprocess,datetime,shutil
root=Path('C:/.projects/venus');out=root/'.artifacts/p05-oci-owned-cleanup-plan01';out.mkdir()
read=lambda p:json.loads(p.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,v):p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
inventoryPath=root/'.artifacts/p05-oci09-13-retained-saved-inventory01.json';assert sha(inventoryPath.read_bytes())=='428a692af152fe183872bda0308cbc57f79adefb928150d86098c503da577858'
inputs=read(inventoryPath)['rows']+[{'producer_version':17,'run':'venus-p05-oci-88cdc68ec346','terminal_path':'.artifacts/p05-pilot-bundle-source12/.artifacts/p05/venus-p05-oci-88cdc68ec346/TERMINAL.json'},{'producer_version':18,'run':'venus-p05-oci-32fe8a4a2dfa','terminal_path':'.artifacts/p05-pilot-bundle-source12/.artifacts/p05/venus-p05-oci-32fe8a4a2dfa/TERMINAL.json'}]
assert len(inputs)==7
allowed={x['run'] for x in inputs};assert len(allowed)==7 and 'venus-p05-oci-c17e7f47baae' not in allowed
commands=[]
def docker(project,args):
 assert project in allowed
 assert args[0] in ['ps','network','volume','container']
 assert args[0]=='ps' or args[1] in ['ls','inspect']
 p=subprocess.run(['docker',*args],cwd=root,capture_output=True,timeout=30);assert p.returncode==0,(project,args,p.stderr[:200])
 name=f'{len(commands)+1:03d}';(out/(name+'.stdout.txt')).write_bytes(p.stdout);(out/(name+'.stderr.txt')).write_bytes(p.stderr)
 commands.append({'project':project,'argv':['docker',*args],'exit_code':p.returncode,'stdout_file':name+'.stdout.txt','stdout_sha256':sha(p.stdout),'stderr_file':name+'.stderr.txt','stderr_sha256':sha(p.stderr)})
 return p.stdout.decode().strip()
# Root authorized a small SAFE historical09 metadata archive, not a new export.
first=root/inputs[0]['terminal_path'];base09=first.parent
archive09=root/'.docs/implementation/evidence/p05/compatible-rollback09-actual01';assert not archive09.exists();archive09.mkdir(parents=True)
safe09=['TERMINAL.json','plan.json','runner.json','owned-after-cleanup.json','authority-ack.json','actual-native-quotas.json','postgres-image-binding.json','source-A1-before.json','source-after-finally.json','producer-A1-before.json','producer-after-finally.json','evidence/phase-A1-terminal.json']
mapping=[]
for name in safe09:
 src=base09/name;assert src.is_file();target=archive09/'run'/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,target)
 mapping.append({'source':name,'archive':'run/'+name,'bytes':src.stat().st_size,'sha256':sha(src.read_bytes())})
save(archive09/'raw-file-map.json',mapping)
(archive09/'REPORT.md').write_text('''# OCI09 historical SAFE metadata reconciliation

Existing OCI09 FAIL preserved: first_error TypeError in A1, exact underlying cause unknown, cleanup retained_manual_cleanup_required, export_error null. This archive copies only the listed pre-existing SAFE host reports, source/producer pin maps, ownership, resource quota and typed failure metadata. It is a later archival reconciliation for exact-owner cleanup planning, not a new native export, successful runner proof, complete private-volume export or PASS. No Docker resource, ENV, private DB data, session cookie or keyring was read for this archive.

raw-file-map.json binds every selected original byte to its copy. Logs, live control and unselected evidence are deliberately not copied; no assertion of complete original export is made. Independent review of exact historical preservation/export sufficiency and future full OCI20 PASS are mandatory before cleanup. All original files and FAIL remain unchanged.
''',encoding='utf-8')
save(archive09/'INDEX.json',{'status':'HISTORICAL_OCI09_SAFE_METADATA_ONLY_FAIL_NOT_NEW_EXPORT_OR_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':[{'path':str(p.relative_to(archive09)).replace('\\','/'),'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted(archive09.rglob('*')) if p.is_file()]})
containerFormat='{"id":{{json .Id}},"name":{{json .Name}},"image_id":{{json .Image}},"image_reference":{{json .Config.Image}},"labels":{{json .Config.Labels}},"created":{{json .Created}},"state":{{json .State.Status}},"running":{{json .State.Running}}}'
networkFormat='{"id":{{json .Id}},"name":{{json .Name}},"labels":{{json .Labels}},"created":{{json .Created}},"driver":{{json .Driver}},"internal":{{json .Internal}},"attached_container_ids":"{{range $id,$value := .Containers}}{{$id}} {{end}}"}'
volumeFormat='{"name":{{json .Name}},"labels":{{json .Labels}},"created":{{json .CreatedAt}},"driver":{{json .Driver}},"scope":{{json .Scope}}}'
rows=[]
for x in inputs:
 version=x['producer_version'];project=x['run'];base=(root/x['terminal_path']).parent;terminal=read(base/'TERMINAL.json');plan=read(base/'plan.json');runner=read(base/'runner.json');saved=read(base/'owned-after-cleanup.json')
 owner=plan['owner'];assert re.fullmatch('[a-f0-9]{32}',owner) and plan['project']==runner['project']==project and runner['owner']==owner
 assert terminal['status']=='FAIL' and terminal['cleanup']=='retained_manual_cleanup_required' and terminal['export_error'] is None
 assert terminal['remaining_owned']==saved
 if version<=13:
  assert sha((base/'TERMINAL.json').read_bytes())==x['terminal_sha256'] and sha((base/'owned-after-cleanup.json').read_bytes())==x['saved_inventory_sha256']
 archive=root/f'.docs/implementation/evidence/p05/compatible-rollback{version:02d}-actual01';index=read(archive/'INDEX.json');rawmap=read(archive/'raw-file-map.json')
 for name in ['TERMINAL.json','plan.json','runner.json','owned-after-cleanup.json']:
  entry=next(r for r in rawmap if r['source']==name);assert sha((base/name).read_bytes())==entry['sha256']==sha((archive/entry['archive']).read_bytes())
 pg=read(base/'postgres-image-binding.json');actual={'containers':[],'networks':[],'volumes':[]};problems=[]
 listArgs={'containers':['ps','--all','--quiet','--no-trunc'],'networks':['network','ls','--quiet','--no-trunc'],'volumes':['volume','ls','--quiet']}
 for kind,args in listArgs.items():
  ids=docker(project,[*args,'--filter','label=com.venus.oci.project='+project]).split()
  for id in ids:
   if kind in ['containers','networks']:assert re.fullmatch('[a-f0-9]{64}',id)
   else:assert re.fullmatch('venus-p05-oci-[a-f0-9]{12}-(authority|db|evidence|private)',id)
   command=['container' if kind=='containers' else 'network' if kind=='networks' else 'volume','inspect','--format',containerFormat if kind=='containers' else networkFormat if kind=='networks' else volumeFormat,id]
   row=json.loads(docker(project,command));labels=row['labels'] or {}
   valid=labels.get('com.venus.oci.project')==project and labels.get('com.venus.oci.owner')==owner
   expected_name=None
   if kind=='containers':
    role=labels.get('com.venus.oci.role');expected_name=project+'-'+str(role).lower();expected_image=pg['image_id'] if role=='db' else plan['roles'].get(role)
    valid=valid and row['id']==id and row['name'].removeprefix('/')==expected_name and row['image_id']==expected_image and any(id.startswith(prefix) for prefix in saved[kind]);row['expected_image_id']=expected_image
   elif kind=='networks':
    row['attached_container_ids']=row['attached_container_ids'].split();valid=valid and row['id']==id and row['name']==plan['network'] and any(id.startswith(prefix) for prefix in saved[kind])
   else:valid=valid and row['name']==id and id in saved[kind] and id in plan['volumes'].values()
   row['current_identity_matches_saved_plan']=valid;row['observed_projection_sha256']=sha(json.dumps(row,sort_keys=True,separators=(',',':')).encode())
   if not valid:problems.append({'kind':kind,'identifier':id,'finding':'CURRENT_IDENTITY_NOT_EXACT_SAVED_PLAN_HOLD'})
   actual[kind].append(row)
 basis={str(p.relative_to(root)).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in [base/'TERMINAL.json',base/'plan.json',base/'runner.json',base/'owned-after-cleanup.json',base/'postgres-image-binding.json',archive/'INDEX.json',archive/'raw-file-map.json']}
 proposed=[]
 for c in actual['containers']:
  if c['current_identity_matches_saved_plan']:
   proposed.append({'kind':'container','id':c['id'],'revalidate_before_stop_or_delete':['Full ID/name/image_id/image_reference/created/owner+project+role labels exactly match this plan; no name-only operation','Root cleanup ACK and evidence prerequisites accepted','If currently running, exact-owner docker stop first; re-inspect same ID and require running=false/state exited or created before rm'], 'stop_if_running':['docker','stop','--time','10',c['id']], 'delete_after_revalidation':['docker','rm',c['id']]})
 for n in actual['networks']:
  if n['current_identity_matches_saved_plan']:proposed.append({'kind':'network','id':n['id'],'revalidate_before_delete':['Full ID/name/created/driver/internal/owner+project labels exactly match','All selected containers removed; attached_container_ids must be empty; unknown/foreign attachment HOLD'], 'delete_after_revalidation':['docker','network','rm',n['id']]})
 for v in actual['volumes']:
  if v['current_identity_matches_saved_plan']:proposed.append({'kind':'volume','name':v['name'],'revalidate_before_delete':['Exact name/created/driver/scope/owner+project labels match; no volume recreation since observation','All selected containers removed and no unknown container references; no force removal','Required SAFE failed evidence archive and independent export-sufficiency review accepted before destroying temporary test state'], 'delete_after_revalidation':['docker','volume','rm',v['name']]})
 rows.append({'producer_version':version,'project':project,'owner':owner,'saved_terminal_status':'FAIL_RETAINED','saved_remaining_owned':saved,'basis':basis,'current_observation':actual,'identity_findings':problems,'absence_note':'Saved IDs prove past retention only. Current project-filtered absence is observed, not a cleanup claim; absent resources need no delete.','archive_scope':'SAFE_METADATA_ONLY_INDEPENDENT_SUFFICIENCY_PENDING' if version==9 else 'EXISTING_FROZEN_HOST_ARCHIVE_INDEPENDENT_SUFFICIENCY_PENDING','proposed_commands_HOLD_NOT_EXECUTED':proposed})
result={'schema_version':1,'status':'HOLD_NO_CLEANUP_AUTHORITY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'EXACT7_HISTORICAL_OCI09_10_11_12_13_17_18_ONLY','active_OCI20_explicitly_excluded':'venus-p05-oci-c17e7f47baae','prerequisites':['Root receives full OCI20 actual14 PASS with successful export/cleanup terminal','Independent actual OCI20/export review exact bytes PASS','Independent review of this seven-project plan and all historical SAFE archive/export sufficiency including newly curated09','Root fresh explicit cleanup authorization binds this plan SHA256 and exact7 owner/project tuples','Immediate per-object identity/ownership revalidation before STOP and DELETE; root exclusive cleanup window; any change/missing evidence/foreign attachment/extra identity HOLD'], 'source_inventory_basis':{'path':str(inventoryPath),'sha256':sha(inventoryPath.read_bytes())},'projects':rows,'current_totals':{k:sum(len(r['current_observation'][k]) for r in rows) for k in ['containers','networks','volumes']},'Docker_readonly_commands':len(commands),'mutations_executed':0,'APP_writes':False,'private_ENV_or_DB_keys_mounted_data_reads':False,'forbidden':['global prune','image removal','filesystem recursive deletion','unlisted owner/project access','force container or volume delete','executing suggested commands before HOLD is lifted']}
save(out/'COMMANDS.json',commands);save(root/'.artifacts/p05-oci-owned-cleanup-plan01.json',result);print(json.dumps({'status':result['status'],'current_totals':result['current_totals'],'readonly_commands':len(commands),'findings':sum(len(r['identity_findings']) for r in rows),'archive09_index_sha256':sha((archive09/'INDEX.json').read_bytes())}))
