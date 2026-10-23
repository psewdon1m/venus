from pathlib import Path
import subprocess,json
r=Path.cwd();d=r/'.artifacts/p05-a14-ui-wire-native-bindings01';b=json.loads((d/'BINDINGS.json').read_bytes());node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
files=[b['browser']['runner'],str(Path(b['layout']['producer'])/'run.mjs'),str(Path(b['layout']['producer'])/'runner-policy.mjs'),str(Path(b['wire']['producer'])/'runner.mjs')];rows=[]
for i,p in enumerate(files):
 cmd=[node,'--check',p];v=subprocess.run(cmd,cwd=r,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(d/f'syntax01-{i}.txt').write_bytes(v.stdout);rows.append({'argv':cmd,'exit':v.returncode,'output':f'syntax01-{i}.txt'});assert v.returncode==0
cmd=[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',*files];v=subprocess.run(cmd,cwd=r,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);(d/'lint01.txt').write_bytes(v.stdout);rows.append({'argv':cmd,'exit':v.returncode,'output':'lint01.txt'});assert v.returncode==0
(d/'commands01.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');print(json.dumps({'status':'SYNTAX4_LINT1_EXIT0','commands':len(rows)}))
