from pathlib import Path
from datetime import datetime,timezone
import subprocess,json
r=Path(__file__).parent;node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
for suffix in ['stdout.txt','stderr.txt']:(r/('independent-controls-attempt01.'+suffix)).write_bytes((r/('independent-controls.'+suffix)).read_bytes())
result=subprocess.run([node,str(r/'independent-controls.mjs')],capture_output=True,text=True)
(r/'independent-controls.stdout.txt').write_text(result.stdout,encoding='utf-8');(r/'independent-controls.stderr.txt').write_text(result.stderr,encoding='utf-8')
commands=json.loads((r/'COMMANDS.json').read_text(encoding='utf-8'));commands[-1]['stdout']='independent-controls-attempt01.stdout.txt';commands[-1]['stderr']='independent-controls-attempt01.stderr.txt';commands.append({'at_utc':datetime.now(timezone.utc).isoformat(),'argv':[node,str(r/'independent-controls.mjs')],'exit_code':result.returncode,'stdout':'independent-controls.stdout.txt','stderr':'independent-controls.stderr.txt','fixture_correction':'ETIMEDOUT is in existing safeError allowlist; EIO is intentionally sanitized to null'})
(r/'COMMANDS.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8');print(result.returncode,result.stdout,result.stderr);assert result.returncode==0
