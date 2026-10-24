from pathlib import Path
import json,hashlib,subprocess,secrets,datetime,sys,shutil
r=Path('C:/.projects/venus');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();section=sys.argv[1]
assert section in ['c2-static','c2-trajectory','c2-canary','m3-invariants','m3-fairness','m3-gf','m3-inference'],'Fresh uniform A26 original section; no historical source credit'
assert len(sys.argv)==3 and len(sys.argv[2])==64 and all(c in '0123456789abcdef'for c in sys.argv[2]),'Exact root-supplied manifest SHA metadata required'
manifest=r/'.artifacts/p05-full-original-ranges06/MANIFEST.json';assert sha(manifest)==sys.argv[2];plan=json.loads(manifest.read_text());terminal_path=r/'.artifacts/p05-full-original-execution06/BATCH_TERMINAL.json';terminal=json.loads(terminal_path.read_text());assert terminal['status']=='ALL_FIXED_RANGES_EXECUTED_NOT_STATISTICAL_ACCEPTANCE'and terminal['completed_jobs']==terminal['planned_jobs']==2609 and all(x['ok']for x in terminal['records'])
assert shutil.disk_usage(r).free>=32*1024**3
out=r/('.artifacts/p05-reduce-original06-'+section);assert not out.exists();out.mkdir();inputs=[]
jobs=[dict(p,range=p['range'])for p in plan['prefixes']if p['section']==section]+[j for j in plan['jobs']if j['range']['section']==section]
for job in jobs:
 owner=job['owner'];raw=r/'.artifacts/p05-fixedranges'/owner;host=json.loads((raw/'host-report.json').read_text());summary=raw/'export/summary.json';s=json.loads(summary.read_text());assert host['status']=='RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE'and host['cleanup']=='COMPLETE'and host['worker_exit']==0 and host['timeout']is False and host['cleanup_errors']==[]
 for k in ['writer_stopped','export_verified','producer_unchanged']:assert host[k]is True
 assert host['owner']==s['owner']==owner and host['range']==s['range']==job['range'];assert host['source_identity']==plan['ack_base']['source_identity']and host['image']==plan['ack_base']['image_id']
 inputs.append({'owner':owner,'range':s['range'],'root':'/raw/'+owner+'/export','summary_sha256':sha(summary),'index_sha256':s['raw']['index_sha256']})
b=plan['ack_base'];m={'schema':1,'section':section,'binding_sha256':b['binding_sha256'],'prereg_sha256':b['prereg_sha256'],'method_review_sha256':b['method_review_sha256'],'inputs':inputs};(out/'inputs.json').write_text(json.dumps(m,indent=2)+'\n',encoding='utf-8');owner=secrets.token_hex(16);name='venus-reduce-'+section+'-'+owner;image=b['image_id'];producer=Path(b['producer_root']);assert sha(producer/'range-reduce.mjs')=='42769a3dff329acb64d2c54f64b286c760db268c6b38fc047f13b3428ba046bd'
producer_before={name:sha(producer/name)for name in b['producer_pins']};assert producer_before==b['producer_pins'];(out/'producer-before.json').write_text(json.dumps(producer_before,indent=2)+'\n',encoding='utf-8')
report={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FAIL','section':section,'original_cases':sum(x['range']['count']for x in inputs),'inputs':len(inputs),'image':image,'source_identity':b['source_identity'],'input_manifest_sha256':sha(out/'inputs.json'),'batch_terminal_sha256':sha(terminal_path),'method_review_sha256':b['method_review_sha256'],'driver_sha256':sha(Path(__file__)),'owner':owner,'name':name,'cleanup':'NOT_RUN','full_stage_PASS':False};created=False
(out/'host-start.json').write_text(json.dumps({**report,'status':'INPUTS_PINNED_NO_ALLOCATION_YET'},indent=2)+'\n',encoding='utf-8')
def run(args,timeout=60000):return subprocess.run(['docker',*args],capture_output=True,timeout=timeout)
def ok(args,timeout=60000):
 p=run(args,timeout);assert p.returncode==0,p.stderr.decode(errors='replace')[:200];return p.stdout
def inspect():
 d=json.loads(ok(['inspect',name]))[0];assert d['Config']['Labels']['venus.p05.reducer.owner']==owner and d['Image']==image;return d
try:
 p=run(['inspect',name]);assert p.returncode!=0 and b'no such' in p.stderr.lower()
 args=['create','--name',name,'--label','venus.p05.reducer.owner='+owner,'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','1536m','--memory-swap','1536m','--cpus','1','--pids-limit','64','--tmpfs','/tmp:size=16m,mode=1777','--mount','type=bind,source='+str(producer)+',target=/run/consumer,readonly','--mount','type=bind,source='+str(r/'.artifacts/p05-fixedranges')+',target=/raw,readonly','--mount','type=bind,source='+str(out)+',target=/out','--entrypoint','node',image,'/run/consumer/range-reduce.mjs',section,'/out/inputs.json','/out/section-report.json'];ok(args);created=True;d=inspect();assert d['Config']['User']=='1000:1000'and d['HostConfig']['ReadonlyRootfs']and d['HostConfig']['NetworkMode']=='none'and d['HostConfig']['Memory']==1610612736 and d['HostConfig']['NanoCpus']==1000000000 and d['HostConfig']['PidsLimit']==64
 try:p=run(['start','--attach',name],1205000);(out/'stdout.txt').write_bytes(p.stdout);(out/'stderr.txt').write_bytes(p.stderr);report['native_exit']=p.returncode
 except subprocess.TimeoutExpired:report['timeout']=True;raise
 assert not inspect()['State']['Running'];assert report['native_exit']==0;result=json.loads((out/'section-report.json').read_text());report['status']='FULL_SECTION_REDUCER_COMPLETED_PENDING_INDEPENDENT_ACCEPTANCE';report['result_status']=result['result']['status'];report['output_sha256']=sha(out/'section-report.json')
finally:
 if created:
  d=inspect()
  if d['State']['Running']:ok(['stop','--time','5',name],20000)
  assert not inspect()['State']['Running'];ok(['rm',name]);report['cleanup']='COMPLETE'
 after={name:sha(producer/name)for name in producer_before};(out/'producer-after.json').write_text(json.dumps(after,indent=2)+'\n',encoding='utf-8');report['producer_unchanged']=after==producer_before
 if not report['producer_unchanged']:report['status']='FAIL_PRODUCER_CHANGED'
 report['finished_at']=datetime.datetime.now(datetime.timezone.utc).isoformat();(out/'host-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report));assert report['producer_unchanged']
