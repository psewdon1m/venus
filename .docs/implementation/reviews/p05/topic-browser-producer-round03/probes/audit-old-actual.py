from pathlib import Path
import json,hashlib
p=Path('.docs/implementation/evidence/p05/topic-browser-preflight-01');idx=p/'index.json';raw=json.loads(idx.read_text());assert hashlib.sha256(idx.read_bytes()).hexdigest()=='31a3296345b877e98c1b58d4ee3a03ba109342ea2b992eeddc3d03af0d3437a5'
for row in raw['files']:
 q=p/row['path'];assert q.stat().st_size==row['bytes'];assert hashlib.sha256(q.read_bytes()).hexdigest()==row['sha256']
r=json.loads((p/'run/topic-browser-report.json').read_text());assert [x['status'] for x in r['records']]==['PASS']*3+['FAIL']+['NOT_RUN']*12;assert r['cleanup']=='PASS' and not r['page_errors']
result={'status':'FAILED_ACTUAL_ARCHIVE_INTEGRITY_PASS_NOT_RUNTIME_PASS','files':len(raw['files']),'archive_index_sha256':hashlib.sha256(idx.read_bytes()).hexdigest(),'actual_case01_03':'PASS','case04':'FAIL','case05_16':'NOT_RUN','cleanup':r['cleanup'],'source_identity':raw['source_identity'],'failure_diagnosis':'source-supported interleaving hypothesis; original exact failed locator unavailable due truncation'}
Path('.artifacts/p05-topic-browser-review-round03/failed-actual-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))