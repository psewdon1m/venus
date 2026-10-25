"""Readonly independent distribution inspection; no archive extraction/execution."""
import json,hashlib,tarfile,pathlib,sys
root=pathlib.Path(sys.argv[1]); inv=json.loads(pathlib.Path(sys.argv[2]).read_text()); idx=json.loads((root/'SOURCE-INDEX.json').read_text()); receipt=json.loads((root/'SOURCES-RECEIPT.json').read_text()); sha=lambda b:hashlib.sha256(b).hexdigest()
fail=[]
for r in idx['entries']+idx['notices']:
 p=root/r['file'];b=p.read_bytes()
 if len(b)!=r['bytes'] or sha(b)!=r['sha256']:fail.append('material:'+r['file'])
if sha((root/'SOURCE-INDEX.json').read_bytes())!=receipt['source_index_sha256']:fail.append('index_receipt')
expected={'SOURCE-INDEX.json','THIRD-PARTY-NOTICES.md'}|{r['file'] for r in idx['entries']+idx['notices']}
with tarfile.open(root/'sources.tar')as t:
 names=t.getnames()
 if len(names)!=len(set(names))or set(names)!=expected:fail.append('outer_tar_members')
 for r in idx['entries']+idx['notices']:
  stream=t.extractfile(r['file']);h=hashlib.sha256();size=0
  while chunk:=stream.read(1024*1024):h.update(chunk);size+=len(chunk)
  if h.hexdigest()!=r['sha256']or size!=r['bytes']:fail.append('outer_tar_material:'+r['file'])
 for name in ['SOURCE-INDEX.json','THIRD-PARTY-NOTICES.md']:
  if t.extractfile(name).read()!=(root/name).read_bytes():fail.append('outer_tar:'+name)
entries={r['identity']:r for r in idx['entries']}
media_missing=[(p.get('package')or p.get('name'))+'@'+p['version'] for p in inv['browser_notice_index']['packages'] if (p.get('package')or p.get('name'))+'@'+p['version'] not in entries]
app_missing=[p['name']+'@'+p['version'] for p in inv['npm_packages'] if p['scope']=='application-runtime'and not p['name'].startswith('@venus/')and p['name']+'@'+p['version'] not in entries]
node=entries['node@24.22.1']; npms={}
with tarfile.open(root/node['file'])as t:
 for v in t:
  if v.isfile()and v.name.endswith('/package.json')and '/deps/npm/'in v.name:
   try:p=json.loads(t.extractfile(v).read());npms[p['name']+'@'+p['version']]=1
   except (ValueError,KeyError):pass
bundled_missing=[p['name']+'@'+p['version'] for p in inv['npm_packages']if p['scope']=='node-bundled-npm'and p['name']+'@'+p['version']not in npms]
venus=next(e for e in idx['entries']if e['kind']=='venus-source')
with tarfile.open(root/venus['file'])as t:
 names=set(t.getnames());required=['third-party/livekit-server-1.13.11/LICENSE','third-party/livekit-server-1.13.11/NOTICE'];missing_build=[n for n in required if n not in names]
result={'format':'VENUS-INDEPENDENT-SOURCE-INSPECTION-1','source':idx['source_revision'],'image_label':idx['image_id'],'collector_status':idx['status'],'material_hash_failures':fail,'entries':len(idx['entries']),'notices':len(idx['notices']),'media_source_missing':media_missing,'application_source_missing':app_missing,'bundled_npm_source_missing':bundled_missing,'venus_build_inputs_missing':missing_build,'status':'PASS'if not(fail or media_missing or app_missing or bundled_missing or missing_build)else'HOLD'}
print(json.dumps(result,indent=2));sys.exit(0 if result['status']=='PASS'else 1)

