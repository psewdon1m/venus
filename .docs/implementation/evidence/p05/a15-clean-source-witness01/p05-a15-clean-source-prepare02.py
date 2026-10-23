from pathlib import Path
import datetime, hashlib, json, shutil, subprocess, sys
r=Path('C:/.projects/venus')
w=Path('C:/Users/pc/.codex/worktrees/p05-final-source/venus')
sys.path.insert(0,str(r/'tools'))
from stage_inventory import inventory, identity
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def clean_inventory():
 # Managed Git worktree metadata is a root .git FILE, never application source.
 return {n:v for n,v in inventory(w).items() if n!='.git'}
def git(*args,cwd=w):
 p=subprocess.run(['git',*args],cwd=cwd,capture_output=True,check=True)
 return p.stdout
out=r/'.artifacts/p05-a15-clean-source-prepare02'
assert not out.exists();out.mkdir()
index=r/'.git/index';index_before=sha(index)
freeze=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze12.json').read_text())
files=freeze['files'];assert inventory(r)==files
assert not git('status','--porcelain=v1')
assert git('rev-parse','HEAD').decode().strip()=='b5436cde02dd09aa049ce0103cab58d9642e8c70'
assert not git('branch','--show-current').strip()
assert not(set(clean_inventory())-set(files)), 'unexpected baseline source path: inspect before any deletion'
for name,digest in files.items():
 source=r/name;target=w/name
 assert sha(source)==digest
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
 assert sha(target)==digest
assert clean_inventory()==files and inventory(r)==files
git('checkout','-b','codex/p05-final-source-20261021')
paths=out/'paths.nul';paths.write_bytes(b''.join(n.encode()+b'\0'for n in sorted(files)))
git('add','--pathspec-from-file='+str(paths),'--pathspec-file-nul')
git('commit','-m','Implement P05 topic games and private interactions for local pilot')
commit=git('rev-parse','HEAD').decode().strip()
assert not git('status','--porcelain=v1')
for name,digest in files.items():
 assert hashlib.sha256(git('show',commit+':'+name)).hexdigest()==digest,name
assert clean_inventory()==files and inventory(r)==files
assert sha(index)==index_before
receipt={'status':'CLEAN_GIT_A15_SOURCE_BYTES_NOT_STAGE_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'worktree':str(w),'commit':commit,'branch':'codex/p05-final-source-20261021','source_identity':identity(files),'source_files':len(files),'excluded_worktree_metadata_only':['.git'],'all_git_blobs_exact':True,'worktree_clean':True,'main_index_unchanged':True,'main_source_unchanged':True,'remote_mutations':False,'full_stage_PASS':False}
(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt))
