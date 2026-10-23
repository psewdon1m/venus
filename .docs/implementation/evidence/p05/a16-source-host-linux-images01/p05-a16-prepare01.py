from pathlib import Path
import hashlib,json,shutil,subprocess,sys,datetime
r=Path('C:/.projects/venus');w=Path('C:/Users/pc/.codex/worktrees/p05-final-source/venus')
sys.path.insert(0,str(r/'tools'))
from stage_inventory import inventory,identity
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def git(*args,input=None):return subprocess.run(['git',*args],cwd=w,input=input,capture_output=True,check=True).stdout
review=Path(sys.argv[1]);assert sha(review)==sys.argv[2] and json.loads(review.read_text())['status'].startswith('PASS')
author=r/'.docs/implementation/reviews/p05/ledger-inspection-memo-product-author-round01'
assert sha(author/'INDEX.json')=='be092f3c0ce8d8d9082b5e22f018780a5122a24c949f967dee4d266537b05439'
h=json.loads((author/'HANDOFF.json').read_text());old=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze12.json').read_text());files=inventory(r)
assert identity(files)==h['candidate_dirty_source_identity']=='c92110576ecaa7d9e6a56b74d79f51ee3d86f071134e760435adb9750350ed13' and len(files)==1870
allowed=set(h['changed_paths'])|{h['added_path']};changed={n for n in set(files)|set(old['files']) if files.get(n)!=old['files'].get(n)};assert changed==allowed
for n in h['changed_paths']:assert sha(author/'after'/n)==files[n]
out=r/'.artifacts/p05-pilot-bundle-source13';assert not out.exists();out.mkdir()
for n,pin in files.items():
 target=out/n;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,target);assert sha(target)==pin
assert inventory(out)==files and inventory(r)==files
index_before=sha(r/'.git/index');assert not git('status','--porcelain=v1');assert git('rev-parse','HEAD').decode().strip()=='7ce04192c84e1d01620b099a4a0386ab5b291fbc'
for n in allowed:
 target=w/n;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,target)
assert {n:v for n,v in inventory(w).items() if n!='.git'}==files
git('add','--',*sorted(allowed));git('commit','-m','Avoid repeated ledger decoding while retaining fresh authority checks')
commit=git('rev-parse','HEAD').decode().strip();assert not git('status','--porcelain=v1')
names=sorted(files);assert all('\n'not in n for n in names)
raw=git('cat-file','--batch',input=''.join(commit+':'+n+'\n' for n in names).encode());cursor=0
for n in names:
 end=raw.index(b'\n',cursor);header=raw[cursor:end].split();assert len(header)==3 and header[1]==b'blob';size=int(header[2]);start=end+1;end=start+size
 assert hashlib.sha256(raw[start:end]).hexdigest()==files[n],n
 assert raw[end:end+1]==b'\n';cursor=end+1
assert cursor==len(raw) and sha(r/'.git/index')==index_before and inventory(r)==files
receipt={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':'A16','status':'FROZEN_REVIEWED_LEDGER_MEMO_WITH_CLEAN_GIT_BYTES_NATIVE_PENDING_NOT_STAGE','identity':identity(files),'included_files':len(files),'materialized_root':str(out),'parent_source_identity':old['identity'],'changed_paths':sorted(allowed),'git_source_commit':commit,'git_worktree':str(w),'all_git_blobs_exact':True,'worktree_clean':True,'main_index_unchanged':True,'product_independent_review_path':str(review),'product_independent_review_sha256':sha(review),'Linux_native_PENDING':True,'full_stage_PASS':False,'files':files}
(r/'.artifacts/p05-pilot-bundle-source-freeze13.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in receipt.items() if k!='files'}))
