from pathlib import Path
import shutil,json,hashlib,datetime
r=Path.cwd();src=r/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-topic-browser-e4e2faa7ae10';out=r/'.docs/implementation/evidence/p05/recovery-method16-chromium-actual01';assert not out.exists();out.mkdir(parents=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mapping=[];files=[p for p in src.rglob('*') if p.is_file()];assert sum(p.stat().st_size for p in files)<128*1024**2
for p in files:
 n=p.relative_to(src).as_posix();dest=out/'run'/(n+'.bytes' if p.suffix=='.md' else n);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);mapping.append({'original':n,'archived':dest.relative_to(out).as_posix(),'sha256':sha(p)})
for n in ['p05-recovery-method16-chromium-run01.txt','p05-recovery-method16-chromium-run01-exit.txt','p05-recovery-method16-binding-draft01.json','p05-recovery-image-a-receipt01.json','p05-recovery-browser16-archive01.py']:shutil.copyfile(r/'.artifacts'/n,out/n)
ack=r/'.artifacts/p05-recovery-source1274-01/.artifacts/p05-recovery-method16-root-ack01.json';shutil.copyfile(ack,out/ack.name)
runner=json.loads((src/'runner.json').read_text(encoding='utf-8'));assert runner['status']=='FAIL' and runner['cleanup']=='PASS'
(out/'raw-path-map.json').write_text(json.dumps(mapping,indent=2)+'\n',encoding='utf-8',newline='\n')
(out/'REPORT.md').write_text('# METHOD16 Chromium actual: FAIL\n\n5PASS/06FAIL/10NOT_RUN, cleanupPASS, exact historical1274/A29e39/source+producer unchanged. Case05 bilateral consent completes after method16 preparation correction. Case06 advice-accept TR stops before any POST: METHOD12_PRIVATE_BATCH_CHANGED_BEFORE_CLICK. Prepared cycle28/lease1789.976ms; observer model changed before the final ticket check. This is not an inferred product defect or prior409 cause. Independent timing/source diagnosis is pending; no stale/cycle/auth/TTL check may be dropped or UI mutation blindly retried. No fullbrowser/layout/P05 PASS. Raw Markdown inputs retain exact bytes under .md.bytes names.\n',encoding='utf-8',newline='\n')
entries=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]
(out/'INDEX.json').write_text(json.dumps({'status':'FAIL_5PASS_06FAIL_10NOT_RUN_CLEANUP_PASS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':entries},indent=2)+'\n',encoding='utf-8',newline='\n');print(json.dumps({'index_sha256':sha(out/'INDEX.json'),'files':len(entries)}))
