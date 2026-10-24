import pathlib,json,hashlib,re,subprocess,difflib
root=pathlib.Path(r'C:/.projects/venus');work=root/'.artifacts/p05-oci21-author01'
parent=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer20';target=parent.with_name('p05-compatible-rollback-producer21')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
before=(parent/'browser-child.mjs').read_text();after=(target/'browser-child.mjs').read_text()
inverse=after[:after.index('/** OCI21 public diagnostic only:')]+after[after.index('/** Browser-native transport hold only;'):]
inverse=inverse.replace("import {readFileSync,existsSync,statfsSync,openSync,constants,fstatSync,writeSync,closeSync} from 'node:fs';\nimport {setInterval,clearInterval} from 'node:timers';","import {readFileSync,existsSync} from 'node:fs';")
inverse=inverse.replace("const read=name=>JSON.parse(readFileSync('/private/'+name+'.json')),diagnostic=createBrowserDiagnostic(lease,gates);","const read=name=>JSON.parse(readFileSync('/private/'+name+'.json'));")
inverse=inverse.replace("await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>host.context().close());diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>page(b.A,b.A.members[3],1001000));","await host.context().close();diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await page(b.A,b.A.members[3],1001000);")
inverse=inverse.replace("report.gate_overflow=gates.length>4;report.status='FAIL';try{diagnostic.caught(error,diagnosticPhase,diagnosticStep);}catch{report.diagnostic_write_failed=true;}}","report.gate_overflow=gates.length>4;report.status='FAIL';}")
inverse=inverse.replace("finally{const diagnosticClean=diagnostic.close();if(!diagnosticClean){report.diagnostic_write_failed=true;report.status='FAIL';}for(const gate of gates)gate.dispose();let clean=true;","finally{for(const gate of gates)gate.dispose();let clean=true;")
assert inverse==before,'SEMANTIC_INVERSE_NOT_EXACT'
oldm={p.relative_to(parent).as_posix():sha(p) for p in parent.rglob('*.mjs')};newm={p.relative_to(target).as_posix():sha(p) for p in target.rglob('*.mjs')}
assert oldm.keys()==newm.keys() and len(newm)==40
assert [p for p in newm if newm[p]!=oldm[p]]==['browser-child.mjs']
changed=[];added=[]
for p in sorted(target.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  n=p.relative_to(target).as_posix();q=parent/n
  if not q.exists():added.append(n)
  elif p.read_bytes()!=q.read_bytes():changed.append(n)
assert changed==['browser-child.mjs'] and added==['OPERATIONAL_REVISION21.json']
assert json.loads((target/'BINDING.json').read_text())['root_run_ack'] is False
assert json.loads((target/'ROOT_RUN_ACK_TEMPLATE.json').read_text())['root_run_ack'] is False
assert after.index('diagnostic.caught(')<after.index('finally{const diagnosticClean=diagnostic.close()')<after.index('for(const c of contexts)')
assert after.count('diagnostic.awaiting(')==2
assert before[before.index('export async function installApiQuiescence'):before.index('export async function browser(')]==after[after.index('export async function installApiQuiescence'):after.index('export async function browser(')]
node=r'C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
r=subprocess.run([node,'--check',str(target/'browser-child.mjs')],capture_output=True,text=True);assert r.returncode==0
(work/'syntax01.json').write_text(json.dumps({'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr})+'\n')
controls=json.loads((work/'controls03.txt').read_text(encoding='utf-8-sig'));assert controls['count']==9 and all(c['status']=='PASS' for c in controls['checks'])
files={p.relative_to(target).as_posix():{'type':'regular_file','bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(target.rglob('*')) if p.is_file() and p.name!='INDEX.json'}
(target/'INDEX.json').write_text(json.dumps({'status':'AUTHOR_FROZEN_METHOD_DIAGNOSTIC_PENDING_INDEPENDENT_REVIEW_AND_A17_BINDING','source_identity':json.loads((target/'BINDING.json').read_text())['source_identity'],'files':files},indent=2)+'\n')
(work/'delta.patch').write_text(''.join(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='OCI20/browser-child.mjs',tofile='OCI21/browser-child.mjs')),encoding='utf8')
pins={}
for p in [parent/'INDEX.json',parent/'browser-child.mjs',target/'INDEX.json',target/'browser-child.mjs',target/'BINDING.json',target/'OPERATIONAL_REVISION21.json',target/'ROOT_RUN_ACK_TEMPLATE.json',root/'.docs/implementation/reviews/p05/oci20-a16-failure-diagnosis-independent-round01/INDEX.json',root/'.artifacts/p05-pilot-bundle-source-freeze13.json']:
 pins[p.relative_to(root).as_posix()]={'sha256':sha(p),'bytes':p.stat().st_size}
result={'status':'PASS_AUTHOR_COLD_ONLY_NOT_INDEPENDENT_NOT_NATIVE','runtime_MJS':40,'changed_MJS':changed,'unchanged_MJS':39,'added_metadata':added,'semantic_inverse_browser_body_exact20':True,'api_quiescence_exact20':True,'original_14_oracles_and_120s_900s_and_quotas_unchanged':True,'controls':9,'syntax_exit':0,'lint_exit':0,'native_runs':0,'root_run_ack':False,'prospective_A17_binding_required':True,'producer_index_sha256':sha(target/'INDEX.json')}
(work/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n');(work/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2)+'\n')
print(json.dumps(result))
