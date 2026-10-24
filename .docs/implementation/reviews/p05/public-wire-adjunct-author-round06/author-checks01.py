from pathlib import Path
import subprocess,json,datetime
r=Path.cwd();d=r/'.artifacts/p05-wire06-author01';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';p=r/'.artifacts/p05-public-wire-adjunct06';rows=[]
commands=[([node,'--check',str(p/'integration.mjs')],'syntax-integration.txt',0),([node,'--check',str(d/'controls.mjs')],'syntax-controls.txt',0),([node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(p/'integration.mjs'),str(d/'controls.mjs')],'lint01.txt',0),([node,str(p/'runner.mjs')],'pending-ACK-denied.txt',1)]
for argv,name,expected in commands:
 v=subprocess.run(argv,cwd=r/'.artifacts/p05-pilot-bundle-source12',env={**__import__('os').environ,'PYTHON':str(r/'.venv/Scripts/python.exe')},stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(d/name).write_bytes(v.stdout);rows.append({'argv':argv,'cwd':str(r/'.artifacts/p05-pilot-bundle-source12'),'native_exit':v.returncode,'expected_exit':expected,'output':name});assert v.returncode==expected,(name,v.stdout)
assert b'ROOT_RUN_ACK' in (d/'pending-ACK-denied.txt').read_bytes()
(d/'commands01.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
with (r/'.history/agents/2026-10-21-p05-wire06-fresh-dispatch-author.md').open('a',encoding='utf-8') as f:f.write('\n'+datetime.datetime.now(datetime.timezone.utc).isoformat()+' UTC — Coldfiniteattempt01/02 FAILED because testdouble missing h.round (method reachedunchangedfinal503 assertion); failedshellquoteedit also rejected byPowerShell beforewrite, preservedattemptbytes/output. Addedonly missingtestdouble round function, method unchanged. controls03 10PASS/native0 incl oldselectorRED/newsetupGREEN/no-private/counter/positive/reconnecterror negatives.2syntax/lint0;freshpendingACKactualNodeexit1 beforeallocation. Awaitcostfrozenactualdiagnosis forauthorfreeze.\n')
print(json.dumps({'checks':'2syntax_lint0_pendingACK1','commands':len(rows)}))
