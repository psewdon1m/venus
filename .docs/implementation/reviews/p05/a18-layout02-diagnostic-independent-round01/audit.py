from pathlib import Path
import json,hashlib,subprocess,sys
r=Path('C:/.projects/venus');o=Path(__file__).parent;s=r/'.artifacts/p05-pilot-bundle-source15';a=r/'.docs/implementation/reviews/p05/a18-layout02-diagnostic-author-round01';p=s/'.artifacts/p05-v2-layout-producer-a18-01';c=s/'.artifacts/p05-v2-layout-producer-a18-02';pins={};sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':sha(b)};return b
def js(p):return json.loads(read(p))
assert sha(read(a/'INDEX.json'))=='464726053f6986c7c401151e754f543fca35fac845c86caf28863b52965c00c2'
author=js(a/'INDEX.json');assert len(author['files'])==47
for x in author['files']:
 b=read(a/x['path']);assert len(b)==x['bytes'] and sha(b)==x['sha256']
assert sha(read(c/'INDEX.json'))=='9b265d752100934dfc81c96a65e41ca76790a7e06713ff67bd090a6ceeb8c84b'
old={x.name:sha(read(x)) for x in p.glob('*.mjs')};new={x.name:sha(read(x)) for x in c.glob('*.mjs')}
assert old.keys()==new.keys() and len(new)==27 and sorted(n for n in new if old[n]!=new[n])==['dom-audit.mjs','measure.mjs','run.mjs']
dom=read(c/'dom-audit.mjs');insert=read(a/'DOM_INSERT.txt');assert dom.count(insert)==1 and dom.replace(insert,b"return {id:e.getAttribute('data-testid'),tag:e.tagName,focus_visible:")==read(p/'dom-audit.mjs')
measure=read(c/'measure.mjs');writer=read(a/'WRITER_INSERT.txt');replacement=read(a/'MEASURE_ASSERT_REPLACEMENT.txt');assert measure.count(writer)==measure.count(replacement)==1
assert measure.replace(writer,b'').replace(b'import {statSync,readFileSync,writeFileSync}',b'import {statSync,readFileSync}').replace(replacement,b'};assertKeyboard(result,targets);return result;')==read(p/'measure.mjs')
assert read(c/'run.mjs')==read(p/'run.mjs').replace(b'p05-v2-layout-producer-a18-01',b'p05-v2-layout-producer-a18-02')
for n in ['binding.json','DESIGN.md','expected-cells.json','RESOURCE_PROFILE21.json']:assert read(c/n)==read(p/n)
ack=js(c/'ROOT_RUN_ACK.json');assert sha(read(c/'ROOT_RUN_ACK.json'))=='a70eff8e7e49b5637538ad0ee7710f152d177223bdaecbd0843b9b7dc5edd79b'
assert ack['root_run_ack'] is False and ack['producer_runtime_digest'] is None and ack['independent_review_path'] is None and ack['operational_resource_profile']=='LAYOUT21_BROWSER_PID512' and ack['browser_pids_limit']==512
diag=r/'.docs/implementation/reviews/p05/a18-layout01-failure-diagnosis-independent-round01/INDEX.json';assert sha(read(diag))=='375f565733034e2b9aea94587d1af268db0e1a24c0c53d2ec3283582e1137091'
binding=js(c/'binding.json');f=js(s.parent/'p05-pilot-bundle-source-freeze15.json');assert f['identity']==binding['source_identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==binding['included_files']==1872
for n,h in f['files'].items():assert sha((s/n).read_bytes())==h,n
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
current=inventory();assert current==f['files'] and identity(current)==f['identity']
receipt=js(Path(binding['root_build_receipt_path']));assert sha(read(Path(binding['root_build_receipt_path'])))==binding['root_build_receipt_sha256'] and receipt['source_identity']==f['identity'] and receipt['included_files']==1872 and receipt['image']==binding['image']=='sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616'
browser=ack['browser_A18_actual_independent_review'];assert sha(read(Path(browser['path'])))==browser['sha256']=='04f456ccc50d7a2388b512aa775adfaf90f2883409d63c53c38fb1e1137e9265'
for n in ['AGENTS.md','.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json']:read(r/n)
commands=[];node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';runtime=None
for name,args,cwd,want in [('author-controls',[node,str(a/'controls.mjs')],r,0),('independent-controls',[node,str(o/'controls.mjs')],r,0),('runtime',[node,str(o/'runtime.mjs')],r,0),('syntax-dom',[node,'--check',str(c/'dom-audit.mjs')],r,0),('syntax-measure',[node,'--check',str(c/'measure.mjs')],r,0),('syntax-run',[node,'--check',str(c/'run.mjs')],r,0),('false-ACK',[node,str(c/'run.mjs')],s,1)]:
 result=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30);(o/(name+'.stdout.txt')).write_bytes(result.stdout);(o/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'exit':result.returncode,'expected':want});assert result.returncode==want,(name,result.returncode,result.stderr)
 if name=='runtime':runtime=json.loads(result.stdout)['runtime_digest'];assert runtime=='8ea5510fdaf72678f4bd55706c20b9a024e739dd741d6f0b4669fdc09787cc07'
 if name=='false-ACK':assert b'ROOT_RUN_ACK_REQUIRED' in result.stderr
out={'status':'PASS_METHOD_ONLY','functional_method_status':'PASS','source_identity':f['identity'],'included_files':1872,'source_count':1872,'image':binding['image'],'producer_runtime_digest':runtime,'producer_INDEX_sha256':sha(read(c/'INDEX.json')),'operational_resource_profile':'LAYOUT21_BROWSER_PID512','browser_pids_limit':512,'author_index_sha256':sha(read(a/'INDEX.json')),'false_ACK_sha256':sha(read(c/'ROOT_RUN_ACK.json')),'other24_MJS_raw_exact01':True,'DOM_and_measure_complete_inverse_exact01':True,'run_only_folder_literal':True,'original51_459_oracles_budget_resources_unchanged':True,'bounded4096_exclusive_original_first_sample_no_positive_IO':True,'writer_failure_preserves_original_FAIL':True,'repeated_author_groups':6,'independent_groups':4,'commands':commands,'findings':[],'native_actions':0,'APP_producer_ACK_edits':False,'actual_acceptance':False,'stage_PASS':False}
(o/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print(json.dumps(out))
