from pathlib import Path
from datetime import datetime,timezone
import json,subprocess
w=Path(__file__).parent;p=Path('.artifacts/p05-engine3-bundle-source01/.artifacts/p05-compatible-rollback-producer06');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=[]
red=(w/'view-controls06.mjs').read_text(encoding='utf-8').replace('p05-compatible-rollback-producer06/scenarios.mjs','p05-compatible-rollback-producer05/scenarios.mjs');(w/'old05-counterexample.mjs').write_text(red,encoding='utf-8')
def run(label,args,expected=0):
 q=subprocess.run([node,*args],capture_output=True,timeout=30);(w/(label+'.stdout')).write_bytes(q.stdout);(w/(label+'.stderr')).write_bytes(q.stderr);rows.append({'at_utc':datetime.now(timezone.utc).isoformat(),'label':label,'argv':[node,*args],'exit_code':q.returncode,'expected':expected});(w/'commands.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');assert q.returncode==expected;print(label,q.returncode)
run('old05-red',[str(w/'old05-counterexample.mjs')],1)
run('new06-green',[str(w/'view-controls06.mjs')])
run('syntax06',['--check',str(p/'scenarios.mjs')])
run('lint06',['node_modules/eslint/bin/eslint.js','--config',str(p/'author-eslint.config.mjs'),str(p/'scenarios.mjs'),str(w/'view-controls06.mjs')])
