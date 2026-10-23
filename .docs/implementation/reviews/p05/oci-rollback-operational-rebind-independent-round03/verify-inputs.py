from pathlib import Path
import hashlib,json,sys
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
P=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume03';OLD=ROOT/'.artifacts/p05-oci-rollback-producer-resume02'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def check_index(p,wanted):
 assert sha(p)==wanted;d=load(p)
 for row in d['files']:
  q=p.parent/row['path'];assert q.stat().st_size==row['bytes'] and sha(q)==row['sha256']
 return len(d['files'])
author=ROOT/'.docs/implementation/reviews/p05/oci-rollback-operational-rebind-author-round03/INDEX.json'
counts={'author':check_index(author,'45e7dc10d5a925b8da4939c543b8f422676ce6d6c925009a0a74e73c6735eecf')}
assert sha(P/'INDEX.json')=='552590591c8f255cc7963fc738da045731a6ce0fa060f709854c0ee72c2bf853'
def producer_map(p):
 result={}
 for q in sorted(p.rglob('*')):
  n=q.relative_to(p).as_posix();assert not q.is_symlink()
  if q.is_dir():result[n]={'type':'directory'}
  elif n!='INDEX.json':result[n]={'type':'regular_file','bytes':q.stat().st_size,'sha256':sha(q)}
 return result
assert producer_map(P)==load(P/'INDEX.json')['source_map']
mirror=author.parent/'producer';assert producer_map(P)==producer_map(mirror) and sha(P/'INDEX.json')==sha(mirror/'INDEX.json')
assert sha(OLD/'INDEX.json')=='f3e37a87d3a154302e9177d15031e39b8837575c41aa507410283ebff645914d'
assert producer_map(OLD)==load(OLD/'INDEX.json')['source_map']
diff=load(P/'resume03-final-changes.json');assert len(diff['unchanged_executable_files'])==29
for r in diff['unchanged_executable_files']:assert sha(P/r['path'])==sha(OLD/r['path'])==r['sha256']
fixtures=[]
for q in (OLD/'pinned-inputs').rglob('*'):
 if q.is_file():n=q.relative_to(OLD);assert sha(q)==sha(P/n);fixtures.append(n.as_posix())
b=load(P/'BINDING.json');prior=load(OLD/'BINDING.json')
for k in ['source_identity','prior_source_identity','included_files','compiled_files','mandatory_controls','budget_mib','total_mib','reserve_bytes','attempt_limit_ms','synthetic_content_only','human450','full_P05_PASS','metadata_profile']:assert b[k]==prior[k],k
assert len(b['mandatory_controls'])==14 and all(x['required'] for x in b['mandatory_controls'])
assert b['status']=='AUTHOR_OPERATIONAL_BINDING_PENDING_INDEPENDENT_REVIEW' and b['root_run_ack'] is False
assert load(P/'ROOT_RUN_ACK.json')['status']=='NOT_AUTHORIZED'
for pin in load(P/'operational-input-pins.json'):
 assert sha(ROOT/pin['source'])==sha(P/pin['copy'])==pin['sha256'] and (P/pin['copy']).stat().st_size==pin['bytes']
