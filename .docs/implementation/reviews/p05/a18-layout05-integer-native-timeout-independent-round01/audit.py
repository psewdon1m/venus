from pathlib import Path
import json,hashlib,subprocess,datetime,os
R=Path('C:/.projects/venus');O=Path(__file__).parent;A=R/'.docs/implementation/reviews/p05/a18-layout05-integer-native-timeout-author-round01';P=R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-05';OLD=P.with_name('p05-v2-layout-producer-a18-04');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf8'));dump=lambda n,x:(O/n).write_text(json.dumps(x,indent=2)+'\n',encoding='utf8')
assert sha(A/'INDEX.json')=='327804c8fde70d66b70118f6578ab4c9d6ab379c6daf1a7379d0b8e381d83ec8';author=load(A/'INDEX.json')
for n,row in author['files'].items():assert sha(A/n)==row['sha256'] and (A/n).stat().st_size==row['bytes']
assert sha(P/'INDEX.json')=='47f97608e10abc1274d246318f8520c4e088cbf13cb4c3bc89cd219f583314a8';prod=load(P/'INDEX.json')
for n,row in prod['files'].items():assert sha(P/n)==row['sha256'] and (P/n).stat().st_size==row['bytes']
old={x.name:sha(x) for x in OLD.glob('*.mjs')};new={x.name:sha(x) for x in P.glob('*.mjs')};changed=sorted(n for n in new if new[n]!=old[n]);assert len(new)==27 and old.keys()==new.keys() and changed==['browser.mjs','inert-report-fixture.mjs','run.mjs','runner-policy.mjs','x11.mjs']
for n in changed:assert (P/n).read_bytes()==(A/'changed-runtime'/n).read_bytes()
for n in ['browser.mjs','runner-policy.mjs','inert-report-fixture.mjs']:assert (P/n).read_bytes().replace(b'A18_BOUNDED_OFFER_SWEEPS_05',b'A18_BOUNDED_OFFER_SWEEPS_04')==(OLD/n).read_bytes()
assert (P/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-a18-05',b'p05-v2-layout-producer-a18-04')==(OLD/'run.mjs').read_bytes()
assert (P/'x11.mjs').read_bytes().replace(b'Math.max(1,Math.floor(Math.min(15000,budget.remaining())))',b'Math.max(1,Math.min(15000,budget.remaining()))')==(OLD/'x11.mjs').read_bytes()
for n in ['binding.json','expected-cells.json','real-text-fixture.json']:assert (P/n).read_bytes()==(OLD/n).read_bytes()
f=load(R/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
for n,h in f['files'].items():assert sha(R/'.artifacts/p05-pilot-bundle-source15'/n)==h
ack=load(P/'ROOT_RUN_ACK.json');assert ack['root_run_ack'] is False and ack['producer_runtime_digest'] is None and ack['independent_review_path'] is None and ack['browser_pids_limit']==512
jobs=[('controls',[node,str(O/'controls.mjs')],0,R),('runtime',[node,str(A/'runtime.mjs')],0,R),('false-ACK',[node,str(P/'run.mjs')],1,R/'.artifacts/p05-pilot-bundle-source15')];commands=[];outputs=R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05';before=set(outputs.iterdir())
for name,args,expected,cwd in jobs:
 x=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30,env={**os.environ,'PYTHON':str(R/'.venv/Scripts/python.exe')});(O/(name+'.stdout.txt')).write_bytes(x.stdout);(O/(name+'.stderr.txt')).write_bytes(x.stderr);commands.append({'name':name,'exit':x.returncode,'expected':expected});assert x.returncode==expected,(name,x.returncode)
 if name=='runtime':assert json.loads(x.stdout)['producer_runtime_digest']=='2aa4f35dbe8d8cc2685cc4d6b21f9221dee24237bd3879bf138ed3b0e50afc19'
 if name=='false-ACK':assert b'ROOT_RUN_ACK_REQUIRED'in x.stderr
assert before==set(outputs.iterdir())
pins=[A/'INDEX.json',P/'INDEX.json',P/'ROOT_RUN_ACK.json',P/'binding.json',R/'.artifacts/p05-pilot-bundle-source-freeze15.json',R/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json']+[R/'.docs/implementation/reviews/p05'/n/'INDEX.json' for n in ['a18-layout04-actual-failure-diagnosis-round01','a18-layout04-operation-diagnostic-independent-round01','a18-browser26-actual-independent-round01']]
dump('PINS.json',{x.relative_to(R).as_posix():{'bytes':x.stat().st_size,'sha256':sha(x)} for x in pins});dump('AUDIT.json',{'status':'PASS_OFFLINE_INTEGER_TIMEOUT_METHOD','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_children':len(author['files']),'producer_children':len(prod['files']),'source_files_verified':1872,'changed_MJS':changed,'other22MJS_raw_exact04':True,'all5_changed_MJS_complete_inverse_exact04':True,'same_single_remaining_sample_integer_clamp1_15000':True,'absolute_budget_expiry_guard_preserved':True,'groups':3,'author_RED_expected_exit1_preserved':True,'author_real_Node_GREEN_child_proof_pinned_not_repeated':True,'false_ACK_noallocation':True,'false_ACK_sha256':sha(P/'ROOT_RUN_ACK.json'),'commands':commands,'native_browser_Docker_models_child_processes_by_review':0,'APP_producer_ACK_Git_edits':False})
print(json.dumps({'status':'PASS_OFFLINE','author_children':len(author['files']),'producer_children':len(prod['files']),'commands':commands,'source_files':1872,'groups':3}))
