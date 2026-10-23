from pathlib import Path
import json,hashlib,subprocess,secrets,datetime
r=Path('C:/.projects/venus');sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();plan=json.loads((r/'.artifacts/p05-full-original-ranges02/MANIFEST.json').read_text());section='c2-static';owners=[p['owner']for p in plan['prefixes']if p['section']==section]+[j['owner']for j in plan['jobs']if j['range']['section']==section];assert len(owners)==11
out=r/'.artifacts/p05-reduce-static-actual01';assert not out.exists();out.mkdir();inputs=[]
for owner in owners:
 raw=r/'.artifacts/p05-fixedranges'/owner;h=json.loads((raw/'host-report.json').read_text());assert h['status']=='RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE'and h['cleanup']=='COMPLETE'and h['export_verified']and h['producer_unchanged'];summary=raw/'export/summary.json';s=json.loads(summary.read_text());inputs.append({'owner':owner,'range':s['range'],'root':'/raw/'+owner+'/export','summary_sha256':sha(summary),'index_sha256':s['raw']['index_sha256']})
b=plan['ack_base'];manifest={'schema':1,'section':section,'binding_sha256':b['binding_sha256'],'prereg_sha256':b['prereg_sha256'],'method_review_sha256':b['method_review_sha256'],'inputs':inputs};(out/'inputs.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8');owner=secrets.token_hex(16);name='venus-reduce-c2-static-'+owner;image=b['image_id'];producer=b['producer_root'];report={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'FAIL','section':section,'original_cases':47040,'image':image,'source_identity':b['source_identity'],'input_manifest_sha256':sha(out/'inputs.json'),'method_review_sha256':b['method_review_sha256'],'owner':owner,'name':name,'cleanup':'NOT_RUN','full_stage_PASS':False};created=False
def run(args,timeout=60000):return subprocess.run(['docker',*args],capture_output=True,timeout=timeout)
def ok(args,timeout=60000):
 p=run(args,timeout);assert p.returncode==0,p.stderr.decode(errors='replace')[:200];return p.stdout
def inspect():
 d=json.loads(ok(['inspect',name]))[0];assert d['Config']['Labels']['venus.p05.reducer.owner']==owner and d['Image']==image;return d
try:
 p=run(['inspect',name]);assert p.returncode!=0 and b'No such' in p.stderr
 args=['create','--name',name,'--label','venus.p05.reducer.owner='+owner,'--network','none','--read-only','--user','1000:1000','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','1536m','--memory-swap','1536m','--cpus','1','--pids-limit','64','--tmpfs','/tmp:size=16m,mode=1777','--mount','type=bind,source='+producer+',target=/run/consumer,readonly','--mount','type=bind,source='+str(r/'.artifacts/p05-fixedranges')+',target=/raw,readonly','--mount','type=bind,source='+str(out)+',target=/out','--entrypoint','node',image,'/run/consumer/range-reduce.mjs',section,'/out/inputs.json','/out/section-report.json'];ok(args);created=True;d=inspect();assert d['Config']['User']=='1000:1000'and d['HostConfig']['ReadonlyRootfs']and d['HostConfig']['NetworkMode']=='none'
 try:p=run(['start','--attach',name],1205000);(out/'stdout.txt').write_bytes(p.stdout);(out/'stderr.txt').write_bytes(p.stderr);report['native_exit']=p.returncode
 except subprocess.TimeoutExpired:report['timeout']=True;raise
 assert not inspect()['State']['Running'];assert report['native_exit']==0;result=json.loads((out/'section-report.json').read_text());assert result['result']['cases']==47040 and not result['result']['mandatory_baseline_failures'];report['status']='C2_STATIC_FULL_REDUCED_NOT_STAGE';report['result_status']=result['result']['status'];report['output_sha256']=sha(out/'section-report.json')
finally:
 if created:
  d=inspect()
  if d['State']['Running']:ok(['stop','--time','5',name],20000)
  assert not inspect()['State']['Running'];ok(['rm',name]);report['cleanup']='COMPLETE'
 (out/'host-report.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print(json.dumps(report))
