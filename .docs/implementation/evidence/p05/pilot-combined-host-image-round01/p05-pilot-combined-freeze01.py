from pathlib import Path
import sys,json,hashlib,shutil,datetime
sys.path.insert(0,'tools')
from stage_inventory import inventory,identity
r=Path.cwd();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
idx=r/'.docs/adr/current-index.json';d=json.loads(idx.read_text(encoding='utf-8'));assert all(x['id']!='ADR-029'for x in d['active_scope']);d['active_scope'].append({'id':'ADR-029','path':'.docs/adr/ADR-029-owner-provisional-local-pilot-catalog.md','status':'IMPLEMENTED_FOCUSED_PASS_INDEPENDENT_AND_ACTUAL_PENDING','authority':'.docs/implementation/user-decisions.v4.json','decision_id':'U-019'});idx.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
pilot=json.loads((r/'.docs/implementation/reviews/p05/owner-provisional-pilot-author-round01/SOURCE-CHANGES.json').read_text(encoding='utf-8'))['files']
for row in pilot:assert sha(r/row['path'])==row['after_sha256']
assert sha(r/'apps/api/src/topic-games.ts')=='ecf754ad8e6f8a5ef36f79147fc095c59759f3ea33904623027533f86094ca12'
full=inventory();a=r/'.artifacts/p05-pilot-bundle-source01';assert not a.exists();a.mkdir()
for n,h in full.items():
 p=a/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p);assert sha(p)==h
assert inventory()==full and inventory(a)==full
old=json.loads((r/'.artifacts/p05-engine3-prebundle-source-freeze01.json').read_text(encoding='utf-8'));base=r/'.artifacts/p05-engine3-prebundle-source01';b=r/'.artifacts/p05-pilot-prebundle-source01';assert not b.exists();b.mkdir()
for n,h in old['files'].items():
 assert sha(base/n)==h;p=b/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(base/n,p)
overlays=[row['path']for row in pilot]+['.docs/adr/ADR-029-owner-provisional-local-pilot-catalog.md','.docs/implementation/p05-source-revision-owner-provisional-pilot-01.json','.docs/adr/current-index.json']
for n in overlays:
 p=b/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p)
bfiles=inventory(b)
for n,h in bfiles.items():assert h==(sha(r/n)if n in overlays else old['files'][n])
assert (b/'apps/api/src/topic-games.ts').read_bytes()==(base/'apps/api/src/topic-games.ts').read_bytes()
assert not(b/'apps/web/src/topic-round-view.ts').exists()
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for label,path,files,parent,extra in [('A4',a,full,'f4270f88bc84753f2fbdb3871311f039843add50a5ffe4832991c25d5b34f20d',{'combination':'Live coordinated all-writers-stopped snapshot: correctedTD bundle plus ownerprovisionalpilot'}),('B4',b,bfiles,old['identity'],{'combination':'Explicit genuineB3 plus exact11pilot source files and3normative docs/index, no bundle; not historical GA','overlay_paths':overlays})]:
 rec={'created_at':now,'label':label,'status':'FROZEN_MATERIALIZED_DIRTY_CANDIDATE_NOT_STAGE_PASS','identity':identity(files),'included_files':len(files),'materialized_root':str(path),'parent_source_identity':parent,'files':files,**extra,'full_stage_PASS':False};out=r/('.artifacts/p05-pilot-'+('bundle'if label=='A4'else'prebundle')+'-source-freeze01.json');out.write_text(json.dumps(rec,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n');print(json.dumps({k:v for k,v in rec.items()if k!='files'}))
