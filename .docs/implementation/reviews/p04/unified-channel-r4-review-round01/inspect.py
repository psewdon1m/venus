from pathlib import Path
import json,sqlite3
r=Path('.docs/implementation/evidence/p04/review470-r4')
for f in ['input-pins.json','current-input-freeze.json','checks/draft-check-round01/analysis.json']:
 d=json.loads((r/f).read_text(encoding='utf-8'));print(f,[(k,type(v).__name__,len(v) if hasattr(v,'__len__') else v) for k,v in d.items()])
db=sqlite3.connect((r/'authoring/candidate.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
print(db.execute("SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name").fetchall())
print(db.execute('SELECT seq,kind,body FROM events WHERE seq>185 ORDER BY seq LIMIT 2').fetchall())
db.close()
