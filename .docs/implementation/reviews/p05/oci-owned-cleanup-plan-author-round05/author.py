from pathlib import Path
import json,hashlib,re,subprocess,datetime,copy,argparse
r=Path('C:/.projects/venus');out=r/'.artifacts/p05-oci-owned-cleanup-plan05/reinspection05';oldpath=r/'.artifacts/p05-oci-owned-cleanup-plan04.json';sha=lambda b:hashlib.sha256(b).hexdigest();read=lambda p:json.loads(p.read_bytes());canon=lambda v:json.dumps(v,sort_keys=True,separators=(',',':')).encode()
assert sha(oldpath.read_bytes())=='e2d6318ea1a87eaffd71fac507e1e20719f043be4ebb2c77c0fe05dda6c4750d';old=read(oldpath);rows=copy.deepcopy(old['projects']);commands=[]
def pin(path):
 f=r/path;return {'bytes':f.stat().st_size,'sha256':sha(f.read_bytes())}
def save(path,v):path.write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8')
for version,rootnum,project,diag,prefix in [(25,14,'venus-p05-oci-f0ff48a45f06','oci25-a17-failure-diagnosis-independent-round01','67f55c33274dacf5a8bf881b4b3d75eb562d87bbc21b50de33d7d6dc7046f249'),(26,14,'venus-p05-oci-882db5f59870','oci26-a17-failure-diagnosis-independent-round01','4806f27c457b696c8c8fd48f10ee8752c3d2fbd3970cf59db5e01c91d1010042')]:
 base=r/f'.artifacts/p05-pilot-bundle-source{rootnum:02d}/.artifacts/p05'/project;plan=read(base/'plan.json');terminal=read(base/'TERMINAL.json');runner=read(base/'runner.json');saved=read(base/'owned-after-cleanup.json');owner=plan['owner'];assert re.fullmatch('[a-f0-9]{32}',owner)and plan['project']==runner['project']==project and runner['owner']==owner;assert terminal['status']=='FAIL'and terminal['cleanup']=='retained_manual_cleanup_required'and terminal['remaining_owned']==saved
 basis={str(f.relative_to(r)).replace('\\','/'):pin(f.relative_to(r))for f in [base/'plan.json',base/'TERMINAL.json',base/'runner.json',base/'owned-after-cleanup.json',base/'postgres-image-binding.json']}
 for name in ['source-after-finally.json','producer-after-finally.json','evidence/phase-A1-terminal.json','evidence/phase-B2-terminal.json']:
  f=base/name
  if f.is_file():basis[f.relative_to(r).as_posix()]=pin(f.relative_to(r))
 d=r/'.docs/implementation/reviews/p05'/diag;assert sha((d/'INDEX.json').read_bytes())==prefix
 for name in ['INDEX.json','REPORT.md','INPUT-PINS.json','AUDIT.json']:
  f=d/name;assert f.is_file();basis[f.relative_to(r).as_posix()]=pin(f.relative_to(r))
 rows.append({'producer_version':version,'project':project,'owner':owner,'saved_terminal_status':'FAIL_RETAINED','saved_remaining_owned':saved,'basis':basis,'archive_scope':'SAFE_HOST_EXPORT_AND_INDEPENDENT_FAILURE_DIAGNOSIS_NOT_EXPORT_SUFFICIENCY_APPROVAL','saved_export_error':terminal.get('export_error'),'safe_host_export_root':base.relative_to(r).as_posix(),'missing_export_claims':['No RAW_INDEX success-path file or complete successful OCI controls proof is asserted','Failure diagnosis is not independent preservation/export-sufficiency acceptance','No DB/keyring/private-volume backup or completeness claim; no private volume read/export performed']})
allowed={x['project']for x in rows};assert len(rows)==len(allowed)==13
# Default is offline preparation ONLY. Explicit root handoff is required to query Docker.
parser=argparse.ArgumentParser(description='Exact13 owned OCI metadata plan, never cleanup execution')
parser.add_argument('--inspect-readonly',action='store_true')
for key in ['oci27-actual-index','oci27-actual-sha256','oci27-independent-index','oci27-independent-sha256']:parser.add_argument('--'+key)
args=parser.parse_args()
for row in rows:
 for name,p in row['basis'].items():assert pin(name)==p,(name,'OFFLINE_BASIS_CHANGED_HOLD')
