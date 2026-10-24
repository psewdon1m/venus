from pathlib import Path
import subprocess,json,hashlib,sys
root=Path('C:/.projects/venus');work=root/'.artifacts/p05-ui-control-contrast-author01';sys.path.insert(0,str(root/'tools'))
from stage_inventory import inventory,identity
before=inventory();baseline=json.loads((root/'.artifacts/p05-pilot-bundle-source-freeze13.json').read_text())['files']
added=sorted(set(before)-set(baseline));removed=sorted(set(baseline)-set(before));changed=sorted(n for n in before.keys()&baseline.keys() if before[n]!=baseline[n])
assert added==['.docs/implementation/p05-source-revision-ui-control-contrast-01.json'] and changed==['apps/web/src/style.css'] and not removed,(added,changed,removed)
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';args=[node,str(root/'node_modules/vite/bin/vite.js'),'build']
p=subprocess.run(args,cwd=root/'apps/web',capture_output=True,timeout=60);(work/'build01.stdout.txt').write_bytes(p.stdout);(work/'build01.stderr.txt').write_bytes(p.stderr);assert p.returncode==0,p.returncode
after=inventory();assert before==after
sha=lambda b:hashlib.sha256(b).hexdigest()
assets={str(p.relative_to(root/'apps/web/dist')).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':sha(p.read_bytes())} for p in sorted((root/'apps/web/dist').rglob('*')) if p.is_file()}
old=json.loads((root/'.artifacts/p05-pilot-bundle-image-binding13/receipt.json').read_text())['web_dist_files'];newJS={n:pin['sha256'] for n,pin in assets.items() if n.endswith('.js')};oldJS={n.removeprefix('apps/web/dist/'):h for n,h in old.items() if n.endswith('.js')};assert newJS==oldJS,(newJS,oldJS)
result={'status':'AUTHOR_SOURCE_BUILD_PASS_NOT_NATIVE_AUDIT','command':args,'cwd':str(root/'apps/web'),'build_exit':p.returncode,'source_identity_before_and_after_build':identity(after),'included_files':len(after),'source_delta_from_A16':{'added':added,'changed':changed,'removed':removed},'full_source_map':after,'compiled_web_assets':assets,'compiled_JS_exact_A16':True,'CSS_and_HTML_changed':'EXPECTED_NEW_STYLESHEET_AND_REFERENCE','native_after_fix':'NOT_RUN','full_stage_PASS':False}
(work/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k not in ['full_source_map','compiled_web_assets']}))
