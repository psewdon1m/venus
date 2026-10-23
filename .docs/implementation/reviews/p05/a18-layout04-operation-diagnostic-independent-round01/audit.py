from pathlib import Path
import json,hashlib,subprocess,datetime,os
R=Path('C:/.projects/venus');O=Path(__file__).parent;A=R/'.docs/implementation/reviews/p05/a18-layout04-operation-diagnostic-author-round01';P=R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-04';OLD=P.with_name('p05-v2-layout-producer-a18-03');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();load=lambda p:json.loads(p.read_text(encoding='utf8'));dump=lambda n,x:(O/n).write_text(json.dumps(x,indent=2)+'\n',encoding='utf8')
assert sha(A/'INDEX.json')=='20f5edcebe123c3e7405dc12f5fe592ccc1b8f95086a7c86649d9507e135feb5'
author=load(A/'INDEX.json')
for row in author['files']:assert sha(A/row['path'])==row['sha256'] and (A/row['path']).stat().st_size==row['bytes']
assert sha(P/'INDEX.json')=='869822de63d7c91104d1a0f11d09a1a058f91f98af2f3bfa861ba3b6f8b8310c'
prod=load(P/'INDEX.json')
for n,row in prod['files'].items():assert sha(P/n)==row['sha256'] and (P/n).stat().st_size==row['bytes']
old={x.name:sha(x) for x in OLD.glob('*.mjs')};new={x.name:sha(x) for x in P.glob('*.mjs')};changed=sorted(n for n in new if new[n]!=old[n]);assert len(new)==27 and old.keys()==new.keys() and changed==['browser.mjs','inert-report-fixture.mjs','measure.mjs','probe-policy.mjs','run.mjs','runner-policy.mjs']
for n in changed+['DESIGN.md','ROOT_RUN_ACK.json']:assert (P/n).read_bytes()==(A/'changed-runtime'/n).read_bytes()
for n in ['runner-policy.mjs','inert-report-fixture.mjs']:assert (P/n).read_bytes().replace(b'A18_BOUNDED_OFFER_SWEEPS_04',b'A18_BOUNDED_OFFER_SWEEPS_03')==(OLD/n).read_bytes()
assert (P/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-a18-04',b'p05-v2-layout-producer-a18-03')==(OLD/'run.mjs').read_bytes()
for n in ['binding.json','expected-cells.json','real-text-fixture.json']:assert (P/n).read_bytes()==(OLD/n).read_bytes()
f=load(R/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
for n,h in f['files'].items():assert sha(R/'.artifacts/p05-pilot-bundle-source15'/n)==h
ack=load(P/'ROOT_RUN_ACK.json');assert ack['root_run_ack'] is False and ack['producer_runtime_digest'] is None and ack['independent_review_path'] is None and ack['browser_pids_limit']==512
text=(A/'controls.mjs').read_text(encoding='utf8')
text=text.replace("counts.heading++;", "counts.heading++;if(failure==='KEYBOARD_HEADING')throw marker;")
text=text.replace("counts.targets++;return", "counts.targets++;if(failure==='TARGETS')throw marker;return")
text=text.replace("counts.clockEval++;if(failure==='CLOCK_AFTER'", "counts.clockEval++;if(failure==='CLOCK_BEFORE'&&counts.clockEval===1)throw marker;if(failure==='CLOCK_AFTER'")
text+='''\nawait check('independent_remaining_clock_targets_heading_boundaries_same_error_work',async()=>{for(const step of ['CLOCK_BEFORE','TARGETS','KEYBOARD_HEADING']){const marker=RangeError('PRIVATE_UNRECOGNIZED'),a=await measureModel(before,{failure:step,marker}),b=await measureModel(after,{failure:step,marker});assert.equal(a.error,marker);assert.equal(b.error,marker);assert.equal(b.report.phase.checkpoint,step);assert.deepEqual(b.counts,a.counts);assert.equal(b.counts.IO,0);assert.equal(b.counts.observation,0);}});\nawait check('independent_wrapped_messages_opaque_and_token_bounds',async()=>{for(const value of ['page.evaluate: Maximum call stack size exceeded','Maximum call stack size exceeded SECRET','x'.repeat(129)]){const v=safeFailure(RangeError(value));assert.equal(v.range_error_kind,'UNKNOWN');assert.equal(v.node_code,'UNKNOWN');assert(!JSON.stringify(v).includes(value));assert(Object.keys(v).every(k=>['name','code','range_error_kind','node_code','source_module','source_line','source_column'].includes(k)));}const v=safeFailure(TypeError('Maximum call stack size exceeded'));assert.equal(Object.hasOwn(v,'range_error_kind'),false);});\nconsole.log(JSON.stringify({independent_boundary_groups:2,total_groups:rows.length,status:'PASS_COLD_ONLY'}));\n'''
(O/'controls.mjs').write_text(text,encoding='utf8')
jobs=[('diagnostic-controls',[node,str(O/'controls.mjs')],0,R),('procedure03-controls',[node,str(A/'procedure03-controls-rebound.mjs')],0,R),('runtime',[node,str(A/'runtime.mjs')],0,R),('false-ACK',[node,str(P/'run.mjs')],1,R/'.artifacts/p05-pilot-bundle-source15')];commands=[];outputs=R/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05';before=set(outputs.iterdir())
for name,args,expected,cwd in jobs:
 x=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30,env={**os.environ,'PYTHON':str(R/'.venv/Scripts/python.exe')});(O/(name+'.stdout.txt')).write_bytes(x.stdout);(O/(name+'.stderr.txt')).write_bytes(x.stderr);commands.append({'name':name,'exit':x.returncode,'expected':expected});assert x.returncode==expected,(name,x.returncode)
 if name=='runtime':assert json.loads(x.stdout)['producer_runtime_digest']=='de800611f9e56c34f2a7e39ebd44f372a840880339daffb56510ac619620591a'
 if name=='false-ACK':assert b'ROOT_RUN_ACK_REQUIRED'in x.stderr
assert before==set(outputs.iterdir())
pins=[A/'INDEX.json',P/'INDEX.json',P/'ROOT_RUN_ACK.json',P/'binding.json',R/'.artifacts/p05-pilot-bundle-source-freeze15.json',R/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json']+[R/'.docs/implementation/reviews/p05'/n/'INDEX.json' for n in ['a18-layout03-actual-failure-diagnosis-round01','a18-layout03-bounded-sweeps-independent-round01','a18-browser26-actual-independent-round01','a18-gate-bindings-independent-round01']]
dump('PINS.json',{x.relative_to(R).as_posix():{'bytes':x.stat().st_size,'sha256':sha(x)} for x in pins})
dump('AUDIT.json',{'status':'PASS_OFFLINE_DIAGNOSTIC_METHOD_AUDIT','at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'author_children':len(author['files']),'producer_children':len(prod['files']),'source_files_verified':1872,'changed_MJS':changed,'other21MJS_exact03':True,'grouping_15_135_cap27_original51_459_324_type_preserved':True,'new_marker_callback_memory_only':True,'original_error_identity_and_work_counts_preserved':True,'stock_token_and_Node_code_whitelist_only':True,'diagnostic_groups':6,'procedure03_groups':4,'false_ACK_noallocation':True,'commands':commands,'native_Docker_model_actions':0,'APP_producer_ACK_Git_edits':False})
print(json.dumps({'status':'PASS_OFFLINE','author_children':len(author['files']),'producer_children':len(prod['files']),'commands':commands,'diagnostic_groups':6,'procedure03_groups':4,'source_files':1872}))
