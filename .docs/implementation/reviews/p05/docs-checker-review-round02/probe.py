"""Independent prospective-candidate probes. Only owned temp fixtures are changed."""
from pathlib import Path
import contextlib,difflib,hashlib,importlib.util,io,json,os,re,shutil,sys,tempfile,types,unittest
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4];C=ROOT/'.artifacts/p05-docs-candidate02'
sys.path.insert(0,str(ROOT/'tools'))
import stage_inventory
identity_before=stage_inventory.identity(stage_inventory.inventory(ROOT))
def sha(b):return hashlib.sha256(b).hexdigest()
def load_module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);sys.modules[name]=module;spec.loader.exec_module(module);return module
helper=load_module('archived_markdown',C/'archived_markdown.py');code=(C/'check_docs.py').read_text(encoding='utf-8')
index= json.loads((ROOT/'.docs/implementation/evidence/p05/docs-checker-candidate-02/index.json').read_text(encoding='utf-8'))
assert sha((ROOT/'.docs/implementation/evidence/p05/docs-checker-candidate-02/index.json').read_bytes())=='e4ca0e88247e1aff821aa5e4caaa80df4c23f48961fb516f3b29c547d5e17da4'
for x in index['files']:
 b=(ROOT/'.docs/implementation/evidence/p05/docs-checker-candidate-02'/x['path']).read_bytes();assert len(b)==x['bytes'] and sha(b)==x['sha256']
assert sha((C/'HANDOFF.json').read_bytes())=='2571790904c842740767a16128b4225fdccf3b2e885d4e31839ce0d97aeb2b86'
for name in ['archived_markdown.py','check_docs.py','test_archived_markdown.py','archive-records.json']:
 assert (C/name).read_bytes()==(ROOT/'.docs/implementation/evidence/p05/docs-checker-candidate-02'/name).read_bytes()
assert len(helper.ARCHIVES)==8
records=json.loads((C/'archive-records.json').read_text(encoding='utf-8'))
assert {x['path']:{k:v for k,v in x.items() if k!='path'} for x in records}==helper.ARCHIVES
for path,r in helper.ARCHIVES.items():
 b=(ROOT/path).read_bytes();assert sha(b)==r['sha256'] and len(b)==r['bytes'];b.decode(r['encoding'])
diff=''.join(difflib.unified_diff((ROOT/'tools/check_docs.py').read_text(encoding='utf-8').splitlines(True),code.splitlines(True),fromfile='current/tools/check_docs.py',tofile='prospective/tools/check_docs.py'))
(OUT/'candidate-diff.txt').write_text(diff,encoding='utf-8')
def run(root):
 stream=io.StringIO();status=0
 try:
  with contextlib.redirect_stdout(stream):exec(compile(code,str(root/'tools/check_docs.py'),'exec'),{'__file__':str(root/'tools/check_docs.py'),'__name__':'prospective_docs_checker'})
 except SystemExit as e:status=int(e.code or 0)
 except Exception as e:status=99;stream.write(type(e).__name__+': '+str(e))
 return status,stream.getvalue()
prospective_status,prospective_output=run(ROOT)
(OUT/'prospective-actual-root.txt').write_text(prospective_output,encoding='utf-8')
author=types.ModuleType('candidate_author_tests');author.__file__=str(ROOT/'tools/test_archived_markdown.py')
exec(compile((C/'test_archived_markdown.py').read_text(encoding='utf-8'),author.__file__,'exec'),author.__dict__)
stream=io.StringIO();result=unittest.TextTestRunner(stream=stream,verbosity=2).run(unittest.defaultTestLoader.loadTestsFromModule(author))
(OUT/'author-tests-independent-rerun.txt').write_text(stream.getvalue(),encoding='utf-8')
assert result.wasSuccessful() and result.testsRun==7
checks=[]
def record(name,expected,status,output='',detail=None):
 checks.append({'id':name,'expected_rejection':expected,'actual_status':status,'assertion_pass':status!=0 if expected else status==0,'diagnostic':output[-900:],'detail':detail})
