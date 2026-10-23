from pathlib import Path
import json,hashlib,ast,importlib.util,sys,tempfile,subprocess
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent;sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def index(p,pin):
 assert sha(p)==pin;d=load(p)
 for r in d['files']:
  q=p.parent/r['path'];assert q.stat().st_size==r['bytes'] and sha(q)==r['sha256']
 return len(d['files'])
E=ROOT/'.docs/implementation/evidence/p05';archive=E/'recovery-oci04-actual-failed01';counts={}
counts['actual_fail_archive']=index(archive/'INDEX.json','37e937593908062706da60b8ca312765699f4433c28672c612cb8b2dec1413fe')
counts['cleanup01']=index(E/'recovery-oci04-owned-cleanup01/INDEX.json','76659391447d6c685c4f231cdd4dd82e9d9965d59eaccfd8628f3b93f3ed84fa')
counts['cleanup02']=index(E/'recovery-oci04-owned-cleanup02/INDEX.json','888f7c5a59e591f5c3f02b29922c65c97da54c82fc4ec008ba3853713ec02302')
oldreview=ROOT/'.docs/implementation/reviews/p05/oci04-actual-diagnosis-round01';assert sha(oldreview/'INDEX.json')=='f112e7787d6356c0857ad735cc956ddf85f532504c506f06972ec60fdfd0e8a2'
plan=load(oldreview/'CLEANUP_PLAN.json');owner=plan['owner'];host=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-p05-oci-ffaaeef4fe2b'
rows=load(archive/'original-host-map.json');assert len(rows)==150
actual=[]
for p in sorted(host.rglob('*')):
 assert not p.is_symlink()
 if p.is_file():actual.append({'path':p.relative_to(host).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
assert actual==rows
for row in rows:
 p=archive/'run'/(row['path']+'.bytes' if row['path'].endswith('.md') else row['path']);assert p.stat().st_size==row['bytes'] and sha(p)==row['sha256']
ids={x['id'] for x in plan['containers_after_verified_stopped']};vols={x['Name'] for x in plan['volumes_after_no_attachments']};nets={x['Id'] for x in plan['network_after_no_containers']}
def validate_command(args):
 if args[0] in ['stop','rm']:
  assert (args[:3]==['stop','--time','5'] and len(args)==4 and args[3]==plan['stop_only_running_keeper']) or len(args)==2 and args[0]=='rm' and args[1] in ids
 elif args[0]=='inspect':assert len(args)==2 and args[1] in ids
 elif args[:2] in [['volume','inspect'],['volume','rm']]:assert len(args)==3 and args[2] in vols
 elif args[:2] in [['network','inspect'],['network','rm']]:assert len(args)==3 and args[2] in nets
 elif args[0]=='ps' or args[:2] in [['volume','ls'],['network','ls']]:
  assert '--filter' in args
  filters=[args[i+1] for i,v in enumerate(args) if v=='--filter'];assert len(filters)==1
  assert filters[0] in ['label=com.venus.oci.owner='+owner,'label=com.venus.oci.resource.owner='+owner] or filters[0].startswith('volume=') and filters[0][7:] in vols
 else:raise AssertionError('unallowlisted command '+str(args))
records=[load(E/('recovery-oci04-owned-cleanup0'+str(i))/'RECORD.json') for i in [1,2]]
for record in records:
 assert record['owner']==owner and record['archive_index_sha256']==sha(archive/'INDEX.json') and record['diagnosis_index_sha256']==sha(oldreview/'INDEX.json')
 for c in record['commands']:assert c['exit_code']==0;validate_command(c['arguments'])
first,last=records;assert first['status']=='FAIL_RETAINED_MANUAL_CLEANUP_REQUIRED' and len(first['commands'])==6
mut=lambda args:args[0] in ['stop','rm'] or args[:2] in [['volume','rm'],['network','rm']]
assert not any(mut(c['arguments']) for c in first['commands'])
assert last['status']=='PASS_EXACT_OWNED_EPHEMERAL_RESOURCES_REMOVED_ORIGINAL_RUN_STILL_FAIL' and len(last['commands'])==42 and last['owner_inventories']=='EMPTY'
expected=[['stop','--time','5',plan['stop_only_running_keeper']],*[['rm',r['id']] for r in plan['containers_after_verified_stopped']],*[['volume','rm',r['Name']] for r in plan['volumes_after_no_attachments']],*[['network','rm',r['Id']] for r in plan['network_after_no_containers']]]
assert [c['arguments'] for c in last['commands'] if mut(c['arguments'])]==expected
assert all(c['stdout_bytes']==0 for c in last['commands'][-4:])
s1=(E/'recovery-oci04-owned-cleanup01/cleanup.py').read_text(encoding='utf-8').replace('cleanup01','cleanup02')
old="assert v[field]==expect[field],('CONTAINER_DRIFT',ident,field)"
new="assert (sorted(v[field],key=lambda m:m['Destination'])==sorted(expect[field],key=lambda m:m['Destination']) if field=='Mounts' else v[field]==expect[field]),('CONTAINER_DRIFT',ident,field)"
assert s1.count(old)==1 and s1.replace(old,new)==(E/'recovery-oci04-owned-cleanup02/cleanup.py').read_text(encoding='utf-8')
mounts=[{'Destination':'/a','RW':False,'Source':'one'},{'Destination':'/b','RW':False,'Source':'two'}];sort=lambda a:sorted(a,key=lambda v:v['Destination'])
assert sort(mounts)==sort(list(reversed(mounts)));changed=[dict(v) for v in mounts];changed[0]['RW']=True;assert sort(changed)!=sort(mounts)
fresh=[]
for args in [['ps','-aq','--no-trunc','--filter','label=com.venus.oci.owner='+owner],['volume','ls','-q','--filter','label=com.venus.oci.owner='+owner],['network','ls','-q','--no-trunc','--filter','label=com.venus.oci.owner='+owner],['ps','-aq','--no-trunc','--filter','label=com.venus.oci.resource.owner='+owner]]:
 r=subprocess.run(['docker',*args],capture_output=True,text=True,timeout=10);assert r.returncode==0 and not r.stdout.strip();fresh.append({'arguments':['docker',*args],'exit_code':r.returncode,'stdout_empty':True,'stderr':r.stderr})
# Exact twelve-entry change versus the previously independently accepted eleven.
sys.path.insert(0,str(ROOT/'tools'));from archived_markdown import ARCHIVES,read_markdown,archive_errors
previous=ROOT/'.docs/implementation/reviews/p05/topic-archive-encoding-independent-review-round01/inputs/archived_markdown.py';spec=importlib.util.spec_from_file_location('previous11',previous);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
target='.docs/implementation/reviews/p05/oci-rollback-operational-rebind-author-round03/producer/README-resume01.md'
assert len(ARCHIVES)==12 and set(ARCHIVES)-set(m.ARCHIVES)=={target} and all(ARCHIVES[n]==v for n,v in m.ARCHIVES.items())
for name in ['read_markdown','archive_errors']:
 def fn(p):return next(n for n in ast.parse(p.read_text(encoding='utf-8')).body if isinstance(n,ast.FunctionDef) and n.name==name)
 assert ast.dump(fn(previous))==ast.dump(fn(ROOT/'tools/archived_markdown.py'))
assert (ROOT/'tools/test_archived_markdown.py').read_text(encoding='utf-8')==(previous.parent/'test_archived_markdown.py').read_text(encoding='utf-8').replace('len(ARCHIVES), 11','len(ARCHIVES), 12')
source=ROOT/target;raw=source.read_bytes();assert len(raw)==4151 and sha(source)=='04490dd8f0f637247893af05132bc032a2338453e6e1dff7e182bfbc75084e51';assert ARCHIVES[target]=={'sha256':sha(source),'bytes':4151,'encoding':'cp1252','origin':None}
text,base=read_markdown(source,ROOT);assert text==raw.decode('cp1252') and base==source.parent
with tempfile.TemporaryDirectory(prefix='venus-maintenance-review-') as t:
 root=Path(t);p=root/target;p.parent.mkdir(parents=True);p.write_bytes(raw);assert read_markdown(p,root)[1]==p.parent
 b=bytearray(raw);b[0]^=1;p.write_bytes(b)
 try:read_markdown(p,root)
 except ValueError as e:assert 'bytes changed' in str(e)
 else:raise AssertionError('same-size corruption accepted')
 unknown=root/'unknown.md';unknown.write_bytes(b'Unknown \x96 byte')
 try:read_markdown(unknown,root)
 except UnicodeDecodeError:pass
 else:raise AssertionError('unknown nonUTF8 accepted')
 for n in ARCHIVES:
  q=root/n;q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes((ROOT/n).read_bytes())
 assert archive_errors(root)==[];p.unlink();errors=archive_errors(root);assert len(errors)==1 and target in errors[0]
assert archive_errors(ROOT)==[]
snapshot=ROOT/'.artifacts/p05-recovery-source1274-01';sys.path.insert(0,str(snapshot/'tools'));from stage_inventory import inventory,identity
files=inventory(snapshot);assert len(files)==1813 and identity(files)=='1274deb83295f121a4ba58b1a25bb5f4b5d00b20589aa2bf1465d9ab43856dad'
result={'status':'PASS_MAINTENANCE_ONLY','index_children_verified':counts,'failed_host_files_unchanged':150,'failed_host_bytes':sum(r['bytes'] for r in rows),'source_identity':identity(files),'included_files':1813,'cleanup01_before_mutation':True,'cleanup02_commands':42,'cleanup02_mutations_exact_own_plan':expected,'fresh_owner_empty_inventory':fresh,'new_archive_record':target,'archive_records':12,'unchanged_reader_function_AST':True,'negative_same_size_hash_unknownUTF8_deleted_record':'PASS','actual_cleanup_by_reviewer':False,'original_OCI04_status':'FAIL_UNCHANGED','full_stage_acceptance':False}
(OUT/'controls.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'host_files':150,'cleanup_commands':42,'archive_records':12,'fresh_inventory':'EMPTY'}))
