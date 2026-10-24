from pathlib import Path
import json,hashlib,subprocess,datetime,os
R=Path('C:/.projects/venus');O=Path(__file__).parent;A=R/'.docs/implementation/reviews/p05/a18-layout03-bounded-sweeps-author-round01';P=R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-03';OLD=P.with_name('p05-v2-layout-producer-a18-02');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
load=lambda p:json.loads(p.read_text(encoding='utf8'))
dump=lambda n,x:(O/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
assert sha(A/'INDEX.json')=='d44ad6d64bd924bf2228c626657cf017baf08c23577add15642de643247d5a14'
author=load(A/'INDEX.json');bad=[x['path'] for x in author['files'] if sha(A/x['path'])!=x['sha256'] or (A/x['path']).stat().st_size!=x['bytes']];assert not bad
assert sha(P/'INDEX.json')=='a8501f074974622689b9a1b20cd2640f79bdbaaf9e0c82013a5625bc92efec6d'
old={x.name:sha(x) for x in OLD.glob('*.mjs')};new={x.name:sha(x) for x in P.glob('*.mjs')};changed=sorted(n for n in new if new[n]!=old[n]);assert set(old)==set(new) and len(new)==27
assert changed==['aggregate.mjs','browser.mjs','inert-report-fixture.mjs','run.mjs','runner-policy.mjs','scene-driver.mjs']
for n in changed+['DESIGN.md','ROOT_RUN_ACK.json']:assert (P/n).read_bytes()==(A/'changed-runtime'/n).read_bytes()
assert (P/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-a18-03',b'p05-v2-layout-producer-a18-02')==(OLD/'run.mjs').read_bytes()
assert (P/'scene-driver.mjs').read_bytes().replace(b"assert(rows.length<27,'METHOD18_PRIVATE_SETUP_RECORD_CAP');",b"assert(rows.length<24,'METHOD18_PRIVATE_SETUP_RECORD_CAP');")==(OLD/'scene-driver.mjs').read_bytes()
for n in ['binding.json','expected-cells.json','real-text-fixture.json']:assert (P/n).read_bytes()==(OLD/n).read_bytes()
ack=load(P/'ROOT_RUN_ACK.json');assert ack['root_run_ack'] is False and ack['producer_runtime_digest'] is None and ack['independent_review_path'] is None
assert sha(P/'ROOT_RUN_ACK.json')=='eec0d8f5c11f376cd4df338d91488eaf5ac905b30612be54f5ca4686f33b1c04'
assert ack['browser_A18_actual_independent_review']['sha256']=='04f456ccc50d7a2388b512aa775adfaf90f2883409d63c53c38fb1e1137e9265'
f=load(R/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
sourcebad=[n for n,h in f['files'].items() if sha(R/'.artifacts/p05-pilot-bundle-source15'/n)!=h];assert not sourcebad
controls=(A/'controls.mjs').read_text(encoding='utf8')
controls=controls.replace('async function mainModel({expireAtFirstOfferSafety=false}={})','async function mainModel({expireAtFirstOfferSafety=false,expireAtSecondOfferSafety=false}={})')
controls=controls.replace("if(expireAtFirstOfferSafety&&prepared.scene==='private_offer'&&!native)","if((expireAtFirstOfferSafety||expireAtSecondOfferSafety&&prepares===8)&&prepared.scene==='private_offer'&&!native)")
controls+='''\nawait check('independent_second_fresh_chunk_expiry_stops_no_native_or_retry',async()=>{const m=await mainModel({expireAtSecondOfferSafety:true});assert.equal(m.report.status,'FAIL');assert.equal(m.exitCode,1);assert.equal(m.prepares,8);assert.equal(m.closes,8);assert.equal(m.actions,7);const p=m.report.sweep_preparations.filter(x=>x.scene==='private_offer');assert.equal(p.length,2);assert.notEqual(p[0].room_id,p[1].room_id);assert.notEqual(p[0].session_id,p[1].session_id);assert.equal(p[0].budget_ms,20000);assert.equal(p[1].budget_ms,20000);assert.equal(p[1].elapsed_ms,null);assert.equal(m.report.keyboard_actions.filter(x=>x.scene==='private_offer').length,1);assert.equal(m.report.records.filter(x=>x.scene==='private_offer'&&x.status==='PASS').length,8);assert.equal(m.report.records.find(x=>x.scene==='private_offer'&&x.native).status,'NOT_RUN');});\nconsole.log(JSON.stringify({independent_second_chunk_boundary:'PASS',groups:rows.length,scope:'INERT_ONLY_NO_NATIVE_RESULT'}));\n'''
(O/'controls.mjs').write_text(controls,encoding='utf8')
jobs=[('focused',[node,str(O/'controls.mjs')],0,R),('existing-contract',[node,str(P/'contract-controls.mjs')],0,R),('runtime',[node,str(A/'runtime.mjs')],0,R),('false-ACK',[node,str(P/'run.mjs')],1,R/'.artifacts/p05-pilot-bundle-source15')]
commands=[]
before=set((R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05').iterdir())
for name,args,expected,cwd in jobs:
 r=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30,env={**os.environ,'PYTHON':str(R/'.venv/Scripts/python.exe')});(O/(name+'.stdout.txt')).write_bytes(r.stdout);(O/(name+'.stderr.txt')).write_bytes(r.stderr);commands.append({'name':name,'exit':r.returncode,'expected':expected});assert r.returncode==expected,(name,r.returncode)
 if name=='runtime':assert json.loads(r.stdout)['producer_runtime_digest']=='781cc34b91bac91326c7eca4e58ffda0f99737cd0ee8107af00c63d4ad80d683'
 if name=='false-ACK':assert b'ROOT_RUN_ACK_REQUIRED' in r.stderr
assert before==set((R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05').iterdir())
pins=[A/'INDEX.json',P/'INDEX.json',P/'ROOT_RUN_ACK.json',P/'binding.json',R/'.artifacts/p05-pilot-bundle-source-freeze15.json',R/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json',R/'.docs/10_IMPLEMENTATION_PLAN.md',R/'.docs/implementation/reviews/p05/a18-layout02-actual-failure-diagnosis-round01/INDEX.json',R/'.docs/implementation/reviews/p05/a18-browser26-actual-independent-round01/INDEX.json',R/'.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json']
dump('PINS.json',{p.relative_to(R).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)} for p in pins})
dump('AUDIT.json',{'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_children_verified':len(author['files']),'author_child_mismatches':bad,'runtime_MJS':len(new),'changed_MJS':changed,'other21MJS_raw_exact02':True,'declared_changed_files_exact_author_frozen':True,'run_only_directory_literal':True,'scene_driver_only24_to27':True,'source_count':1872,'all_source_bytes_match_freeze':True,'source_mismatches':sourcebad,'false_ACK_no_output_allocation':True,'focused_groups':5,'existing_contract_cases':load(O/'existing-contract.stdout.txt')['count'],'commands':commands,'native_Docker_API_model_actions':0,'APP_producer_ACK_edits':False})
print(json.dumps({'status':'OFFLINE_AUDIT_PASS','commands':commands,'source_files':1872,'author_children':len(author['files']),'changed_MJS':changed,'independent_boundary':'SECOND_CHUNK_EXPIRY_NO_RETRY'}))
