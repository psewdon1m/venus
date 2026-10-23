from pathlib import Path
import json,hashlib
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-a17-oci22-binding-author01'
read=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer21';new=root/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22'
freezePath=root/'.artifacts/p05-pilot-bundle-source-freeze14.json';f=read(freezePath);materialized=root/'.artifacts/p05-pilot-bundle-source14'
rPath=root/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';r=read(rPath);pPath=root/'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json';p=read(pPath)
oldb=read(old/'BINDING.json');b=read(new/'BINDING.json');oldm=read(old/'actual-image-maps.json');m=read(new/'actual-image-maps.json');ack=read(new/'ROOT_RUN_ACK_TEMPLATE.json')
assert b['source_identity']==r['source_identity']==p['source_identity']==f['identity']
assert b['included_files']==r['included_files']==p['included_files']==f['included_files']==1871
assert read(new/'included-inputs.json')==f['files']
for name,h in f['files'].items():assert sha(materialized/name)==h,name
oldruntime={x.relative_to(old).as_posix():sha(x) for x in old.rglob('*.mjs')};newruntime={x.relative_to(new).as_posix():sha(x) for x in new.rglob('*.mjs')};assert oldruntime==newruntime and len(newruntime)==40
changed=[];added=[]
for x in sorted(new.rglob('*')):
 if x.is_file() and x.relative_to(new).as_posix()!='INDEX.json':
  n=x.relative_to(new).as_posix();q=old/n
  if not q.exists():added.append(n)
  elif x.read_bytes()!=q.read_bytes():changed.append(n)
assert sorted(changed)==sorted(['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','actual-image-maps.json','included-inputs.json'])
assert added==['OPERATIONAL_REVISION22.json']
for field in ['per_image_compiled','per_image_additional']:assert b[field]['B']==oldb[field]['B']
assert b['images']['B']==oldb['images']['B']=='sha256:62602920f998e1e971d3f8f9dd55c706217e4e00a50bcee2d056cbf6d94c8903'
assert m['maps']['B']==oldm['maps']['B']
assert b['private_policies']==oldb['private_policies'] and b['previous_candidate_approved_known_good'] is False
assert {**b['per_image_compiled']['A'],**b['per_image_additional']['A']}==r['compiled_files']
assert m['maps']['A']['files']=={**r['compiled_files'],**r['migration_files'],**r['web_dist_files'],**r['pg_dependency_files']}
assert m['images']==b['images']==ack['images'] and m['images']['A']==r['image']
assert len(m['maps']['A']['files'])==81 and len(m['maps']['B']['files'])==78
assert b['expanded_actual_image_UI_migration_maps_sha256']==ack['expanded_image_map_sha256']==sha(new/'actual-image-maps.json')
assert ack['source_identity']==ack['application_source_review_source']==f['identity'] and b['root_run_ack'] is ack['root_run_ack'] is False
assert ack['producer_index_sha256'] is None and ack['independent_review_index'] is None and ack['status']=='NOT_AUTHORIZED'
assert p['build_metadata']['source_revision']==p['source_git_commit']==f['git_source_commit']=='3abad03309ebd19f04fc0b61532627a5188d855c' and p['base_test_image']==r['image']
oldr=read(root/'.artifacts/p05-pilot-bundle-image-binding13/receipt.json');oldp=read(root/'.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json')
for field in ['compiled_files','migration_files','pg_dependency_files']:assert oldr[field]==r[field] and oldp[field]==p[field]
js=lambda q:[h for n,h in q['web_dist_files'].items() if n.endswith('.js')]
assert js(r)==js(oldr)==js(p)==['18645659151dc2d9c1d5e2ae0b5e13b65b0f90f8864a5f5ec75e8c00cef1bf32']
assert len(r['web_dist_files'])==len(p['web_dist_files'])==3 and r['web_dist_files']==p['web_dist_files']
assert r['web_dist_files']!=oldr['web_dist_files']
index=read(new/'INDEX.json');actual={x.relative_to(new).as_posix():{'type':'regular_file','bytes':x.stat().st_size,'sha256':sha(x)} for x in sorted(new.rglob('*')) if x.is_file() and x.relative_to(new).as_posix()!='INDEX.json'}
assert index['files']==actual
reviewPath=root/'.docs/implementation/reviews/p05/oci21-diagnostic-independent-round01/INDEX.json';review=read(reviewPath);assert sha(reviewPath)=='12be809d9b1092b7903b5b65812872106bc8baafeda87c9071c1d5b3e9eb6ff4'
assert review['producer21_index_sha256']==sha(old/'INDEX.json')=='7045afa7d30ea2e1f94eb6c0efcaa54cb83b00cc65f05a636a726ca645487596'
pins={}
for x in [freezePath,rPath,pPath,old/'INDEX.json',new/'INDEX.json',reviewPath]:pins[x.relative_to(root).as_posix()]={'bytes':x.stat().st_size,'sha256':sha(x)}
result={'status':'PASS_AUTHOR_COLD_BINDING_ONLY_NOT_NATIVE_NOT_INDEPENDENT','source_identity':f['identity'],'included_files':1871,'source_git_commit':f['git_source_commit'],'materialized_files_checked':1871,'all40MJS_byte_exact21':True,'changed_existing':changed,'added_metadata':added,'A_critical_files':81,'B_critical_files':78,'B4_all_fields_preserved':True,'A69_backend_SQL7_PG2_exact_A16':True,'A17_JS_content_exact_A16_new_asset_name_CSS_HTML_new':True,'authority_all_false':True,'native_runs':0,'producer_index_sha256':sha(new/'INDEX.json')}
(work/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n');(work/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2)+'\n');(work/'RUNTIME-PINS.json').write_text(json.dumps(newruntime,indent=2)+'\n');print(json.dumps(result))
