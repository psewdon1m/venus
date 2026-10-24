from pathlib import Path
import hashlib,json,subprocess,datetime
R=Path('C:/.projects/venus');O=Path(__file__).parent;A=R/'.docs/implementation/reviews/p05/oci30-a19-runtime-map-correction-author-round01';S=R/'.artifacts/p05-pilot-bundle-source16';P=S/'.artifacts/p05-compatible-rollback-producer30';Q=S/'.artifacts/p05-compatible-rollback-producer29'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));dump=lambda n,x:(O/n).write_text(json.dumps(x,indent=2)+'\n',encoding='utf8')
pins={}
def pin(p,h=None):
 v=sha(p)
 if h:assert v==h,(str(p),v,h)
 pins[p.relative_to(R).as_posix()]={'sha256':v,'bytes':p.stat().st_size};return v
pin(A/'INDEX.json','7873d91bcdb07359450c53b008b9d259e80b5b85a32de94334bbffcf32fe44b1')
for n,v in load(A/'INDEX.json')['files'].items():assert sha(A/n)==v['sha256']and(A/n).stat().st_size==v['bytes']
for n,v in load(A/'INPUT-PINS.json').items():pin(R/n,v['sha256'])
pin(P/'INDEX.json','08ad7faf0c45331338fd64e76b615d1793aaea37b79af887d3b25f26feec8d85');pin(P/'actual-image-maps.json','9a6482ad29ffdd2e2a72a918c9aa5387d7b688fae83714a93dc280bd605ae181')
for n,v in load(P/'INDEX.json')['files'].items():assert sha(P/n)==v['sha256']and(P/n).stat().st_size==v['bytes'],n
x={p.relative_to(P).as_posix():sha(p)for p in P.rglob('*.mjs')};y={p.relative_to(Q).as_posix():sha(p)for p in Q.rglob('*.mjs')};assert x==y and len(x)==40
def diff(n):
 a=load(P/n);b=load(Q/n);return sorted(k for k in set(a)|set(b)if a.get(k)!=b.get(k))
assert diff('BINDING.json')==['expanded_actual_image_UI_migration_maps_sha256','operational_binding_revision'];assert diff('PROFILE.json')==['status'];assert diff('ROOT_RUN_ACK_TEMPLATE.json')==['expanded_image_map_sha256'];assert diff('actual-image-maps.json')==['maps']
b=load(P/'BINDING.json');m=load(P/'actual-image-maps.json');full=load(P/'FULL299-PROBE16.json');receipt=load(R/'.artifacts/p05-pilot-bundle-image-binding16/receipt.json');old28=load(R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-compatible-rollback-producer28/actual-image-maps.json')
assert b['source_identity']=='d1804e3e560e9879a19914ea1eccdc77cc69c1f9547808100d3849f4296c81b2'and b['included_files']==1873
assert m['images']==b['images']and b['expanded_actual_image_UI_migration_maps_sha256']==sha(P/'actual-image-maps.json')
assert m['maps']['B']==old28['maps']['B']==load(Q/'actual-image-maps.json')['maps']['B']and len(m['maps']['B']['files'])==78
assert full['files']==receipt['image_files_sha256'] and full['file_count']==len(full['files'])==299
selected=dict(b['per_image_compiled']['A']);assert len(selected)==64;selected.update(b['per_image_additional']['A']);assert len(selected)==69
dirs=['apps/api/migrations/','apps/api/game-migrations/','apps/api/catalog-migrations/','apps/api/chat-migrations/','apps/api/private-topic-migrations/','apps/web/dist/assets/']
for n,v in full['files'].items():
 if any(n.startswith(d)for d in dirs)or n in ['apps/web/dist/index.html','node_modules/pg/lib/index.js','node_modules/pg/package.json','build-metadata.json']:selected[n]=v
assert len(selected)==81 and m['maps']['A']['files']==selected
assert all(full['files'][n]==v for n,v in selected.items())
nonweb={n:v for n,v in selected.items()if not n.startswith('apps/web/')};assert len(nonweb)==78 and nonweb=={n:v for n,v in old28['maps']['A']['files'].items()if not n.startswith('apps/web/')}
phases={}
raw=S/'.artifacts/p05/venus-p05-oci-8f430f802c66'
for phase in ['A1','B2','A3']:
 d=load(raw/'evidence'/('phase-'+phase+'-terminal.json'));key='B'if phase=='B2'else'A';assert d['actual_image']['files']==m['maps'][key]['files'];phases[phase]={'files':len(d['actual_image']['files']),'compiled64':d['actual_image']['compiled64']}
rr=load(raw/'runner.json');assert rr['status']=='FAIL'
template=load(P/'ROOT_RUN_ACK_TEMPLATE.json');assert template['root_run_ack']is False and template['status']!='AUTHORIZED'
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';cmd=[node,str(A/'existing-map-comparator.mjs')];r=subprocess.run(cmd,cwd=R,capture_output=True);(O/'existing-comparator.stdout.txt').write_bytes(r.stdout);(O/'existing-comparator.stderr.txt').write_bytes(r.stderr);assert r.returncode==0;assert json.loads(r.stdout)==load(P/'INDEX.json')['files']
pin(R/'.docs/implementation/reviews/p05/a19-existing-gates-binding-independent-round01/INDEX.json','ee656e65515f9c21e410dd4ff9f70a86a6926de995ca93149857eaaec44fd9b0')
for n in ['BINDING.json','ROOT_RUN_ACK_TEMPLATE.json','image-modules.mjs','contract.mjs','driver.mjs','host-runner.mjs','FULL299-PROBE16.json']:pin(P/n)
dump('PINS.json',pins);dump('AUDIT.json',{'status':'PASS_NARROW_METADATA_CORRECTION_ONLY','author_children':10,'producer_children':len(load(P/'INDEX.json')['files']),'all40_recursive_MJS_raw_exact29':True,'A_expected_runtime_files':81,'B_expected_runtime_files':78,'A_runtime_basis':'64compiled+5additional+7SQL+3servedweb+2PG; same original image-modules scope','A_nonweb78_exactaccepted28':True,'A_currentweb3_exactreceipt16':True,'full299_probe_separate_exactreceipt':True,'old299_reject_saved81':True,'new81_equals_savedA1A3_B78_equalsB2':phases,'existing_strict_comparator_exit':r.returncode,'producerMap_matches_INDEX':True,'source_images_binding_unchanged':True,'original14_oracles_900000ms_512MiB_reserve10GiB_unchanged':True,'OCI29_actual_status_retained':rr['status'],'new30_actual_PASS':False,'read_attempt_failure':'rg guessed authority.mjs absent; driver import/inventory resolved contract.mjs; no conclusion from absence','new_native_Docker_model_APP_producer_ACK_Git_actions':0})
print(json.dumps({'status':'PASS_METADATA_ONLY','producer_files':len(load(P/'INDEX.json')['files']),'runtime40':len(x),'A':81,'B':78,'cold_exit':r.returncode}))

