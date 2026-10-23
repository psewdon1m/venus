from pathlib import Path
from datetime import datetime,timezone
import subprocess,json
r=Path(__file__).parent;argv=['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe',str(r/'oracle-controls.mjs')];p=subprocess.run(argv,capture_output=True,text=True)
(r/'oracle.stdout.txt').write_text(p.stdout,encoding='utf-8');(r/'oracle.stderr.txt').write_text(p.stderr,encoding='utf-8');(r/'COMMAND.json').write_text(json.dumps({'at_utc':datetime.now(timezone.utc).isoformat(),'argv':argv,'exit_code':p.returncode},indent=2)+'\n',encoding='utf-8');print(p.returncode,p.stdout,p.stderr);assert p.returncode==0
