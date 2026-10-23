from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,sys
r=Path(__file__).parent;a=Path('.docs/implementation/reviews/p05/projection-reuse-product-author-round01');read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
receipt=read(a/'image-receipt.json');assert receipt==read(Path('.artifacts/p05-projection-reuse-image-binding01/receipt.json'))
assert receipt['image']=='sha256:9e1a7ee66230b3b5c362a4f5f08fff6bef04899e10796129392fe7a28ab5e355' and receipt['source_identity']=='c454631da2b2ede99241555273a35d7b0b4124c76f30ab3632bf2ba48d540d40'
union={}
for key,count in [('source_files',203),('compiled_files',64),('migration_files',7),('web_dist_files',3)]:
 assert len(receipt[key])==count
 for name,pin in receipt[key].items():
  if name in union:assert union[name]==pin
  union[name]=pin
  if key!='web_dist_files':assert sha(Path(name).read_bytes())==pin
assert union==receipt['image_files_sha256'] and len(union)==270
previous=read(Path('.artifacts/p05-timing-poll-image-binding02/receipt.json'))
assert previous['image']==receipt['previous_image'] and receipt['web_dist_files']==previous['web_dist_files']
assert receipt['changed_image_paths']==['apps/api/dist/topic-games.js','apps/api/src/topic-games.ts','apps/api/src/topic-projection-reuse.test.ts']
assert receipt['build_observed_exit']==receipt['probe_exit_code']==0 and receipt['probe_cleanup']=='AUTO_REMOVED' and receipt['source_before_after_unchanged']
assert sha((a/'p05-projection-reuse-docker-build01.txt').read_bytes())==receipt['build_log_sha256']
old=Path('.artifacts/p05-timing-poll-browser20-run01.mjs');outer=Path('.artifacts/p05-projection-reuse-browser20-run01.mjs');draftpath=Path('.artifacts/p05-projection-reuse-browser20-binding-draft01.json')
assert sha(old.read_bytes())=='11c8e6f7ae91a61c901b141962be70dcd125a03b3d62f58d85400f9893d6eac1';assert sha(outer.read_bytes())=='6ca2dff8b962ed4a870562b46117daa8093549483d4ff446f8aa1e5f35486034';assert sha(draftpath.read_bytes())=='80441fa1e70bbf20b344653d9500e959c939c9c1c38acb0d0694f7c7f44d3c4a'
draft=read(draftpath);assert draft['rootACK'] is False
expected=old.read_bytes()
for before,after in draft['literal_replacements'].items():
 assert expected.count(before.encode())==1;expected=expected.replace(before.encode(),after.encode())
assert expected==outer.read_bytes() and len(draft['literal_replacements'])==4
pins=read(Path('.docs/implementation/evidence/p05/timing-poll-browser20-chromium-actual01/run/producer-pins.json'));assert len(pins)==10
for name,pin in pins.items():assert sha((Path('.artifacts/p05-private-batch-browser-producer20')/name).read_bytes())==pin
sys.path.insert(0,'tools');from stage_inventory import inventory,identity
current=inventory();assert current==read(a/'source-freeze.json')['files'] and identity(current)==receipt['source_identity'] and len(current)==1825
for p in ['apps/web/src/topic-games-panel.tsx','apps/web/src/topic-state.ts','apps/web/src/topic-safety.ts','packages/contracts/src/topic-games.ts']:
 assert current[p]==read(Path('.artifacts/p05-compatible-rollback-producer02/included-inputs.json'))[p]
(r/'operational-outer.mjs.bytes').write_bytes(outer.read_bytes());(r/'operational-draft.json.bytes').write_bytes(draftpath.read_bytes())
out={'at_utc':datetime.now(timezone.utc).isoformat(),'source_identity':receipt['source_identity'],'files':1825,'image':receipt['image'],'source203_compiled64_migrations7_actual_web3_union270':True,'actual_image_web_exact_AA_not_host_asset_names':True,'build_probe_exit0_auto_removed_author_record':True,'independent_new_Docker_probe':False,'runtime10_exact':True,'outer_single_literal_replacements':4,'rootACK':False,'actual_RUN':False,'source_after_own_tests_unchanged':True}
(r/'bindings.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
