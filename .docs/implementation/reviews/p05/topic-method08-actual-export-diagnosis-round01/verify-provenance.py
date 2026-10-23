from pathlib import Path
import hashlib,json,sys
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;RUN=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
index=ROOT/'.docs/implementation/evidence/p05/recovery-method08-actual01/INDEX.json'
assert sha(index)=='8e6de2acca7ef3e336fd32170d9ccc318d4e89b2bf4888aec8608378c6637d0f'
data=json.loads(index.read_text())
for row in data['files']:
 p=index.parent/row['path'];assert p.stat().st_size==row['bytes'] and sha(p)==row['sha256']
review=ROOT/'.docs/implementation/reviews/p05/topic-measurement-method08-independent-review-round01/INDEX.json'
assert sha(review)=='e46158ab5d6e36f5fa633e95c9f40c19f4672f6f341d29cc935ab8fb1fae4977'
for row in json.loads(review.read_text())['files']:
 p=review.parent/row['path'];assert sha(p)==row['sha256'] and p.stat().st_size==row['bytes']
prep=json.loads((RUN/'preparation.json').read_text());pins=json.loads((RUN/'inputs/input-pins.json').read_text());assert sha(RUN/'inputs/input-pins.json')==prep['input_pin_sha256']
for row in pins['mapping']:assert sha(RUN/'inputs'/row['snapshot'])==row['sha256']
for path,pin in pins['producer'].items():
 if path.startswith('.artifacts/p05-topic-measurements-method08/'):
  assert sha(RUN/'inputs/next'/Path(path).name)==pin
  assert sha(ROOT/path)==pin
snapshot=ROOT/'.artifacts/p05-recovery-source1274-01';sys.path.insert(0,str(snapshot/'tools'));from stage_inventory import inventory,identity
files=inventory(snapshot);assert len(files)==1813 and identity(files)==prep['source_identity']
terminal=json.loads((ROOT/'.artifacts/p05-recovery-method08-run01.txt').read_text());assert terminal['status']=='NOT_ACCEPTED' and terminal['cleanup']=='retained' and terminal['exportVerified'] is False and terminal['workerStopped'] is True and terminal['supervisor_exit_code']==1
result={'status':'PASS_DIAGNOSIS_PROVENANCE_ONLY','actual_root_evidence_INDEX_sha256':sha(index),'actual_root_evidence_children_verified':len(data['files']),'method08_review_INDEX_sha256':sha(review),'method08_review_children_verified':len(json.loads(review.read_text())['files']),'snapshot_mappings_verified':len(pins['mapping']),'root_ACK_sha256':sha(ROOT/'.artifacts/p05-recovery-method08-root-ack01.json'),'source_identity':identity(files),'included_files':1813,'actual_status':terminal['status'],'actual_supervisor_exit':1,'actual_run_accepted':False}
(OUT/'provenance.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
