from pathlib import Path
from datetime import datetime,timezone
import json,subprocess,hashlib,shutil
w=Path(__file__).parent;base=Path('.artifacts/p05-pilot-bundle-source01').resolve();p=base/'.artifacts/p05-compatible-rollback-producer07';node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';rows=[];sha=lambda b:hashlib.sha256(b).hexdigest()
for name,prefix in [('owner-provisional-pilot-independent-round01','0f702d92'),('compatible-rollback-independent-repeat06','948f51f1')]:
 source=Path('.docs/implementation/reviews/p05')/name;assert sha((source/'INDEX.json').read_bytes()).startswith(prefix);target=base/'.docs/implementation/reviews/p05'/name
 for f in source.rglob('*'):
  if f.is_file():
   dest=target/f.relative_to(source);dest.parent.mkdir(parents=True,exist_ok=True)
   if dest.exists():assert dest.read_bytes()==f.read_bytes()
   else:shutil.copyfile(f,dest)
def run(name,args,expected=0):
 q=subprocess.run([node,*args],cwd=base,capture_output=True,timeout=30);(w/(name+'.stdout')).write_bytes(q.stdout);(w/(name+'.stderr')).write_bytes(q.stderr);rows.append({'at_utc':datetime.now(timezone.utc).isoformat(),'name':name,'argv':[node,*args],'cwd':str(base),'exit_code':q.returncode,'expected':expected});(w/'commands.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8');assert q.returncode==expected;print(name,q.returncode)
run('binding09',[str(p/'author-rebind-controls.mjs')]);run('describe07',[str(p/'driver.mjs'),'--describe']);ack=w.resolve()/'unissued-ACK.json';ack.write_bytes((p/'ROOT_RUN_ACK_TEMPLATE.json').read_bytes());run('unauthorized07',['--max-old-space-size=192',str(p/'driver.mjs'),'--run','--ack='+str(ack)],1)
uri=(p/'source-proof.mjs').as_uri();script='const m=await import('+json.dumps(uri)+');const r=await m.verifyIncluded();console.log(JSON.stringify({identity:r.identity,files:Object.keys(r.files).length}));';run('source1842',['--input-type=module','-e',script]);run('binding-syntax',['--check',str(p/'author-rebind-controls.mjs')]);run('binding-lint',[str(Path('node_modules/eslint/bin/eslint.js').resolve()),'--config',str(p/'author-eslint.config.mjs'),str(p/'author-rebind-controls.mjs')])
