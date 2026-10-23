from pathlib import Path
import json, hashlib, collections, datetime

root=Path('C:/.projects/venus'); here=Path(__file__).resolve().parent
raw=root/'.artifacts/p05-a15-owned-cpu-profile01'
def read(name): return json.loads((raw/name).read_text(encoding='utf-8-sig'))
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
data=read('cpu-profile.json'); p=data['profile']; a=read('AGGREGATES.json')
assert data['requested_profile_ms']==7000
assert len(p['samples'])==len(p['timeDeltas'])==6385
nodes={n['id']:n for n in p['nodes']}; assert len(nodes)==6291
parents={child:n['id'] for n in p['nodes'] for child in n['children']}
self_us=collections.Counter(); inclusive_us=collections.Counter(); counts=collections.Counter()
def key(n):
    f=n['callFrame']; return (f['functionName'],f['url'],f['lineNumber']+1,f['columnNumber']+1)
for n in nodes.values():
    assert set(n)<= {'id','callFrame','hitCount','children'}
    assert set(n['callFrame'])=={'functionName','scriptId','url','lineNumber','columnNumber'}
for sample, delta in zip(p['samples'],p['timeDeltas']):
    assert delta>=0
    k=key(nodes[sample]); self_us[k]+=delta; counts[k]+=1
    seen=set(); walked=set(); current=sample
    while current in nodes:
        assert current not in walked; walked.add(current); seen.add(key(nodes[current]))
        if current not in parents: break
        current=parents[current]
    for k in seen: inclusive_us[k]+=delta
total=sum(p['timeDeltas'])
for field,counter in [('top_self',self_us),('top_inclusive',inclusive_us)]:
    rows=a[field]; assert len(rows)==25
    assert sorted(counter.values(),reverse=True)[:25]==[round(row['milliseconds']*1000) for row in rows]
    for row in rows:
        k=(row['function'],row['url'],row['line'],row['column'])
        assert row['milliseconds']==round(counter[k]/1000,3)
        assert row['sampled_wall_percent']==round(counter[k]/total*100,3)
        assert row['self_milliseconds']==round(self_us[k]/1000,3)
        assert row['self_samples']==counts[k]
assert a['sampled_ms']==round(total/1000,3)==7057.103
assert a['profile_elapsed_ms']==round((p['endTime']-p['startTime'])/1000,3)==7057.2
receipt=read('receipt.json'); before=read('inspect-before.json')
assert before==read('inspect-before02.json')==read('inspect-after.json')
assert before['project']==receipt['project']=='venus-pilot470-04ed27eff134'
assert before['image']==receipt['image']=='sha256:d1eff08f9a3201c087356bef173ab5b5df7ea202125d6e30aceaec090cbe893c'
assert before['command']==['node','apps/api/dist/server.js'] and before['service']=='app'
assert '9229/tcp' not in before['ports']
assert read('listener-after.json')=={'tcp':['0100007F:240D'],'tcp6':[]}
assert receipt['capture_exit']==receipt['aggregate_exit']==0 and receipt['capture_repeated'] is False
assert read('pre-capture-failure01.json')['native_cpu_captures']==0
assert (raw/'capture.mjs').read_bytes()==(root/'.artifacts/p05-a11-owned-cpu-profile01/capture.mjs').read_bytes()
assert sha(raw/'capture.mjs')=='49539ffe8131232959ba7087b48f6adcd062e313292657f7676036cb01f942b3'
assert (raw/'aggregate.py').read_bytes()==(root/'.artifacts/p05-a11-owned-cpu-profile01/aggregate.py').read_bytes()
assert (raw/'capture-stderr.txt').stat().st_size==(raw/'pg-waits01-stderr.txt').stat().st_size==0
progress=read('public-progress-before.json'); assert progress['completed_rounds']==80
assert [(x['N'],x['status'],x['rounds']) for x in progress['profiles'][:5]]==[(2,'PASS',20),(3,'PASS',20),(4,'PASS',20),(5,'PASS',20),(6,'RUNNING',0)]
pg=read('pg-waits01.json')['rows']; assert len(pg)==3
waiters=[]; idle_tx=[]
for row in pg:
    waiters.append(sum(g['connections'] for g in row['groups'] if g['wait_event']=='advisory'))
    idle_tx.append(sum(g['connections'] for g in row['groups'] if g['state']=='idle in transaction' and g['wait_event']=='ClientRead'))
assert waiters==[4,4,3] and idle_tx==[1,1,1]
assert read('pg-waits01-receipt.json')['exit']==0
paths=list(raw.iterdir())+[root/'.artifacts/p05-a15-owned-cpu-profile01.py',root/'.artifacts/p05-a15-owned-cpu-profile02.py',root/'.artifacts/p05-a15-pg-waits01.py']
paths += [root/'apps/api/src'/x for x in ['private-topic-ledger.ts','security.ts','topic-room-lifecycle.ts','private-topic-preferences.ts']]
pins=[{'path':str(path.relative_to(root)).replace('\\','/'),'sha256':sha(path),'bytes':path.stat().st_size} for path in sorted(paths)]
(here/'INPUT-PINS.json').write_text(json.dumps({'files':pins},indent=2)+'\n',encoding='utf-8')
out={'status':'PASS_SAVED_PROFILE_AND_COST_FINDING_ONLY','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'new_native_actions':0,'raw_self_and_inclusive_recalculated':True,'samples':6385,'nodes':6291,'sampled_ms':a['sampled_ms'],'elapsed_ms':a['profile_elapsed_ms'],'top_self':a['top_self'][:5],'selected_inclusive':[r for r in a['top_inclusive'] if r['function'] in ['reload','inspect','read','locked']],'pg_advisory_waiters':waiters,'pg_idle_in_transaction_client_read':idle_tx,'teardown':'PARENT_OWNED_PENDING_AT_CAPTURE'}
(here/'AUDIT.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'status':out['status'],'raw_files_pinned':len(pins),'samples':6385,'new_native_actions':0}))
