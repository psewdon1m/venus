from pathlib import Path
import importlib.util,subprocess,json,sys
p=Path('.artifacts/p05-topic-measurements-method09/r100-v3-package.py')
spec=importlib.util.spec_from_file_location('package09',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
checks=[]
for e,klass,reason,number in [(PermissionError(13,'PRIVATE_CANARY'),'PermissionError',None,13),(ValueError('PRIVATE_CANARY'),'ValueError',None,None),(m.guard_module.OutputStopped('HOST_OUTPUT_STOP_NOT_ACCEPTED:SUPERVISOR_SAMPLE_STALE'),'OutputStopped','SUPERVISOR_SAMPLE_STALE',None),(TypeError('PRIVATE_CANARY'),'OTHER',None,None)]:
 row=m.failure_envelope(e,'STAGE');assert row['exception_class']==klass and row['reason']==reason and row['os_errno']==number;assert 'PRIVATE_CANARY' not in json.dumps(row);checks.append({'id':klass+'_'+str(number),'status':'PASS'})
q=subprocess.run([sys.executable,'-B',str(p),'--stage=PRIVATE_CANARY','--partition=PRIVATE_CANARY','--limit=1'],capture_output=True,timeout=5)
assert q.returncode==1 and q.stdout==b'';v=json.loads(q.stderr);assert v['reason']=='LIVE_OWNER_GUARD_CONFIG_REQUIRED';assert v['stage']=='STAGE' and v['primary'] is True and b'PRIVATE_CANARY' not in q.stderr;checks.append({'id':'actual CLI exception preserves typed first envelope without raw path','status':'PASS'})
Path('.artifacts/p05-method09-package-controls01.json').write_text(json.dumps({'status':'PASS_FINITE_PACKAGE_ONLY','checks':checks,'Docker_calls':0},indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':'PASS','checks':len(checks)}))
