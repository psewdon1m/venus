from pathlib import Path
import json,hashlib,shutil,datetime
r=Path('C:/.projects/venus');src=r/'.artifacts/p05-pilot-bundle-source06/.artifacts/p05/venus-topic-browser-16f273121b99';out=r/'.docs/implementation/evidence/p05/browser22-a9-chromium-actual01';assert not out.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def inventory():return {p.relative_to(src).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(src.rglob('*'))if p.is_file()}
before=inventory();assert sum(x['bytes']for x in before.values())<128*1024**2;out.mkdir(parents=True);paths=[]
for n,row in before.items():
 original=src/n;assert not original.is_symlink();p=out/'run'/(n+'.bytes'if original.suffix=='.md'else n);p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original,p);assert sha(p)==row['sha256'];paths.append({'source':n,'archived':p.relative_to(out).as_posix(),'sha256':row['sha256']})
assert inventory()==before
for n in ['p05-browser22-a9-run01.mjs','p05-browser22-a9-root-ack01.json','p05-browser22-a9-run01.txt','p05-browser22-a9-run01-exit.txt','p05-browser22-a9-archive01.py']:shutil.copyfile(r/'.artifacts'/n,out/n)
report=json.loads((src/'topic-browser-report.json').read_text());runner=json.loads((src/'runner.json').read_text());counts={s:sum(x['status']==s for x in report['records'])for s in ['PASS','FAIL','NOT_RUN']};assert sum(counts.values())==16
def write(n,v):(out/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8',newline='\n')
write('path-map.json',paths);write('RECORD.json',{'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'counts':counts,'runner':runner,'observed_exit_code':int((r/'.artifacts/p05-browser22-a9-run01-exit.txt').read_text()),'source_scope':'IMMUTABLE_DIRTY_A9_6562_1850','raw_file_count':len(before),'raw_logical_bytes':sum(x['bytes']for x in before.values()),'raw_before_after_equal':True,'full_P05_PASS':False})
(out/'REPORT.md').write_text('# A9 Chromium actual METHOD22\n\n'+f'Actual16: {counts}; runner {runner["status"]}, cleanup {runner["cleanup"]}, source/producer unchanged {runner["source_and_producer_unchanged"]}. Frozen source6562438b1850/image58d8c700, independent METHOD22be3615d5+operationalaaba3771/rootACK0d02901b. First14PASS, including exact hostabort13 and lateprivateepoch14.15FAIL permanentexclusion ownonly: backendpersisted exclusion/peerunchanged, own allowromance checkbox stillcheckeddisabled. Productsettingsrefresh correction inprogress,16NOT_RUN. Synthetic functional scope, not normal470 or fullstage. No oraclewaiver; layout actual remains blocked on full16PASS.\n',encoding='utf-8')
write('INDEX.json',{'files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted(out.rglob('*'))if p.is_file()]});print(json.dumps({'index':sha(out/'INDEX.json'),'files':len(json.loads((out/'INDEX.json').read_text())['files']),'counts':counts,'status':runner['status'],'cleanup':runner['cleanup']}))
