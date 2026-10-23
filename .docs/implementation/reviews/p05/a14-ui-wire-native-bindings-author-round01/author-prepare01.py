from pathlib import Path
import json,hashlib,shutil,difflib,datetime
r=Path('C:/.projects/venus');d=r/'.artifacts/p05-a14-ui-wire-native-bindings01';assert not d.exists();d.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def j(p):return json.loads(p.read_bytes())
def put(p,v):p.write_bytes((json.dumps(v,indent=2)+'\n').encode())
source=r/'.artifacts/p05-pilot-bundle-source11';freeze=r/'.artifacts/p05-pilot-bundle-source-freeze11.json';receipt=r/'.artifacts/p05-pilot-bundle-image-binding11/receipt.json';production=r/'.artifacts/p05-pilot-bundle-production-image-binding11/receipt.json';f=j(freeze);im=j(receipt);prod=j(production)
assert f['identity']=='c481761fbecfadf77883c5ab4c8a851ab201c092b57e6994ced431dccefd4193' and len(f['files'])==1865
assert sha(receipt)=='646b8e4104e6962f21c4107ea3f2b63f74b8652e7307ba82dce3bf6f1260bf68' and sha(production)=='06e4fe547f60261fb5d9dd0fb50841b30373ae670465dc38bb7fd7402248a737'
for n,h in f['files'].items():assert sha(source/n)==h
assert im['source_identity']==prod['source_identity']==f['identity'] and im['included_files']==prod['included_files']==1865
assert len(im['image_files_sha256'])==297 and len(prod['image_files_sha256'])==122
assert im['image']=='sha256:d3e515f5729af2306e5e62e9b92a50fe9dbf574e8a3451f8d22031bad519ac30'
assert prod['image']=='sha256:06133a2774fe083dc2187758e191951c3165b20bdee59e74ce8d05d0f0caaeca'
methods={
 'browser':r/'.docs/implementation/reviews/p05/topic-browser-method23-independent-round01/INDEX.json',
 'layout':r/'.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round08/INDEX.json',
 'wire':r/'.docs/implementation/reviews/p05/public-wire-adjunct-independent-round02/INDEX.json',
 'parentbinding':r/'.docs/implementation/reviews/p05/a13-ui-wire-native-bindings-independent-round01/INDEX.json',
 'app03':r/'.docs/implementation/reviews/p05/own-exclusion-refresh-independent-round03/INDEX.json'}
