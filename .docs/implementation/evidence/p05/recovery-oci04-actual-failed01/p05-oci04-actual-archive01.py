from pathlib import Path
import json,hashlib,shutil,datetime
r=Path.cwd();src=r/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/venus-p05-oci-ffaaeef4fe2b';out=r/'.docs/implementation/evidence/p05/recovery-oci04-actual-failed01';assert not out.exists();out.mkdir(parents=True);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def inventory():
 rows=[]
 for p in sorted(src.rglob('*')):
  assert not p.is_symlink()
  if p.is_file():rows.append({'path':p.relative_to(src).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)})
 return rows
before=inventory();assert sum(v['bytes'] for v in before)<160*1024**2
for row in before:
 p=src/row['path'];d=out/'run'/(row['path']+'.bytes' if p.suffix=='.md' else row['path']);d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,d);assert sha(d)==row['sha256']
assert inventory()==before
for n in ['p05-recovery-oci04-run01.txt','p05-recovery-oci04-run01-exit.txt','p05-recovery-oci04-root-ack01.json','p05-recovery-oci04-activation-witness01.json','p05-oci04-actual-archive01.py']:shutil.copyfile(r/'.artifacts'/n,out/n)
diagnosis=r/'.docs/implementation/reviews/p05/oci04-actual-diagnosis-round01/INDEX.json';assert sha(diagnosis)=='f112e7787d6356c0857ad735cc956ddf85f532504c506f06972ec60fdfd0e8a2'
def write(n,v):(out/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8',newline='\n')
write('original-host-map.json',before)
write('RECORD.json',{'status':'ACTUAL_FAIL_PRESERVED_NOT_ACCEPTED','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_scope':'RESTORED_HISTORICAL1274_1813_NOT_CURRENT_LIVE_STAGE','exit_code':int((r/'.artifacts/p05-recovery-oci04-run01-exit.txt').read_text()),'source_host_files':len(before),'source_host_logical_bytes':sum(v['bytes'] for v in before),'source_unchanged_during_copy':True,'markdown_copy_suffix':'.md.bytes','runner_json':'ABSENT_NOT_SYNTHESIZED','diagnosis_index_sha256':sha(diagnosis),'native_state':'READONLY_KEEPER_RETAINED_UNTIL_SEPARATE_OWNED_CLEANUP','private_database_keyring_or_password_exported':False,'full14controls_PASS':False,'full_P05_PASS':False})
(out/'REPORT.md').write_text('# OCI04 actual failure preserved\n\nThe actual driver passed its former ESM startup cycle, then failed during A1. Exit1, phase terminal ERR_MODULE_NOT_FOUND; original error message was truncated. Independent inert import reproduction of the exact retained generated graph identifies missing bare pg resolution from /private/modules-A1; pg exists at the pinned /app dependency root. Actual control guard publication also recorded EPERM rename, with holder unknown. A root runner.json was never produced and is not backfilled.\n\nAll host run files were copied and byte-verified with an unchanged before/after source map. Markdown is archived as bytes to preserve old relative links and encoding. No private volume, ephemeral password, keyring or database contents were exported. Failed host prefix remains unchanged. Serving containers were already stopped; readonly keeper and three ephemeral volumes were retained at freeze time. Separate exact-owner cleanup will have its own receipt. This FAIL remains FAIL regardless of corrective method acceptance. Human HOLD, current-source and fullP05 are not accepted.\n',encoding='utf-8',newline='\n')
write('INDEX.json',{'status':'ACTUAL_FAIL_PRESERVED_NOT_ACCEPTED','files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]})
print(json.dumps({'index_sha256':sha(out/'INDEX.json'),'host_files':len(before),'host_bytes':sum(v['bytes'] for v in before)}))
