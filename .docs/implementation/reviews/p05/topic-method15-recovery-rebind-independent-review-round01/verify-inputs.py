from pathlib import Path
import hashlib,json,sys,datetime
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
draft_path=ROOT/'.artifacts/p05-recovery-method15-binding-draft01.json'
d=json.loads(draft_path.read_text());s=Path(d['source_root'])
runner=s/'.artifacts/p05-recovery-method15-browser-run01.mjs'
assert sha(draft_path)=='fcb33dc738b48021ce09b8e3b98c06c73661e5d2d05723cba2ad0dcfcfd5c908'
assert sha(runner)==d['runner_sha256']=='d6da5a457eee82441aa60ec5731ca660d01fe931ab981184dcee50ada5a37ce7'
r=json.loads(Path(d['image_receipt']).read_text())
baseline=(ROOT/'.artifacts/p05-method13-browser-run01.mjs').read_text()
changes={r['previous_pruned_image']:r['image'],'p05-private-batch-browser-producer13':'p05-private-batch-browser-producer15','p05-method13-root-binding01.json':'p05-recovery-method15-root-ack01.json','const before=inventory();':"assert.equal(sha(readFileSync(authority.image_receipt)),authority.image_receipt_sha256);assert.equal(sha(readFileSync(authority.rebinding_review_index)),authority.rebinding_review_index_sha256);\nconst before=inventory();",'DIRTY_FROZEN_FUNCTIONAL_V2_BROWSER_SLICE':'HISTORICAL_EXACT_SOURCE_REBUILT_IMAGE_DIAGNOSTIC_SLICE_NOT_CURRENT_LIVE_STAGE'}
for a,b in changes.items():assert baseline.count(a)==1;baseline=baseline.replace(a,b)
assert baseline==runner.read_text(),'unexpected outer change'
review=Path(d['independent_review_index']);m=json.loads(review.read_text())
assert sha(review)==d['independent_review_index_sha256']=='12b4aa5a8d7a3641b203c5eaa2ae27912325bbdd7bb58c6573c2ba430d62c540'
assert m['status']=='PASS_METHOD_ONLY' and m['runtime_pins']==d['runtime_pins']
for item in m['files']:
 p=review.parent/item['path'];assert sha(p)==item['sha256'] and p.stat().st_size==item['bytes']
assert len(d['runtime_pins'])==9
for name,pin in d['runtime_pins'].items():
 assert sha(s/'.artifacts/p05-private-batch-browser-producer15'/name)==pin
 assert sha(ROOT/'.artifacts/p05-private-batch-browser-producer15'/name)==pin
assert sha(Path(d['image_receipt']))==d['image_receipt_sha256']=='eb994713042617b6e9bcc567062e502b18e5330b54759ee85b33ab1459ae0f7c'
assert r['image']==d['image'] and r['source_identity']==d['source_identity'] and r['included_files']==1813
old=json.loads((ROOT/'.artifacts/p05-renewal-image-build-receipt01.json').read_text())
assert len(r['image_files_sha256'])==73 and r['image_files_sha256']==old['image_files_sha256']
assert len(r['host_compiled_files_sha256'])==64
assert all(sha(s/n)==h for n,h in r['host_compiled_files_sha256'].items())
sys.path.insert(0,str(s/'tools'));from stage_inventory import inventory,identity
files=inventory(s);ctx=json.loads((ROOT/'.artifacts/p05-renewal-freeze-context01.json').read_text())
assert files==ctx['files'] and len(files)==1813 and identity(files)==d['source_identity']
assert d['status']=='NOT_AUTHORIZED_DRAFT_REBINDING_REVIEW_REQUIRED'
assert not (s/'.artifacts/p05-recovery-method15-root-ack01.json').exists()
result={'status':'PASS_COLD_INPUTS_ONLY','source_identity':identity(files),'included_files':len(files),'image':d['image'],'image_files_map_count':73,'host_compiled_count':64,'runtime_pins':d['runtime_pins'],'runner_sha256':sha(runner),'baseline_changes_exact':list(changes),'existing_review_files_verified':len(m['files']),'actual_run':False,'image_probe_repeated':False,'current_live_source_acceptance':False}
(OUT/'inputs-verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
