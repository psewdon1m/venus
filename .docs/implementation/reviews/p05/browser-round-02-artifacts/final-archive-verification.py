import hashlib,json,sys,zipfile,subprocess
from pathlib import Path
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
root=Path('.docs/implementation/evidence/p05/browser-matrix-preflight-01')
index=json.loads((root/'index.json').read_text(encoding='utf-8-sig'))
for row in index['files']:
 data=(root/row['path']).read_bytes()
 assert len(data)==row['size'],row['path']
 assert hashlib.sha256(data).hexdigest()==row['sha256'],row['path']
before=json.loads((root/'browser/inputs-before.json').read_text(encoding='utf-8-sig'))
after=json.loads((root/'browser/inputs-after.json').read_text(encoding='utf-8-sig'))
files=before['files']; assert files==after['files']
with zipfile.ZipFile(root/'included-source.zip') as archive:
 entries=archive.namelist();assert len(entries)==len(set(entries))==len(files)==1720
 assert set(entries)==set(files)
 for name in entries:assert hashlib.sha256(archive.read(name)).hexdigest()==files[name],name
assert identity(files)==index['source_identity_sha256']=='46bf2780058b7a420af842de0939245f05bad32d039bc69cef90fe9fd853c197'
assert inventory()==files,'Current included source differs from actual tested source'
for kind in ['browser','probe']:
 receipt=json.loads((root/kind/'runner.json').read_text(encoding='utf-8-sig'))
 assert receipt['source_unchanged'] and receipt['source_identity_sha256']==receipt['source_identity_after']==identity(files)
 assert receipt['status']=='PASS' and receipt['cleanup']=='completed' and receipt['preflight_only'] and receipt['source_dirty']
 for name in ['runner.json','inputs-before.json','inputs-after.json','build.txt','image-id.txt']:
  raw=Path('.artifacts/p05')/receipt['isolated_project']/name
  assert raw.read_bytes()==(root/kind/name).read_bytes(),str(raw)
cleanup=[]
for resource,args in [('containers',['ps','-a','--format','{{.Names}}']),('volumes',['volume','ls','--format','{{.Name}}']),('networks',['network','ls','--format','{{.Name}}'])]:
 p=subprocess.run(['docker',*args],capture_output=True,text=True,timeout=30,check=True)
 matches=[name for name in p.stdout.splitlines() if any(x in name for x in ['venus-p05-b69106075752','venus-p05-dee06684ef96','venus-p05-independent-read-'])]
 assert not matches,(resource,matches);cleanup.append({'resource':resource,'owned_matches':matches,'exit_code':p.returncode})
result={'status':'PASS','evidence_files_hashed':len(index['files']),'archive_files':len(files),'source_identity_sha256':identity(files),'current_source_matches':True,'actual_attempts':['venus-p05-b69106075752','venus-p05-dee06684ef96'],'cleanup':cleanup,'method':'Independent SHA/size checks of every evidence file, every archived included-source byte, current inventory, original receipts and actual Docker inventory'}
Path('.artifacts/p05-browser-review/final-archive-verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