saved_totals={k:sum(len(row['saved_remaining_owned'][k])for row in rows)for k in ['containers','networks','volumes']}
assert saved_totals=={'containers':26,'networks':13,'volumes':52}
assert sum(saved_totals.values())==91
successful27=None
if not args.inspect_readonly:
 print(json.dumps({'status':'PREPARED_OFFLINE_ONLY_HOLD_NO_DOCKER','projects':13,'saved_totals':saved_totals,'saved_objects':91,'expected_readonly_queries_if_all_saved_objects_present':130,'queries_executed':0,'mutations':0,'parent_plan_sha256':sha(oldpath.read_bytes()),'required_for_root_later':['--inspect-readonly in root exclusive no-UI/native window','--oci27-actual-index PATH --oci27-actual-sha256 EXACT_SHA256','--oci27-independent-index PATH --oci27-independent-sha256 EXACT_SHA256','Current successful27 remains owned-empty and exact14 PASS','Independent final plan/evidence review and NEW cleanup authorization remain separate']}))
 raise SystemExit(0)
def provided_pin(name,expected):
 assert isinstance(name,str)and isinstance(expected,str)and re.fullmatch('[a-f0-9]{64}',expected),'FIXED_SUCCESS27_PIN_REQUIRED'
 f=(r/name).resolve();rel=f.relative_to(r).as_posix();assert rel.startswith('.docs/implementation/')and not f.is_symlink(),'DURABLE27_INDEX_REQUIRED';assert f.name in ['INDEX.json','index.json'];assert sha(f.read_bytes())==expected,'SUCCESS27_PIN_MISMATCH';return {'path':rel,**pin(rel)}
actual_index=provided_pin(args.oci27_actual_index,args.oci27_actual_sha256);independent_index=provided_pin(args.oci27_independent_index,args.oci27_independent_sha256)
review=read(r/independent_index['path']);assert isinstance(review.get('status'),str)and review['status'].startswith('PASS'),'SUCCESS27_INDEPENDENT_PASS_REQUIRED'
success=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-p05-oci-d78e437b4a16';success_plan=read(success/'plan.json');success_terminal=read(success/'TERMINAL.json');success_runner=read(success/'runner.json');success_owned=read(success/'owned-after-cleanup.json')
assert success_plan['project']=='venus-p05-oci-d78e437b4a16'and re.fullmatch('[a-f0-9]{32}',success_plan['owner'])
assert success_runner['status']==success_terminal['status']=='PASS_BOUNDED_SYNTHETIC_OCI_ROLLBACK'and success_runner['cleanup']==success_terminal['cleanup']=='completed'
assert success_runner['owner']==success_plan['owner']and success_runner['project']==success_plan['project']
assert success_owned==success_terminal['remaining_owned']=={'containers':[],'networks':[],'volumes':[]}
assert len(success_runner['controls'])==14 and [v['id']for v in success_runner['controls']]==['OCI'+str(i).zfill(2)for i in range(1,15)]and all(v['status']=='PASS'for v in success_runner['controls'])
assert success_plan['project']not in allowed
successful27={'actual_index':actual_index,'independent_index':independent_index,'project':success_plan['project'],'owner':success_plan['owner'],'scope':'PREREQUISITE_ONLY_NOT_CLEANUP_TARGET','basis':{f.relative_to(r).as_posix():pin(f.relative_to(r))for f in [success/'plan.json',success/'TERMINAL.json',success/'runner.json',success/'owned-after-cleanup.json']}}
assert not out.exists(),'NEW_READONLY_OBSERVATION_ONLY_NO_OVERWRITE';out.mkdir(parents=True)

def docker(project,args):
 assert project in allowed and(args[0]=='ps'or args[0]in['container','network','volume']and args[1]in['ls','inspect']);result=subprocess.run(['docker',*args],cwd=r,capture_output=True,timeout=30);name=f'{len(commands)+1:03d}';(out/(name+'.stdout.txt')).write_bytes(result.stdout);(out/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'project':project,'argv':['docker',*args],'exit_code':result.returncode,'stdout_file':name+'.stdout.txt','stdout_sha256':sha(result.stdout),'stderr_file':name+'.stderr.txt','stderr_sha256':sha(result.stderr)});assert result.returncode==0,(project,args,result.returncode);return result.stdout.decode().strip()
