from pathlib import Path
import hashlib,json,subprocess,sys
r=Path('C:/.projects/venus');o=Path(__file__).parent;a=r/'.docs/implementation/reviews/p05/topic-browser-method26-author-round01';p=r/'.artifacts/p05-private-batch-browser-producer25';c=r/'.artifacts/p05-private-batch-browser-producer26';pins={};sha=lambda b:hashlib.sha256(b).hexdigest()
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':sha(b)};return b
def js(p):return json.loads(read(p))
assert sha(read(a/'INDEX.json'))=='00fc1fb03edc97865f5105b02ffaece1f2eab6f83172cb2b4dd8c6ffe777f578'
author=js(a/'INDEX.json');assert len(author['files'])==55
for item in author['files']:
 b=read(a/item['path']);assert sha(b)==item['sha256'] and len(b)==item['bytes'],item['path']
runtime={}
assert sorted(x.name for x in p.glob('*.mjs'))==sorted(x.name for x in c.glob('*.mjs'))
for file in sorted(c.glob('*.mjs')):
 n=file.name;b=read(file);runtime[n]=sha(b);assert b==read(a/'runtime'/n)
 if n!='browser.mjs':assert b==read(p/n)
assert len(runtime)==9
digest=sha(('\n'.join(n+' '+h for n,h in sorted(runtime.items()))+'\n').encode());assert digest==author['runtime_digest']=='0c5cb34b10d3fa57d2fc400c472149da4bd847b30450d300362ed4b6c47ae3ba'
old=read(p/'browser.mjs');new=read(c/'browser.mjs');ending=b'\r\n' if b'\r\n' in old else b'\n';restored=new
for before,after in [(b'const observedOwnStarts=new WeakMap();'+ending+b'const normalCurrentStarts=new WeakMap(),normalCurrentViews=new WeakMap();',b'const observedOwnStarts=new WeakMap();'),(read(a/'OBSERVER_INSERT.txt'),b''),(read(a/'REQUEST_LISTENER.txt'),b''),(b"page.on('response',async response=>{const request=response.request(),normalCurrentSlot=beginNormalCurrent(a,response);",b"page.on('response',async response=>{const request=response.request();"),(b'const v=await response.json();rememberNormalCurrent(a,normalCurrentSlot,v);a.lastGameView=',b'const v=await response.json();a.lastGameView='),(read(a/'CANDIDATE_HELPER.txt'),read(a/'PARENT_HELPER.txt'))]:
 assert restored.count(before)==1;restored=restored.replace(before,after)
assert restored==old and old.count(b'await check(')==new.count(b'await check(')==16
wrapper=r/'.artifacts/p05-browser26-a18-run01.mjs';pending=r/'.artifacts/p05-browser26-a18-root-ack01.pending.json';w=read(wrapper)
assert w==read(r/'.artifacts/p05-browser25-a18-run01.mjs').replace(b'p05-private-batch-browser-producer25',b'p05-private-batch-browser-producer26').replace(b'p05-browser25-a18-root-ack01.json',b'p05-browser26-a18-root-ack01.json')
assert sha(w)=='2036d8b31aa2f1feb2084a94bfc28c84b2e18dff9d77dc5e56f67dce8599e870'
ack=js(pending);assert sha(read(pending))=='04c8d5fbf03cce0cf932a23cb9d2bb9786d643bfd6588023dc62a68f60843bfe'
assert ack['runtime_pins']==runtime and ack['status']=='NOT_AUTHORIZED' and ack['issued_at'] is None and ack['runner_sha256']==sha(w)
assert not (r/'.artifacts/p05-browser26-a18-root-ack01.json').exists()
assert sha(read(r/'.docs/implementation/reviews/p05/a18-browser25-failure-diagnosis-independent-round01/INDEX.json'))=='5d23ffa55fcae4e28384d64a69f083e73dfb40b2b46a4b6a47ba6b9f61b4f2d0'
f=js(r/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']==ack['source_identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==ack['source_files']==1872
for n,h in f['files'].items():assert sha((r/'.artifacts/p05-pilot-bundle-source15'/n).read_bytes())==h,n
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
current=inventory();assert current==f['files'] and identity(current)==f['identity']
receipt=js(Path(ack['image_receipt']));assert sha(read(Path(ack['image_receipt'])))==ack['image_receipt_sha256'] and receipt['source_identity']==f['identity'] and receipt['image']==ack['image'] and receipt['included_files']==1872
for n in ['AGENTS.md','.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json','.docs/implementation/reviews/p05/topic-browser-method25-independent-round01/INDEX.json']:
 read(r/n)
commands=[];node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
for name,args in [('author-controls',[node,str(a/'controls.mjs')]),('independent-controls',[node,str(o/'controls.mjs')]),('syntax-browser',[node,'--check',str(c/'browser.mjs')]),('syntax-wrapper',[node,'--check',str(wrapper)])]:
 result=subprocess.run(args,cwd=r,capture_output=True,timeout=30);(o/(name+'.stdout.txt')).write_bytes(result.stdout);(o/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'exit':result.returncode});assert result.returncode==0,(name,result.returncode,result.stderr.decode())
audit={'status':'PASS_METHOD_ONLY','functional_method_status':'PASS','source_identity':f['identity'],'included_files':1872,'image':ack['image'],'runtime_count':9,'runtime_pins':runtime,'runtime_digest':digest,'wrapper':{'bytes':len(w),'sha256':sha(w)},'pending_ACK':pins[pending.relative_to(r).as_posix()],'author_index_sha256':sha(read(a/'INDEX.json')),'source_binding_review_sha256':pins['.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json']['sha256'],'other8_MJS_raw_exact25':True,'browser_inverse_exact25':True,'all16_case_bodies_otherhelpers_private_fault_checks_exact25':True,'original8000ms_50_100_250_intervals_unchanged':True,'request_after_invocation_not_precall_cache':True,'full_actual_DTO_original_coherentRound':True,'latest_non200_strict_FAIL_no_retry':True,'async_slot_identity_fences':True,'repeated_author_controls':7,'own_actual_helper_combinations':5,'JSON_parse_helper_fail_fast_preserved':False,'unaccounted_JSON_parse_terminal_guard_preserved':True,'commands':commands,'findings':[],'native_actions':0,'APP_edits':False,'producer_edits':False,'ACK_edits':False,'actual_browser_PASS':False,'stage_PASS':False}
(o/'AUDIT.json').write_text(json.dumps(audit,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print(json.dumps(audit))
