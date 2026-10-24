from pathlib import Path
import json,hashlib,shutil,difflib,datetime
r=Path('C:/.projects/venus');d=r/'.artifacts/p05-a15-ui-wire-native-bindings01';assert not d.exists();d.mkdir()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def j(p):return json.loads(p.read_bytes())
def put(p,v):p.write_bytes((json.dumps(v,indent=2)+'\n').encode())
source=r/'.artifacts/p05-pilot-bundle-source12';freeze=r/'.artifacts/p05-pilot-bundle-source-freeze12.json';receipt=r/'.artifacts/p05-pilot-bundle-image-binding12/receipt.json';production=r/'.artifacts/p05-pilot-bundle-production-image-binding12/receipt.json';f=j(freeze);im=j(receipt);prod=j(production)
assert f['identity']=='658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de' and len(f['files'])==1869
assert sha(receipt)=='53b227006b685cc87bf47fe9b34ccafd05eabe9968d4976afc7707aba334bfff' and sha(production)=='4f0d8e7e885945bb249ccc83f9583c2459af07b1fada5da4e163d3d68e5d9d83'
for n,h in f['files'].items():assert sha(source/n)==h
assert im['source_identity']==prod['source_identity']==f['identity'] and im['included_files']==prod['included_files']==1869
assert len(im['image_files_sha256'])==299 and len(prod['image_files_sha256'])==122
assert im['image']=='sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689'
assert prod['image']=='sha256:d1eff08f9a3201c087356bef173ab5b5df7ea202125d6e30aceaec090cbe893c'
methods={
 'browser':r/'.docs/implementation/reviews/p05/topic-browser-method23-independent-round01/INDEX.json',
 'layout':r/'.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round08/INDEX.json',
 'wire':r/'.docs/implementation/reviews/p05/public-wire-adjunct-independent-round02/INDEX.json',
 'parentbinding':r/'.docs/implementation/reviews/p05/a14-ui-wire-native-bindings-independent-round01/INDEX.json',
 'app03':r/'.docs/implementation/reviews/p05/own-exclusion-refresh-independent-round03/INDEX.json',
 'appprojection':r/'.docs/implementation/reviews/p05/socket-projection-work-independent-round01/INDEX.json',
 'applog':r/'.docs/implementation/reviews/p05/ws-safe-failure-logging-independent-round01/INDEX.json'}
