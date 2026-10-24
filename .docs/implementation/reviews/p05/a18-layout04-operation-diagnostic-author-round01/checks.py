from pathlib import Path
import ast,json,hashlib,subprocess,os
r=Path('C:/.projects/venus');o=Path(__file__).parent;p=r/'.artifacts/p05-pilot-bundle-source15/.artifacts/p05-v2-layout-producer-a18-03';c=p.with_name('p05-v2-layout-producer-a18-04');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
old={x.name:sha(x) for x in p.glob('*.mjs')};new={x.name:sha(x) for x in c.glob('*.mjs')};changed=sorted(n for n in new if new[n]!=old[n]);assert old.keys()==new.keys() and len(new)==27 and changed==['browser.mjs','inert-report-fixture.mjs','measure.mjs','probe-policy.mjs','run.mjs','runner-policy.mjs']
tree=ast.parse((o/'prepare.py').read_text());literals={}
for n in tree.body:
 if isinstance(n,ast.Assign):
  for t in n.targets:
   if isinstance(t,ast.Name) and t.id in ['ops','old_enums','range_meta']:literals[t.id]=ast.literal_eval(n.value)
literals['new_enums']=literals['old_enums'][:-1]+','+','.join("'"+s+"'" for s in literals['ops'])+']';reproduced=[]
for n in tree.body:
 if isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Name) and n.value.func.id=='edit':
  name=ast.literal_eval(n.value.args[0]);operations=eval(compile(ast.Expression(n.value.args[1]),'<own-literal-edits>','eval'),{'__builtins__':{}},literals);expected=(p/name).read_bytes()
  for a,b in operations:assert expected.count(a.encode())==1;expected=expected.replace(a.encode(),b.encode())
  assert expected==(c/name).read_bytes(),name;reproduced.append(name)
for name in ['runner-policy.mjs','inert-report-fixture.mjs']:assert (c/name).read_bytes()==(p/name).read_bytes().replace(b'A18_BOUNDED_OFFER_SWEEPS_03',b'A18_BOUNDED_OFFER_SWEEPS_04')
assert len(reproduced)==4
for name in ['scene-driver.mjs','aggregate.mjs','matrix.mjs','expected-cells.json','dom-audit.mjs','x11.mjs','real-text-probe.mjs','real-text-fixture.json','binding.json','runtime.mjs','private-batch-observer.mjs','request-emission.mjs']:assert (p/name).read_bytes()==(c/name).read_bytes(),name
assert (c/'measure.mjs').read_bytes().count(b'writeFileSync')==(p/'measure.mjs').read_bytes().count(b'writeFileSync') and (c/'browser.mjs').read_bytes().count(b'save()')==(p/'browser.mjs').read_bytes().count(b'save()')
ack=read(c/'ROOT_RUN_ACK.json');assert ack['root_run_ack'] is False and ack['producer_runtime_digest'] is None and ack['independent_review_path'] is None and ack['operational_resource_profile']=='LAYOUT21_BROWSER_PID512' and ack['browser_pids_limit']==512
diag=r/'.docs/implementation/reviews/p05/a18-layout03-actual-failure-diagnosis-round01/INDEX.json';assert sha(diag)=='d0b938e39339b7fb92da325eff7f5fafa5b40003851e032e417e8220f4f97ed8'
f=read(r/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
for name,h in f['files'].items():assert sha(r/'.artifacts/p05-pilot-bundle-source15'/name)==h,name
reused=o/'procedure03-controls-rebound.mjs';reused.write_bytes((r/'.docs/implementation/reviews/p05/a18-layout03-bounded-sweeps-author-round01/controls.mjs').read_bytes().replace(b'p05-v2-layout-producer-a18-03',b'p05-v2-layout-producer-a18-04'))
commands=[];node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
jobs=[('diagnostic-controls',[node,str(o/'controls.mjs')],0,r),('existing03-procedure-controls',[node,str(reused)],0,r),('existing-contract-controls',[node,str(c/'contract-controls.mjs')],0,r)]+[('syntax-'+n,[node,'--check',str(c/n)],0,r) for n in changed]+[('syntax-focused',[node,'--check',str(o/'controls.mjs')],0,r),('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(c/'eslint.config.mjs'),'--no-ignore',*[str(c/n) for n in changed],str(o/'controls.mjs')],0,r),('false-ack',[node,str(c/'run.mjs')],1,r/'.artifacts/p05-pilot-bundle-source15'),('runtime',[node,str(o/'runtime.mjs')],0,r)]
for name,args,expected,cwd in jobs:
 result=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30,env={**os.environ,'PYTHON':str(r/'.venv/Scripts/python.exe')});(o/(name+'.stdout.txt')).write_bytes(result.stdout);(o/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'exit':result.returncode});assert result.returncode==expected,(name,result.returncode)
 if name=='false-ack':assert b'ROOT_RUN_ACK_REQUIRED' in result.stderr
 if name=='runtime':(o/'RUNTIME.json').write_text(json.dumps(json.loads(result.stdout),indent=2)+'\n',encoding='utf8')
pins=[diag,p/'INDEX.json',p/'ROOT_RUN_ACK.json',r/'.artifacts/p05-pilot-bundle-source-freeze15.json',r/'.docs/implementation/reviews/p05/a18-layout03-bounded-sweeps-author-round01/INDEX.json',r/'.docs/implementation/reviews/p05/a18-browser26-actual-independent-round01/INDEX.json',r/'.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json'];(o/'INPUT_PINS.json').write_text(json.dumps({x.relative_to(r).as_posix():{'bytes':x.stat().st_size,'sha256':sha(x)} for x in pins},indent=2)+'\n',encoding='utf8')
for name in changed+['DESIGN.md']:(o/(name+'.diff')).write_text(''.join(__import__('difflib').unified_diff((p/name).read_text().splitlines(True),(c/name).read_text().splitlines(True),fromfile='a18-03/'+name,tofile='a18-04/'+name)),encoding='utf8')
checks={'status':'AUTHOR_METHOD04_DIAGNOSTIC_ONLY_COLD_PASS_NOT_NATIVE','runtime_MJS':27,'changed_MJS':changed,'other21MJS_raw_exact03':True,'literal_reproduction_four_runtime_changes':reproduced,'runner_and_inert_fixture_only_revision_label':True,'03grouping15_135_privatecap27_all51_459_324type_raw_preserved':True,'no_additional_save_IO_DOM_clock_sample_Tab_scroll_focus_timer_budget':True,'original_error_identity_and_failure_preserved':True,'stockRange4tokens_and_Node5codes_only_unknownopaque':True,'diagnostic_groups':4,'reused03_procedure_groups':4,'existing_contract_exit':0,'syntax_checks':7,'lint_exit':0,'false_ACK_exit':1,'false_ACK_noallocation':True,'all1872_source_hashes_verified':True,'native_Docker_Git_APP_models':0,'commands':commands};(o/'CHECKS.json').write_text(json.dumps(checks,indent=2)+'\n',encoding='utf8');print(json.dumps(checks))
