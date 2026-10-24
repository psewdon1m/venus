from pathlib import Path
import json,hashlib,sys,shutil,datetime
r=Path('C:/.projects/venus');sys.path.insert(0,str(r/'tools'));from stage_inventory import inventory,identity
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
# Arguments are the independent logging review, SHA256, author INDEX and SHA256.
review=Path(sys.argv[1]);assert sha(review)==sys.argv[2]and json.loads(review.read_text())['status'].startswith('PASS')
author=Path(sys.argv[3]);assert sha(author)==sys.argv[4];a=json.loads(author.read_text())
projection=r/'.docs/implementation/reviews/p05/socket-projection-work-author-round01/INDEX.json';assert sha(projection)=='d91a6232c23ebd40fb99284d31901c608f06790698340dac0f19fbf7863e1c8c';pa=json.loads(projection.read_text())
pr=r/'.docs/implementation/reviews/p05/socket-projection-work-independent-round01/INDEX.json';assert sha(pr)=='c5eb20ae0a92e29d7d2518b622e2396d17a3134351998b11d6f0b694895c9c07'and json.loads(pr.read_text())['status'].startswith('PASS')
owned=pa['source_files']|a['source_files']
for packet in [pa,a]:
 revision=packet.get('source_revision_path')
 if revision:owned[revision]=packet['source_revision_sha256']
# Revision filenames are explicitly supplied by the immutable author packets or found by exact hash.
for packet in [pa,a]:
 matches=[p for p in (r/'.docs/implementation').glob('p05-source-revision-*.json')if sha(p)==packet['source_revision_sha256']];assert len(matches)==1;owned[matches[0].relative_to(r).as_posix()]=packet['source_revision_sha256']
old=json.loads((r/'.artifacts/p05-pilot-bundle-source-freeze11.json').read_text());before=inventory(r);changed={n for n,v in before.items()if old['files'].get(n)!=v}|(set(old['files'])-set(before));assert changed==set(owned),(changed,set(owned));assert all(before[n]==v for n,v in owned.items());assert len(before)==1869
out=r/'.artifacts/p05-pilot-bundle-source12';assert not out.exists();out.mkdir()
for n,v in before.items():
 p=out/n;p.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(r/n,p);assert sha(p)==v
assert inventory(r)==before and inventory(out)==before
rec={'created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'label':'A15','status':'FROZEN_MATERIALIZED_SOCKET_UNUSED_WORK_AND_SAFE_DIAGNOSTICS_NOT_STAGE','identity':identity(before),'included_files':len(before),'materialized_root':str(out),'parent_source_identity':old['identity'],'changed_paths':sorted(changed),'independent_app_reviews':{str(pr):sha(pr),str(review):sha(review)},'web_source_exact_A14':True,'files':before,'full_stage_PASS':False};(r/'.artifacts/p05-pilot-bundle-source-freeze12.json').write_text(json.dumps(rec,indent=2)+'\n',encoding='utf-8')
s=(r/'.artifacts/p05-native-build11.py').read_text().replace('11','12');(r/'.artifacts/p05-native-build12.py').write_text(s,encoding='utf-8',newline='\n')
s=(r/'.artifacts/p05-pilot-a13-image-probe01.py').read_text().replace('image-binding09','image-binding11').replace('source-freeze10','source-freeze12').replace('image10.txt','image12.txt').replace('build10','build12').replace("'label':'A13'","'label':'A15'").replace("assert changed==[],changed","assert set(changed)=={'apps/api/dist/rooms.js','apps/api/dist/room-routes.js','apps/api/dist/room-games.js','apps/api/dist/topic-games.js','apps/api/dist/request-error-diagnostic.js'},changed").replace('changed_compiled_from_A12','changed_compiled_from_A14').replace('MATERIALIZED_TEST_RECOVERY_ORACLE_CORRECTED_TEST_IMAGE_BOUND_NOT_STAGE','MATERIALIZED_SOCKET_WORK_AND_SAFE_DIAGNOSTICS_IMAGE_BOUND_NOT_STAGE').replace("out=r/'.artifacts/p05-pilot-bundle-image-binding10'","out=r/'.artifacts/p05-pilot-bundle-image-binding12'");(r/'.artifacts/p05-pilot-a15-image-probe01.py').write_text(s,encoding='utf-8',newline='\n')
s=(r/'.artifacts/p05-pilot-a13-production-probe01.py').read_text().replace('image-binding10','image-binding12').replace('production-image10','production-image12').replace('production-build10','production-build12').replace("'label':'A13'","'label':'A15'");(r/'.artifacts/p05-pilot-a15-production-probe01.py').write_text(s,encoding='utf-8',newline='\n')
s=(r/'.artifacts/p05-a14-host-checks01.py').read_text().replace('source-freeze11','source-freeze12').replace('p05-a14-host-checks01','p05-a15-host-checks01');(r/'.artifacts/p05-a15-host-checks01.py').write_text(s,encoding='utf-8',newline='\n')
print(json.dumps({k:v for k,v in rec.items()if k!='files'}))
