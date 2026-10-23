from pathlib import Path
import subprocess,json,hashlib
r=Path('C:/.projects/venus');s=r/'.artifacts/p05-pilot-bundle-source14';p=s/'.artifacts/p05-v2-layout-producer-resume18';c=p.with_name('p05-v2-layout-producer-resume19');w=r/'.artifacts/p05-layout19-author01';w.mkdir();node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';commands=[]
def run(name,args,cwd=r,expected=0):
 result=subprocess.run(args,cwd=cwd,capture_output=True,timeout=30);(w/(name+'.stdout.txt')).write_bytes(result.stdout);(w/(name+'.stderr.txt')).write_bytes(result.stderr);commands.append({'name':name,'argv':args,'cwd':str(cwd),'exit_code':result.returncode});assert result.returncode==expected,(name,result.returncode);return result
run('finite',[node,str(r/'.artifacts/p05-layout19-controls.mjs')])
for name,path in [('measure',c/'measure.mjs'),('browser',c/'browser.mjs'),('run',c/'run.mjs'),('controls',r/'.artifacts/p05-layout19-controls.mjs')]:run('syntax-'+name,[node,'--check',str(path)])
run('lint',[node,str(r/'node_modules/eslint/bin/eslint.js'),'--config',str(r/'eslint.config.mjs'),'--no-ignore',str(c/'measure.mjs'),str(c/'browser.mjs'),str(c/'run.mjs'),str(r/'.artifacts/p05-layout19-controls.mjs')])
result=run('pendingACK-early-refusal',[node,str(c/'run.mjs')],s,1);assert b'ROOT_RUN_ACK_REQUIRED'in result.stderr
sha=lambda b:hashlib.sha256(b).hexdigest();binding=json.loads((c/'binding.json').read_bytes());assert(c/'binding.json').read_bytes()==(p/'binding.json').read_bytes();assert json.loads((c/'ROOT_RUN_ACK.json').read_bytes())['root_run_ack']is False
frozen=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze14.json').read_bytes());assert frozen['identity']==binding['source_identity']and frozen['included_files']==1871
import sys
sys.path.insert(0,str(s/'tools'));from stage_inventory import inventory,identity
actual=inventory(s);assert identity(actual)==binding['source_identity']and len(actual)==1871
(w/'CHECKS.json').write_text(json.dumps({'status':'AUTHOR_COLD_PASS_PENDING_INDEPENDENT_NO_NATIVE','finite':5,'syntax':4,'lint_exit':0,'pendingACK_exit':1,'pendingACK_reason':'ROOT_RUN_ACK_REQUIRED_BEFORE_NATIVE','source_identity':identity(actual),'source_count':len(actual),'runtime_MJS':27,'other24_MJS':'BYTE_EXACT18','changed_MJS':['measure.mjs foreground/read-only positive preparation','browser.mjs enum phase checkpoint','run.mjs dirname literal only'],'APP_changes':False,'native':False,'root_run_ack':False,'commands':commands},indent=2)+'\n');print(json.dumps({'status':'PASS_AUTHOR_COLD_ONLY','finite':5,'syntax':4,'lint_exit':0,'pendingACK_exit':1,'source1871_exact':True}))
