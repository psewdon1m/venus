import pathlib,sys,json,shutil,datetime,hashlib
r=pathlib.Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
old=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze03.json').read_text());author=r/'.docs/implementation/reviews/p05/private-yesbut-condition-author-round01/source';owned={p.relative_to(author).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()for p in author.rglob('*')if p.is_file()};assert len(owned)==6,owned
for n,h in owned.items():assert hashlib.sha256((r/n).read_bytes()).hexdigest()==h,n
before=inventory(r);changed={n for n,h in before.items()if old['files'].get(n)!=h}|(set(old['files'])-set(before));assert changed==set(owned)|{'tools/archived_markdown.py','tools/test_archived_markdown.py'},changed
out=r/'.artifacts/p05-pilot-bundle-source04';assert not out.exists();out.mkdir()
for n,h in before.items():
 p=out/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p);assert hashlib.sha256(p.read_bytes()).hexdigest()==h
assert inventory(r)==before and inventory(out)==before
rec={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':'A7','status':'FROZEN_MATERIALIZED_DIRTY_CANDIDATE_NOT_STAGE_PASS','identity':identity(before),'included_files':len(before),'materialized_root':str(out),'parent_source_identity':old['identity'],'changed_paths':sorted(changed),'files':before,'full_stage_PASS':False}
(r/'.artifacts/p05-pilot-bundle-source-freeze04.json').write_text(json.dumps(rec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in rec.items()if k!='files'}))
