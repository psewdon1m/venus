from pathlib import Path,PurePosixPath
import json,subprocess,urllib.request,urllib.error,zipfile,io,hashlib,re
import sys
RUN=int(sys.argv[1]);SHA=sys.argv[2];ROOT=Path(sys.argv[3]);ROOT.mkdir(exist_ok=True)
ATTEMPT=int(sys.argv[4]) if len(sys.argv)>4 else None
p=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\npath=psewdon1m/venus.git\n\n',text=True,capture_output=True,check=True)
credential=dict(s.split('=',1) for s in p.stdout.splitlines() if '=' in s)
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
opener=urllib.request.build_opener(NoRedirect)
def api(path):
 assert path.startswith('/actions/') or path=='/branches/main/protection'
 req=urllib.request.Request('https://api.github.com/repos/psewdon1m/venus'+path,headers={'Authorization':'Bearer '+credential['password'],'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Cache-Control':'no-cache'})
 try:
  with opener.open(req,timeout=30) as r:return r.read()
 except urllib.error.HTTPError as error:
  if error.code!=302:raise
  with urllib.request.urlopen(urllib.request.Request(error.headers['Location']),timeout=30) as r:return r.read()
def json_api(path):return json.loads(api(path))
endpoint='/actions/runs/'+str(RUN)+('/attempts/'+str(ATTEMPT) if ATTEMPT else '')
run=json_api(endpoint);jobs=json_api(endpoint+'/jobs?per_page=100');artifacts=json_api('/actions/runs/'+str(RUN)+'/artifacts?per_page=100')
assert run['head_sha']==SHA
if ATTEMPT:assert run['run_attempt']==ATTEMPT
for name,value in [('ci-run.json',run),('ci-jobs.json',jobs),('all-attempts-artifact-metadata.json',artifacts)]: (ROOT/name).write_text(json.dumps(value,indent=2)+'\n')
logroot=ROOT/'job-logs';logroot.mkdir(exist_ok=True)
bindings=[]
for job in jobs['jobs']:
 if job['status']!='completed':continue
 assert job['run_id']==RUN and job['head_sha']==SHA
 label=job['name'].replace(' ','-').replace('(','').replace(')','');path=logroot/(label+'.txt')
 if not path.exists():
  try:path.write_bytes(api('/actions/jobs/'+str(job['id'])+'/logs'))
  except urllib.error.HTTPError as error:
   if error.code!=404:raise
 if path.exists():
  ids=sorted({int(n) for n in re.findall(r'Artifact ID(?: is)?\s+(\d+)',path.read_text(encoding='utf-8-sig'))})
  bindings.append({'job_id':job['id'],'job_name':job['name'],'run_id':RUN,'run_attempt':run.get('run_attempt',1),'log_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'artifact_ids':ids})
if ATTEMPT:
 ids={i for b in bindings for i in b['artifact_ids']}
 artifacts={**artifacts,'artifacts':[a for a in artifacts['artifacts'] if a['id'] in ids]};artifacts['total_count']=len(artifacts['artifacts'])
(ROOT/'artifact-job-bindings.json').write_text(json.dumps(bindings,indent=2)+'\n')
(ROOT/'artifact-metadata.json').write_text(json.dumps(artifacts,indent=2)+'\n')
records=[]
for artifact in artifacts['artifacts']:
 name=artifact['name'];assert name in {'negative-gates','container-smoke','p02-integration','p03-integration','p04-integration'} or name.startswith('p03-measurements-'),name
 directory=ROOT/name;directory.mkdir(exist_ok=True)
 marker=directory/'download-receipt.json'
 archive_path=ROOT/'archives'/(str(artifact['id'])+'.zip');archive_path.parent.mkdir(exist_ok=True)
 if not archive_path.exists():
  raw=api('/actions/artifacts/'+str(artifact['id'])+'/zip')
  assert artifact['digest']=='sha256:'+hashlib.sha256(raw).hexdigest()
  archive_path.write_bytes(raw)
 if not marker.exists():
  raw=archive_path.read_bytes();entries=[]
  with zipfile.ZipFile(io.BytesIO(raw)) as archive:
   assert sum(i.file_size for i in archive.infolist())<=256*1024*1024
   for entry in archive.infolist():
    path=PurePosixPath(entry.filename);assert not path.is_absolute() and '..' not in path.parts and '\\' not in entry.filename and ':' not in entry.filename
    if entry.is_dir():continue
    assert entry.file_size<=128*1024*1024
    data=archive.read(entry);target=directory.joinpath(*path.parts);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
    entries.append({'path':entry.filename,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()})
  marker.write_text(json.dumps({'artifact_id':artifact['id'],'run_id':RUN,'source_sha':SHA,'archive_sha256':hashlib.sha256(raw).hexdigest(),'files':entries},indent=2)+'\n')
 receipt=json.loads(marker.read_text());assert receipt['artifact_id']==artifact['id'] and receipt['archive_sha256']==hashlib.sha256(archive_path.read_bytes()).hexdigest();records.append({'name':name,'id':artifact['id'],'files':[e['path'] for e in receipt['files']]})
(ROOT/'artifact-index.json').write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps({'run_id':RUN,'run_attempt':run.get('run_attempt',1),'status':run['status'],'conclusion':run['conclusion'],'jobs':[{'name':j['name'],'status':j['status'],'conclusion':j['conclusion']} for j in jobs['jobs']],'artifacts':records}))
