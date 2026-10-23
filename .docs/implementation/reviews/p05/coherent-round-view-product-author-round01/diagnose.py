from pathlib import Path
from datetime import datetime,timezone
import json,hashlib
r=Path(__file__).parent;p=Path('.docs/implementation/evidence/p05/projection-reuse-browser20-chromium-actual02');read=lambda p:json.loads(p.read_text(encoding='utf-8'));sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha((p/'INDEX.json').read_bytes())=='bcb1a9c20fb6f911f3c04adacceb8ef0c7ce2d363d906b6aa34d3b2c3e9e7582';idx=read(p/'INDEX.json');assert len(idx['files'])==45
for row in idx['files']:
 b=(p/row['path']).read_bytes();assert len(b)==row['bytes'] and sha(b)==row['sha256']
delivery=read(p/'run/delivery-metadata.json');batch=[v for v in delivery['http']if v['locale']=='tr'and v['cycle']==68];parts={v['route']['kind']:v for v in batch}
assert all(parts[k]['status']==200 for k in ['self-actions','target','conversation','chat'])
own=parts['self-actions'];chat=parts['chat'];elapsed=chat['body_complete_native_ms']-own['started_native_ms'];assert own['dto']['server_relative_ms']==5000
rows=[{'kind':k,'started_ms':parts[k]['started_native_ms'],'body_complete_ms':parts[k]['body_complete_native_ms'],'status':parts[k]['status']}for k in ['self-actions','target','conversation','chat']]
out={'at_utc':datetime.now(timezone.utc).isoformat(),'actual_index_sha256':sha((p/'INDEX.json').read_bytes()),'children_verified':45,'case_result':'4PASS/05FAIL/11NOT_RUN_CLEANUP_PASS','route_timing_TR_cycle68':rows,'collection_elapsed_ms':elapsed,'own_lease_ms':5000,'remaining_at_chat_body_ms':5000-elapsed,'observer_minimum_ms':250,'remaining_over_minimum_ms':5000-elapsed-250,'interpretation':'All four endpoint responses200; sequential collection consumes most5s own lease, leaving little time for body/model/DOM work. Actual appcache acceptance is not observed; no403/parentexpiry established. Bundle removes four independent read transaction chains without increasing TTL/deadline.','new_RUN':False}
(r/'actual02-timing-diagnosis.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps(out,indent=2))
