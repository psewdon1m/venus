from pathlib import Path
import json,hashlib,subprocess,sys
r=Path('C:/.projects/venus');o=Path(__file__).parent
a=r/'.docs/implementation/reviews/p05/topic-browser-method25-author-round01';p=r/'.artifacts/p05-private-batch-browser-producer24';c=r/'.artifacts/p05-private-batch-browser-producer25'
pins={}
def read(p):
 b=p.read_bytes();pins[p.relative_to(r).as_posix()]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()};return b
def js(p):return json.loads(read(p))
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(read(a/'INDEX.json'))=='ee432ba31828b4ea7c023ed212236f1146f433aaf3034c4f648150bd62f69d0a'
author=js(a/'INDEX.json');assert len(author['files'])==35
for item in author['files']:
 b=read(a/item['path']);assert len(b)==item['bytes'] and sha(b)==item['sha256']
names=sorted(x.name for x in c.glob('*.mjs'));assert len(names)==9
runtime={}
for n in names:
 b=read(c/n);assert b==read(a/'runtime'/n);runtime[n]=sha(b)
 if n!='browser.mjs':assert b==read(p/n)
digest=sha(('\n'.join(n+' '+h for n,h in sorted(runtime.items()))+'\n').encode())
assert digest==author['runtime_digest']=='f1be316048622bdd55c4a5e3a4e0ce381303dc902ea6678c4154f67ab5a7e658'
before=read(p/'browser.mjs');after=read(c/'browser.mjs')
start=b'async function coherentGame(';end=b'async function ownUiRound('
x=before.index(start);y=before.index(end,x);u=after.index(start);v=after.index(end,u)
assert before[:x]==after[:u] and before[y:]==after[v:]
assert before[x:y]==read(a/'PARENT_HELPER.txt') and after[u:v]==read(a/'CANDIDATE_HELPER.txt')
wrapper=r/'.artifacts/p05-browser25-a18-run01.mjs';pending=r/'.artifacts/p05-browser25-a18-root-ack01.pending.json'
w=read(wrapper);oldw=read(r/'.artifacts/p05-browser24-a18-run01.mjs')
assert w==oldw.replace(b'p05-private-batch-browser-producer24',b'p05-private-batch-browser-producer25').replace(b'p05-browser24-a18-root-ack01.json',b'p05-browser25-a18-root-ack01.json')
assert sha(w)=='c8321044927f140931e5e6ecef6b33d0dd42b079b596f6ac6c5ffecc4682280a'
ack=js(pending);assert sha(read(pending))=='a39f8dd33669f99401b1aa2d55f63c8ce8c6ebd04d4479e3ed38c3510435f5c5'
assert ack['runtime_pins']==runtime and ack['status']=='NOT_AUTHORIZED' and ack['issued_at'] is None and ack['runner_sha256']==sha(w)
assert not (r/'.artifacts/p05-browser25-a18-root-ack01.json').exists()
assert sha(read(r/'.docs/implementation/reviews/p05/a18-browser24-failure-diagnosis-independent-round01/INDEX.json'))=='44bd3ddc93645dbf8c4fcc7a3d30c88b33a9fc20841ba61b2fd39e2911de93ac'
f=js(r/'.artifacts/p05-pilot-bundle-source-freeze15.json');assert f['identity']==ack['source_identity'] and f['included_files']==ack['source_files']==1872
for n,h in f['files'].items():assert sha((r/'.artifacts/p05-pilot-bundle-source15'/n).read_bytes())==h,n
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
current=inventory();assert current==f['files'] and identity(current)==f['identity']
assert sha(read(Path(ack['image_receipt'])))==ack['image_receipt_sha256']
for file in ['AGENTS.md','.docs/implementation/reviews/p05/topic-browser-method24-independent-round01/INDEX.json','.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json']:
 read(r/file)
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
for name,args in [('author-controls',[node,str(a/'controls.mjs')]),('independent-controls',[node,str(o/'controls.mjs')]),('syntax-browser',[node,'--check',str(c/'browser.mjs')]),('syntax-wrapper',[node,'--check',str(wrapper)])]:
 result=subprocess.run(args,cwd=r,capture_output=True,timeout=30);(o/(name+'.stdout.txt')).write_bytes(result.stdout);(o/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'exit':result.returncode});assert result.returncode==0,(name,result.returncode,result.stderr.decode())
out={'status':'PASS_METHOD_ONLY','functional_method_status':'PASS','source_identity':f['identity'],'included_files':1872,'image':ack['image'],'runtime_count':9,'runtime_pins':runtime,'runtime_digest':digest,'wrapper':{'bytes':len(w),'sha256':sha(w)},'pending_ACK':pins[pending.relative_to(r).as_posix()],'author_index_sha256':sha(read(a/'INDEX.json')),'source_binding_review_sha256':pins['.docs/implementation/reviews/p05/a18-gate-bindings-independent-round01/INDEX.json']['sha256'],'other8_MJS_raw_exact24':True,'entire_browser_inverse_except_coherentGame_exact24':True,'all16_case_bodies_raw_exact24':True,'original_8000ms_intervals_unchanged':True,'repeated_author_controls':6,'independent_actual_helper_controls':4,'commands':commands,'findings':[],'native_actions':0,'APP_edits':False,'producer_edits':False,'ACK_edits':False,'actual_browser_PASS':False,'stage_PASS':False}
(o/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n');(o/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2,sort_keys=True)+'\n');print(json.dumps(out))
