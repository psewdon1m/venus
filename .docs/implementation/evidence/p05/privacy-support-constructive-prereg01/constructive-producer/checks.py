from pathlib import Path
import json,subprocess,hashlib
r=Path('C:/.projects/venus');w=r/'.artifacts/p05-privacy-support-constructive01';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,expected=0):
 name='round02-'+name
 x=subprocess.run(args,cwd=r,capture_output=True,timeout=30);(w/(name+'.stdout.txt')).write_bytes(x.stdout);(w/(name+'.stderr.txt')).write_bytes(x.stderr);commands.append({'name':name,'argv':args,'exit_code':x.returncode});assert x.returncode==expected,(name,x.returncode);return x
run('finite-final',[node,str(w/'controls.mjs')])
targets=[w/n for n in ['consumer.mjs','matched-model.mjs','matched-worker.mjs','host.mjs','controls.mjs']]
for i,t in enumerate(targets):run('syntax-'+str(i),[node,'--check',str(t)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',*[str(t)for t in targets]])
run('falseACK-host',[node,str(w/'host.mjs'),str(w/'ROOT-ACK.template.json'),str(r/'.docs/implementation/reviews/p05/privacy-matched-support-design-independent-round01/INDEX.json')],1)
assert b'ROOT_RUN_ACK'in(w/'round02-falseACK-host.stderr.txt').read_bytes();assert not(r/'.artifacts/p05-privacy-support-constructive-runs01').exists()
print('SIX_COLD_GROUPS_SYNTAX5_LINT0_FALSE_ACK1_NO_NATIVE_OR_REPLAY');(w/'CHECKS.json').write_text(json.dumps({'status':'AUTHOR_COLD_PASS_NOT_NATIVE_OR_REPLAY','cold_groups':6,'syntax':5,'lint_exit':0,'falseACK_host_exit':1,'native_models':0,'APP_writes':0,'Docker_commands':0,'commands':commands},indent=2)+'\n')
