from pathlib import Path
import shutil,json,hashlib,datetime
r=Path.cwd();log=r/'.artifacts/p05-projection-reuse-browser20-chromium-run02.txt'
lines=[json.loads(v) for v in log.read_text(encoding='utf-8-sig').splitlines() if v.startswith('{')]
assert len(lines)==2 and lines[0]['phase']=='starting'
src=Path(lines[0]['output']);assert src.is_relative_to(r/'.artifacts/p05')
out=r/'.docs/implementation/evidence/p05/projection-reuse-browser20-chromium-actual02';assert not out.exists()
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def snapshot():return {p.relative_to(src).as_posix():{'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(src.rglob('*')) if p.is_file()}
before=snapshot();assert sum(v['bytes'] for v in before.values())<128*1024**2
out.mkdir(parents=True);mapping=[]
for n,row in before.items():
    p=src/n;assert not p.is_symlink();dest=out/'run'/(n+'.bytes' if p.suffix=='.md' else n);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,dest);assert sha(dest)==row['sha256'];mapping.append({'original':n,'archived':dest.relative_to(out).as_posix(),'sha256':row['sha256']})
assert snapshot()==before
for n in ['p05-projection-reuse-browser20-chromium-run02.txt','p05-projection-reuse-browser20-chromium-exit02.txt','p05-projection-reuse-browser20-root-ack02.json','p05-projection-reuse-browser20-root-ack02.json','p05-projection-reuse-browser20-run02.mjs','p05-projection-reuse-browser20-archive02.py']:shutil.copyfile(r/'.artifacts'/n,out/n)
runner=json.loads((src/'runner.json').read_text(encoding='utf-8'));report=json.loads((src/'topic-browser-report.json').read_text(encoding='utf-8'));counts={s:sum(v['status']==s for v in report['records']) for s in ['PASS','FAIL','NOT_RUN']};assert sum(counts.values())==16
def write(n,v):(out/n).write_text(json.dumps(v,indent=2)+'\n',encoding='utf-8',newline='\n')
write('raw-path-map.json',mapping)
write('RECORD.json',{'status':runner['status'],'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'counts':counts,'cleanup':runner['cleanup'],'source_and_producer_unchanged':runner['source_and_producer_unchanged'],'source_identity':runner['source_identity'],'image':runner['image'],'observed_exit_code':int((r/'.artifacts/p05-projection-reuse-browser20-chromium-exit02.txt').read_text()),'source_scope':'CURRENT_FROZEN_DIRTY_732ED840_1826_PROJECTION_REUSE_NOT_CLEAN_STAGE','full_P05_PASS':False,'raw_host_files':len(before),'raw_host_logical_bytes':sum(v['bytes'] for v in before.values()),'raw_before_after_map_unchanged':True,'legacy_browser_report_revision_label':'INHERITED12_LABEL_NOT_PROVENANCE_AUTHORITY_USE_EXACT_METHOD18_PINS'})
(out/'REPORT.md').write_text('# METHOD20 projection-reuse Chromium actual02: FAIL\n\n4 PASS, case05 FAIL OBSERVER_READY_DEADLINE awaiting TR private-prompt,11 NOT_RUN; cleanup PASS. Game active rev36/round16 pending; EN/TR privateactors, RUoutsider. Final TR snapshot complete200 batch, lease too short/expired. Exact route timing cause requires diagnosis; projection optimization does not establish successful browser completion. Source732/1826, imagee076, runtimeMETHOD20 and before/after unchanged; all historical failures retained. No fullstage or browsermatrix acceptance.\n',encoding='utf-8',newline='\n')
write('INDEX.json',{'status':runner['status']+'_ACTUAL_CHROMIUM_SLICE_NOT_FULL_STAGE','files':[{'path':p.relative_to(out).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(out.rglob('*')) if p.is_file()]})
print(json.dumps({'index_sha256':sha(out/'INDEX.json'),'files':len(json.loads((out/'INDEX.json').read_text())['files']),'counts':counts,'cleanup':runner['cleanup']}))
