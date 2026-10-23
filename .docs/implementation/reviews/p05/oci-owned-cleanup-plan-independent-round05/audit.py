from pathlib import Path
import hashlib,json,re,collections
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/oci-owned-cleanup-plan-author-round05';P=R/'.artifacts/p05-oci-owned-cleanup-plan05.json'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest();pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())};canon=lambda v:json.dumps(v,sort_keys=True,separators=(',',':')).encode()
assert pin(A/'INDEX.json')['sha256']=='ad4952643089c5023e903dac4c42ac4be23b400041c6ee7a578dba83614e986b'
author=read(A/'INDEX.json');assert len(author['files'])==5
for n,p in author['files'].items():assert pin(A/n)==p,n
assert pin(P)['sha256']=='9c2680bfff06f5af9f73fbd4d008be312cbffe6a696be3907d848f0c90c62056'and P.read_bytes()==(A/'CLEANUP-PLAN.json').read_bytes()
d=read(P);parent=R/d['parent_plan']['path'];assert pin(parent)['sha256']==d['parent_plan']['sha256']=='e2d6318ea1a87eaffd71fac507e1e20719f043be4ebb2c77c0fe05dda6c4750d';old=read(parent)
prior=R/'.docs/implementation/reviews/p05/oci-owned-cleanup-plan-independent-round04/INDEX.json';prior_i=read(prior);assert pin(prior)['sha256'].startswith('82a3')and prior_i['status']=='PASS_PLAN_HISTORICAL_EXPORTS_ONLY'
for n,p in prior_i['files'].items():assert pin(prior.parent/n)==p,n
assert len(d['projects'])==13 and d['cleanup_execution_authority']is False and d['status']=='HOLD_NO_CLEANUP_AUTHORITY'and d['mutations_executed']==0
assert d['APP_writes']is False and d['private_ENV_or_DB_keys_mounted_data_reads']is False
assert d['current_totals']==d['saved_totals']=={'containers':26,'networks':13,'volumes':52}
assert [x['producer_version']for x in d['projects']]==[9,10,11,12,13,17,18,20,22,23,24,25,26]
assert len({x['project']for x in d['projects']})==len({x['owner']for x in d['projects']})==13
tr=read(A/'READONLY-TRANSCRIPT.json');assert len(tr)==d['Docker_readonly_commands']==130
outputs=R/'.artifacts/p05-oci-owned-cleanup-plan05/reinspection05';trans_by_project=collections.defaultdict(list)
for row in tr:
 args=row['argv'];assert row['exit_code']==0 and args[0]=='docker'
 assert args[1]=='ps'or args[1]in ['container','network','volume']and args[2]in ['ls','inspect']
 assert row['project']in {x['project']for x in d['projects']}
 for stream in ['stdout','stderr']:
  raw=(outputs/row[stream+'_file']).read_bytes();assert sha(raw)==row[stream+'_sha256']
  assert row[stream].encode()==raw
 assert row['stderr']==''
 if args[1]=='ps'or args[2]=='ls':assert args[-2:]==['--filter','label=com.venus.oci.project='+row['project']]
 else:assert '--format'in args and '.Env'not in args[args.index('--format')+1]and all(x not in args for x in ['--force','-f','exec','run','start','stop','rm','prune'])
 trans_by_project[row['project']].append(row)
