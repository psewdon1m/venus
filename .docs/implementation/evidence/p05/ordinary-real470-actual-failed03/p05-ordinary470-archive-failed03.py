import pathlib,sys,hashlib,json,shutil,datetime
r=pathlib.Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
src=r/'.artifacts/p05-ordinary-real470-probe03/runs/venus-pilot470-e138258d870f';out=r/'.docs/implementation/evidence/p05/ordinary-real470-actual-failed03';assert not out.exists();out.mkdir(parents=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for p in src.iterdir():
 assert p.is_file() and p.suffix in ['.json','.txt'];shutil.copyfile(p,out/p.name)
for name in ['probe.mjs','outer.mjs','DESCRIPTOR.json']:shutil.copyfile(r/'.artifacts/p05-ordinary-real470-probe03'/name,out/name)
for name in ['p05-ordinary-real470-root-ack03.json','p05-ordinary-real470-run03.txt','p05-ordinary-real470-run03-exit.txt','p05-ordinary470-archive-failed03.py']:shutil.copyfile(r/'.artifacts'/name,out/name)
freeze=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze01.json').read_text());actual=inventory(pathlib.Path(freeze['materialized_root']));assert actual==freeze['files']
(out/'SOURCE-AFTER.json').write_text(json.dumps({'source_identity':identity(actual),'files':len(actual),'equals_frozen_inputs':True,'not_clean_commit':True},indent=2)+'\n',encoding='utf-8')
(out/'REPORT.md').write_text('''# Ordinary real470 production-server attempt03

FAIL exit1, cleanup PASS. Exact historical A4 production image/source, normal production CMD, real470 pilot source, no synthetic game actors. Questions online N2 and N3 each completed20 rounds; N4 completed7 then GET self-actions returned500. Totals47 completed/47 finish receipts/971requests,3rooms created/3closed. Remaining profiles and two negative profiles NOT_RUN. This is not42-profile PASS or current A7 proof.

Underlying exception UNKNOWN. No failing actor/phase/request UUID or server error category was preserved before teardown. Code:null follows the probe allowlist omission and does not classify the exception. No assertion that group selection, pool exhaustion, deadlock or timeout caused it. Independent diagnosis920db524 identifies missing safe observability; add minimal safe category/correlation and one declared bounded N4 forensic attempt before another full run. Native consent/leases/rates and original test failures remain unchanged. API cookie/header client does not prove browser TLS. No raw bodies, cookies or secrets retained.
''',encoding='utf-8')
files=[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(out.rglob('*'))if p.is_file()];(out/'INDEX.json').write_text(json.dumps({'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'files':files},indent=2)+'\n',encoding='utf-8');print(json.dumps({'index':sha(out/'INDEX.json'),'files':len(files)}))
