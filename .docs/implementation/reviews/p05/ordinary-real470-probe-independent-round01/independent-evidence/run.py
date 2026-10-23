from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,sys
sys.stdout.reconfigure(encoding='utf-8')
w=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=json.loads((w/'commands.json').read_text())
for name,args in [('independent07',[str(w/'controls.mjs')])]:
 q=subprocess.run([node,*args],capture_output=True,timeout=30);(w/(name+'.stdout')).write_bytes(q.stdout);(w/(name+'.stderr')).write_bytes(q.stderr);rows.append({'at_utc':datetime.now(timezone.utc).isoformat(),'argv':[node,*args],'exit_code':q.returncode});(w/'commands.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');assert q.returncode==0;print(name,q.returncode,q.stdout.decode('utf-8')[-500:])
