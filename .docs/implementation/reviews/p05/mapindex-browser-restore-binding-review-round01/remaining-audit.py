from pathlib import Path
import sys,json,hashlib,datetime,zipfile,subprocess,shutil
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path.cwd();base=Path('.artifacts/p05-mapindex-binding-review-round01');out=Path('.docs/implementation/reviews/p05/mapindex-browser-restore-binding-review-round01')
read=lambda p:json.loads(p.read_text('utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
browser=Path('.artifacts/p05-topic-browser');restore=Path('.artifacts/p05-topic-restore');oldrestore=Path('.docs/implementation/evidence/p05/storage503-topic-restore-preflight-01/run')
expected={browser/'run.mjs':'58e338202f98a4919312b2e4c2c6f6547c349c1b292cfe1566f807c361ac01f2',Path('.artifacts/p05-mapindex-browser-root-binding01.json'):'ab2bf7ee1e2e1ddaf5b6667469040979bd0493656763a740b908e407b8ffffae',restore/'BINDING.json':'989d1dd3f5f73afb9f8de005c5d25bc05439cb63cb2cc4ea18c042985398258e',restore/'ROOT_RUN_ACK.json':'e0eb688743ae12282bf3c8c721f7766692806856617a477edec8fb6718559a81',Path('.artifacts/p05-mapindex-image-build-receipt01.json'):'20a6942b5a7f6ebd099ff75688bbf32da479ebed82b4991fa87ea6c7e95cb079',browser/'HANDOFF.json':'f9bf1731f8f3f897ee342d7cc7b029e812265cd477e4189cdcdf7847d44582a8',restore/'HANDOFF.json':'a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b'}
for p,h in expected.items():assert sha(p)==h,p
authority=read(Path('.artifacts/p05-mapindex-browser-root-binding01.json'));before=(Path('.docs/implementation/reviews/p05/topic-browser-method10-review-round01/inputs/.artifacts/p05-topic-browser/run.mjs')).read_bytes()
for old,new in authority['exact_replacements']:
 assert before.count(old.encode())==1;before=before.replace(old.encode(),new.encode())
assert before.replace(b'\r',b'')==(browser/'run.mjs').read_bytes().replace(b'\r',b'') # ONLY continuity for remaining audit; initial exactbyteFAIL retained
for name,h in read(browser/'HANDOFF.json')['pins'].items():
 if name!='run.mjs':assert sha(browser/name)==h,name
# Fresh exact top-level names/types; only two current regular files changed.
oldpins=read(oldrestore/'producer-pins-before.json');pins={}
for p in sorted(restore.iterdir()):
 assert not p.is_symlink();assert p.is_file() or p.is_dir()
 pins[p.name]={'type':'regular_file','sha256':sha(p)} if p.is_file() else {'type':'historical_directory_contents_excluded'}
assert set(pins)==set(oldpins)
changed=[name for name in pins if pins[name]!=oldpins[name]];assert changed==['BINDING.json','ROOT_RUN_ACK.json'],changed
binding=read(restore/'BINDING.json');prior=read(oldrestore/'producer/BINDING.json');assert {k for k in binding if binding[k]!=prior[k]}=={'source_identity','image'}
for name,h in [('BINDING-storage503-root-preserved.json',oldpins['BINDING.json']['sha256']),('ROOT_RUN_ACK-storage503-preserved.json',oldpins['ROOT_RUN_ACK.json']['sha256'])]:assert sha(restore/'producer-checkpoint06'/name)==h
ack=read(restore/'ROOT_RUN_ACK.json');assert ack['prior_binding']==prior and ack['new_binding']==binding and ack['binding_sha256']==sha(restore/'BINDING.json')
source=inventory();sid=identity(source);assert sid==binding['source_identity']=='e9b9d97223ab38721255c67d041638f99594d0536b719a82a1531e58e137e6d4' and len(source)==1813
freeze=Path('.docs/implementation/evidence/p05/map-index-source-freeze-01');fm=read(freeze/'inputs.json');assert fm['files']==source
for x in read(freeze/'index.json')['files']:assert sha(freeze/x['path'])==x['sha256']
archive=freeze/'included-source.zip';assert sha(archive)=='064a04d912452d2c20afd5503c3be57016640610a46ba8bf7f244d7208ff486f'
with zipfile.ZipFile(archive) as z:
 assert set(z.namelist())==set(source)
 for name,h in source.items():assert hashlib.sha256(z.read(name)).hexdigest()==h
receipt=read(Path('.artifacts/p05-mapindex-image-build-receipt01.json'));assert receipt['source_identity']==sid and receipt['image']==binding['image'] and receipt['build_exit_code']==receipt['read_only_probe_exit_code']==0
assert sha(Path('.artifacts/p05-mapindex-build01.txt'))==receipt['build_log_sha256']
for name,h in receipt['image_files_sha256'].items():assert sha(Path(name))==h,name
for name,h in receipt['host_compiled_files_sha256'].items():assert sha(Path(name))==h,name
assert len(receipt['image_files_sha256'])==9 and len(receipt['host_compiled_files_sha256'])==64
image=subprocess.run(['docker','image','inspect',binding['image'],'--format','{{.Id}}'],capture_output=True,text=True);assert image.returncode==0 and image.stdout.strip()==binding['image'];(base/'readonly-image-inspect.txt').write_text(image.stdout+image.stderr,'utf-8')
guards=read(base/'guards.json');assert guards['status']=='PASS' and guards['checks']==10
print('RESTORE_SOURCE_ZIP_IMAGE_GUARDS_REMAINING_READONLY_CHECKS_PASS_NOT_BROWSER_EXACTBYTE_ACCEPTANCE')