summary=[];basis_pins={};suff=[]
for i,x in enumerate(d['projects']):
 project=x['project'];owner=x['owner'];assert not x['identity_findings']and x['saved_terminal_status']=='FAIL_RETAINED'and len(trans_by_project[project])==10
 assert re.fullmatch(r'venus-p05-oci-[a-f0-9]{12}',project)and re.fullmatch('[a-f0-9]{32}',owner)
 for n,p in x['basis'].items():assert pin(R/n)==p,n;basis_pins[n]=p
 base=(R/next(n for n in x['basis']if n.endswith('/plan.json'))).parent;plan=read(base/'plan.json');terminal=read(base/'TERMINAL.json');remaining=read(base/'owned-after-cleanup.json');pg=read(base/'postgres-image-binding.json')
 assert plan['owner']==owner and plan['project']==project and terminal['status']=='FAIL'and terminal['remaining_owned']==remaining==x['saved_remaining_owned']
 if i<11:
  previous=old['projects'][i];assert x['basis']==previous['basis']and x['saved_remaining_owned']==previous['saved_remaining_owned']and x['archive_scope']==previous['archive_scope']
  for kind in ['containers','networks','volumes']:
   assert [o['immutable_identity_projection']for o in x['current_observation'][kind]]==[o['immutable_identity_projection']for o in previous['current_observation'][kind]]
 observed=x['current_observation'];assert {k:len(v)for k,v in observed.items()}=={'containers':2,'networks':1,'volumes':4}
 query=trans_by_project[project];lookup={row['argv'][-1]:row for row in query if 'inspect'in row['argv']}
 assert len(lookup)==7 and len(x['proposed_commands_HOLD_NOT_EXECUTED'])==7
 for kind,objects in observed.items():
  enum=next(z for z in query if z['argv'][1]=='ps')if kind=='containers'else next(z for z in query if z['argv'][1:3]==['network'if kind=='networks'else'volume','ls'])
  ids={o.get('id',o.get('name'))for o in objects};assert set(enum['stdout'].split())==ids
  for obj in objects:
   identifier=obj.get('id',obj.get('name'));assert obj['current_identity_matches_saved_plan']and obj['labels']['com.venus.oci.owner']==owner and obj['labels']['com.venus.oci.project']==project
   assert sha(canon(obj['immutable_identity_projection']))==obj['immutable_identity_sha256']
   assert sha(canon({k:v for k,v in obj.items()if k!='observed_projection_sha256'}))==obj['observed_projection_sha256']
   recorded=json.loads(lookup[identifier]['stdout'])
   if kind=='containers':
    assert re.fullmatch('[a-f0-9]{64}',identifier)and any(identifier.startswith(z)for z in remaining[kind])
    role=obj['labels']['com.venus.oci.role'];assert role in ['db','keeper']and obj['name']=='/'+project+'-'+role
    assert obj['image_id']==(pg['image_id']if role=='db'else plan['roles'][role])
    recorded['mounts'].sort(key=lambda z:(z['destination'],z['name']or''));recorded['networks'].sort(key=lambda z:z['name'])
    assert all(m['name']in plan['volumes'].values()for m in obj['mounts']if m['type']=='volume')
   elif kind=='networks':
    recorded['attached_container_ids']=sorted(recorded['attached_container_ids'].split());assert obj['name']==plan['network']and obj['internal']and set(obj['attached_container_ids'])<={o['id']for o in observed['containers']}
   else:assert identifier in plan['volumes'].values()and identifier in remaining[kind]and obj['driver']==obj['scope']=='local'
   assert all(recorded[k]==v for k,v in obj['immutable_identity_projection'].items())
   proposal=next(z for z in x['proposed_commands_HOLD_NOT_EXECUTED']if z['identifier']==identifier);assert proposal['status']=='HOLD_NOT_EXECUTED'and proposal['kind']==kind and proposal['all_identity_and_evidence_checks_required']
   assert proposal['immutable_identity_sha256_required']==obj['immutable_identity_sha256']and proposal['revalidate_exact_fields']==list(obj['immutable_identity_projection'])and proposal['revalidate_command']==lookup[identifier]['argv']
   if kind=='containers':assert proposal['stop_ONLY_if_revalidated_running']==['docker','stop','--time','10',identifier]and proposal['delete_ONLY_if_revalidated_stopped']==['docker','rm',identifier]
   elif kind=='networks':assert proposal['delete_ONLY_after_revalidation_empty_endpoints']==['docker','network','rm',identifier]
   else:assert proposal['delete_ONLY_after_revalidation']==['docker','volume','rm',identifier]
  assert all(z['observed']=='PRESENT_METADATA_MATCH'for z in x['saved_to_current_resolution'][kind])
 if x['producer_version']in [25,26]:
  version=x['producer_version'];dp=R/f'.docs/implementation/reviews/p05/oci{version}-a17-failure-diagnosis-independent-round01';di=read(dp/'INDEX.json');expected='67f55c33274dacf5a8bf881b4b3d75eb562d87bbc21b50de33d7d6dc7046f249' if version==25 else '4806f27c457b696c8c8fd48f10ee8752c3d2fbd3970cf59db5e01c91d1010042';assert pin(dp/'INDEX.json')['sha256']==expected
  for n,p in di['files'].items():assert pin(dp/n)==p,n
  pins=read(dp/'INPUT-PINS.json');assert terminal['export_error']is None and terminal['cleanup_error']is None
  for n,p in pins['safe_raw'].items():assert pin(base/n)==p and pin(dp/'raw'/n)==p,n
  suff.append({'version':version,'diagnosis_sha256':expected,'preserved_safe_export_files':len(pins['safe_raw']),'scope':'SUFFICIENT_FOR_DOCUMENTED_FAIL_AND_UNKNOWNS_ONLY_NOT_PRIVATE_FORENSIC_BACKUP','status':'PASS_QUALIFIED_HISTORICAL_PRESERVATION'})
 summary.append({'version':x['producer_version'],'project':project,'owner':owner,'objects':7,'proposal_status':'HOLD_NOT_EXECUTED','archive_scope':x['archive_scope']})