with tempfile.TemporaryDirectory(prefix='venus-docs-review-') as directory:
 owned=Path(directory).resolve();root=owned/'fixture';root.mkdir()
 prefix=code.split('errors=archive_errors(ROOT)')[0];ctx={'__file__':str(root/'tools/check_docs.py'),'__name__':'fixture_constants'};exec(compile(prefix,str(root/'tools/check_docs.py'),'exec'),ctx)
 for rel in ctx['REQUIRED']:
  p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'')
 for rel,r in helper.ARCHIVES.items():
  p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((ROOT/rel).read_bytes())
 # Existing checker asset/snapshot inventory is satisfied without pretending this
 # isolated fixture is a complete application checkout or modifying real files.
 for rel in ['.docs/assets/references/source-map.json','.docs/source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md']:
  p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((ROOT/rel).read_bytes())
 for p in (ROOT/'.docs/assets/references').glob('*.png'):shutil.copyfile(p,root/'.docs/assets/references'/p.name)
 for i in range(12):
  p=root/'.docs/examples/cards'/f'fixture-{i}.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text('{}',encoding='utf-8')
 links=re.compile(r'!?\[[^\]\n]*\]\(([^)]+)\)')
 for rel in helper.ARCHIVES:
  text,base=helper.read_markdown(root/rel,root)
  for raw in links.findall(text):
   target=raw.strip().split(' "')[0].split('#')[0]
   if not target or target.startswith(('https://','http://','mailto:','data:')):continue
   from urllib.parse import unquote
   p=(base/unquote(target)).resolve();assert p.is_relative_to(root)
   if not p.exists():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b'')
 current=root/'current.md';target=root/'current-target.txt';target.write_text('fixture',encoding='utf-8');current.write_text('[valid](current-target.txt)',encoding='utf-8')
 s,o=run(root);record('FIXTURE-POSITIVE',False,s,o);assert s==0,o
 for number,rel in enumerate(helper.ARCHIVES):
  p=root/rel;raw=p.read_bytes();p.unlink();s,o=run(root);record(f'MISSING-{number}',True,s,o);p.write_bytes(raw)
  p.write_text('Changed valid UTF8 bytes',encoding='utf-8');s,o=run(root);record(f'TAMPER-VALID-UTF8-{number}',True,s,o);p.write_bytes(raw)
  b=bytearray(raw);b[0]^=1;p.write_bytes(b);s,o=run(root);record(f'SAME-SIZE-{number}',True,s,o);p.write_bytes(raw)
  dest=owned/f'file-target-{number}.md';dest.write_bytes(raw);p.unlink();os.symlink(dest,p);s,o=run(root);record(f'ACTUAL-FINAL-SYMLINK-{number}',True,s,o);p.unlink();p.write_bytes(raw)
 for name,raw in [('UNKNOWN-BAD-UTF8',b'new undeclared \x97 codec'),('CURRENT-BROKEN-LINK',b'[broken](never-exists-p05-review-target)'),('CURRENT-ROOT-ESCAPE',b'[escaped](../../outside-root)')]:
  current.write_bytes(raw);s,o=run(root);record(name,True,s,o)
 current.write_text('[valid](current-target.txt)',encoding='utf-8')
 rel=next(x for x,r in helper.ARCHIVES.items() if r['origin']);original=helper.ARCHIVES[rel]['origin'];helper.ARCHIVES[rel]['origin']='../../wrong-origin/source.md'
 s,o=run(root);record('VALIDATOR-ORIGIN-ESCAPE-MUTATION',True,s,o,{'scope':'Explicit mutation of candidate constant, not an untrusted runtime input'});helper.ARCHIVES[rel]['origin']=original
 # Final-file is_symlink is not enough: actual ancestor directory symlink causes
 # source_files(os.walk followlinks=False) to omit four registered documents.
 parent=(root/rel).parent;outside=owned/'ancestor-target';assert parent.resolve().is_relative_to(owned) and outside.resolve().is_relative_to(owned)
 parent.rename(outside);os.symlink(outside,parent,target_is_directory=True)
 s,o=run(root)
 from source_inventory import source_files
 missing=[x for x in helper.ARCHIVES if root/x not in list(source_files(root))]
 record('ACTUAL-ANCESTOR-DIRECTORY-SYMLINK',True,s,o,{'archive_errors':helper.archive_errors(root),'registered_paths_missing_from_markdown_walk':missing,'all_raw_pins_unchanged':True})
 parent.unlink();outside.rename(parent)
 if os.name=='nt':
  import _winapi
  parent.rename(outside)
  _winapi.CreateJunction(str(outside),str(parent))
  assert parent.is_junction() and not parent.is_symlink()
  s,o=run(root);record('ACTUAL-WINDOWS-ANCESTOR-JUNCTION',True,s,o,{'actual_junction_created':True})
  os.rmdir(parent);outside.rename(parent)
 s,o=run(root);record('REGULAR-ANCESTORS-RESTORED-POSITIVE',False,s,o)
assert stage_inventory.identity(stage_inventory.inventory(ROOT))==identity_before
payload={'schema_version':1,'scope':'PROSPECTIVE_EXCLUDED_CANDIDATE_ONLY_NOT_INTEGRATED_SOURCE_ACCEPTANCE','source_identity':identity_before,'candidate_helper_sha256':sha((C/'archived_markdown.py').read_bytes()),'candidate_checker_sha256':sha((C/'check_docs.py').read_bytes()),'candidate_index_sha256':'e4ca0e88247e1aff821aa5e4caaa80df4c23f48961fb516f3b29c547d5e17da4','author_tests_independently_reexecuted':7,'prospective_actual_root_status':prospective_status,'checks':checks,'passed':sum(c['assertion_pass'] for c in checks),'failed':sum(not c['assertion_pass'] for c in checks),'source_unchanged':True,'no_docker_or_product_requests':True}
(OUT/'probes.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'checks':len(checks),'passed':payload['passed'],'failed':payload['failed'],'prospective_actual_root_status':prospective_status,'source_unchanged':True}))
