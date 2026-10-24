import json,hashlib,pathlib
root=pathlib.Path.cwd();base=root/'.artifacts/p05-topics-ui-review'
for folder,expected in [('topics-ui-preflight-04','b6037653f5a3dd613c5700d8d5370ddf42547c7a0c93f234555cde4a9437fb4b'),('topics-ui-regression-01','0c9602a143032083bd6318ea05b4634e28a34c47c960a2f47a5eff1ad8b8e58e')]:
 p=root/'.docs/implementation/evidence/p05'/folder; raw=(p/'index.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==expected;idx=json.loads(raw);rows=[]
 for r in idx['files']:
  f=p/r['path'];b=f.read_bytes();assert len(b)==r['size'] and hashlib.sha256(b).hexdigest()==r['sha256'],r['path']
  if folder.endswith('04') and r['path'].startswith('source/'):
   q=root/r['path'][7:];assert q.read_bytes()==b,r['path'];rows.append({'path':r['path'][7:],'sha256':r['sha256']})
 result={'indexed_files':len(idx['files']),'exact_current_source_copies':len(rows),'index_sha256':expected,'inputs':rows}
 (base/(folder+'-verified.json')).write_text(json.dumps(result,indent=2)+'\n');print(folder,result['indexed_files'],len(rows))
 if folder.endswith('04'):assert (p/'inputs-before.json').read_bytes()==(p/'inputs-after.json').read_bytes()
p=base/'probes-round01.mjs';s=p.read_text().replace('clock+=6000;','monotonic+=6000;').replace('probes-round01-results.json','probes-round02-results.json');(base/'probes-round02.mjs').write_text(s)
p=base/'clock-probe-round01.mjs';s=p.read_text().replace('clock-probe-round01-results.json','clock-probe-round02-results.json');(base/'clock-probe-round02.mjs').write_text(s)
