from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,sys
sys.stdout.reconfigure(encoding='utf-8');w=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=[]
for label,args,expected in [('serializer',[str(w/'counterexample.mjs')],0),('old-postfinish-oracle-red',[str(w/'counterexample.mjs'),'--old-oracle'],1)]:
 q=subprocess.run([node,*args],capture_output=True,timeout=20);(w/(label+'.stdout')).write_bytes(q.stdout);(w/(label+'.stderr')).write_bytes(q.stderr);rows.append({'at_utc':datetime.now(timezone.utc).isoformat(),'label':label,'argv':[node,*args],'exit_code':q.returncode,'expected':expected});(w/'commands.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');assert q.returncode==expected;print(label,q.returncode)
