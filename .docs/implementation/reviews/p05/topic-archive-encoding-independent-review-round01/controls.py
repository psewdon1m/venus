from pathlib import Path
import ast,hashlib,importlib.util,json,tempfile,sys
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT/'tools'))
from archived_markdown import ARCHIVES,read_markdown,archive_errors
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=ROOT/'.artifacts/p05-recovery-source1274-01/tools/archived_markdown.py'
spec=importlib.util.spec_from_file_location('oldarchive',old);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
new=ROOT/'tools/archived_markdown.py'
before=ast.parse(old.read_text(encoding='utf-8'));after=ast.parse(new.read_text(encoding='utf-8'))
results=[]
def ok(name):results.append({'name':name,'status':'PASS'})
for a,b in zip([n for n in before.body if isinstance(n,ast.FunctionDef)],[n for n in after.body if isinstance(n,ast.FunctionDef)]):assert ast.dump(a)==ast.dump(b)
assert len([n for n in before.body if isinstance(n,ast.FunctionDef)])==len([n for n in after.body if isinstance(n,ast.FunctionDef)])==2
ok('read_markdown and archive_errors AST unchanged')
added=set(ARCHIVES)-set(module.ARCHIVES)
expected={'.docs/implementation/reviews/p05/oci-rollback-author-resume-round01/producer/README.md','.docs/implementation/reviews/p05/oci-rollback-author-resume-round02/producer/README-resume01.md'}
assert added==expected and len(ARCHIVES)==11 and all(ARCHIVES[k]==v for k,v in module.ARCHIVES.items())
ok('exact two additions; previous nine records unchanged')
assert (ROOT/'tools/test_archived_markdown.py').read_text(encoding='utf-8')==(ROOT/'.artifacts/p05-recovery-source1274-01/tools/test_archived_markdown.py').read_text(encoding='utf-8').replace('len(ARCHIVES), 9','len(ARCHIVES), 11')
ok('author test change only expected count9 to11')
for name in sorted(added):
 p=ROOT/name;raw=p.read_bytes();record=ARCHIVES[name]
 assert len(raw)==4151 and sha(p)=='04490dd8f0f637247893af05132bc032a2338453e6e1dff7e182bfbc75084e51'
 assert record=={'sha256':sha(p),'bytes':4151,'encoding':'cp1252','origin':None}
 try:raw.decode('utf-8')
 except UnicodeDecodeError:pass
 else:raise AssertionError('not actually nonUTF8')
 text,base=read_markdown(p,ROOT);assert text==raw.decode('cp1252') and base==p.parent
 ok(name+' exact4151B hash, strictUTF8 failure, declared cp1252 and own link base')
 with tempfile.TemporaryDirectory() as temp:
  root=Path(temp);q=root/name;q.parent.mkdir(parents=True);q.write_bytes(raw)
  text,base=read_markdown(q,root);assert base==q.parent
  changed=bytearray(raw);changed[-1]^=1;q.write_bytes(changed)
  try:read_markdown(q,root)
  except ValueError as e:assert 'bytes changed' in str(e)
  else:raise AssertionError('same size mutation accepted')
  ok(name+' same-size mutation rejected')
  q.write_text('valid UTF8 replacement',encoding='utf-8')
  try:read_markdown(q,root)
  except ValueError as e:assert 'bytes changed' in str(e)
  else:raise AssertionError('rewritten capture accepted')
  ok(name+' validUTF8 rewrite rejected')
  q.unlink();assert any(name in e for e in archive_errors(root));ok(name+' missing capture rejected')
with tempfile.TemporaryDirectory() as temp:
 root=Path(temp);p=root/'unknown.md';p.write_bytes(b'Unknown \x96 nonUTF8')
 try:read_markdown(p,root)
 except UnicodeDecodeError:pass
 else:raise AssertionError('fallback broadened')
 ok('unknown nonUTF8 remains strict; no wildcard fallback')
assert archive_errors(ROOT)==[];ok('all11 actual immutable records present and exact')
result={'status':'PASS_TOOLING_ONLY','controls':len(results),'cases':results,'live_tools_sha256':{n:sha(ROOT/n) for n in ['tools/archived_markdown.py','tools/test_archived_markdown.py']},'new_records':{k:ARCHIVES[k] for k in sorted(added)},'historical_readme_writes':False,'source_qualification':'LIVE_TOOLING_FIX_SEPARATE_FROM_RESTORED_HISTORICAL1813_SOURCE'}
(OUT/'controls.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':result['status'],'controls':len(results)}))
