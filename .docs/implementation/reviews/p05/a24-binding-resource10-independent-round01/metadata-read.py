from pathlib import Path
import hashlib,json,datetime
r=Path('C:/.projects/venus')
out=r/'.docs/implementation/reviews/p05/a24-binding-resource10-independent-round01'
out.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def pin(path,h):
 p=r/path;assert sha(p)==h,(path,sha(p));return read(p)
author=r/'.docs/implementation/reviews/p05/a24-two-gates-rebind-author-round01'
ai=read(author/'INDEX.json')
for n,d in ai['files'].items():
 p=author/n;assert sha(p)==d['sha256'] and p.stat().st_size==d['bytes'],n
freeze=pin('.artifacts/p05-pilot-bundle-source-freeze21.json','4218bcbaa6c1717f397a110f8e9445062a7e4ef16bfcc074c542ab4c08b669b6')
f=freeze['files'];old=read(r/'.artifacts/p05-pilot-bundle-source-freeze20.json')['files']
src=Path(freeze['materialized_root']);parent=r/'.artifacts/p05-pilot-bundle-source20'
assert len(f)==1878 and len(old)==1877
changed=[n for n in f if old.get(n)!=f[n]]
assert sorted(changed)==['.docs/implementation/p05-source-revision-keyboard-focus-06.json','apps/web/src/main.tsx']
assert (src/'apps/web/src/main.tsx').read_bytes().replace(b"&&field.matches(':focus-visible')",b'')==(parent/'apps/web/src/main.tsx').read_bytes()
assert all(f[n]==h for n,h in old.items() if n!='apps/web/src/main.tsx')
pr=pin('.docs/implementation/reviews/p05/focus-visible-guard-source-independent-round01/INDEX.json','8efd2e60093020641fb53bc5e1945e106a38c5a87c33e62636d26063be9a5f25')
for n,d in pr['files'].items(): assert sha(r/'.docs/implementation/reviews/p05/focus-visible-guard-source-independent-round01'/n)==d['sha256']
t=pin('.artifacts/p05-pilot-bundle-image-binding22/receipt.json','c474e97d6d406cc5f6171f1ab3e31cc9658def66cca54519b7b3b3845543df19')
p=pin('.artifacts/p05-pilot-bundle-production-image-binding22/receipt.json','738074bb1b0dd9c99e228f0c0a2daa5af253741de9683b907abc0d5795a2b987')
for q,oldpath,count,compiled in [(t,'p05-pilot-bundle-image-binding20',299,69),(p,'p05-pilot-bundle-production-image-binding20',122,67)]:
 before=read(r/'.artifacts'/oldpath/'receipt.json')
 assert q['source_identity']==freeze['identity'] and q['included_files']==1878
 assert len(q['image_files_sha256'])==count and len(q['compiled_files'])==compiled
 for key,num in [('compiled_files',compiled),('migration_files',7),('pg_dependency_files',2)]:
  assert len(q[key])==num and q[key]==before[key],key
 css=lambda x:{k:v for k,v in x['web_dist_files'].items() if k.endswith('.css')}
 assert css(q)==css(before) and len(css(q))==1
 assert q['probe_exit_code']==q['build_observed_exit']==q['app_imports']==0 and q['probe_cleanup']=='AUTO_REMOVED'
assert all(f[n]==h for n,h in t['source_files'].items())
assert p['ordinary_server_executed'] is False and p['source_git_commit']==freeze['git_source_commit']
ui=src/'.artifacts/p05-v2-layout-producer-a24-01';uold=r/'.artifacts/p05-pilot-bundle-source19/.artifacts/p05-v2-layout-producer-a22-01'
for n in ['run.mjs','runner-policy.mjs']:
 b=(ui/n).read_bytes();previous=(uold/n).read_bytes()
 b=b.replace(b'p05-v2-layout-producer-a24-01',b'p05-v2-layout-producer-a22-01') if n=='run.mjs' else b.replace(b'binding.included_files,1878',b'binding.included_files,1876')
 assert b==previous,n
