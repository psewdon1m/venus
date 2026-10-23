from pathlib import Path
import json,sys
sys.stdout.reconfigure(encoding='utf-8')
r=Path('.docs/implementation/evidence/p05/unified-method18-chromium-actual01/run')
for name in ['topic-browser-report.json','delivery-metadata.json','failure-details.json']:
 d=json.loads((r/name).read_text(encoding='utf-8'));print(name,[(k,type(v).__name__,len(v) if hasattr(v,'__len__') else v) for k,v in d.items()])
 if name=='topic-browser-report.json':
  for k in d:
   if any(s in k for s in ['failed','readiness','preparation','setup']):print(k,json.dumps(d[k][-3:] if isinstance(d[k],list) else d[k],ensure_ascii=False)[:17000])
 if name=='delivery-metadata.json':
  for k,v in d.items():
   if isinstance(v,list) and v:print('SAMPLE',k,str(v[0])[:1500])
