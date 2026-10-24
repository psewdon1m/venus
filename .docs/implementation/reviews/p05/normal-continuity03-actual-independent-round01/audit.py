from pathlib import Path
import json, hashlib
from datetime import datetime,timezone

root=Path('C:/.projects/venus')
base=root/'.docs/implementation/evidence/p05/a7-normal-continuity-actual01'
out=root/'.docs/implementation/reviews/p05/normal-continuity03-actual-independent-round01'
out.mkdir(exist_ok=False)
pins={}
def pin(p,h=None):
 p=Path(p);p=p if p.is_absolute() else root/p
 b=p.read_bytes();s=hashlib.sha256(b).hexdigest()
 if h:assert s==h,(str(p),s,h)
 pins[p.relative_to(root).as_posix()]={'bytes':len(b),'sha256':s}
 return b
def load(p,h=None):return json.loads(pin(p,h))
def children(p,h=None):
 p=Path(p);p=p if p.is_absolute() else root/p
 v=load(p,h)
 fs=v['files']
 rows=fs if isinstance(fs,list) else [{'path':k,**(d if isinstance(d,dict) else {'sha256':d})} for k,d in fs.items()]
 for d in rows:
  q=p.parent/d['path'];b=pin(q,d['sha256'])
  if 'bytes' in d:assert len(b)==d['bytes']
 return len(rows)
assert children(base/'INDEX.json','81d51992f1f319c6d998373a94c4d43d18be9639cd057ed5bae7b76409ad2ca9')==19
ackpath=base/'p05-a7-normal-continuity-root-ack02.json'
ack=load(ackpath)
assert ack['status']=='ROOT_RUN_ACK'
assert ack['purpose']=='NORMAL470_PERSISTENT_A6_B4_01'
reviewchildren=children(ack['method_review_path'],ack['method_review_sha256'])
source_counts={};receipts={};source_maps={}
for k in ['A','B']:
 a=ack[k];f=load(a['source_freeze_path'],a['source_freeze_sha256']);assert f['identity']==a['source_identity'];assert len(f['files'])==a['included_files']
 for n,h in f['files'].items():pin(Path(a['source_root'])/n,h if isinstance(h,str) else h['sha256'])
 fmap={n:h if isinstance(h,str) else h['sha256'] for n,h in f['files'].items()};source_maps[k]=fmap
 assert hashlib.sha256(json.dumps(fmap,sort_keys=True,separators=(',',':')).encode()).hexdigest()==a['source_identity']
 r=load(a['image_receipt_path'],a['image_receipt_sha256']);assert r['source_identity']==a['source_identity'];assert r['image']==a['image_id']
 assert a['runtime_files']=={**r['image_files_sha256'],'build-metadata.json':r['build_metadata_sha256']}
 source_counts[k]=len(fmap);receipts[k]={'source_identity':a['source_identity'],'image':a['image_id'],'runtime_pins':len(a['runtime_files'])}
for n,h in ack['method_files'].items():pin(base/'method'/n,h)
for n in ['packages/card-catalog/dist/owner-provisional-pilot.json','packages/card-catalog/dist/pilot-bundle.js','packages/relationship-engine/dist/topic-planner.js','packages/relationship-engine/dist/topic-map.js']+[n for n in ack['A']['runtime_files'] if n.endswith('.sql')]:assert ack['A']['runtime_files'][n]==ack['B']['runtime_files'][n]
assert pin(Path(ack['A']['source_root'])/'infra/venus/compose.yml')==pin(Path(ack['B']['source_root'])/'infra/venus/compose.yml')
for d in load(base/'PATH-MAP.json'):pin(base/d['archive'],d['sha256'])
assert pin(base/'p05-a7-normal-continuity-run02-exit.txt').decode().strip()=='0'
stdout=json.loads(pin(base/'p05-a7-normal-continuity-run02.txt'));assert stdout['status']==stdout['cleanup']=='PASS'
outer=load(base/'run/outer-report.json');assert outer['status']==outer['cleanup']=='PASS';assert outer['cleanup_errors']==[];assert outer['private_grant_claim'] is False
assert outer['root_ack_sha256']==hashlib.sha256(pin(ackpath)).hexdigest()
assert [x['phase'] for x in outer['phases']]==['a-on','b-off','b-on']
assert len({x['db_id'] for x in outer['phases']})==1
assert len({json.dumps(x['volumes'],sort_keys=True) for x in outer['phases']})==1
assert len({x['app_id'] for x in outer['phases']})==3
assert [x['image_id'] for x in outer['phases']]==[ack['A']['image_id'],ack['B']['image_id'],ack['B']['image_id']]
reports={n:load(base/'run'/f'{n}-report.json') for n in ['a-on','b-off','b-on']}
for n,r in reports.items():
 assert r['status']=='PASS' and r['API_only'] is True and r['actual_TLS'] is False
 assert r['WS_connections']==2
 assert pin(base/'run'/f'{n}-stderr.txt')==b''
 s=json.loads(pin(base/'run'/f'{n}-stdout.txt'));assert s['phase']==n and s['status']=='PASS' and s['requests']==r['requests']
