from pathlib import Path
import json,shutil,hashlib
r=Path('C:/.projects/venus');parent=r/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-v2-layout-producer-resume15';child=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume16';assert not child.exists();shutil.copytree(parent,child,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json'))
s=(parent/'x11.mjs').read_bytes().decode()
a="// WebKit remains exact-title-only: its native identity/template is unresolved."
b="// WebKit's measured Playwright prefix still contains the full exact own nonce."
assert s.count(a)==1;s=s.replace(a,b)
a="const firefoxWindowSuffix=' \\u2014 Nightly';"
b=a+"\nconst webkitWindowPrefix='\\u{1f3ad} Playwright: ';\nfunction vendorWindowPrefix(engine){return engine==='webkit'?webkitWindowPrefix:'';}"
assert s.count(a)==1;s=s.replace(a,b)
a="checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return '^'+title+(suffix?'('+suffix+')?':'')+'$';"
b="checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return '^'+(prefix?'('+prefix+')?':'')+title+(suffix?'('+suffix+')?':'')+'$';"
assert s.count(a)==1;s=s.replace(a,b)
a="checkWindowNonce(title);const suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||(suffix!==''&&value===title+suffix));"
b="checkWindowNonce(title);const prefix=vendorWindowPrefix(engine),suffix=vendorWindowSuffix(engine);return typeof value==='string'&&(value===title||value===prefix+title+suffix);"
assert s.count(a)==1;s=s.replace(a,b);(child/'x11.mjs').write_bytes(s.encode())
(child/'run.mjs').write_bytes((parent/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume15',b'p05-v2-layout-producer-resume16').replace(b'FINAL_A16_BOUND_INDEPENDENT_REVIEW_REQUIRED',b'FINAL_A17_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace(b'FINAL_A16_BINDING_REQUIRED',b'FINAL_A17_BINDING_REQUIRED'))
policy=(parent/'runner-policy.mjs').read_bytes();assert policy.count(b'assert.equal(binding.included_files,1870)')==1;(child/'runner-policy.mjs').write_bytes(policy.replace(b'assert.equal(binding.included_files,1870)',b'assert.equal(binding.included_files,1871)'))
freezePath=r/'.artifacts/p05-pilot-bundle-source-freeze14.json';receiptPath=r/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';freeze=json.loads(freezePath.read_text());receipt=json.loads(receiptPath.read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
assert freeze['identity']==receipt['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d';assert freeze['included_files']==receipt['included_files']==1871
binding=json.loads((parent/'binding.json').read_text());binding.update(source_identity=freeze['identity'],included_files=1871,image=receipt['image'],root_build_receipt_path=str(receiptPath),root_build_receipt_sha256=sha(receiptPath.read_bytes()),source_snapshot_path=str(freezePath),source_snapshot_sha256=sha(freezePath.read_bytes()),status='FINAL_A17_BOUND_INDEPENDENT_REVIEW_REQUIRED');(child/'binding.json').write_text(json.dumps(binding,indent=2)+'\n',encoding='utf-8')
ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':freeze['identity'],'image':receipt['image'],'scope':'A17_LAYOUT16_MEASURED_WEBKIT_PREFIX_PENDING_NONAUTHOR_REVIEW_AND_ROOT_ACK'};(child/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':'PREPARED_A17_NOT_RUN','path':str(child),'ACK':False}))