others=[x.name for x in ui.glob('*.mjs') if x.name not in ['run.mjs','runner-policy.mjs']]
assert len(others)==25 and all((ui/n).read_bytes()==(uold/n).read_bytes() for n in others)
for folder in [ui,src/'.artifacts/p05-compatible-rollback-producer36']:
 ix=read(folder/'INDEX.json')
 for n,d in ix['files'].items():
  if d.get('type') in ['directory','historical_or_extraction_directory']:continue
  q=folder/n
  if q.is_file(): assert sha(q)==d['sha256'] and q.stat().st_size==d['bytes'],n
oci=src/'.artifacts/p05-compatible-rollback-producer36';oold=r/'.artifacts/p05-pilot-bundle-source19/.artifacts/p05-compatible-rollback-producer34'
paths={str(x.relative_to(oci)) for x in oci.rglob('*.mjs')}
assert len(paths)==40 and paths=={str(x.relative_to(oold)) for x in oold.rglob('*.mjs')}
assert all((oci/n).read_bytes()==(oold/n).read_bytes() for n in paths)
maps=read(oci/'actual-image-maps.json');omaps=read(oold/'actual-image-maps.json')
assert maps['images']['A']==t['image'] and maps['images']['B']==omaps['images']['B']
assert maps['maps']['B']==omaps['maps']['B']
actualA={**t['compiled_files'],**t['migration_files'],**t['web_dist_files'],**t['pg_dependency_files']}
assert len(actualA)==81 and actualA==maps['maps']['A']['files']
a=pin('.artifacts/p05-a24-existing-gates-resource-authority10.json','f7bca9ed5750c7c02207423e031cb3054cdcf55d534a8dd8f27bbef1a0dbff34')
aold=read(r/'.artifacts/p05-a22-existing-gates-resource-authority08.json')
for key in ['foreign_running_ids_expected','original_statistics_maximum_workers','original_statistics_worker','maximum_additional_concurrent_heavy','shards','browser_database_envelope','per_producer_profiles_unchanged','prelaunch_bounds','prestart_enforcement','automatic_batch_authorized','stop_on_first_failure_no_retry','no_other_new_heavy','additional_gate_envelopes','active_statistics_manifest_sha256']:
 assert a[key]==aold[key],key
assert a['revision']==10 and a['source_identity']==freeze['identity'] and a['source_files']==1878 and a['test_image']==t['image'] and a['production_image']==p['image']
assert a['last_independently_accepted_numeric_authority_sha256']=='9fe308787b737a7048ab191efd7cf44c7e9f51758bf3271e2507878cffe31119'
guard=r/'.artifacts/p05-a24-manual-preflight08.py';assert sha(guard)=='8d03b4a6751a5c31b62fdadf7ecac3a951ccf5d70b68c3fb98e6ea9fd1ad80c9'
g=guard.read_bytes().replace(b'p05-a24-existing-gates-resource-authority10',b'p05-a22-existing-gates-resource-authority08').replace(b'f7bca9ed5750c7c02207423e031cb3054cdcf55d534a8dd8f27bbef1a0dbff34',b'9fe308787b737a7048ab191efd7cf44c7e9f51758bf3271e2507878cffe31119').replace(b'A24_GATE_MANUAL_START_UNDER_RESOURCE10',b'A22_GATE_MANUAL_START_UNDER_RESOURCE08')
assert g==(r/'.artifacts/p05-a22-manual-preflight06.py').read_bytes()
assert sha(r/'.git/index')=='a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093'
result={'status':'PASS_CURRENT_A24_CHANGED_BINDINGS_RESOURCE_METADATA_ONLY','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_index_sha256':sha(author/'INDEX.json'),'author_children':len(ai['files']),'source_identity':freeze['identity'],'source_files':1878,'one_focus_visible_guard_whole_main_inverse_exact':True,'other1876paths_exact_A23':True,'source_independent8efd_exact':True,'compiled69_67_SQL7_PG2_CSS_exact_accepted_A22':True,'full_probe299_122':True,'UI2metadata_inverses_25rawexact_A22':True,'OCI40rawexact34_A81_B78strictmaps':True,'resource10_guard08_numericpolicy_exact_accepted08':True,'oldfunctionalcontrols_Docker_models_archive_payload_reads':0,'current_native_acceptance':False,'stage_acceptance':False}
(out/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