cf='{"id":{{json .Id}},"name":{{json .Name}},"image_id":{{json .Image}},"image_reference":{{json .Config.Image}},"labels":{{json .Config.Labels}},"created":{{json .Created}},"state":{{json .State.Status}},"running":{{json .State.Running}},"mounts":[{{range $i,$v := .Mounts}}{{if $i}},{{end}}{"type":{{json .Type}},"name":{{json (index . "Name")}},"destination":{{json .Destination}},"rw":{{json .RW}}}{{end}}],"networks":[{{$first := true}}{{range $name,$v := .NetworkSettings.Networks}}{{if $v.NetworkID}}{{if not $first}},{{end}}{{$first = false}}{"name":{{json $name}},"id":{{json $v.NetworkID}}}{{end}}{{end}}]}'
nf='{"id":{{json .Id}},"name":{{json .Name}},"labels":{{json .Labels}},"created":{{json .Created}},"driver":{{json .Driver}},"internal":{{json .Internal}},"attached_container_ids":"{{range $id,$value := .Containers}}{{$id}} {{end}}"}'
vf='{"name":{{json .Name}},"labels":{{json .Labels}},"created":{{json .CreatedAt}},"driver":{{json .Driver}},"scope":{{json .Scope}}}'
for row in rows:
 project=row['project'];owner=row['owner'];planpath=next(n for n in row['basis']if n.endswith('/plan.json'));base=(r/planpath).parent;plan=read(base/'plan.json');pg=read(base/'postgres-image-binding.json');saved=row['saved_remaining_owned'];previous=row.pop('current_observation',None);row['previous_plan04_observation_preserved_in_parent_only']=row['producer_version']<25
 for name,p in row['basis'].items():assert pin(name)==p,(name,'BASIS_CHANGED_HOLD')
 actual={k:[]for k in ['containers','networks','volumes']};findings=[];proposals=[];resolution={};inspectCommands={}
 for kind,args,fmt in [('containers',['ps','--all','--quiet','--no-trunc'],cf),('networks',['network','ls','--quiet','--no-trunc'],nf),('volumes',['volume','ls','--quiet'],vf)]:
  ids=docker(project,[*args,'--filter','label=com.venus.oci.project='+project]).split();assert len(ids)==len(set(ids))
  for id in ids:
   assert re.fullmatch('[a-f0-9]{64}',id)if kind!='volumes'else re.fullmatch(re.escape(project)+r'-(authority|db|evidence|private)',id)
   argv=['container'if kind=='containers'else'network'if kind=='networks'else'volume','inspect','--format',fmt,id];obj=json.loads(docker(project,argv));inspectCommands[id]=['docker',*argv];labels=obj['labels']or{};valid=labels.get('com.venus.oci.owner')==owner and labels.get('com.venus.oci.project')==project
   if kind=='containers':
    role=labels.get('com.venus.oci.role');image=pg['image_id']if role=='db'else plan['roles'].get(role);valid=valid and obj['id']==id and obj['name']=='/'+project+'-'+str(role).lower()and obj['image_id']==image and any(id.startswith(v)for v in saved[kind]);obj['expected_image_id']=image
    obj['mounts'].sort(key=lambda m:(m['destination'],m['name']or''));obj['networks'].sort(key=lambda n:n['name'])
    if previous:
     prior=next((v for v in previous[kind]if v['id']==id),None);valid=valid and prior is not None and all(obj[k]==prior[k]for k in ['id','name','image_id','image_reference','labels','created'])
    fields=['id','name','image_id','image_reference','labels','created','mounts','networks']
   elif kind=='networks':
    obj['attached_container_ids']=sorted(obj['attached_container_ids'].split());valid=valid and obj['id']==id and obj['name']==plan['network']and any(id.startswith(v)for v in saved[kind]);fields=['id','name','labels','created','driver','internal']
    if previous:
     prior=next((v for v in previous[kind]if v['id']==id),None);valid=valid and prior is not None and all(obj[k]==prior[k]for k in fields)
   else:
    valid=valid and obj['name']==id and id in saved[kind]and id in plan['volumes'].values();fields=['name','labels','created','driver','scope']
    if previous:
     prior=next((v for v in previous[kind]if v['name']==id),None);valid=valid and prior is not None and all(obj[k]==prior[k]for k in fields)
   obj['current_identity_matches_saved_plan']=valid;obj['immutable_identity_projection']={k:obj[k]for k in fields};obj['immutable_identity_sha256']=sha(canon(obj['immutable_identity_projection']));obj['observed_projection_sha256']=sha(canon(obj));actual[kind].append(obj)
   if not valid:findings.append({'kind':kind,'id':id,'finding':'IDENTITY_OR_PRIOR_PLAN_MISMATCH_HOLD'})
  resolution[kind]=[]
  for id in saved[kind]:
   matches=[v.get('id',v.get('name'))for v in actual[kind]if(v['name']==id if kind=='volumes'else v['id'].startswith(id))];assert len(matches)<=1;resolution[kind].append({'saved_identifier':id,'current_identifier':matches[0]if matches else None,'observed':'PRESENT_METADATA_MATCH'if matches else'ABSENT_FILTERED_OBSERVATION_NO_DELETE'})
 expected={o['id']for o in actual['containers']}
 for net in actual['networks']:
  if not set(net['attached_container_ids'])<=expected:findings.append({'kind':'network','id':net['id'],'finding':'UNKNOWN_ENDPOINT_HOLD'})
 for kind,objects in actual.items():
  for obj in objects:
   id=obj.get('id',obj.get('name'));proposal={'kind':kind,'identifier':id,'status':'HOLD_NOT_EXECUTED','immutable_identity_sha256_required':obj['immutable_identity_sha256'],'revalidate_exact_fields':list(obj['immutable_identity_projection']),'revalidate_command':inspectCommands[id],'all_identity_and_evidence_checks_required':True}
   if kind=='containers':proposal.update({'stop_ONLY_if_revalidated_running':['docker','stop','--time','10',id],'delete_ONLY_if_revalidated_stopped':['docker','rm',id],'required_before_delete':['Revalidate full identity after stop','State exited or created, running=false','No changed owner/project/role/image/mount/network identities']})
   elif kind=='networks':proposal.update({'delete_ONLY_after_revalidation_empty_endpoints':['docker','network','rm',id],'required_before_delete':['All selected containers removed','Endpoint set empty; any foreign/unknown attachment HOLD']})
   else:proposal.update({'delete_ONLY_after_revalidation':['docker','volume','rm',id],'required_before_delete':['All selected containers removed','Same name/created/labels/driver/scope; never force','Docker refusal on unknown reference stops cleanup without broadening scope']})
   if not obj['current_identity_matches_saved_plan']:proposal['status']='IDENTITY_MISMATCH_NO_ACTION'
   proposals.append(proposal)
 row.update({'current_observation':actual,'identity_findings':findings,'saved_to_current_resolution':resolution,'proposed_commands_HOLD_NOT_EXECUTED':proposals,'observation_scope':'Sequential exact-project metadata only; not a current deletion authorization or foreign-reference absence proof'})
