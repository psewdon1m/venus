from pathlib import Path
import hashlib,json,subprocess,os
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def index(path,expected):
 assert pin(path)['sha256']==expected
 d=read(path);rows=d['files'];rows=[dict(v,path=k)for k,v in rows.items()]if isinstance(rows,dict)else rows
 for f in rows:
  p=path.parent/f['path'];assert pin(p)=={k:f[k]for k in ['bytes','sha256']},str(p)
 return d
ociA=R/'.docs/implementation/reviews/p05/oci28-a18-bindings-author-round01';twoA=R/'.docs/implementation/reviews/p05/a18-final-gate-bindings-author-round01'
assert len(index(ociA/'INDEX.json','3d9ce200cba48fb17bd6a012bc0c48b7931b6d065f05c86968e5b576eec37479')['files'])==24
assert len(index(twoA/'INDEX.json','8f97ad4c373180dbc6e9a4a29bf103d0ff46e039f0f232d812c3446922250c1b')['files'])==27
fp=R/'.artifacts/p05-pilot-bundle-source-freeze15.json';f=read(fp);oldf=read(R/'.artifacts/p05-pilot-bundle-source-freeze14.json');S=R/'.artifacts/p05-pilot-bundle-source15'
assert pin(fp)['sha256']=='40d31fbad39ee7056022fa310404c16121da41741a4a39c2c6e512e56cc1562d'
assert f['identity']=='a5a4143f3c8c346215450617b1ee711cd2c027cb23fc5e59f6e791c88b8f1866'and f['included_files']==len(f['files'])==1872
assert f['git_source_commit']=='8f16c23a29ca6637ce6ef359fcf76398709549b2'and f['all_git_blobs_exact']and f['worktree_clean']
for n,h in f['files'].items():assert pin(S/n)['sha256']==h,n
changed=sorted(n for n in oldf['files']if oldf['files'][n]!=f['files'].get(n));added=sorted(set(f['files'])-set(oldf['files']));assert changed==['apps/web/src/topic-games-panel.tsx','apps/web/src/topic-panel.test.ts']and added==['.docs/implementation/p05-source-revision-active-pair-refusal-01.json']
product=R/'.docs/implementation/reviews/p05/active-pair-refusal-product-independent-round01/INDEX.json';index(product,'a4fbc5670f172efdc64e48c2b3eea601568c30362b5746d58254ae4f6637517e')
testp=R/'.artifacts/p05-pilot-bundle-image-binding15/receipt.json';prodp=R/'.artifacts/p05-pilot-bundle-production-image-binding15/receipt.json'
assert pin(testp)['sha256']=='e869aefdbbaeefbe3155a391dc51567a392c465352b30de94687b8de841127b3'and pin(prodp)['sha256']=='9dd1224a78fbaddce48f783ae8c3ecb2c440bfa30d7e210a4054a485ddd22f3d'
t=read(testp);p=read(prodp);ot=read(R/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json');op=read(R/'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json')
assert t['source_identity']==p['source_identity']==f['identity']and t['included_files']==p['included_files']==1872
assert t['image']=='sha256:181f591d4ebef7446de991275cc8820369d90dbfce378da9cd82f4c282a32616'and p['image']=='sha256:faffbd1531d2b85c0dc085a8f56800c0f5cae15ee63137ade5be4d11a881431a'
assert len(t['image_files_sha256'])==299 and len(p['image_files_sha256'])==122 and p['build_metadata']['source_revision']==f['git_source_commit']and p['metadata_source_revision_is_dirty_source_SHA256_not_git_commit']is False
for k,count in [('compiled_files',69),('migration_files',7),('pg_dependency_files',2)]:assert t[k]==ot[k]and len(t[k])==count
for k,count in [('compiled_files',67),('migration_files',7),('pg_dependency_files',2)]:assert p[k]==op[k]and len(p[k])==count
for n,h in t['source_files'].items():assert f['files'][n]==h,n
for n,h in p['image_files_sha256'].items():assert t['image_files_sha256'][n]==h,n
css=lambda q:{n:h for n,h in q['web_dist_files'].items()if n.endswith('.css')}
assert css(t)==css(ot)==css(p)and t['web_dist_files']==p['web_dist_files']and t['web_dist_files']!=ot['web_dist_files']
for q in [t,p]:assert q['probe_exit_code']==q['build_observed_exit']==0 and q['probe_cleanup']=='AUTO_REMOVED'and q['app_imports']==0
assert p['ordinary_server_executed']is False and t['build_metadata_absent']is True
C=S/'.artifacts/p05-compatible-rollback-producer28';B=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer27';ci=read(C/'INDEX.json');bi=read(B/'INDEX.json')
assert pin(C/'INDEX.json')['sha256']=='3618665392fb08884cdfa39438d5429020c9c9ab8225cd7e6593bb7ab3dd1230'
for n,v in ci['files'].items():assert pin(C/n)=={k:v[k]for k in ['bytes','sha256']},n
assert {x.relative_to(C).as_posix()for x in C.rglob('*')if x.is_file()and x.name!='INDEX.json'}==set(ci['files'])
assert set(ci['files'])-set(bi['files'])=={'OPERATIONAL_REVISION28.json','final28-actual-receipts/A18.json','final28-actual-receipts/B4.json'}
metadata=['BINDING.json','PROFILE.json','ROOT_RUN_ACK_TEMPLATE.json','actual-build-metadata-absence.json','actual-image-maps.json','included-inputs.json'];assert sorted(n for n in bi['files']if bi['files'][n]!=ci['files'][n])==metadata
for n in bi['files']:
 if n not in metadata:assert (C/n).read_bytes()==(B/n).read_bytes(),n
assert len([n for n in ci['files']if n.endswith('.mjs')])==40
binding=read(C/'BINDING.json');assert binding['source_identity']==f['identity']and binding['included_files']==1872 and binding['images']['A']==t['image']and binding['images']['B']==read(B/'BINDING.json')['images']['B']and binding['resource_profile']=='QRB_BOUND_ONLY_2_BROWSER_PIDS256'and binding['root_run_ack']is False
assert read(C/'included-inputs.json')==f['files']and read(C/'final28-actual-receipts/A18.json')==t
maps=read(C/'actual-image-maps.json');assert len(maps['maps']['A']['files'])==81 and len(maps['maps']['B']['files'])==78 and maps['maps']['B']==read(B/'actual-image-maps.json')['maps']['B']
for n,h in maps['maps']['A']['files'].items():assert t['image_files_sha256'][n]==h,n
oldRunner=R/'.artifacts/p05-browser24-a17-run01.mjs';runner=R/'.artifacts/p05-browser24-a18-run01.mjs';ackp=R/'.artifacts/p05-browser24-a18-root-ack01.pending.json';ba=read(ackp)
assert pin(runner)['sha256']=='12bf02a0395044273d8054fcd1d72d679f6fc6f175390f233519e47d6085412c'and pin(ackp)['sha256']=='adf9851d8aeb3ae88a420ff4f22c1e24885c61212c538e3e17119fa45213e62c'
expected=oldRunner.read_bytes().replace(ot['image'].encode(),t['image'].encode()).replace(oldf['identity'].encode(),f['identity'].encode()).replace(b'length,1871',b'length,1872').replace(b'p05-browser24-a17-root-ack01.json',b'p05-browser24-a18-root-ack01.json');assert runner.read_bytes()==expected
assert ba['status']=='NOT_AUTHORIZED'and ba['issued_at']is None and ba['rebinding_review_index_sha256']is None and ba['source_identity']==f['identity']and ba['source_files']==1872 and ba['runner_sha256']==pin(runner)['sha256']
assert len(ba['runtime_pins'])==9
for n,h in ba['runtime_pins'].items():assert pin(R/'.artifacts/p05-private-batch-browser-producer24'/n)['sha256']==h,n
L=S/'.artifacts/p05-v2-layout-producer-a18-01';LB=R/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume21';li=read(L/'INDEX.json')
assert pin(L/'INDEX.json')['sha256']=='b799b08b01b1ff07d1bdb0e130676223bbbdc2f8f9a798c4b85610d8e5f7c6be'
for n,v in li['files'].items():
 if v.get('type')=='file':assert pin(L/n)=={k:v[k]for k in ['bytes','sha256']},n
oldm={x.name:x.read_bytes()for x in LB.glob('*.mjs')};newm={x.name:x.read_bytes()for x in L.glob('*.mjs')};assert len(newm)==27 and set(oldm)==set(newm)and sorted(n for n in oldm if oldm[n]!=newm[n])==['run.mjs','runner-policy.mjs']
assert newm['run.mjs']==oldm['run.mjs'].replace(b'p05-v2-layout-producer-resume21',b'p05-v2-layout-producer-a18-01').replace(b'FINAL_A17_BOUND_INDEPENDENT_REVIEW_REQUIRED',b'FINAL_A18_BOUND_INDEPENDENT_REVIEW_REQUIRED').replace(b'FINAL_A17_BINDING_REQUIRED',b'FINAL_A18_BINDING_REQUIRED')
assert newm['runner-policy.mjs']==oldm['runner-policy.mjs'].replace(b'assert.equal(binding.included_files,1871)',b'assert.equal(binding.included_files,1872)')
for n in ['expected-cells.json','DESIGN.md','real-text-fixture.json']:assert (L/n).read_bytes()==(LB/n).read_bytes(),n
la=read(L/'ROOT_RUN_ACK.json');lb=read(L/'binding.json');assert la['root_run_ack']is False and la['independent_review_path']is None and la['producer_runtime_digest']is None and la['browser_pids_limit']==512 and la['operational_resource_profile']=='LAYOUT21_BROWSER_PID512'
assert lb['source_identity']==f['identity']and lb['image']==t['image']and lb['included_files']==1872 and lb['source_snapshot_sha256']==pin(fp)['sha256']and lb['root_build_receipt_sha256']==pin(testp)['sha256']
proofs=read(twoA/'PROOFS.json')
for label,v in proofs.items():assert pin(R/v['path'])['sha256']==v['sha256'],label
pure=read(R/'.artifacts/p05-privacy-matched-operational01/PURE-CLOSURE-A9-A11.json');assert len(pure['runtime_modules'])==28 and [n for n,h in pure['runtime_modules'].items()if t['compiled_files'][n]!=h]==['apps/api/dist/rooms.js']
assert f['files']['package-lock.json']==pure['package_lock_sha256']and all(t['compiled_files'][n]==ot['compiled_files'][n]for n in pure['runtime_modules'])
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';checks=[]
def cold(name,args,cwd=R,expected=0):
 q=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30);(O/(name+'.stdout.txt')).write_bytes(q.stdout);(O/(name+'.stderr.txt')).write_bytes(q.stderr);assert q.returncode==expected,(name,q.stderr.decode());checks.append({'name':name,'exit':q.returncode});return q
