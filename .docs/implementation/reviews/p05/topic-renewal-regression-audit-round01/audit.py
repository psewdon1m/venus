from pathlib import Path
import json,hashlib,sys,zipfile,re,copy
sys.path.insert(0,'tools');from stage_inventory import identity
root=Path.cwd();ep=root/'.docs/implementation/evidence/p05';out=root/'.artifacts/p05-renewal-regression-audit-round01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text(encoding='utf-8'))
source='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad';archive_sha='82fac3944a024439ddce48f98263e96fe1f67568205d18e93d540acc3c00109e'
expected={'renewal-host-regression-01':'4e4dd51d21316823fadb6440c19e49c881af31d27e2b3dcdcd52120298e400de','renewal-linux-regression-01':'e68910e59e161bed51b4e4a4d04c75fafb0cc4bba2a6189b817c7d72bb60cef2','renewal-source-freeze-01':'0d3666f17709d598d2204935036caa60988ba40090419865c78d18a31adaa3b4'}
total=0
for name,h in expected.items():
 p=ep/name;assert sha(p/'index.json')==h
 for f in read(p/'index.json')['files']:
  q=p/f['path'];assert q.stat().st_size==f['bytes'] and sha(q)==f['sha256'];total+=1
freeze=ep/'renewal-source-freeze-01';files=read(freeze/'inputs.json')['files'];assert len(files)==1813 and identity(files)==source
assert sha(freeze/'included-source.zip')==archive_sha
with zipfile.ZipFile(freeze/'included-source.zip')as z:
 assert set(z.namelist())==set(files)
 for name,h in files.items():assert hashlib.sha256(z.read(name)).hexdigest()==h
host=ep/'renewal-host-regression-01';hi=read(host/'index.json');hc=read(host/'commands.json');ht=(host/'test.txt').read_text(encoding='utf-8')
linux=ep/'renewal-linux-regression-01';li=read(linux/'index.json');lr=read(linux/'run/runner.json');lc=read(linux/'run/commands.json');lt=re.sub(r'\x1b\[[0-9;]*m','',(linux/'run/tests.txt').read_text(encoding='utf-8'))
def host_guard(i,c):
 assert i['source_identity']==source and i['included_files']==1813 and i['observed_exit_code']==0
 assert i['tests_pass']==810 and i['platform_skips']==208 and i['test_files']==57
 assert set(c)=={'tests','typecheck','lint'} and all(v==0 for v in c.values())
def linux_guard(r,c,before,after):
 assert r['status']=='PASS' and r['cleanup']=='completed' and r['observed_exit_code']==0 and r['source_unchanged']
 assert r['source_identity']==source and r['included_files']==1813
 assert before==after and before['files']==files and identity(before['files'])==source
 assert [x['label']for x in c]==['build','JS','PY'] and all(x['exit_code']==0 for x in c)
