from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil,difflib
r=Path(__file__).parent;work=Path('.artifacts/p05-round-view-author01');baseline=Path('.artifacts/p05-engine3-prebundle-source01');at=datetime.now(timezone.utc).isoformat();sha=lambda b:hashlib.sha256(b).hexdigest()
paths=['apps/api/src/topic-games.ts','apps/api/src/topic-game-routes.ts','apps/api/src/topic-round-view.test.ts','apps/api/src/topic-round-view-route.test.ts','apps/web/src/topic-games-panel.tsx','apps/web/src/topic-round-view.ts','apps/web/src/topic-round-view.test.ts','apps/web/src/topic-test-harness.ts','apps/web/src/topic-panel.test.ts','packages/contracts/src/topic-games.ts','.docs/implementation/p05-source-revision-round-view-01.json']
owned=[];patch=''
for name in paths:
 b=Path(name).read_bytes();dest=r/'source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b);before=baseline/name;old=before.read_bytes()if before.exists()else b''
 if before.exists():out=r/'before'/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(old)
 assert b!=old
 owned.append({'path':name,'bytes':len(b),'sha256':sha(b),'before_sha256':sha(old)if old else None})
 patch+=''.join(difflib.unified_diff(old.decode('utf-8-sig').splitlines(True),b.decode('utf-8-sig').splitlines(True),fromfile='B3/'+name,tofile='bundle/'+name))
(r/'owned-source-pins.json').write_text(json.dumps(owned,indent=2)+'\n',encoding='utf-8');(r/'changes.patch').write_text(patch,encoding='utf-8')
for p in work.iterdir():
 if p.is_file():shutil.copyfile(p,r/p.name)
assert sha(Path('apps/web/src/topic-round-view.ts').read_bytes())=='c557c1b777a9d23f747982dc3ff216815508f809ef0d981d30896abae72df564'
h={'at_utc':at,'status':'AUTHOR_READY_FOR_NONAUTHOR_REVIEW_ACTUAL_PENDING','writes':'COMPLETE','owned_source_files':11,'global_source_frozen':False,'image_built':False,'actual_RUN':False,'baseline_source':'ed18d3cb16cac4e244d2f2d58602c41cd8485b0bddf9beef7fe9ae1fa64a0026','baseline_files':1830,'host_regression':{'files':26,'PASS':370,'platform_SKIP':163,'exit':0},'lint_exit':0,'typecheck_exit':0,'web_typecheck_exit':0,'validator_sha256':'c557c1b777a9d23f747982dc3ff216815508f809ef0d981d30896abae72df564','root_engine3_authorship':'SEPARATE_NOT_ACCEPTED_HERE','full_stage_PASS':False}
(r/'HANDOFF.json').write_text(json.dumps(h,indent=2)+'\n',encoding='utf-8');files=[]
for p in sorted(r.rglob('*')):
 if p.is_file() and p.name!='INDEX.json':
  b=p.read_bytes();files.append({'path':p.relative_to(r).as_posix(),'bytes':len(b),'sha256':sha(b)})
(r/'INDEX.json').write_text(json.dumps({'at_utc':at,'status':h['status'],'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index_sha256':sha((r/'INDEX.json').read_bytes()),'files':len(files),'writes':'COMPLETE'}))
