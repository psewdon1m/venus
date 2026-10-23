from pathlib import Path
import subprocess,json,re
base=Path('.artifacts/p05-topic-restore-metadata06-review-round01');p=Path('.artifacts/p05-topic-restore');n='metadata06-controls.mjs'
s=(p/n).read_text(encoding='utf8');s=re.sub(r"(?m)^(import .*from )'\./",r"\1'../p05-topic-restore/",s).replace("writeFileSync(root+'/","writeFileSync('.artifacts/p05-topic-restore-metadata06-review-round01/")
(base/n).write_text(s,encoding='utf8');r=subprocess.run([r'C:\Temp\venus-p01-toolchain\node-v24.22.0-win-x64\node.exe',str(base/n)],capture_output=True,text=True,encoding='utf8');(base/'author-controls.txt').write_text(r.stdout+r.stderr,encoding='utf8');print(json.dumps({'exit':r.returncode}));assert r.returncode==0
