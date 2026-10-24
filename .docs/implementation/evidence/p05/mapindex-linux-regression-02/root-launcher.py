import json,hashlib,secrets,subprocess,sys
from pathlib import Path
from datetime import datetime,timezone
r=Path.cwd();sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
old=json.loads((r/'.artifacts/p05-engine2-freeze-context01.json').read_bytes());new=json.loads((r/'.artifacts/p05-map-index-freeze-context01.json').read_bytes());current=inventory();assert current==new['files'];assert not set(old['files'])-set(current)
names=sorted(k for k in current if old['files'].get(k)!=current[k]);assert len(names)==8,names
name='venus-mapindex-linux-'+secrets.token_hex(6);out=r/'.artifacts/p05'/name;out.mkdir();image='sha256:17ab5bf821f60523c882d634ace69b708d999f80a57fc06322dd326a200dfdbb'
def save(n,v):(out/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf8')
def call(args,log,timeout=1200):
 with (out/log).open('wb') as f:q=subprocess.run(['docker',*args],stdout=f,stderr=subprocess.STDOUT,timeout=timeout)
 if q.returncode:raise RuntimeError(log+' exit '+str(q.returncode))
 return (out/log).read_text(encoding='utf8')
code="""import fs from 'node:fs';import path from 'node:path';import {execFileSync}from'node:child_process';const readInventory=()=>JSON.parse(execFileSync('python',['-B','-c',\"import sys,json;sys.path.insert(0,'tools');from stage_inventory import inventory,identity;x=inventory();print(json.dumps({'files':x,'identity':identity(x)},sort_keys=True))\"],{encoding:'utf8',maxBuffer:16*1024*1024}));const original=readInventory();fs.writeFileSync('/artifacts/materialized-base.json',JSON.stringify(original,null,2));if(original.identity!==OLD_ID)throw Error('Wrong exact base source');for(const n of PATCH_NAMES){if(n.startsWith('/')||n.split('/').includes('..'))throw Error('Unsafe path');fs.mkdirSync(path.dirname('/workspace/'+n),{recursive:true});fs.copyFileSync('/input/'+n,'/workspace/'+n);}const before=readInventory();fs.writeFileSync('/artifacts/materialized-before.json',JSON.stringify(before,null,2));if(before.identity!==NEW_ID)throw Error('Wrong materialized current source');let results=[];for(const [label,binary,args]of [['build','node',['node_modules/typescript/bin/tsc','-b','--force']],['JS','npm',['test']],['PY','python',['-B','-m','unittest','discover','-s','tools','-p','test_*.py']]]){try{execFileSync(binary,args,{stdio:'inherit'});results.push({label,exit_code:0});}catch(e){results.push({label,exit_code:e.status??-1});}}const after=readInventory();fs.writeFileSync('/artifacts/materialized-after.json',JSON.stringify(after,null,2));if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Source changed during tests');fs.writeFileSync('/artifacts/commands.json',JSON.stringify(results,null,2));process.exitCode=results.every(x=>x.exit_code===0)?0:1;""".replace('OLD_ID',json.dumps(old['identity'])).replace('NEW_ID',json.dumps(new['identity'])).replace('PATCH_NAMES',json.dumps(names))
v={'schema_version':1,'created_at':datetime.now(timezone.utc).isoformat(),'status':'FAIL','project':name,'source_identity':new['identity'],'included_files':1813,'base_image':image,'base_source_identity':old['identity'],'materialized_delta':names,'scope':'LINUX_EXACT_SOURCE_UNIT_REGRESSION_NOT_FULL_QUALITY','full_stage_acceptance':False};save('root-inputs-before.json',{'identity':identity(current),'files':current});save('launch.json',v);(out/'runtime-script.mjs').write_text(code,encoding='utf8');volumes=[]
print('START '+name,flush=True)
try:
 call(['create','--name',name,'--label','venus.p05.project='+name,'--platform','linux/amd64','--network','none','--user','1000:1000','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges:true','--memory','2g','--cpus','2','--tmpfs','/tmp:rw,exec,size=512m,mode=1777','--tmpfs','/home/node:rw,size=64m,uid=1000,gid=1000,mode=700','--mount','type=bind,source='+str(r)+',target=/input,readonly','--mount','type=bind,source='+str(out)+',target=/artifacts',image,'node','--input-type=module','-e',code],'container-create.txt',60)
 a=json.loads(subprocess.check_output(['docker','container','inspect',name]));assert len(a)==1 and a[0]['Config']['Labels']['venus.p05.project']==name;volumes=[x['Name'] for x in a[0]['Mounts'] if x['Type']=='volume'];assert len(volumes)==1;save('owned-volume.json',volumes)
 call(['start','--attach',name],'tests.txt');a=json.loads(subprocess.check_output(['docker','container','inspect',name]));assert a[0]['State']['ExitCode']==0;v['status']='PASS';v['observed_exit_code']=0
except Exception as e:v['error']=str(e)
finally:
 try:
  q=subprocess.run(['docker','container','inspect',name],capture_output=True,text=True)
  if q.returncode==0:
   a=json.loads(q.stdout);assert a[0]['Config']['Labels']['venus.p05.project']==name;call(['container','rm','--force','--volumes',name],'cleanup.txt',60)
  else:assert 'no such' in q.stderr.lower()
  for volume in volumes:
   q=subprocess.run(['docker','volume','inspect',volume],capture_output=True,text=True);assert q.returncode!=0 and 'no such' in q.stderr.lower()
  q=subprocess.check_output(['docker','ps','-aq','--filter','label=venus.p05.project='+name],text=True);assert not q.strip();v['cleanup']='completed'
 except Exception as e:v['cleanup']='FAIL';v['cleanup_error']=str(e);v['status']='FAIL'
 after=inventory();save('root-inputs-after.json',{'identity':identity(after),'files':after});v['source_unchanged']=after==current
 if after!=current:v['status']='FAIL'
 save('runner.json',v);print('TERMINAL '+json.dumps(v),flush=True)
sys.exit(0 if v['status']=='PASS' else 1)
