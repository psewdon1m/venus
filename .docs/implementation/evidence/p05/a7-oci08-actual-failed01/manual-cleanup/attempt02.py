from pathlib import Path
import subprocess,json,datetime,hashlib
r=Path('C:/.projects/venus');p='venus-p05-oci-92449ca228b3';owner='2921a9585c8667163fce42087ac6f2d1';out=r/'.artifacts/p05-oci-failed01-manual-cleanup';assert out.exists() and not (out/'before.json').exists()
def run(args):
 s=subprocess.run(['docker',*args],capture_output=True,text=True,encoding='utf-8',timeout=30);assert s.returncode==0,(args[0],s.returncode);return s.stdout
rows=json.loads(run(['inspect',p+'-initialize',p+'-keeper']));image='sha256:9f5a417c8333b4e6340a07d2dc06c2df0a65e2cd8665e47548d5dda187f52937'
for x in rows:
 assert x['Config']['Labels']['com.venus.oci.owner']==owner and x['Config']['Labels']['com.venus.oci.project']==p and x['Image']==image
 assert x['Name'] in ['/'+p+'-initialize','/'+p+'-keeper']
assert rows[0]['State']['Status']=='created';assert rows[0]['State']['StartedAt']=='0001-01-01T00:00:00Z'
counts=json.loads(run(['exec','--user','0:0',p+'-keeper','node','--input-type=module','-e',"import fs from'node:fs';console.log(JSON.stringify(Object.fromEntries(['/evidence','/private','/authority','/retained-db'].map(p=>[p,fs.readdirSync(p).length]))))"]))
assert counts=={'/evidence':0,'/private':0,'/authority':0,'/retained-db':0},'NONEMPTY_RETAIN_NO_DELETE'
vols=json.loads(run(['volume','inspect',*[p+'-'+n for n in ['authority','db','evidence','private']]]))
for x in vols:assert x['Labels']['com.venus.oci.owner']==owner and x['Labels']['com.venus.oci.project']==p and x['Name'].startswith(p+'-')
net=json.loads(run(['network','inspect',p+'-isolated']))[0];assert net['Labels']['com.venus.oci.owner']==owner and net['Labels']['com.venus.oci.project']==p
proof={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'project':p,'owner':owner,'native_initialization_never_started':True,'four_retained_native_dirs_empty':counts,'initial_container_ids':[x['Id'] for x in rows],'initial_cap_add':rows[0]['HostConfig']['CapAdd'],'original_failure_preserved':True,'original_terminal_sha256':hashlib.sha256((r/'.artifacts/p05-pilot-bundle-source04/.artifacts/p05'/p/'TERMINAL.json').read_bytes()).hexdigest(),'cleanup':'IN_PROGRESS'}
(out/'before.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8')
run(['stop','--time','2',p+'-keeper']);run(['rm',*[x['Id'] for x in rows]]);run(['volume','rm',*[x['Name'] for x in vols]]);run(['network','rm',net['Id']])
for kind in ['container','volume','network']:
 listing=run(['ps','-a','-q','--filter','label=com.venus.oci.project='+p]) if kind=='container' else run([kind,'ls','-q','--filter','label=com.venus.oci.project='+p]);assert listing.strip()==''
proof.update(cleanup='MANUAL_OWNER_VERIFIED_EMPTY_ONLY_PASS',stage_pass=False);(out/'after.json').write_text(json.dumps(proof,indent=2)+'\n',encoding='utf-8');print(json.dumps({'cleanup':proof['cleanup'],'native_dirs':counts}))
