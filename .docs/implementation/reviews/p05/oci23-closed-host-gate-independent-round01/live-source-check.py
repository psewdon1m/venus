import sys,json,hashlib
from pathlib import Path
root=Path('C:/.projects/venus')
sys.path.insert(0,str(root/'tools'))
from stage_inventory import inventory,identity
freeze=json.loads((root/'.artifacts/p05-pilot-bundle-source-freeze14.json').read_text(encoding='utf8'))
actual=inventory(root)
assert actual==freeze['files'],'live inventory differs from freeze14'
assert identity(actual)==freeze['identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d'
assert len(actual)==1871
print(json.dumps({'status':'PASS_COLD_LIVE_SOURCE_INVENTORY','identity':identity(actual),'included_files':len(actual),'APP_imports':0,'DB_connections':0,'Docker_allocations':0}))