for label,name,wanted in [('method','oci-rollback-independent-review-resume-round02','789492910f6cbaea7e7b936eae3bd803333fe0b14b64a240ff80e43d12a621b0'),('image','recovery-image-binding-independent-round01','c451ddef9cec3ae0fadf1b9aa3d955c3ce7d5bffa60034cb9b91c9652e44db6c'),('resource','oci-resource-feasibility-actual-rebound-round01','e0eea2d1f15f65ae9eba2447616ec03b5cc466a749ade8ae55808174ead8e830')]:counts[label]=check_index(ROOT/'.docs/implementation/reviews/p05'/name/'INDEX.json',wanted)
actual=load(P/'operational-inputs/actual-image-review.json');expanded=load(P/'actual-image-maps.json');oldexpanded=load(OLD/'actual-image-maps.json')
assert sha(P/'actual-image-maps.json')==b['expanded_actual_image_UI_migration_maps_sha256']=='e8d4b25b79c55a1ce8e92b121b41248c8e6b3ed1ce61d6f94742aed668127ab4'
assert actual['error'] is None and actual['owned_container_inventory_empty'] is True
for row in actual['images']:
 key=row['key'];receipt=load(P/('operational-inputs/new-'+key+'-receipt.json'));m=expanded['maps'][key]
 assert row['new_image']==b['images'][key]==receipt['image']==expanded['images'][key]
 assert row['included_files']==1813 and row['historical_source']==(b['source_identity'] if key=='A' else b['prior_source_identity'])
 assert len(row['union_files'])==81 and row['actual_probe_exit_code']==0 and row['current_live_stage_acceptance'] is False
 assert len(m['files'])==74 and set(m['files'])==set(oldexpanded['maps'][key]['files']) and all(row['union_files'][n]==h for n,h in m['files'].items())
 assert m['files']==oldexpanded['maps'][key]['files']
 assert len(receipt['image_files_sha256'])==73 and b['receipt_image_maps'][key]==receipt['image_files_sha256']
 assert all(row['union_files'][n]==h for n,h in receipt['image_files_sha256'].items())
 assert row['actual_container_id']==m['actual_container_id'] and m['raw_independent_image_proof_sha256']==sha(P/'operational-inputs/actual-image-review.json')
 assert m['metadata'] is None and m['metadata_absent'] is True
f=load(P/'operational-inputs/actual-resource-report.json');assert f['status']=='PASS_BOUNDED_RESOURCE_FEASIBILITY_ONLY' and f['cleanup']=='completed' and not f['cleanup_errors'] and len(f['checks'])==4
health=[x for x in f['commands'] if len(x['args'])>2 and x['args'][0]=='exec' and x['args'][2]=='pg_isready']
assert health and health[-1]['exit_code']==0
assert all(x['exit_code']==0 or x in health and x['exit_code']==2 and 'no response' in x['stdout'] for x in f['commands'])
assert all(x['stdout']=='' and x['exit_code']==0 for x in f['commands'][-2:])
assert f['full_OCI14_RUN'] is False and f['statistics_RUN'] is False
v=load(P/'resume03-validation-attempt02.json');assert len(v['checks'])==40 and all(x['exit_code']==x['expected_exit_code'] for x in v['checks'])
assert sum(diff['finite_controls'].values())==216
projection=load(P/'ROOT_ACTIVATION_PROJECTION.json');assert set(projection['binding_changes_only_after_root_and_non_author_review'])=={'status','root_run_ack'}
assert projection['binding_changes_only_after_root_and_non_author_review']=={'status':{'before':b['status'],'after':'ROOT_FROZEN_INDEPENDENTLY_REVIEWED_READY'},'root_run_ack':{'before':False,'after':True}}
assert b['resource_guard']['status']=='INDEPENDENTLY_REVIEWED_READY' and sha(P/b['resource_guard']['module'])==b['resource_guard']['sha256']
snapshot=P.parents[1];sys.path.insert(0,str(snapshot/'tools'));from stage_inventory import inventory,identity
files=inventory(snapshot);assert len(files)==1813 and identity(files)==b['source_identity']
result={'status':'PASS_OPERATIONAL_INPUTS_ONLY','index_children_verified':counts,'producer_map_entries':len(producer_map(P)),'unchanged_executables':29,'unchanged_fixture_files':len(fixtures),'source_identity':identity(files),'included_files':1813,'images':b['images'],'projection_files_per_image':74,'actual_union_per_image':81,'receipt_files_per_image':73,'author_finite_commands':40,'author_finite_controls':216,'resource_actual_checks':4,'actual_Docker_calls':0,'producer_writes':False,'current_live_stage_acceptance':False}
(OUT/'inputs-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