out=cold('browser-layout-cold',[node,str(twoA/'cold.mjs')]);runtime=json.loads(out.stdout)['layout_runtime_digest'];assert runtime=='a85898fa9aa7b90b96614ce04a6a7addd380fb7d3f334af6c1832e8dcdf0e4f6'
cold('oci-memory-authority',[node,str(O/'oci-cold.mjs')])
falseack=R/'.artifacts/p05-oci28-author01/UNISSUED_ACK.json';assert read(falseack)['root_run_ack']is False
cold('oci-falseACK',[node,'--max-old-space-size=192',str(C/'driver.mjs'),'--run','--ack='+str(falseack)],cwd=S,expected=1)
out=cold('layout-falseACK',[node,str(L/'run.mjs')],cwd=S,expected=1);assert b'ROOT_RUN_ACK_REQUIRED'in out.stderr
env={**os.environ,'GIT_OPTIONAL_LOCKS':'0'};head=subprocess.run(['git','rev-parse','HEAD'],cwd=f['git_worktree'],capture_output=True,env=env,check=True).stdout.decode().strip();status=subprocess.run(['git','status','--porcelain=v1'],cwd=f['git_worktree'],capture_output=True,env=env,check=True).stdout;assert head==f['git_source_commit']and status==b''
result={'status':'PASS_METHOD_ONLY','source_identity':f['identity'],'included_files':1872,'source_count':1872,'Git':head,'Git_status_empty':True,'Git_allblob_verification':'ROOT_FROZEN_WITNESS_NOT_DUPLICATED','source_changed':changed,'source_added':added,'test_compiled69_prod67_SQL7_PG2':'EXACT_A17','image':t['image'],'images':binding['images'],'production_image':p['image'],'OCI28_index':pin(C/'INDEX.json'),'OCI40_MJS':'RAW_EXACT27','resource_profile':binding['resource_profile'],'browser_runner_sha256':pin(runner)['sha256'],'browser_pending_ACK_sha256':pin(ackp)['sha256'],'browser9_MJS':'EXACT24','layout_INDEX':pin(L/'INDEX.json'),'producer_runtime_digest':runtime,'operational_resource_profile':'LAYOUT21_BROWSER_PID512','browser_pids_limit':512,'layout27MJS':'25_RAW_EXACT21_2_LITERAL_ONLY','carry':'API42_840_PLUS2NEG_AND_WIRE_BOUNDARY_ONLY_BACKEND_EQUIVALENCE;A9_27WHOLE_PLUS_ROOMS_REVISION_SLICE','new_UI_or_OCI_or_full_host_native_acceptance':False,'checks':checks,'native_runs':0,'APP_writes':0}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n');(O/'PROOF-PINS.json').write_text(json.dumps(proofs,indent=2)+'\n')
(O/'INPUT-PINS.json').write_text(json.dumps({str(x.relative_to(R)):pin(x)for x in [ociA/'INDEX.json',twoA/'INDEX.json',fp,testp,prodp,product,C/'INDEX.json',runner,ackp,L/'INDEX.json',L/'binding.json',L/'ROOT_RUN_ACK.json',falseack]},indent=2)+'\n');print(json.dumps(result))