a=reports['a-on'];assert a['rooms_created']==1 and a['consent_acceptances']==4
assert a['released']=={'card_id':'YB-1009','revision':2,'round_index':1,'bilateral_invitation':True}
assert a['persisted']['pack_digest']==ack['pack_digest'];assert a['persisted']['game_state']=='active'
same=['room_id','session_id','pack_digest','snapshot_sha256','pins_sha256','history_sha256','participants','game_count','room_count']
for n in ['b-off','b-on']:
 r=reports[n];assert r['rooms_created']==r['consent_acceptances']==0
 for boundary in ['persisted_before','persisted_after']:
  s=r[boundary]
  for k in same:assert s[k]==a['persisted'][k],(n,boundary,k)
  assert s['private_objects']==s['private_refs']==0
  assert s['catalog']['active_digest'] is None
  assert s['catalog']['ledger_head']==a['persisted']['catalog']['ledger_head']
 assert r['persisted_after']['game_state']=='aborted'
 assert r['stale_start']=={'status':409,'code':'GAME_NOT_WAITING'}
assert reports['b-off']['persisted_before']['game_state']=='paused'
assert reports['b-off']['refusals']==[{'method':'POST','code':'TOPIC_GAMES_DISABLED','status':503}]*2
assert reports['b-on']['refusals']==[{'method':'POST','code':'TOPIC_SOURCE_UNAVAILABLE','status':503}]
assert reports['b-on']['room_closed'] is True
assert [int(x['catalog']['generation']) for x in [a['persisted'],reports['b-off']['persisted_before'],reports['b-on']['persisted_before']]]==[2,3,4]
current=load('.artifacts/p05-pilot-bundle-source-freeze08.json');cf=current['files']
def normalized(d):return {n:h if isinstance(h,str) else h['sha256'] for n,h in d.items()}
cf=normalized(cf)
carry={k:{'changed_existing_paths':[n for n,h in m.items() if n in cf and cf[n]!=h],'removed_paths':sorted(set(m)-set(cf)),'new_current_paths':sorted(set(cf)-set(m))} for k,m in source_maps.items()}
registry=load('.docs/implementation/p05-registry.json');workmap=load('.docs/implementation/p05-work-map.json');triage=load('.docs/implementation/reviews/p05/requirements44-current-triage-round02/matrix.json')
assert len(registry['requirements'])==len(workmap['requirements'])==len(triage['rows'])==44
for rows in [workmap['requirements'],triage['rows']]:
 assert {r['id'] for r in rows}=={r['id'] for r in registry['requirements']}
 for r in registry['requirements']:
  t=next(x for x in rows if x['id']==r['id'])
  for k in ['requirement','expected','source_card_ids']:assert t.get(k)==r.get(k),(r['id'],k)
assert len(workmap['critical_e2e_04_section8'])==10
normative=['.docs/10_IMPLEMENTATION_PLAN.md','.docs/04_UI_UX_AND_INTERACTIONS.md','.docs/adr/ADR-025-p05-unified-private-text-chat.md','.docs/adr/ADR-026-p04-owner-provisional-local-pilot.md','.docs/adr/ADR-029-owner-provisional-pilot-source.md']
for n in normative:
 if (root/n).exists():pin(n)
evidence_refs=[
 '.docs/implementation/reviews/p05/browser22-diagnostic-independent-round01/INDEX.json',
 '.docs/implementation/reviews/p05/c2-static-full-independent-round01/INDEX.json',
 '.docs/implementation/reviews/p05/topic-layout-independent-review-resume-round08/INDEX.json',
 '.docs/implementation/reviews/p05/public-wire-adjunct-independent-round02/INDEX.json',
 '.docs/implementation/reviews/p05/privacy-matched-independent-round01/INDEX.json',
 '.docs/implementation/reviews/p05/layout06-handoff-corpus-remaining-scope-round01/INDEX.json',
 '.docs/implementation/evidence/p05/compatible-rollback11-actual01/INDEX.json',
 '.docs/implementation/evidence/p05/owner-pilot-c2-baseline-actual01/INDEX.json',
 '.docs/implementation/reviews/p05/requirements44-current-triage-round02/INDEX.json',
]
verified_evidence={n:children(n) for n in evidence_refs}
result={'status':'PASS_HISTORICAL_NORMAL_CONTINUITY03_ACTUAL_ONLY_NOT_STAGE','at_utc':datetime.now(timezone.utc).isoformat(),'native_RUN':False,'source_counts_verified':source_counts,'binding':receipts,'method_review_children':reviewchildren,'archive_children':19,'native_phase_counts':{n:{k:r[k] for k in ['requests','WS_connections','rooms_created','consent_acceptances']} for n,r in reports.items()},'same_db_and_volumes':True,'app_recreated_three_ids':True,'same_room_session_snapshot_pins_history':True,'used_null_not_reactivated':True,'cleanup_recorded_PASS':True,'cleanup_raw_empty_inventory_archived':False,'keyring_bytes_fingerprint_archived':False,'current_A11_identity':current['identity'],'source_carry':carry,'requirements44_preserved':True,'requirements44_new_acceptance':False,'evidence_children_verified':verified_evidence,'pins':pins}
(out/'audit-result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ['pins','source_carry']},indent=2))
print('A7_to_A11_changed',json.dumps(carry['A'],indent=2))