assert sha(methods['browser'])=='8ea52f43e0a2dd20cd13603ce2fc188523105ee0cddec12de25f71227ed58a6a'
assert sha(methods['parentbinding'])=='0c826f2f8132e00019eeb0650057db854f05db04e9e4673987a268f10fed49e5'
assert sha(methods['app03'])=='d2d9546fbe44a6dcf647cf13599cf9f7a15604aa5dd3c990b52c24241d1a30f7'
oldwrapper=r/'.artifacts/p05-browser23-a13-run01.mjs';wrapper=r/'.artifacts/p05-browser23-a14-run01.mjs';assert not wrapper.exists();text=oldwrapper.read_bytes()
substitutions={b'sha256:6a0336c782fde807fed24d0b0e4325bc387d0cd5d72d232340911fd28d68aee1':im['image'].encode(),b'p05-browser23-a13-root-ack01.json':b'p05-browser23-a14-root-ack01.json',b'5be635651557399fb9ef865ebd17c813fdf0c0eda8fc96f76a3840894cef039a':f['identity'].encode(),b'1863,':b'1865,'}
for old,new in substitutions.items():assert old in text;text=text.replace(old,new)
wrapper.write_bytes(text)
ack=j(r/'.artifacts/p05-browser23-a13-root-ack01.json');ack.update(status='NOT_AUTHORIZED',runner_sha256=sha(wrapper),image=im['image'],source_identity=f['identity'],source_files=1865,source_root=str(source),image_receipt=str(receipt),image_receipt_sha256=sha(receipt),rebinding_review_index='PENDING_FRESH_NONAUTHOR_A14_BINDING_REVIEW',rebinding_review_index_sha256='PENDING_FRESH_NONAUTHOR_A14_BINDING_REVIEW',issued_at=None,scope='PENDING_ONE_CHROMIUM16_FROZEN_A14_METHOD23_NOT_REAL470_OR_STAGE',application_review_index=str(methods['app03']),application_review_index_sha256=sha(methods['app03']),N4_prerequisite={'status':'HISTORICAL_A13_API_BYTECARRY_NOT_NEW_A14_UI_PROOF','parent':ack.get('N4_prerequisite')},concurrent_workload='PENDING_ROOT_RESOURCE_AND_LAUNCH_ACK')
ack['application_reviews'][str(methods['app03'])]=sha(methods['app03']);assert len(ack['runtime_pins'])==9
for n,h in ack['runtime_pins'].items():assert sha(r/'.artifacts/p05-private-batch-browser-producer23'/n)==h
browserack=r/'.artifacts/p05-browser23-a14-root-ack01.json';assert not browserack.exists();put(browserack,ack)
layoutold=r/'.artifacts/p05-pilot-bundle-source10/.artifacts/p05-v2-layout-producer-resume09';layout=source/'.artifacts/p05-v2-layout-producer-resume10';assert not layout.exists();shutil.copytree(layoutold,layout)
b=j(layout/'binding.json');b.update(source_identity=f['identity'],included_files=1865,image=im['image'],root_build_receipt_path=str(receipt),root_build_receipt_sha256=sha(receipt),source_snapshot_path=str(freeze),source_snapshot_sha256=sha(freeze),status='FINAL_A14_BOUND_INDEPENDENT_REVIEW_REQUIRED');put(layout/'binding.json',b)
q=layout/'run.mjs';raw=q.read_bytes();q.write_bytes(raw.replace(b'p05-v2-layout-producer-resume09',b'p05-v2-layout-producer-resume10').replace(b'FINAL_A13',b'FINAL_A14'))
q=layout/'runner-policy.mjs';raw=q.read_bytes();assert b'binding.included_files,1863' in raw;q.write_bytes(raw.replace(b'binding.included_files,1863',b'binding.included_files,1865'))
a=j(layout/'ROOT_RUN_ACK.json');a.update(source_identity=f['identity'],image=im['image'],root_run_ack=False,independent_producer_review='PENDING',independent_review_index_sha256=None,independent_review_path=None,producer_runtime_digest=None,browser23_actual_PASS_prerequisite='PENDING_ROOT_MUST_VERIFY_ON_FINAL_A14_APP',final_A14_source_image_binding='BOUND_REVIEW_PENDING_NO_RUN');a.pop('final_A13_source_image_binding',None);put(layout/'ROOT_RUN_ACK.json',a)
wireold=r/'.artifacts/p05-public-wire-adjunct03';wire=r/'.artifacts/p05-public-wire-adjunct04';assert not wire.exists();shutil.copytree(wireold,wire)
a=j(wire/'ROOT-ACK.template.json');a.update(status='NOT_AUTHORIZED',source_root=str(source),source_identity=f['identity'],source_freeze_path=str(freeze),source_freeze_sha256=sha(freeze),image_id=im['image'],image_receipt_path=str(receipt),image_receipt_sha256=sha(receipt),method_review_path='PENDING_FRESH_NONAUTHOR_A14_BINDING_REVIEW',method_review_sha256='PENDING_FRESH_NONAUTHOR_A14_BINDING_REVIEW',runtime_files=im['image_files_sha256']);put(wire/'ROOT-ACK.template.json',a)
prior=j(r/'.artifacts/p05-pilot-bundle-source-freeze10.json')['files'];appdelta={n:{'A13':prior.get(n),'A14':h} for n,h in f['files'].items() if prior.get(n)!=h}
assert len(appdelta)==5 and not set(prior)-set(f['files'])
assert set(appdelta)=={'apps/web/src/topic-games-panel.tsx','apps/web/src/topic-settings.tsx','apps/web/src/topic-own-exclusion-refresh.test.ts','.docs/implementation/p05-source-revision-own-exclusion-ui-refresh-02.json','.docs/implementation/p05-source-revision-own-exclusion-ui-refresh-03.json'}
index={'status':'AUTHOR_BINDING_ONLY_PENDING_REVIEW_NO_RUN','source_root':str(source),'source_identity':f['identity'],'included_files':1865,'freeze_path':str(freeze),'freeze_sha256':sha(freeze),'test_receipt_path':str(receipt),'test_receipt_sha256':sha(receipt),'test_image':im['image'],'production_receipt_path':str(production),'production_receipt_sha256':sha(production),'production_image':prod['image'],'reviews':{k:{'path':str(p),'sha256':sha(p)} for k,p in methods.items()},'browser':{'runner':str(wrapper),'parent':str(oldwrapper),'pending_ACK':str(browserack),'runtime_producer':str(r/'.artifacts/p05-private-batch-browser-producer23')},'layout':{'producer':str(layout),'parent':str(layoutold)},'wire':{'producer':str(wire),'parent':str(wireold)},'A13_A14_source_delta':appdelta,'no_actual_ACK_RUN':True}
put(d/'BINDINGS.json',index)
for name,old,new in [('browser',oldwrapper,wrapper),('layout-run',layoutold/'run.mjs',layout/'run.mjs'),('layout-policy',layoutold/'runner-policy.mjs',layout/'runner-policy.mjs')]:
 (d/(name+'.diff')).write_bytes(''.join(difflib.unified_diff(old.read_bytes().decode().splitlines(True),new.read_bytes().decode().splitlines(True),fromfile='A13-parent',tofile='A14-binding-only')).encode())
with (r/'.history/agents/2026-10-21-p05-browser23-a13-archive-a14-bindings.md').open('a',encoding='utf-8') as z:z.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Root final A14 tuple received; all1865materialized files/test297/prod122 source IDs/pinned receipt hashes verified; threebindings prepared with falseACK. browser wrapper4literal substitutions only; layout run/path/status+count only; wire5runtime exact03. No source/native/ACK. Pending cold controls/freeze/non-author review.\n')
print(json.dumps({'status':index['status'],'source1865_verified':True,'browser_runner':sha(wrapper),'wire_runtime5_exact':all(sha(wire/n)==sha(wireold/n) for n in ['runner.mjs','integration.mjs','public-wire-observer.mjs','positive.mjs','ordinary-observation.mjs']),'layout_other25_exact':len([p for p in layoutold.glob('*.mjs') if p.name not in ['run.mjs','runner-policy.mjs'] and sha(p)==sha(layout/p.name)])},indent=2))
