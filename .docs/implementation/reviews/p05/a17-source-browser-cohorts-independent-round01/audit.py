from pathlib import Path
import json,hashlib,subprocess,sys
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent
sha=lambda b:hashlib.sha256(b).hexdigest()
pin=lambda p:{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())}
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
A=R/'.docs/implementation/reviews/p05/a17-source-browser-cohorts-author-round01'
assert sha((A/'INDEX.json').read_bytes())=='5a9f3318b33fcba1cfe49a1a27da0990c87891c393bbfa759396ee2024ad64c0'
ai=read(A/'INDEX.json');assert len(ai['files'])==13
for n,p in ai['files'].items():assert pin(A/n)==p,n
fp=R/'.artifacts/p05-pilot-bundle-source-freeze14.json';f=read(fp);oldf=read(R/'.artifacts/p05-pilot-bundle-source-freeze13.json')
assert (A/fp.name).read_bytes()==fp.read_bytes()
sys.path.insert(0,str(R/'tools'));from stage_inventory import inventory,identity,included
live=inventory(R);material=inventory(Path(f['materialized_root']))
assert live==material==f['files'] and len(live)==1871
assert identity(live)==f['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
delta=sorted(n for n in live.keys()|oldf['files'].keys() if live.get(n)!=oldf['files'].get(n))
assert delta==['.docs/implementation/p05-source-revision-ui-control-contrast-01.json','apps/web/src/style.css']
w=Path(f['git_worktree']);commit=f['git_source_commit'];assert commit=='3abad03309ebd19f04fc0b61532627a5188d855c'
def git(*args,input=None):return subprocess.run(['git',*args],cwd=w,input=input,capture_output=True,check=True).stdout
assert git('rev-parse','HEAD').decode().strip()==commit and git('status','--porcelain=v1')==b''
tree={}
for row in git('ls-tree','-rz','--full-tree',commit).split(b'\0'):
 if not row:continue
 header,name=row.split(b'\t',1);mode,kind,oid=header.split();assert kind==b'blob' and mode in [b'100644',b'100755'];tree[name.decode()]=oid.decode()
assert set(live)<=set(tree)
assert all(not included(n) for n in set(tree)-set(live))
names=sorted(live);raw=git('cat-file','--batch',input=''.join(tree[n]+'\n' for n in names).encode());cursor=0
for n in names:
 end=raw.index(b'\n',cursor);oid,kind,size=raw[cursor:end].split();assert kind==b'blob' and oid.decode()==tree[n]
 start=end+1;end=start+int(size);assert sha(raw[start:end])==live[n],n;assert raw[end:end+1]==b'\n';cursor=end+1
assert cursor==len(raw)
assert sorted(git('diff-tree','--no-commit-id','--name-only','-r',commit).decode().splitlines())==delta
tp=R/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';pp=R/'.artifacts/p05-pilot-bundle-production-image-binding14/receipt.json'
t=read(tp);p=read(pp);ot=read(R/'.artifacts/p05-pilot-bundle-image-binding13/receipt.json');op=read(R/'.artifacts/p05-pilot-bundle-production-image-binding13/receipt.json')
assert (A/'test-receipt.json').read_bytes()==tp.read_bytes() and (A/'production-receipt.json').read_bytes()==pp.read_bytes()
assert len(t['image_files_sha256'])==299 and len(p['image_files_sha256'])==122
for x in [t,p]:
 assert x['source_identity']==f['identity'] and x['included_files']==1871 and x['probe_exit_code']==x['build_observed_exit']==0
 assert x['app_imports']==0 and x['probe_cleanup']=='AUTO_REMOVED'
for x,y in [(t,ot),(p,op)]:
 for section,count in [('compiled_files',69 if x is t else 67),('migration_files',7),('pg_dependency_files',2)]:assert x[section]==y[section] and len(x[section])==count
 assert {n:h for n,h in x['image_files_sha256'].items() if not n.startswith('apps/web/dist/') and n not in t['source_files']}=={n:h for n,h in y['image_files_sha256'].items() if not n.startswith('apps/web/dist/') and n not in t['source_files']}
for n,h in t['source_files'].items():assert live[n]==h
for n,h in t['compiled_files'].items():assert sha((R/n).read_bytes())==h,n
for section in ['compiled_files','migration_files','pg_dependency_files','web_dist_files','source_files']:
 for n,h in t[section].items():assert t['image_files_sha256'][n]==h
for section in ['compiled_files','migration_files','pg_dependency_files','web_dist_files']:
 for n,h in p[section].items():assert p['image_files_sha256'][n]==h and t['image_files_sha256'][n]==h
assert {n:h for n,h in p['image_files_sha256'].items() if n.startswith('packages/')}=={n:h for n,h in op['image_files_sha256'].items() if n.startswith('packages/')}
byext=lambda m,e:sorted(h for n,h in m.items() if n.endswith(e))
assert byext(t['web_dist_files'],'.js')==byext(ot['web_dist_files'],'.js')==['18645659151dc2d9c1d5e2ae0b5e13b65b0f90f8864a5f5ec75e8c00cef1bf32']
for ext in ['.css','.html']:assert byext(t['web_dist_files'],ext)!=byext(ot['web_dist_files'],ext)
assert p['build_metadata']=={'version':'0.0.0','source_revision':commit} and p['source_git_commit']==commit and t['build_metadata_absent']
for label,receipt in [('p05-pilot-bundle-build14',t),('p05-pilot-bundle-production-build14',p)]:
 assert int((R/'.artifacts'/(label+'-exit.txt')).read_text())==0
 assert sha((R/'.artifacts'/(label+'.txt')).read_bytes())==receipt['build_log_sha256']
closure=read(R/'.artifacts/p05-privacy-matched-operational01/PURE-CLOSURE-A9-A11.json')['runtime_modules']
assert len(closure)==28
assert all(t['image_files_sha256'][n]==ot['image_files_sha256'][n] for n in closure)
assert sum(t['image_files_sha256'][n]==h for n,h in closure.items())==27
assert [n for n,h in closure.items() if t['image_files_sha256'][n]!=h]==['apps/api/dist/rooms.js']
browser=read(A/'p05-browser23-a17-root-ack01.pending.json');runner=A/'p05-browser23-a17-run01.mjs'
assert browser['status']=='NOT_AUTHORIZED' and browser['issued_at'] is None and browser['source_identity']==f['identity'] and browser['image']==t['image']
assert browser['runner_sha256']==sha(runner.read_bytes()) and runner.read_bytes()==(R/'.artifacts/p05-browser23-a17-run01.mjs').read_bytes()
body=(R/'.artifacts/p05-browser23-a15-run01.mjs').read_bytes()
for a,b in [(b'sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689',t['image'].encode()),(b'p05-browser23-a15-root-ack01.json',b'p05-browser23-a17-root-ack01.json'),(b'658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de',f['identity'].encode()),(b'length,1869',b'length,1871')]:assert body.count(a)==1;body=body.replace(a,b)
assert body==runner.read_bytes()
assert len(browser['runtime_pins'])==9
for n,h in browser['runtime_pins'].items():assert sha((R/'.artifacts/p05-private-batch-browser-producer23'/n).read_bytes())==h
oldba=read(R/'.artifacts/p05-browser23-a15-root-ack01.json');assert browser['runtime_pins']==oldba['runtime_pins']
for key in ['independent_review_index','application_review_index']:
 assert sha(Path(browser[key]).read_bytes())==browser[key+'_sha256']
for path,h in browser['application_reviews'].items():assert sha(Path(path).read_bytes())==h
acks=[]
allowed={'status','source_root','source_identity','source_freeze_path','source_freeze_sha256','source_revision','source_git_commit','image_id','image_receipt_path','image_receipt_sha256','runtime_files','issued_at','scope','operational_change','parent_ack_path','parent_ack_sha256','fresh_binding_review','fresh_binding_review_sha256','N4_600s_positive_prerequisite','application_reviews'}
for path in sorted(A.glob('*-*.pending.json')):
 if path.name.startswith('p05-'):continue
 ack=read(path);parentpath=Path(ack['parent_ack_path']);parent=read(parentpath)
 assert ack['parent_ack_sha256']==sha(parentpath.read_bytes())
 diff=sorted(k for k in ack.keys()|parent.keys() if ack.get(k)!=parent.get(k));assert set(diff)<=allowed,diff
 assert ack['status']=='NOT_AUTHORIZED' and ack['issued_at'] is None and ack['maximum_concurrent_cohorts']==2 and ack['no_retry_or_reseed']
 assert ack['source_identity']==f['identity'] and ack['source_revision']==ack['source_git_commit']==commit
 assert ack['source_freeze_sha256']==sha(fp.read_bytes()) and ack['image_receipt_sha256']==sha(pp.read_bytes()) and ack['image_id']==p['image']
 assert ack['runtime_files']==p['image_files_sha256']|{'build-metadata.json':p['build_metadata_sha256']}
 for n,h in ack['method_files'].items():assert sha((R/'.artifacts/p05-ordinary-real470-probe06'/n).read_bytes())==h
 assert ack['method_files']==parent['method_files'] and ack['method_review_sha256']=='122d26cf594e289796166542deddb89f6f2d4314e2f499ba554f695c1bd2959f'
 assert sha(Path(ack['method_review_path']).read_bytes())==ack['method_review_sha256']
 changedprereq={k for k in ack['N4_600s_positive_prerequisite'] if ack['N4_600s_positive_prerequisite'].get(k)!=parent['N4_600s_positive_prerequisite'].get(k)}
 assert changedprereq<={'qualification','independent_review','independent_review_sha256'}
 assert {k:v for k,v in ack['application_reviews'].items() if k not in parent['application_reviews']}=={str(R/'.docs/implementation/reviews/p05/ui-control-contrast-product-independent-round01/INDEX.json'):'6b6c7d1d32d9643e73028df389f5eb4ce474c7d919c1c6cc5cb4fa0f82ebdaac'}
 assert all(ack['application_reviews'][k]==v for k,v in parent['application_reviews'].items())
 assert path.read_bytes()==(R/'.artifacts/p05-cohorts06-a17-acks01'/path.name).read_bytes()
 acks.append({'name':path.name,'pin':pin(path),'cohort':ack['cohort'],'diff_from_parent_fields':diff})
assert len(acks)==4
assert inventory(R)==live and inventory(Path(f['materialized_root']))==material and git('status','--porcelain=v1')==b''
result={'status':'PASS_SOURCE_BINDINGS','author_children':13,'source_identity':f['identity'],'included_files':1871,'live_materialized_Git_all_blobs':1871,'git_commit':commit,'git_clean':True,'source_delta_from_A16':delta,
 'test_receipt':pin(tp),'test_image':t['image'],'test_paths':299,'production_receipt':pin(pp),'production_image':p['image'],'production_paths_plus_metadata':123,'metadata':p['build_metadata'],'metadata_sha256':p['build_metadata_sha256'],
 'compiled_all69_exact_A16':True,'SQL7_PG2_exact':True,'JS_content_exact':True,'CSS_HTML_new':True,'pure_closure_all28_exact_A16_not_all_A9':True,'pure_A9_whole_exact':27,'browser_runtime9_exact':True,'browser_wrapper_four_literals_only':True,'pending_cohorts':acks,
 'limitations':['Enumerated receipt maps, no live image reinspection or whole-image absence proof.','Prior A16 actuals retain their original tuple labels; narrow unchanged component reuse only.','No A17 wholeAPP/browser/layout/full42/fullC2/M3/matched/stage PASS.','No native allocation, APP or ACK mutation by reviewer.']}
(O/'AUDIT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:result[k] for k in ['status','author_children','live_materialized_Git_all_blobs','git_commit','test_image','production_image','compiled_all69_exact_A16','browser_wrapper_four_literals_only']}))
