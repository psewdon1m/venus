from pathlib import Path
import hashlib,json,subprocess,sys
r=Path('C:/.projects/venus');o=Path(__file__).parent;sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();read=lambda p:json.loads(p.read_text())
p=r/'.artifacts/p05-private-batch-browser-producer24';c=r/'.artifacts/p05-private-batch-browser-producer25';wrapper=r/'.artifacts/p05-browser25-a18-run01.mjs';pending=r/'.artifacts/p05-browser25-a18-root-ack01.pending.json'
names=sorted(x.name for x in p.glob('*.mjs'));assert names==sorted(x.name for x in c.glob('*.mjs')) and len(names)==9
for n in names:
 if n!='browser.mjs':assert (p/n).read_bytes()==(c/n).read_bytes(),n
before=(p/'browser.mjs').read_bytes();after=(c/'browser.mjs').read_bytes();a=before.index(b'async function coherentGame(');b=before.index(b'async function ownUiRound(',a);x=after.index(b'async function coherentGame(');y=after.index(b'async function ownUiRound(',x)
assert before[:a]==after[:x] and before[b:]==after[y:]
assert (o/'PARENT_HELPER.txt').read_bytes()==before[a:b] and (o/'CANDIDATE_HELPER.txt').read_bytes()==after[x:y]
assert before.count(b'await check(')==after.count(b'await check(')==16
assert b'timeout:8000,intervals:[50,100,250]' in after[x:y]
assert wrapper.read_bytes()==(r/'.artifacts/p05-browser24-a18-run01.mjs').read_bytes().replace(b'p05-private-batch-browser-producer24',b'p05-private-batch-browser-producer25').replace(b'p05-browser24-a18-root-ack01.json',b'p05-browser25-a18-root-ack01.json')
runtime=read(o/'RUNTIME.json');ack=read(pending);assert ack['runtime_pins']==runtime['runtime_pins'];assert ack['status']=='NOT_AUTHORIZED' and ack['issued_at'] is None and ack['independent_review_index_sha256'] is None and ack['runner_sha256']==sha(wrapper)
assert not (r/'.artifacts/p05-browser25-a18-root-ack01.json').exists()
for n,h in runtime['runtime_pins'].items():assert sha(c/n)==h
diag=r/'.docs/implementation/reviews/p05/a18-browser24-failure-diagnosis-independent-round01/INDEX.json';assert sha(diag)=='44bd3ddc93645dbf8c4fcc7a3d30c88b33a9fc20841ba61b2fd39e2911de93ac'
freeze=r/'.artifacts/p05-pilot-bundle-source-freeze15.json';f=read(freeze);assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866' and f['included_files']==1872
for n,h in f['files'].items():assert sha(r/'.artifacts/p05-pilot-bundle-source15'/n)==h,n
sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
actual=inventory();assert actual==f['files'] and identity(actual)==f['identity']
commands=[];node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
for name,args in [('syntax-browser',[node,'--check',str(c/'browser.mjs')]),('syntax-wrapper',[node,'--check',str(wrapper)]),('syntax-controls',[node,'--check',str(o/'controls.mjs')]),('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(c/'browser.mjs'),str(wrapper),str(o/'controls.mjs')])]:
 result=subprocess.run(args,cwd=r,capture_output=True,timeout=30);(o/(name+'.stdout.txt')).write_bytes(result.stdout);(o/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'exit':result.returncode});assert result.returncode==0,(name,result.returncode)
result={'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','finite_controls':6,'other8MJS_raw_exact24':True,'browser_only_coherentGame_helper':True,'all16case_bodies_and_allotherhelpers_raw_exact24':True,'wrapper_only_producer_and_ACK_path_literals':True,'strict200_original_coherentRound_8s_intervals_unchanged':True,'source1872_materialized_and_current_verified':True,'runtime_count':9,'APP_edits':False,'native_RUN':False,'active_ACK':False,'commands':commands}
(o/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
pins=[freeze,diag,r/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json',r/'.artifacts/p05-browser24-a18-run01.mjs',r/'.artifacts/p05-browser24-a18-root-ack01.pending.json',r/'.docs/implementation/reviews/p05/topic-browser-method24-independent-round01/INDEX.json',r/'.docs/implementation/reviews/p05/a18-final-gate-bindings-author-round01/INDEX.json']
(o/'INPUT_PINS.json').write_text(json.dumps({x.relative_to(r).as_posix():{'bytes':x.stat().st_size,'sha256':sha(x)} for x in pins},indent=2)+'\n',encoding='utf8');print(json.dumps(result))
