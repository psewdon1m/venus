import pathlib, shutil, re, json, hashlib, datetime
root=pathlib.Path(r'C:/.projects/venus')
parent=root/'.artifacts/p05-pilot-bundle-source13/.artifacts/p05-compatible-rollback-producer20'
target=parent.with_name('p05-compatible-rollback-producer21')
assert not target.exists()
shutil.copytree(parent,target)
source=(parent/'browser-child.mjs').read_text(encoding='utf8')
body=(root/'.artifacts/p05-oci21-author01/diagnostic-body.txt').read_text(encoding='utf8')
steps=sorted(set(re.findall(r"diagnosticStep='([A-Z0-9_]+)'",source)))
body=body.replace('DIAGNOSTIC_STATIC_STEPS',json.dumps(steps,separators=(',',':')))
source=source.replace("import {readFileSync,existsSync} from 'node:fs';", "import {readFileSync,existsSync,statfsSync,openSync,constants,fstatSync,writeSync,closeSync} from 'node:fs';\nimport {setInterval,clearInterval} from 'node:timers';")
marker='/** Browser-native transport hold only; no clock/DOM/cache/database mutation. */'
source=source.replace(marker,body+'\n'+marker)
source=source.replace("const read=name=>JSON.parse(readFileSync('/private/'+name+'.json'));", "const read=name=>JSON.parse(readFileSync('/private/'+name+'.json')),diagnostic=createBrowserDiagnostic(lease,gates);")
source=source.replace("await host.context().close();diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await page(b.A,b.A.members[3],1001000);", "await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>host.context().close());diagnosticStep='B2_OBSERVER_PAGE_OPEN';const observer=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>page(b.A,b.A.members[3],1001000));")
source=source.replace("report.gate_overflow=gates.length>4;report.status='FAIL';}", "report.gate_overflow=gates.length>4;report.status='FAIL';try{diagnostic.caught(error,diagnosticPhase,diagnosticStep);}catch{report.diagnostic_write_failed=true;}}")
source=source.replace("finally{for(const gate of gates)gate.dispose();let clean=true;", "finally{const diagnosticClean=diagnostic.close();if(!diagnosticClean){report.diagnostic_write_failed=true;report.status='FAIL';}for(const gate of gates)gate.dispose();let clean=true;")
assert source.count('diagnostic.awaiting(')==2
assert source.count('diagnostic.caught(')==1
(target/'browser-child.mjs').write_text(source,encoding='utf8',newline='\n')
revision={'status':'AUTHOR_DIAGNOSTIC_METHOD_ONLY_NOT_ACCEPTANCE_NOT_AUTHORIZED','derived_from':'p05-compatible-rollback-producer20','parent_index_sha256':hashlib.sha256((parent/'INDEX.json').read_bytes()).hexdigest(),'diagnosis_index':'.docs/implementation/reviews/p05/oci20-a16-failure-diagnosis-independent-round01/INDEX.json','diagnosis_index_sha256':'1fc545b8fb4f758a1fd5fe17d7c0525a310ad3f62fb18f3efb1bcbf7c83acc82','source_identity_context_only':'c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13','prospective_A17_binding_required':True,'root_run_ack':False,'native_runs':0,'runtime_change':'browser-child.mjs only: safe checkpoints before two B2 awaits, 1Hz one-file numeric cgroup/tmp diagnostic, safe caught failure before cleanup','unchanged':'39 other recursive MJS; all 14 oracles, host context close, 120s phase, 900s whole, quotas, traffic rates, APP'}
(target/'OPERATIONAL_REVISION21.json').write_text(json.dumps(revision,indent=2)+'\n',encoding='utf8')
files={}
for p in sorted(target.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes(); files[p.relative_to(target).as_posix()]={'type':'regular_file','bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
(target/'INDEX.json').write_text(json.dumps({'status':'AUTHOR_FROZEN_METHOD_DIAGNOSTIC_PENDING_INDEPENDENT_REVIEW_AND_A17_BINDING','source_identity':revision['source_identity_context_only'],'files':files},indent=2)+'\n',encoding='utf8')
print(json.dumps({'status':'PREPARED_NOT_RUN','target':str(target),'files':len(files),'runtime_MJS':len(list(target.rglob('*.mjs'))),'steps':len(steps)}))
