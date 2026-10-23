from pathlib import Path
import json,hashlib,subprocess,difflib,os
r=Path('C:/.projects/venus');w=r/'.artifacts/p05-layout20-query-author01';p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume19';c=p.with_name('p05-v2-layout-producer-resume20');node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe';read=lambda p:json.loads(p.read_text(encoding='utf8'));sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old={x.name:sha(x) for x in p.glob('*.mjs')};new={x.name:sha(x) for x in c.glob('*.mjs')};assert old.keys()==new.keys() and len(new)==27
changed=sorted(n for n in new if new[n]!=old[n]);assert changed==['browser.mjs','run.mjs','x11.mjs']
assert (c/'run.mjs').read_bytes()==(p/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume19',b'p05-v2-layout-producer-resume20')
a=(p/'x11.mjs').read_text();b=(c/'x11.mjs').read_text();inverse=b.replace("import {randomUUID,createHash} from 'node:crypto';\nimport {types} from 'node:util';","import {randomUUID} from 'node:crypto';").replace("import {display,xdo as rawXdo} from '../../tests/p05/display.mjs';","import {display,xdo} from '../../tests/p05/display.mjs';")
start=inverse.index('/** Fixed public child-command failure projection;');end=inverse.index('export async function launch(',start);inverse=inverse[:start]+inverse[end:]
move="await bounded(budget,'content-focus',()=>page.bringToFront());";assert b.count(move)==a.count(move)==1
inverse=inverse.replace(' '+move+'\n', '').replace(" assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;",' '+move+"assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;")
assert inverse==a,'X11_INVERSE_REQUIRED'
a=(p/'browser.mjs').read_text();b=(c/'browser.mjs').read_text();inverse=b.replace('resetNative,x11CommandFailure','resetNative')
start=inverse.index(' const recordX11Failure=');end=inverse.index('\n const screenshots=',start);inverse=inverse[:start]+inverse[end+1:];inverse=inverse.replace('recordX11Failure(e);','');assert inverse==a,'BROWSER_DIAGNOSTICS_ONLY_INVERSE_REQUIRED'
for name in ['measure.mjs','probe-policy.mjs','keyboard-replay.mjs','scene-driver.mjs','matrix.mjs','expected-cells.json','DESIGN.md','real-text-fixture.json','binding.json','runner-policy.mjs']:assert (p/name).read_bytes()==(c/name).read_bytes(),name
assert b.index('recordX11Failure(e);throw e;')<b.index('finally{if(native)') and b.count('recordX11Failure(e);')==2
cells=read(c/'expected-cells.json');assert cells['count']==len(cells['cells'])==459
binding=read(c/'binding.json');ack=read(c/'ROOT_RUN_ACK.json');freezePath=r/'.artifacts/p05-pilot-bundle-source-freeze14.json';f=read(freezePath);receiptPath=r/'.artifacts/p05-pilot-bundle-image-binding14/receipt.json';receipt=read(receiptPath)
assert binding['source_identity']==f['identity']==receipt['source_identity']=='93221ba482331e3916e56f2e1866b5c7743fa72ad29320f2819a7a6fd1a2951d';assert binding['included_files']==f['included_files']==1871
assert binding['image']==receipt['image']=='sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2';assert binding['root_build_receipt_sha256']==sha(receiptPath) and binding['source_snapshot_sha256']==sha(freezePath)
for name,h in f['files'].items():assert sha(c.parent.parent/name)==h,name
assert ack['root_run_ack'] is False and ack['independent_producer_review']=='PENDING' and ack['producer_runtime_digest'] is None
diagPath=r/'.docs/implementation/reviews/p05/a17-layout19-failure-diagnosis-independent-round01/INDEX.json';diag=read(diagPath);assert sha(diagPath)=='56eb613dcb25d2a7febce3299dfad9a2c37677f1ba8b4739c3505b5cab277f3d'
for name,pin in diag['files'].items():assert sha(diagPath.parent/name)==pin['sha256'],name
methodPath=r/'.docs/implementation/reviews/p05/layout19-foreground-readiness-independent-round01/INDEX.json';assert sha(methodPath)=='ac42561f296529a8af2faafecf2f9fb497c92c21ac95a7e101d288413975c26c'
actual=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05/venus-v2-layout-3a8f31389808';saved=read(actual/'layout-report.json');counts={s:sum(row['status']==s for row in saved['records']) for s in ['PASS','FAIL','NOT_RUN']};assert counts=={'PASS':27,'FAIL':1,'NOT_RUN':23} and saved['cleanup']=='PASS'
commands=[]
for i,path in enumerate([c/'x11.mjs',c/'browser.mjs',c/'run.mjs',w/'controls.mjs']):
 result=subprocess.run([node,'--check',str(path)],capture_output=True,timeout=15);assert result.returncode==0;commands.append({'syntax':path.name,'exit':result.returncode})
before=sorted(x.name for x in (c.parent.parent/'.artifacts/p05').glob('venus-v2-layout-*'));result=subprocess.run([node,str(c/'run.mjs')],cwd=c.parent.parent,env={**os.environ,'PYTHON':str(r/'.venv/Scripts/python.exe')},capture_output=True,timeout=30);(w/'pending-ack.stdout.txt').write_bytes(result.stdout);(w/'pending-ack.stderr.txt').write_bytes(result.stderr);assert result.returncode==1 and b'ROOT_RUN_ACK_REQUIRED' in result.stderr;assert before==sorted(x.name for x in (c.parent.parent/'.artifacts/p05').glob('venus-v2-layout-*'))
(w/'x11.diff').write_text(''.join(difflib.unified_diff((p/'x11.mjs').read_text().splitlines(True),(c/'x11.mjs').read_text().splitlines(True),fromfile='layout19/x11.mjs',tofile='layout20/x11.mjs')))
(w/'browser.diff').write_text(''.join(difflib.unified_diff((p/'browser.mjs').read_text().splitlines(True),(c/'browser.mjs').read_text().splitlines(True),fromfile='layout19/browser.mjs',tofile='layout20/browser.mjs')))
pins={}
for x in [p/'INDEX.json',methodPath,diagPath,actual/'layout-report.json',freezePath,receiptPath,c/'binding.json',c/'ROOT_RUN_ACK.json']:
 pins[x.relative_to(r).as_posix()]={'bytes':x.stat().st_size,'sha256':sha(x)}
result={'status':'PASS_AUTHOR_TARGETED_COLD_NOT_NATIVE','MJS_total':27,'raw_MJS_unchanged':24,'changed':changed,'run_literal_only':True,'x11_normalized_inverse_except_diagnostics_and_same_single_bringToFront_move':True,'browser_normalized_inverse_except_once_safe_diagnostic_recording':True,'all19_foreground_freshscope_positivepreparation_final_strict_asserts_459_unchanged':True,'source_files_checked':1871,'original_actual19_counts':counts,'actual19_query_code_signal_stderr_resource_cause':'UNKNOWN_NO_REMEDY_CLAIM','cold_controls':6,'syntax':commands,'lint_exit':0,'pending_ack_exit':1,'no_output_allocated':True,'native_runs':0,'APP_edits':0,'optional_resource_snapshot':'OMITTED_NO_TIMERS_OR_EXTRA_RESOURCE_READS'}
(w/'CHECKS.json').write_text(json.dumps(result,indent=2)+'\n');(w/'INPUT_PINS.json').write_text(json.dumps(pins,indent=2)+'\n');print(json.dumps(result))