host_guard(hi,hc)
before=read(linux/'run/materialized-before.json');after=read(linux/'run/materialized-after.json');linux_guard(lr,lc,before,after)
assert '810 passed | 208 skipped' in ht and '57 passed (57)'in ht
assert '1015 passed | 3 skipped'in lt and '57 passed (57)'in lt and 'Ran 124 tests'in lt and '\nOK\n'in lt
assert li['js_pass']==1015 and li['js_platform_skip']==3 and li['python_pass']==124
assert read(linux/'run/root-inputs-before.json')==read(linux/'run/root-inputs-after.json')
assert read(linux/'run/root-inputs-before.json')['files']==files
old=read(linux/'run/materialized-base.json');assert identity(old['files'])==lr['base_source_identity']
delta=sorted(n for n in files if old['files'].get(n)!=files[n]);assert len(delta)==10 and delta==sorted(lr['materialized_delta']) and not(set(old['files'])-set(files))
launcher=(linux/'launcher.py').read_text(encoding='utf-8');script=(linux/'run/runtime-script.mjs').read_text(encoding='utf-8')
assert "'--force'"in launcher and '78597'in script and '8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9'in script
assert "a[0]['Config']['Labels']['venus.p05.project']==name"in launcher and "'--volumes'"in launcher
assert "v['cleanup']='completed'"in launcher and "v['source_unchanged']=after==current"in launcher
assert len(read(linux/'run/owned-volume.json'))==1
assert (linux/'run/cleanup.txt').read_text(encoding='utf-8').strip()==lr['project']
assert 'TERMINAL '+json.dumps(lr) in (linux/'root-terminal.txt').read_text(encoding='utf-8')
receipt=ep/'renewal-topic-browser-preflight-01/p05-renewal-image-build-receipt01.json';assert sha(receipt)=='2dae88a270c9a9a3fbc33386b09ae98585bebb49d6d26e1a3f6d95c8ddf443e5'
image=read(receipt);assert image['source_identity']==source and image['source_archive_sha256']==archive_sha
assert image['image']=='sha256:ff371010e110cbcc56e029d8396f1195bbcb8b41866ba9e1be73dde2b6da09c4'
assert image['build_observed_exit_code']==image['probe_exit_code']==0 and image['previous64compiled_identical']
assert len(image['host_compiled_files_sha256'])==64 and len(image['image_files_sha256'])==73
assert all(image['image_files_sha256'].get(n)==h for n,h in image['host_compiled_files_sha256'].items())
for n,h in image['image_files_sha256'].items():
 if n in files:assert h==files[n]
 if not n.startswith('apps/web/dist/assets/'):assert sha(root/n)==h
assert sha(receipt.parent/'p05-renewal-build01.txt')==image['build_log_sha256']
negatives=[]
for defect in ('exit','count','skip','commands'):
 i=copy.deepcopy(hi);c=copy.deepcopy(hc)
 if defect=='exit':i['observed_exit_code']=1
 if defect=='count':i['tests_pass']=1018
 if defect=='skip':i['platform_skips']=0
 if defect=='commands':c['tests']=1
 try:host_guard(i,c)
 except AssertionError:negatives.append('host_'+defect)
 else:raise AssertionError('host false acceptance')
for defect in ('status','cleanup','exit','unchanged','identity','command','map'):
 r=copy.deepcopy(lr);c=copy.deepcopy(lc);a=copy.deepcopy(before);b=copy.deepcopy(after)
 if defect=='status':r['status']='FAIL'
 if defect=='cleanup':r['cleanup']='missing'
 if defect=='exit':r['observed_exit_code']=1
 if defect=='unchanged':r['source_unchanged']=False
 if defect=='identity':r['source_identity']='foreign'
 if defect=='command':c[1]['exit_code']=1
 if defect=='map':b['files'][next(iter(b['files']))]='0'*64
 try:linux_guard(r,c,a,b)
 except AssertionError:negatives.append('linux_'+defect)
 else:raise AssertionError('linux false acceptance')
result={'status':'BOUNDED_CURRENT1274_HOST_LINUX_ARCHIVE_AUDIT_PASS','source_identity':source,'included_files':1813,'packet_indexes':expected,'indexed_files_verified':total,'source_zip_sha256':archive_sha,'source_zip_entries_verified':1813,'host':{'PASS':810,'SKIP':208,'files':57,'scope':'ROOT_FREEZE_WITNESS_NO_PER_COMMAND_MAPS'},'linux':{'PASS':1015,'SKIP':3,'python_PASS':124,'files':57,'materialized_included_delta':10,'extra_archived_plan_bytes':78597,'cleanup':'completed','scope':'OLDER_PINNED_QUALITY_IMAGE_WITH_EXACT_MATERIALIZED_SOURCE_NOT_FULL_QUALITY'},'image_receipt_sha256':sha(receipt),'image_pins':73,'compiled_pins':64,'host_compiled_and_source_files_verified':71,'image_web_assets_receipt_only':2,'image_extraction_repeated':False,'negative_guards':negatives,'docker_commands':0,'suite_repeats':0,'full_stage_pass':False}
(out/'audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
