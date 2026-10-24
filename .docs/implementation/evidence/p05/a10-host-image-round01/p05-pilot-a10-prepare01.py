from pathlib import Path
import sys,json,shutil,datetime,hashlib
r=Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze06.json').read_text())
reviews=['topic-snapshot-cache-product-author-round01','own-exclusion-ui-refresh-author-round01']
owned={}
for name in reviews:
 source=r/'.docs/implementation/reviews/p05'/name/'source'
 assert source.is_dir(),source
 for p in source.rglob('*'):
  if p.is_file():owned[p.relative_to(source).as_posix()]=sha(p)
assert len(owned)==10,owned
for n,h in owned.items():assert sha(r/n)==h,n
review=r/'.docs/implementation/reviews/p05/cache-own-exclusion-app-independent-round01/INDEX.json'
assert sha(review)=='424c6ef2ab8a8fc896299240d1fd8d7a51db53b3df673fe41aaf29939671f93d'
before=inventory(r);changed={n for n,h in before.items()if old['files'].get(n)!=h}|(set(old['files'])-set(before))
assert changed==set(owned)|{'AGENTS.md'},changed
out=r/'.artifacts/p05-pilot-bundle-source07';assert not out.exists();out.mkdir()
for n,h in before.items():
 p=out/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p);assert sha(p)==h
assert inventory(r)==before and inventory(out)==before
rec={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':'A10','status':'FROZEN_MATERIALIZED_CACHE_OWN_EXCLUSION_CORRECTED_NOT_STAGE_PASS','identity':identity(before),'included_files':len(before),'materialized_root':str(out),'parent_source_identity':old['identity'],'changed_paths':sorted(changed),'independent_app_review_sha256':sha(review),'files':before,'full_stage_PASS':False}
(r/'.artifacts/p05-pilot-bundle-source-freeze07.json').write_text(json.dumps(rec,indent=2)+'\n',encoding='utf-8')
entry=f"\n\n## {rec['created_at']} — A10 app source freeze; accepted source reviews, final native gates pending\n- Cache and own-exclusion UI author10 source paths verified exact; independent424c6ef2/8 PASS49 tests, including fresh AES/AAD/key removal negatives. No speedup/browser outcome claimed. All app writers STOP before freeze.\n- A10 immutable source {rec['identity']}/{len(before)}, A9 delta exactly10 reviewed application/revision paths + AGENTS.md v4/U019 pointers. No additional source drift. Test and normal images now to build; same600s N4/unchangedbrowser22 actual required.\n- OCI10 independent e0af7086/11 PASS6cold/304pins, three semantic objecthash corrections plus newcandidate CRLF→LF. Original09 failure retained. Agent prepares one authorized14-control actual; rootchecks ACKbefore allocation.\n- Matched-domain method independent f1b675aa/7 PASS21+18finite, originalAUC126k preserved; wire andrealdata outcome pending. Thin existing-WS publiccapture adjunct delegated12. Original full7-section exact-range manifest delegated06, acceptedcostprefixes/corecleanprereg26ee04e8 retained. No new testing framework or P06.\n- Read-only guessed nonexistent buildfilename error retained; directory inventory and existing Dockerfiles used for actual build commands.\n"
for n in ['.history/2026-10-20-orchestrator.md','.history/2026-10-19-p05.md']:
 with(r/n).open('a',encoding='utf-8',newline='\n')as f:f.write(entry)
print(json.dumps({k:v for k,v in rec.items()if k!='files'}))
