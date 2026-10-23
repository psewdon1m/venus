from pathlib import Path
import subprocess,json
base=Path('.artifacts/p05-topic-browser-topic08-review-round01');p=Path('.artifacts/p05-topic-browser/corrected-static-08-final/author-checks');rows=[]
for n in ['topic-ack08-controls.mjs','delivery-controls.mjs','metadata-corrections.mjs']:
 s=(p/n).read_text(encoding='utf8').replace("from '../","from '../p05-topic-browser/").replace("writeFileSync(root+'/author-checks/","writeFileSync('.artifacts/p05-topic-browser-topic08-review-round01/").replace("writeFileSync(dir+'/author-checks/","writeFileSync('.artifacts/p05-topic-browser-topic08-review-round01/")
 (base/n).write_text(s,encoding='utf8');r=subprocess.run([r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe',str(base/n)],capture_output=True,text=True,encoding='utf8');(base/(n+'.txt')).write_text(r.stdout+r.stderr,encoding='utf8');rows.append({'script':n,'exit':r.returncode})
(base/'rerun-results.json').write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(rows));assert all(r['exit']==0 for r in rows)
