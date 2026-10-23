from pathlib import Path
import hashlib,json,datetime,sys
ROOT=Path(__file__).resolve().parents[5];sys.path.insert(0,str(ROOT/'tools'))
from stage_inventory import inventory,identity
OUT=Path(__file__).parent;A=ROOT/'.docs/implementation/reviews/p05/topic-layout-author-resume03';W=ROOT/'.artifacts/p05-v2-layout-producer-resume03';P=ROOT/'.artifacts/p05-v2-layout-producer-resume02'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8'))
assert sha(A/'INDEX.json')=='981e8fe4a724f49610f486c1341cabcdc00742fbbae61c6ebe320e16be756eb3'
rows=load(A/'INDEX.json')['files'];assert len(rows)==90
for x in rows:assert sha(A/x['path'])==x['sha256'] and (A/x['path']).stat().st_size==x['bytes']
assert sha(A/'HANDOFF.json').startswith('94b9733b')
prior=ROOT/'.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round02/INDEX.json';assert sha(prior)=='8937fa2fc7b912dbcc57ec3cd39ccb2aa8ec41e23635868ed6104fca52fd668d'
for x in load(prior)['files']:assert sha(prior.parent/x['path'])==x['sha256']
def runtime(root):
 r={}
 for p in sorted(root.iterdir(),key=lambda p:p.name):
  if p.is_file() and (p.name.endswith('.mjs') or p.name in ['binding.json','DESIGN.md']):r[p.name]={'type':'file','sha256':sha(p),'bytes':p.stat().st_size}
 return hashlib.sha256(json.dumps(r,separators=(',',':')).encode()).hexdigest()
assert runtime(P)=='d5aabd06dd1b6528d25b7574dc3503ad4c2f7f2a0476f49777b0aeda0dc510e1'
assert runtime(W)=='89d0b751d7f2b1963d948489380b6f031a95a3719ecafc24b8904c81a7ff642c'
for p in W.iterdir():
 if p.is_file():
  frozen=A/'producer'/p.name
  if not frozen.exists():frozen=A/'producer'/(p.name+'.bytes')
  assert frozen.exists() and sha(p)==sha(frozen),p.name
unchanged=['matrix.mjs','expected-cells.json','probe-policy.mjs','dom-audit.mjs','measure.mjs','x11.mjs','aggregate.mjs','browser.mjs','runtime.mjs','observations.mjs','private-batch-observer.mjs','contract-controls.mjs','inert-report-fixture.mjs']
for n in unchanged:assert sha(W/n)==sha(P/n)
assert (W/'run.mjs').read_text()==(P/'run.mjs').read_text().replace('p05-v2-layout-producer-resume02','p05-v2-layout-producer-resume03')
assert (W/'runner-policy.mjs').read_text().replace('binding.included_files,1819','binding.included_files,1813')==(P/'runner-policy.mjs').read_text()
binding=load(W/'binding.json');ack=load(W/'ROOT_RUN_ACK.json');assert ack['root_run_ack'] is False and ack['independent_review_path'] is None
assert ack['browser18_actual_PASS_prerequisite']=='PENDING_ROOT_WILL_NOT_ACK_BEFORE_PASS'
source=inventory(ROOT);assert len(source)==1819 and identity(source)==binding['source_identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4'
receipt=ROOT/binding['root_build_receipt_path'];assert sha(receipt)==binding['root_build_receipt_sha256']=='9b9307c5f09ab5706fe678c67e6835f7c24bbd5c39b3c8208567b6b09581e5ed'
rr=load(receipt);assert rr['image']==binding['image']=='sha256:0b4c3a743cdb6c0a15aa25ac5c74bd4bea3d7c5fcf21f62f1cffc951d66a37e5' and rr['probe_exit_code']==rr['build_exit_code']==0
image=load(receipt.parent/'actual-source-map.json');assert len(image)==200
for p,h in image.items():assert source[p]==h
method=ROOT/'.docs/implementation/reviews/p05/topic-browser-method18-independent-review-round01/INDEX.json';assert sha(method)=='87ec16348ba810913f8cc8d603987dd6c8416c83e43261bf349fa3bb89a9e99b'
for x in load(method)['files']:assert sha(method.parent/x['path'])==x['sha256']
for name in ['request-emission.mjs','readiness-diagnostics.mjs']:assert sha(W/name)==sha(ROOT/'.artifacts/p05-private-batch-browser-producer18'/name)
assert "absoluteBudget(180000)" in (W/'browser.mjs').read_text()
pins={str(p.relative_to(W)).replace('\\','/'):sha(p) for p in sorted(W.rglob('*')) if p.is_file()};(OUT/'working-file-pins.json').write_text(json.dumps(pins,indent=2)+'\n',encoding='utf-8')
result={'status':'PASS_NARROW_LAYOUT03_REBIND_INPUTS_ONLY','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_children':90,'current_working_files':len(pins),'source_identity':identity(source),'source_files':len(source),'image':binding['image'],'producer_runtime_digest':runtime(W),'parent_runtime_digest':runtime(P),'unchanged_oracle_runtime_files':unchanged,'actual_image_source_pins_reused':200,'existing_author_finite_controls_inherited_not_rerun':171,'prior_independent_review_finite_count_in_its_own_scope':load(prior)['finite_controls'],'actualbrowser18_PASS_prerequisite':'PENDING_ROOT_ACTUAL_ACCEPTANCE','actual_layout':'NOT_RUN','actual_r4_texts':'NOT_LOADED','in_person_browser_UI':'NOT_RUN_ONLINE_FIXTURE_ONLY','ACK':False,'full_stage_pass':False}
(OUT/'verification.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
