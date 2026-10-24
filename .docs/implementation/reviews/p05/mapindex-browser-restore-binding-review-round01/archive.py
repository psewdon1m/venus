from pathlib import Path
import sys,json,hashlib,datetime,zipfile,subprocess,shutil
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path.cwd();base=Path('.artifacts/p05-mapindex-binding-review-round01');out=Path('.docs/implementation/reviews/p05/mapindex-browser-restore-binding-review-round01')
read=lambda p:json.loads(p.read_text('utf-8-sig'))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
browser=Path('.artifacts/p05-topic-browser');restore=Path('.artifacts/p05-topic-restore');oldrestore=Path('.docs/implementation/evidence/p05/storage503-topic-restore-preflight-01/run')
expected={browser/'run.mjs':'59306bfbff9fa8c827853303cd472384ce450c97daefa7e6e7b6df3e7a9ce267',Path('.artifacts/p05-mapindex-browser-root-binding02.json'):'1d146e33209d2d74e098c378808e40f411aaec4d805da1a1e90100e5bc069f68',restore/'BINDING.json':'989d1dd3f5f73afb9f8de005c5d25bc05439cb63cb2cc4ea18c042985398258e',restore/'ROOT_RUN_ACK.json':'e0eb688743ae12282bf3c8c721f7766692806856617a477edec8fb6718559a81',Path('.artifacts/p05-mapindex-image-build-receipt01.json'):'20a6942b5a7f6ebd099ff75688bbf32da479ebed82b4991fa87ea6c7e95cb079',browser/'HANDOFF.json':'f9bf1731f8f3f897ee342d7cc7b029e812265cd477e4189cdcdf7847d44582a8',restore/'HANDOFF.json':'a8a2daf149ef00a0f427b751b44092d01c19dde0f0cda59fe56316f821ee080b'}
for p,h in expected.items():assert sha(p)==h,p
authority=read(Path('.artifacts/p05-mapindex-browser-root-binding02.json'));before=(Path('.docs/implementation/reviews/p05/topic-browser-method10-review-round01/inputs/.artifacts/p05-topic-browser/run.mjs')).read_bytes()
for old,new in authority['exact_replacements']:
 assert before.count(old.encode())==1;before=before.replace(old.encode(),new.encode())
assert before==(browser/'run.mjs').read_bytes()
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
out.mkdir(parents=True,exist_ok=False)
inputs=[]
for p in list(expected)+[browser/'browser.mjs',freeze/'index.json',freeze/'inputs.json',restore/'producer-checkpoint06/BINDING-storage503-root-preserved.json',restore/'producer-checkpoint06/ROOT_RUN_ACK-storage503-preserved.json']:
 dest=out/'inputs'/p;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);inputs.append({'path':p.as_posix(),'sha256':sha(p)})
for p in base.iterdir():
 if p.is_file():shutil.copyfile(p,out/p.name)
status='BROWSER10_AND_RESTORE06_NEW_MAPINDEX_BINDING_STATIC_PASS'
report={'schema_version':1,'status':status,'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'reviewer':'/root/p05_topics_ui_review','exact_inputs':inputs,'source_identity':sid,'included_files':1813,'image':binding['image'],'findings':[],'checks':{'browser_exact_two_literal_replacements':True,'all_browser_handoff_otherpins_unchanged':True,'restore_fresh_top_names_types_unchanged':True,'restore_regular_changed':changed,'restore_exact_source_image_only_bindingdiff':True,'restore_prior_authorities_preserved':True,'fullsourceZIP1813hashes':True,'root_receipt5source4compiled_matches_host':True,'host_compiled_hashes':64,'readonly_Docker_image_Id_confirmed':True,'own_VM_bindingguards':10},'scope':'Exactbindingonly; method10/restore06 priorindependentstaticaccepted. Newactualruns require rootdecision and do not inherit oldsourceactualPASS.','limits':['Root build receipt records read-only9 imagefile observations; reviewer verifies receipt/buildlog/fullsourceZIP/currenthost/sourcecompiledhashes and actualimage.Id. No independent image file extraction or functionalDocker/containerstart.','No functionalruntime, otherengines, production, P06, fullP05 or human450 approval. Rootconcurrent Linux/host test runs untouched.'],'initial_browser_byteclaim_failure_preserved':read(base/'initial-failure.json'),'correction':'Root separatebinding02 uses original bytes+2literal replacements; initial58e338/authority01 retained and never RUN.','full_stage_pass':False}
(out/'report.json').write_text(json.dumps(report,indent=2)+'\n','utf-8')
(out/'REPORT.md').write_text('''# Map index source: browser/restore finite binding

**BROWSER10_AND_RESTORE06_NEW_MAPINDEX_BINDING_STATIC_PASS.** Initial exact-byte check found24extraCR bytes in runner58e338. Root preserved that unrun failure and published separate byte-preserving runner59306bfb/authority02. Corrected exact-byte comparison passes; no open findings. Browser run.mjs is byte-exact prior method10 runner after only source1d3a→e9b9 and imagea0b→d316 literal replacements; count1813 unchanged. Browser10/HANDOFF and every other declared pin are unchanged. Restore06 fresh top-level names/types match prior actual snapshot, with only BINDING/ROOT_RUN_ACK hashes changed. BINDING differs only source/image; old authorities are preserved exactly inside existing checkpoint06, and all runtime/HANDOFF bytes remain unchanged.

Current e9b9/1813 equals archived full source inventory. ZIP064a04 was checked for exact1813names/hashes. Root build receipt20a694 and exact buildlog are verified; five source and four compiled observations match host, as do64 hostcompiled pins. Independent read-only Docker image inspect returns exact image.Id d316. The reviewer did not extract image files or start a container: imagefile observation comes from root's pinned read-only build receipt. Ten own VM controls verify current source/count acceptance and wrong identity/count or invalid root ACK/status/image rejection.

This is finite binding acceptance for root RUN decisions, not a functional result on new source. Prior method10/restore06 reviews remain applicable to unchanged producer bytes; historical actuals are not promoted to new source. No product/producer writes, functional Docker RUN, or interference with concurrent root Linux/host runs occurred. Full P05/human450/production remain separate.
''','utf-8')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'index.json').write_text(json.dumps({'schema_version':1,'status':status,'files':entries},indent=2)+'\n','utf-8');print(json.dumps({'status':status,'index_sha256':sha(out/'index.json'),'files':len(entries)}))
