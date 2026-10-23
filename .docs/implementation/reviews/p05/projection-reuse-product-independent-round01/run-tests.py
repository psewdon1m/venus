from pathlib import Path
from datetime import datetime,timezone
import subprocess,json
r=Path(__file__).parent;argv=['C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe','node_modules/vitest/vitest.mjs','run','--config','.artifacts/p05-projection-reuse-independent01/vitest.config.mts']
result=subprocess.run(argv,capture_output=True,text=True,encoding='utf-8');(r/'vitest.stdout.txt').write_text(result.stdout,encoding='utf-8');(r/'vitest.stderr.txt').write_text(result.stderr,encoding='utf-8');(r/'COMMAND.json').write_text(json.dumps({'at_utc':datetime.now(timezone.utc).isoformat(),'argv':argv,'exit_code':result.returncode},indent=2)+'\n',encoding='utf-8');print(result.returncode);print(result.stdout);print(result.stderr);assert result.returncode==0
