from pathlib import Path
import hashlib,json,sys
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;S=ROOT/'.artifacts/p05-recovery-source1274-01';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
dpath=ROOT/'.artifacts/p05-recovery-method16-binding-draft01.json';d=json.loads(dpath.read_text());runner=S/'.artifacts/p05-recovery-method16-browser-run01.mjs'
assert sha(dpath)=='245dd0c217c1b887a53255d7fb149049493c10594ba33594015bf73a6f706159'
assert sha(runner)==d['runner_sha256']=='c4b2c00aba69c485b1e44147529f65a7f7b1dd86b7561d46d88992558584ba6b'
old=S/'.artifacts/p05-recovery-method15-browser-run01.mjs';assert sha(old)=='d6da5a457eee82441aa60ec5731ca660d01fe931ab981184dcee50ada5a37ce7'
text=old.read_text()
for a,b in [('p05-private-batch-browser-producer15','p05-private-batch-browser-producer16'),('p05-recovery-method15-root-ack01.json','p05-recovery-method16-root-ack01.json')]:assert text.count(a)==1;text=text.replace(a,b)
assert text==runner.read_text(),'unexpected outer code change'
review=Path(d['independent_review_index']);assert sha(review)==d['independent_review_index_sha256']=='d7c452b3b58bf3199f7a94af88b266c01121881a39389727709fd43e70ad9bc8'
m=json.loads(review.read_text());h=json.loads((review.parent/'HANDOFF.json').read_text());assert h['status']=='PASS_METHOD_ONLY_NOT_BROWSER' and h['runtime_pins']==d['runtime_pins'] and h['root_run_ack'] is False
for row in m['files']:
 p=review.parent/row['path'];assert sha(p)==row['sha256'] and p.stat().st_size==row['bytes']
assert len(d['runtime_pins'])==10 and 'readiness-diagnostics.mjs' in d['runtime_pins']
for name,pin in d['runtime_pins'].items():assert sha(S/'.artifacts/p05-private-batch-browser-producer16'/name)==sha(ROOT/'.artifacts/p05-private-batch-browser-producer16'/name)==pin
receipt=Path(d['image_receipt']);r=json.loads(receipt.read_text());assert sha(receipt)==d['image_receipt_sha256']=='eb994713042617b6e9bcc567062e502b18e5330b54759ee85b33ab1459ae0f7c'
assert r['image']==d['image']=='sha256:29e39ccd2afe45804ead1c049aed82582ec4dd006d2fda7b278f385cdae7e04f' and r['source_identity']==d['source_identity'] and d['included_files']==r['included_files']==1813
sys.path.insert(0,str(S/'tools'));from stage_inventory import inventory,identity
files=inventory(S);assert len(files)==1813 and identity(files)==d['source_identity']=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
assert d['status']=='NOT_AUTHORIZED_DRAFT_REBINDING_REVIEW_REQUIRED' and d['rebinding_review_index'] is None and d['rebinding_review_index_sha256'] is None
assert not (S/'.artifacts/p05-recovery-method16-root-ack01.json').exists()
result={'status':'PASS_OPERATIONAL_INPUTS_ONLY','runner_sha256':sha(runner),'outer_changes_only':['producer16 path','rootACK16 path'],'runtime_pins':d['runtime_pins'],'method16_review_children_verified':len(m['files']),'source_identity':identity(files),'included_files':1813,'image':d['image'],'actual_Docker_calls':0,'actual_run':False,'current_live_stage_acceptance':False,'full_stage_acceptance':False}
(OUT/'inputs-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'method_review_children':len(m['files']),'runtime_pins':len(d['runtime_pins']),'source_files':len(files)}))