result={'schema_version':2,'status':'HOLD_NO_CLEANUP_AUTHORITY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'EXACT13_HISTORICAL_OCI09_10_11_12_13_17_18_20_22_23_24_25_26_ONLY','parent_plan':{'path':oldpath.relative_to(r).as_posix(),'sha256':sha(oldpath.read_bytes())},'successful27_prerequisite':successful27,'saved_totals':saved_totals,'expected_queries_if_all_saved_present':130,'cleanup_execution_authority':False,'prerequisites':['CurrentOCI27 full14 actualPASS with successful safe host export and cleanup terminal (fixed pinned prerequisite only, not a deletion target)','Independent actualOCI27/export-sufficiency acceptance of exact bytes','Independent plan05 and historical safe evidence/export-sufficiency review for all13projects (09 metadata-only qualification retained)','Fresh explicit root cleanup authorization binds this exact plan hash and13 owner/project tuples','Root exclusive cleanup window and immediate object-specific identity/ownership/basis revalidation before each future stop/delete; any unknown/change HOLD'],'projects':rows,'current_totals':{k:sum(len(v['current_observation'][k])for v in rows)for k in ['containers','networks','volumes']},'Docker_readonly_commands':len(commands),'mutations_executed':0,'APP_writes':False,'private_ENV_or_DB_keys_mounted_data_reads':False,'execution_order_after_future_authority':['Reverify exact plan/parent/basis/export evidence hashes and all independent acceptances','Fresh exact13project enumeration; reject extra or changed resources/owners','Stop only revalidated running full container IDs, then reinspect stopped identity before nonforce rm','After all selected containers removed, revalidate full network identities and require no endpoints before nonforce rm','Revalidate exact volume identities then nonforce volume rm; no unknown reference bypass','Fresh exactproject/owner inventories empty; retain full commands and exits; all historical FAIL retained'],'forbidden':['Executor or activeACK in this packet','Stop/remove/start/run/exec during planning','ENV/private DB/keyring/mounted contents read','Any unlisted project/owner (including foreign ra20261020)','Global prune/image removal/recursive host deletion/force removal'],'foreign_reference_scope':'No global foreign-container inventory/absence proof. Nonforce Docker removal must refuse unknown references; any refusal stops cleanup without expanding scope.'}
save(out/'COMMANDS.json',commands);save(r/'.artifacts/p05-oci-owned-cleanup-plan05.json',result);print(json.dumps({'status':result['status'],'current_totals':result['current_totals'],'readonly_commands':len(commands),'identity_findings':sum(len(x['identity_findings'])for x in rows),'mutations':0}))
