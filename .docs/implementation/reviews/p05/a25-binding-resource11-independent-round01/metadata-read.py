from pathlib import Path
import hashlib,json,datetime
r=Path('C:/.projects/venus')
out=r/'.docs/implementation/reviews/p05/a25-binding-resource11-independent-round01'
out.mkdir(exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
def pin(path,h):
 p=r/path;assert sha(p)==h,(path,sha(p));return read(p)
author=r/'.docs/implementation/reviews/p05/a25-two-gates-rebind-author-round01'
ai=read(author/'INDEX.json')
for n,d in ai['files'].items():
 p=author/n;assert sha(p)==d['sha256'] and p.stat().st_size==d['bytes'],n
freeze=pin('.artifacts/p05-pilot-bundle-source-freeze22.json','1bb09ee3980022bfdedfe9e48d71ddabe36e4a0ee64887c3f9be4ff4a21ff433')
f=freeze['files'];old=read(r/'.artifacts/p05-pilot-bundle-source-freeze21.json')['files']
src=Path(freeze['materialized_root']);parent=r/'.artifacts/p05-pilot-bundle-source21'
assert len(f)==1879 and len(old)==1878
changed=[n for n in f if old.get(n)!=f[n]]
assert sorted(changed)==['.docs/implementation/p05-source-revision-keyboard-focus-07.json','apps/web/src/main.tsx']
insertion=b" onKeyUp={event=>{\n    if(event.key!=='Tab') return;\n    const field=event.target;\n    if(field instanceof HTMLElement&&field===document.activeElement&&field.matches('input,select,button,textarea')) field.scrollIntoView({behavior:'instant',block:'center',inline:'nearest'});\n  }}"
insertion=insertion.replace(b'\n',b'\r\n')
current=(src/'apps/web/src/main.tsx').read_bytes();assert current.count(insertion)==1
assert current.replace(insertion,b'')==(parent/'apps/web/src/main.tsx').read_bytes()
assert all(f[n]==h for n,h in old.items() if n!='apps/web/src/main.tsx')
pr=pin('.docs/implementation/reviews/p05/tab-keyup-visibility-source-independent-round01/INDEX.json','69443c45070579049409ab6b1a9b7f89b174360a6adb18c4c4e9234be4c8ca80')
for n,d in pr['files'].items(): assert sha(r/'.docs/implementation/reviews/p05/tab-keyup-visibility-source-independent-round01'/n)==d['sha256']
t=pin('.artifacts/p05-pilot-bundle-image-binding23/receipt.json','00dea42404b27dc718622466bbf042c4a853b20905a1e0cb030bdcd2aa3e4660')
p=pin('.artifacts/p05-pilot-bundle-production-image-binding23/receipt.json','329183c1d4197b5d562f4d57b25ba8b2b4baca758b62bbcfb34f2026b96a4ce3')
for q,oldpath,count,compiled in [(t,'p05-pilot-bundle-image-binding22',299,69),(p,'p05-pilot-bundle-production-image-binding22',122,67)]:
 before=read(r/'.artifacts'/oldpath/'receipt.json')
 assert q['source_identity']==freeze['identity'] and q['included_files']==1879
 assert len(q['image_files_sha256'])==count and len(q['compiled_files'])==compiled
 for key,num in [('compiled_files',compiled),('migration_files',7),('pg_dependency_files',2)]:
  assert len(q[key])==num and q[key]==before[key],key
 css=lambda x:{k:v for k,v in x['web_dist_files'].items() if k.endswith('.css')}
 assert css(q)==css(before) and len(css(q))==1
 assert q['probe_exit_code']==q['build_observed_exit']==q['app_imports']==0 and q['probe_cleanup']=='AUTO_REMOVED'
assert all(f[n]==h for n,h in t['source_files'].items())
assert p['ordinary_server_executed'] is False and p['source_git_commit']==freeze['git_source_commit']
ui=src/'.artifacts/p05-v2-layout-producer-a25-01';uold=r/'.artifacts/p05-pilot-bundle-source21/.artifacts/p05-v2-layout-producer-a24-01'
for n in ['run.mjs','runner-policy.mjs']:
 b=(ui/n).read_bytes();previous=(uold/n).read_bytes()
 b=b.replace(b'p05-v2-layout-producer-a25-01',b'p05-v2-layout-producer-a24-01') if n=='run.mjs' else b.replace(b'binding.included_files,1879',b'binding.included_files,1878')
 assert b==previous,n
others=[x.name for x in ui.glob('*.mjs') if x.name not in ['run.mjs','runner-policy.mjs']]
assert len(others)==25 and all((ui/n).read_bytes()==(uold/n).read_bytes() for n in others)
for folder in [ui,src/'.artifacts/p05-compatible-rollback-producer37']:
 ix=read(folder/'INDEX.json')
 for n,d in ix['files'].items():
  if d.get('type') in ['directory','historical_or_extraction_directory']:continue
  q=folder/n
  if q.is_file(): assert sha(q)==d['sha256'] and q.stat().st_size==d['bytes'],n
oci=src/'.artifacts/p05-compatible-rollback-producer37';oold=r/'.artifacts/p05-pilot-bundle-source21/.artifacts/p05-compatible-rollback-producer36'
paths={str(x.relative_to(oci)) for x in oci.rglob('*.mjs')}
assert len(paths)==40 and paths=={str(x.relative_to(oold)) for x in oold.rglob('*.mjs')}
assert all((oci/n).read_bytes()==(oold/n).read_bytes() for n in paths)
maps=read(oci/'actual-image-maps.json');omaps=read(oold/'actual-image-maps.json')
assert maps['images']['A']==t['image'] and maps['images']['B']==omaps['images']['B']
assert maps['maps']['B']==omaps['maps']['B']
actualA={**t['compiled_files'],**t['migration_files'],**t['web_dist_files'],**t['pg_dependency_files']}
assert len(actualA)==81 and actualA==maps['maps']['A']['files']
a=pin('.artifacts/p05-a25-existing-gates-resource-authority11.json','01fe84029ea2cef6b30b553702ef0ae7c76af9580a19475b4529ac90d4e3e66b')
aold=read(r/'.artifacts/p05-a24-existing-gates-resource-authority10.json')
for key in ['foreign_running_ids_expected','original_statistics_maximum_workers','original_statistics_worker','maximum_additional_concurrent_heavy','shards','browser_database_envelope','per_producer_profiles_unchanged','prelaunch_bounds','prestart_enforcement','automatic_batch_authorized','stop_on_first_failure_no_retry','no_other_new_heavy','additional_gate_envelopes','active_statistics_manifest_sha256']:
 assert a[key]==aold[key],key
assert a['revision']==11 and a['source_identity']==freeze['identity'] and a['source_files']==1879 and a['test_image']==t['image'] and a['production_image']==p['image']
assert a['parent_resource_authority_sha256']=='f7bca9ed5750c7c02207423e031cb3054cdcf55d534a8dd8f27bbef1a0dbff34'
guard=r/'.artifacts/p05-a25-manual-preflight09.py';assert sha(guard)=='9e47da126cd1a0956aae54759ca6f77d835f3ae23d11654b11f36039d3850f62'
g=guard.read_bytes().replace(b'p05-a25-existing-gates-resource-authority11',b'p05-a24-existing-gates-resource-authority10').replace(b'01fe84029ea2cef6b30b553702ef0ae7c76af9580a19475b4529ac90d4e3e66b',b'f7bca9ed5750c7c02207423e031cb3054cdcf55d534a8dd8f27bbef1a0dbff34').replace(b'A25_GATE_MANUAL_START_UNDER_RESOURCE11',b'A24_GATE_MANUAL_START_UNDER_RESOURCE10')
assert g==(r/'.artifacts/p05-a24-manual-preflight08.py').read_bytes()
assert sha(r/'.git/index')=='a4bb6d5150e4fc2e8beb8bb14bd4aa13aba7e4b419b8c4e40c85e6708ac89093'
result={'status':'PASS_CURRENT_A25_CHANGED_BINDINGS_RESOURCE_METADATA_ONLY','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_index_sha256':sha(author/'INDEX.json'),'author_children':len(ai['files']),'source_identity':freeze['identity'],'source_files':1879,'four_line_Tab_keyup_whole_main_inverse_exact':True,'other1877paths_exact_A24':True,'source_independent6944_exact':True,'compiled69_67_SQL7_PG2_CSS_exact_accepted_A24':True,'full_probe299_122':True,'UI2metadata_inverses_25rawexact_A24':True,'OCI40rawexact36_A81_B78strictmaps':True,'resource11_guard09_numericpolicy_exact_accepted10':True,'oldfunctionalcontrols_Docker_models_archive_payload_reads':0,'current_native_acceptance':False,'stage_acceptance':False}
(out/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result))
