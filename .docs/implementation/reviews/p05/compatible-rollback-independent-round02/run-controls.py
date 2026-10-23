from pathlib import Path
from datetime import datetime,timezone
import subprocess,json
r=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';clone=Path('.artifacts/p05-compatible-rollback-independent-review02');commands=[]
for name in ['author-controls','author-factory-controls','author-source-controls','author-export-controls','independent-controls']:
 script=(r if name=='independent-controls' else clone)/(name+'.mjs')
 result=subprocess.run([node,str(script)],capture_output=True,text=True)
 (r/(name+'.stdout.txt')).write_text(result.stdout,encoding='utf-8');(r/(name+'.stderr.txt')).write_text(result.stderr,encoding='utf-8')
 commands.append({'at_utc':datetime.now(timezone.utc).isoformat(),'argv':[node,str(script)],'exit_code':result.returncode,'stdout':name+'.stdout.txt','stderr':name+'.stderr.txt'})
 (r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8')
 print(name,result.returncode,result.stdout.strip());assert result.returncode==0