success=d['successful27_prerequisite'];assert success['project']not in {x['project']for x in d['projects']}and success['scope']=='PREREQUISITE_ONLY_NOT_CLEANUP_TARGET'
for k in ['actual_index','independent_index']:
 p=success[k];assert pin(R/p['path'])=={z:p[z]for z in ['bytes','sha256']}and p['sha256']=='34fe127e32330e44436aee37f434696bcf4b945b755f9d97973bc739ab836439'
 si=read(R/p['path']);assert si['status']=='PASS_COMPONENT_ONLY'and si['controls_PASS']==14 and si['cleanup']=='COMPLETED_OWNED_EMPTY'
 for n,pin_ in si['files'].items():assert pin((R/p['path']).parent/n)==pin_,n
for n,p in success['basis'].items():assert pin(R/n)==p,n
assert success['actual_index']==success['independent_index']
assert any('Fresh explicit root'in z for z in d['prerequisites'])and any('immediate object-specific'in z for z in d['prerequisites'])and any('Fresh exact13project enumeration'in z for z in d['execution_order_after_future_authority'])
assert any('force removal'in z for z in d['forbidden'])and any('foreign'in z for z in d['foreign_reference_scope'].split('.'))
(O/'PROJECTS.json').write_text(json.dumps(summary,indent=2)+'\n');(O/'NEW-HISTORICAL-PRESERVATION.json').write_text(json.dumps(suff,indent=2)+'\n')
(O/'INPUT-PINS.json').write_text(json.dumps({'author_index':pin(A/'INDEX.json'),'plan':pin(P),'parent_plan':pin(parent),'prior_independent04':pin(prior),'basis':basis_pins,'successful27':success},indent=2)+'\n')
result={'status':'PASS_PLAN_HISTORICAL_EXPORTS_ONLY','cleanup_authority':'NOT_AUTHORIZED_HOLD','plan_sha256':pin(P)['sha256'],'projects':13,'objects':91,'containers':26,'networks':13,'volumes':52,'saved_metadata_queries_checked':130,'all_exit0':True,'identity_findings':[],'prior11_qualified_carry':True,'new25_26_safe_exports':'QUALIFIED_SUFFICIENT_FOR_DOCUMENTED_FAIL_UNKNOWN_ONLY','old09':'METADATA_ONLY_QUALIFICATION_RETAINED','successful27_same_index_two_roles':'EXPLICIT_SINGLE_INDEPENDENT_ACTUAL_PACKET_NOT_TWO_REVIEWS','private_DB_keyring_full_backup':False,'current_Docker_queries':0,'mutations':0,'future_rootACK_exclusive_fresh_wholeplan_peraction_required':True}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