assert sha(methods['browser'])=='8ea52f43e0a2dd20cd13603ce2fc188523105ee0cddec12de25f71227ed58a6a'
assert sha(methods['parentbinding'])=='87547daf250b58b79134c52e1c616cc61808ea55291cd0403011d1af0230bf93'
assert sha(methods['app03'])=='d2d9546fbe44a6dcf647cf13599cf9f7a15604aa5dd3c990b52c24241d1a30f7'
assert sha(methods['appprojection'])=='c5eb20ae0a92e29d7d2518b622e2396d17a3134351998b11d6f0b694895c9c07'
assert sha(methods['applog'])=='8125e2688917a9bcb1be406e478b89ed6bddf361ddb3e4b937cbd4008b4df9ca'
oldwrapper=r/'.artifacts/p05-browser23-a14-run01.mjs';wrapper=r/'.artifacts/p05-browser23-a15-run01.mjs';assert not wrapper.exists();text=oldwrapper.read_bytes()
substitutions={b'sha256:d3e515f5729af2306e5e62e9b92a50fe9dbf574e8a3451f8d22031bad519ac30':im['image'].encode(),b'p05-browser23-a14-root-ack01.json':b'p05-browser23-a15-root-ack01.json',b'c481761fbecfadf77883c5ab4c8a851ab201c092b57e6994ced431dccefd4193':f['identity'].encode(),b'1865,':b'1869,'}
for old,new in substitutions.items():assert old in text;text=text.replace(old,new)
wrapper.write_bytes(text)
ack=j(r/'.artifacts/p05-browser23-a14-root-ack01.json');ack.update(status='NOT_AUTHORIZED',runner_sha256=sha(wrapper),image=im['image'],source_identity=f['identity'],source_files=1869,source_root=str(source),image_receipt=str(receipt),image_receipt_sha256=sha(receipt),rebinding_review_index='PENDING_FRESH_NONAUTHOR_A15_BINDING_REVIEW',rebinding_review_index_sha256='PENDING_FRESH_NONAUTHOR_A15_BINDING_REVIEW',issued_at=None,scope='PENDING_ONE_CHROMIUM16_FROZEN_A15_METHOD23_NOT_REAL470_OR_STAGE',application_review_index=str(methods['applog']),application_review_index_sha256=sha(methods['applog']),N4_prerequisite={'status':'PENDING_ROOT_A15_SOLO_N4_NATIVE_RESULT','parent':ack.get('N4_prerequisite')},concurrent_workload='PENDING_ROOT_RESOURCE_AND_LAUNCH_ACK')
ack['application_reviews'].update({str(methods[k]):sha(methods[k]) for k in ['app03','appprojection','applog']});assert len(ack['runtime_pins'])==9
for n,h in ack['runtime_pins'].items():assert sha(r/'.artifacts/p05-private-batch-browser-producer23'/n)==h
browserack=r/'.artifacts/p05-browser23-a15-root-ack01.json';assert not browserack.exists();put(browserack,ack)
layoutold=r/'.artifacts/p05-pilot-bundle-source11/.artifacts/p05-v2-layout-producer-resume10';layout=source/'.artifacts/p05-v2-layout-producer-resume11';assert not layout.exists();shutil.copytree(layoutold,layout)
b=j(layout/'binding.json');b.update(source_identity=f['identity'],included_files=1869,image=im['image'],root_build_receipt_path=str(receipt),root_build_receipt_sha256=sha(receipt),source_snapshot_path=str(freeze),source_snapshot_sha256=sha(freeze),status='FINAL_A15_BOUND_INDEPENDENT_REVIEW_REQUIRED');put(layout/'binding.json',b)
q=layout/'run.mjs';raw=q.read_bytes();q.write_bytes(raw.replace(b'p05-v2-layout-producer-resume10',b'p05-v2-layout-producer-resume11').replace(b'FINAL_A14',b'FINAL_A15'))
q=layout/'runner-policy.mjs';raw=q.read_bytes();assert b'binding.included_files,1865' in raw;q.write_bytes(raw.replace(b'binding.included_files,1865',b'binding.included_files,1869'))
a=j(layout/'ROOT_RUN_ACK.json');a.update(source_identity=f['identity'],image=im['image'],root_run_ack=False,independent_producer_review='PENDING',independent_review_index_sha256=None,independent_review_path=None,producer_runtime_digest=None,browser23_actual_PASS_prerequisite='PENDING_ROOT_MUST_VERIFY_ON_FINAL_A15_APP',final_A15_source_image_binding='BOUND_REVIEW_PENDING_NO_RUN');a.pop('final_A14_source_image_binding',None);put(layout/'ROOT_RUN_ACK.json',a)
wireold=r/'.artifacts/p05-public-wire-adjunct04';wire=r/'.artifacts/p05-public-wire-adjunct05';assert not wire.exists();shutil.copytree(wireold,wire)
a=j(wire/'ROOT-ACK.template.json');a.update(status='NOT_AUTHORIZED',source_root=str(source),source_identity=f['identity'],source_freeze_path=str(freeze),source_freeze_sha256=sha(freeze),image_id=im['image'],image_receipt_path=str(receipt),image_receipt_sha256=sha(receipt),method_review_path='PENDING_FRESH_NONAUTHOR_A15_BINDING_REVIEW',method_review_sha256='PENDING_FRESH_NONAUTHOR_A15_BINDING_REVIEW',runtime_files=im['image_files_sha256']);put(wire/'ROOT-ACK.template.json',a)
prior=j(r/'.artifacts/p05-pilot-bundle-source-freeze11.json')['files'];appdelta={n:{'A14':prior.get(n),'A15':h} for n,h in f['files'].items() if prior.get(n)!=h}
assert len(appdelta)==12 and not set(prior)-set(f['files'])
assert set(appdelta)==set(f['changed_paths'])
index={'status':'AUTHOR_BINDING_ONLY_PENDING_REVIEW_NO_RUN','source_root':str(source),'source_identity':f['identity'],'included_files':1869,'freeze_path':str(freeze),'freeze_sha256':sha(freeze),'test_receipt_path':str(receipt),'test_receipt_sha256':sha(receipt),'test_image':im['image'],'production_receipt_path':str(production),'production_receipt_sha256':sha(production),'production_image':prod['image'],'reviews':{k:{'path':str(p),'sha256':sha(p)} for k,p in methods.items()},'browser':{'runner':str(wrapper),'parent':str(oldwrapper),'pending_ACK':str(browserack),'runtime_producer':str(r/'.artifacts/p05-private-batch-browser-producer23')},'layout':{'producer':str(layout),'parent':str(layoutold)},'wire':{'producer':str(wire),'parent':str(wireold)},'A14_A15_source_delta':appdelta,'no_actual_ACK_RUN':True}
put(d/'BINDINGS.json',index)
for name,old,new in [('browser',oldwrapper,wrapper),('layout-run',layoutold/'run.mjs',layout/'run.mjs'),('layout-policy',layoutold/'runner-policy.mjs',layout/'runner-policy.mjs')]:
 (d/(name+'.diff')).write_bytes(''.join(difflib.unified_diff(old.read_bytes().decode().splitlines(True),new.read_bytes().decode().splitlines(True),fromfile='A14-parent',tofile='A15-binding-only')).encode())
with (r/'.history/agents/2026-10-21-p05-a15-ui-wire-bindings.md').open('a',encoding='utf-8') as z:z.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Root final A15 tuple received; all1869materialized files/test299/prod122 source IDs/pinned receipt hashes verified; threebindings prepared with falseACK. browser wrapper4literal substitutions only; layout run/path/status+count only; wire5runtime exact03. No source/native/ACK. Pending cold controls/freeze/non-author review.\n')
print(json.dumps({'status':index['status'],'source1869_verified':True,'browser_runner':sha(wrapper),'wire_runtime5_exact':all(sha(wire/n)==sha(wireold/n) for n in ['runner.mjs','integration.mjs','public-wire-observer.mjs','positive.mjs','ordinary-observation.mjs']),'layout_other25_exact':len([p for p in layoutold.glob('*.mjs') if p.name not in ['run.mjs','runner-policy.mjs'] and sha(p)==sha(layout/p.name)])},indent=2))
