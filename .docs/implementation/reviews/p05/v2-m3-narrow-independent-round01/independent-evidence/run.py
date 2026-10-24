from pathlib import Path
from datetime import datetime,timezone
import subprocess,json,sys
sys.stdout.reconfigure(encoding='utf-8');w=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=[]
for name,script in [('author43-repeat','.artifacts/p05-m3-narrow-independent-runtime01/finite-controls.mjs'),('independent10','.artifacts/p05-m3-narrow-independent01/controls.mjs')]:
 q=subprocess.run([node,script],capture_output=True,timeout=60);(w/(name+'.stdout')).write_bytes(q.stdout);(w/(name+'.stderr')).write_bytes(q.stderr);row={'at_utc':datetime.now(timezone.utc).isoformat(),'argv':[node,script],'exit_code':q.returncode};rows.append(row);(w/'commands.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');print(json.dumps(row));print(q.stdout.decode('utf-8')[-1000:]);print(q.stderr.decode('utf-8')[-2000:]);assert q.returncode==0
