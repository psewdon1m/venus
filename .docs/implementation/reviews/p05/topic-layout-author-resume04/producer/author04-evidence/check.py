from pathlib import Path
from datetime import datetime,timezone
import subprocess,json
w=Path(__file__).parent;p=Path('.artifacts/p05-v2-layout-producer-resume04');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args):
 q=subprocess.run([node,*args],capture_output=True,timeout=40);(w/(name+'.stdout')).write_bytes(q.stdout);(w/(name+'.stderr')).write_bytes(q.stderr);commands.append({'at_utc':datetime.now(timezone.utc).isoformat(),'name':name,'argv':[node,*args],'exit_code':q.returncode});(w/'commands.json').write_text(json.dumps(commands,indent=2)+'\n',encoding='utf-8');assert q.returncode==0;print(name,q.returncode)
run('finite04',[str(p/'author-controls04.mjs')])
changed=['real-text-probe.mjs','author-controls04.mjs','browser.mjs','runner-policy.mjs','build-driver.mjs','scene-driver.mjs','run.mjs'];run('lint04',['node_modules/eslint/bin/eslint.js','--config',str(p/'eslint.config.mjs'),*[str(p/n)for n in changed]])
for n in changed:run('syntax-'+n,['--check',str(p/n)])
(w/'lint-attempt01.json').write_text(json.dumps({'exit_code':1,'rule':'no-unsafe-finally','file':'real-text-probe.mjs','line':42,'cause':'ThrowStatement in cleanup finally','preserved_beforebytes':'real-text-probe-before-lint-fix.mjs.bytes','correction':'Latch primary/secondary through finally, throw primary after cleanup'},indent=2)+'\n',encoding='utf-8')
