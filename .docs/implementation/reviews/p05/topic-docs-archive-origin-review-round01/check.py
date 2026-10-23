from pathlib import Path
import sys,ast,importlib.util,types,unittest,hashlib,json,runpy,subprocess,tempfile
root=Path.cwd();sys.path.insert(0,str(root/'tools'));base=root/'.artifacts/p05-docs-archive-origin-review-round01';candidate=root/'.artifacts/p05-docs-archive-origin-candidate01'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(candidate/'archived_markdown.py')=='8253bbf23daa7feed20adba250f514618bcde049a1cf7f2fdeb9a8d829f7a2c4' and sha(candidate/'test_archived_markdown.py')=='078df0299ab95f9ae49835f57b4274523965f139c2c3b0a5beb59ad27bd38cf6'
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
old=load('original_archived',root/'tools/archived_markdown.py');new=load('archived_markdown',candidate/'archived_markdown.py');sys.modules['archived_markdown']=new
key='.docs/implementation/reviews/p05/topic-browser-aggregate-budget-diagnosis-round01/inputs/.docs/10_IMPLEMENTATION_PLAN.md';record={'sha256':'8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9','bytes':78597,'encoding':'utf-8','origin':'.docs/10_IMPLEMENTATION_PLAN.md'}
assert set(new.ARCHIVES)-set(old.ARCHIVES)=={key} and len(new.ARCHIVES)==9 and new.ARCHIVES[key]==record
assert {k:v for k,v in new.ARCHIVES.items() if k!=key}==old.ARCHIVES
funcs=lambda s:{n.name:ast.dump(n,include_attributes=False) for n in ast.parse(s).body if isinstance(n,ast.FunctionDef)}
assert funcs((candidate/'archived_markdown.py').read_text('utf-8'))==funcs((root/'tools/archived_markdown.py').read_text('utf-8'))
assert (candidate/'test_archived_markdown.py').read_text('utf-8')==(root/'tools/test_archived_markdown.py').read_text('utf-8').replace('len(ARCHIVES), 8','len(ARCHIVES), 9')
text,origin=new.read_markdown(root/key,root);assert origin==root/'.docs' and text==(root/key).read_bytes().decode('utf-8')
assert not new.archive_errors(root)
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'normal.md';p.write_text('[normal](sibling.md)','utf-8');assert new.read_markdown(p,Path(d))[1]==Path(d)
 p.write_bytes(b'bad\x97');
 try:new.read_markdown(p,Path(d));raise AssertionError('ordinary invalid codec accepted')
 except UnicodeDecodeError:pass
tests=types.ModuleType('prospective_tests');tests.__file__=str(root/'tools/test_archived_markdown.py');exec(compile((candidate/'test_archived_markdown.py').read_bytes(),tests.__file__,'exec'),tests.__dict__)
result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromModule(tests));assert result.wasSuccessful() and result.testsRun==7
(base/'results.json').write_text(json.dumps({'status':'PASS','own_exact_addedrecord_ast_guard_checks':7,'unit_tests':result.testsRun,'origin':str(origin),'ordinary_unknown_nonUTF8_rejected':True,'all_previous8_records_byteidentical':True},indent=2)+'\n','utf-8')
# Exact original tool file location keeps repository discovery correct.
runpy.run_path(str(root/'tools/check_docs.py'),run_name='__main__')
