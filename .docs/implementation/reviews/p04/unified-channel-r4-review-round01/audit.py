"""Independent read-only r3→r4 and ledger audit. Never opens SQLite writable."""
from pathlib import Path
import json,hashlib,sqlite3,collections,datetime,sys
sys.stdout.reconfigure(encoding='utf-8')
ROOT=Path(__file__).resolve().parents[5]
OUT=Path(__file__).parent
R=ROOT/'.docs/implementation/evidence/p04/review470-r4'
S=ROOT/'.docs/implementation/evidence/p04/review470-r3'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def ro(p):return sqlite3.connect(p.resolve().as_uri()+'?mode=ro',uri=True)
assert sha(R/'HANDOFF.json')=='b9095f24ffab2c131286d7a022d539da43924201d515fd0d395b831e6cedf026'
assert sha(R/'manifest.json')=='df7b02a40787e571387f2df7bc89f1aeb98944367500ba7df77776130760173c'
assert sha(R/'current-input-freeze.json')=='594e6f65c427eaadcde7718c3a986505e40098694a16ee14f1f8aeb2a83d1d88'
m=load(R/'manifest.json');assert len(m['files'])==666
seen=set()
for entry in m['files']:
 p=ROOT/entry['path'];assert p.resolve().is_relative_to(R.resolve());assert entry['path'] not in seen;seen.add(entry['path'])
 assert p.is_file() and p.stat().st_size==entry['bytes'] and sha(p)==entry['sha256'],entry['path']
pins=load(R/'input-pins.json')
for entry in pins['source_files']+[pins['source_ledger'],pins['source_analysis_manifest']]:assert sha(ROOT/entry['path'])==entry['sha256']
freeze=load(R/'current-input-freeze.json')
for entry in freeze['card_files']+freeze['author_scripts']:assert sha(ROOT/entry['path'])==entry['sha256']
assert sha(ROOT/freeze['ledger_path'])==freeze['ledger_sha256']
source={p.stem:(p,load(p)) for p in (S/'candidate/cards').glob('*.json')}
target={p.stem:(p,load(p)) for p in (R/'candidate/cards').glob('*.json')}
assert len(source)==len(target)==470 and source.keys()==target.keys()
app=load(R/'applicability143.json');appmap={x['id']:x for x in app['cards']};assert len(appmap)==len(app['cards'])==143
declared={x['id']:x for x in load(R/'changes143.json')['changed']};assert declared.keys()==appmap.keys()
changed=[];unchanged=[];locale_count=0;locale_changed_count=0;old21=[];per_id=[]
for id,(p,c) in target.items():
 oldpath,old=source[id]
 assert old['text']==c['text'] and old['authoring']==c['authoring'] and old['id']==c['id']
 locale_count+=sum(len(v) for v in c['text'].values())
 if sha(p)==sha(oldpath):unchanged.append(id);assert id not in appmap;continue
 changed.append(id)
 assert {k for k in set(c)|set(old) if c.get(k)!=old.get(k)}<= {'revision','meeting_contexts','required_capabilities'}
 assert c['revision']==old['revision']+1 and c['interaction']=='pair_private' and c['consent']=='bilateral'
 assert c['meeting_contexts']==['online','in_person'] and 'private_text_chat' in c['required_capabilities']
 assert not c['requires_physical_contact'] and not c['requires_going_away'] and c['min_comfort']>=1 and c['min_progression_stage']>=3
 assert set(c['required_capabilities'])==set(old['required_capabilities'])|{'private_text_chat'}
 assert sha(R/'revision-history'/f"{id}-r{old['revision']}.json")==sha(oldpath)
 a=appmap[id];assert a['source_contexts']==old['meeting_contexts'] and a['target_contexts']==c['meeting_contexts']
 assert not a['physical'] and not a['going_away'] and not a['human_approval'] and len(a['rationale'])>50 and len(a['card_specific_note'])>15
 added='private_text_chat' not in old['required_capabilities'];assert a['old21_capability_added']==added
 if added:old21.append(id)
 for locale,fields in c['text'].items():
  evidence=a['locale_evidence'][locale];assert len(evidence)==len(fields)
  assert {v['field'] for v in evidence}==set(fields)
  for v in evidence:assert v['text']==fields[v['field']] and v['utf8_sha256']==hashlib.sha256(v['text'].encode()).hexdigest();locale_changed_count+=1
 d=declared[id];assert d['previous_raw_sha256']==sha(oldpath) and d['raw_sha256']==sha(p) and d['previous_canonical_sha256']==digest(old) and d['canonical_sha256']==digest(c)
 reason={'questions':'A preference or imaginary question can be answered as typed private text in either meeting context; no depicted object/action must be physically present.','truth_or_dare':'Both truth and dare are private discussion/invention/description; the dare does not require an actual sound, performance, contact, movement or prop.','yes_but':'The proposal is typed discussion/fiction; unchanged responder preserves own condition, explicit bilateral confirmation and withdrawal. The imagined scene is not a required physical action.'}[c['mode']]
 if added:reason+=' The former private-conversation wording does not require speech aloud; the newly explicit capability makes its written delivery prerequisite enforceable.'
 special={'TD-1107':'Imagined chimes/flute are compared in words, not produced or heard live.','TD-1109':'Imaginary musical opening/ending is specified only in words.','TD-1158':'The window/parade belongs to a fictional self; no actual camera, movement or outside event.','TD-1160':'The text explicitly says no eating is needed.','YB-1117':'Gallery opening is roleplay explicitly within private chat.','YB-1142':'The secret passage connects imagined places, not actual room departure.','YB-1160':'Alongside hobbies is explicitly imagined, not mandatory co-presence.','YB-1162':'Campfire positions are imagined and expressly not measured in physical steps.','YB-1166':'An imagined celebration requires no photograph or real event.','YB-1180':'The fictional musical symbol expressly requires no real music or notation.'}
 if id in special:reason+=' '+special[id]
 per_id.append({'id':id,'source_revision':old['revision'],'revision':c['revision'],'raw_sha256':sha(p),'locale_sha256':{loc:{f:hashlib.sha256(t.encode()).hexdigest() for f,t in fields.items()} for loc,fields in c['text'].items()},'old21_added_capability':added,'technical_applicability':'OPTIONAL_WRITTEN_DISCUSSION_OR_IMAGINARY_DESCRIPTION_IN_EITHER_CONTEXT','reviewed_operation_en':c['text']['en'],'independent_rationale':reason,'human_approval':False})
assert len(changed)==143 and len(unchanged)==327 and len(old21)==21 and locale_count==2340
assert set(changed)==set(appmap)=={id for id,(_,c) in target.items() if c['interaction']=='pair_private'}
counts=collections.Counter(target[id][1]['mode'] for id in changed);assert counts=={'questions':47,'truth_or_dare':50,'yes_but':46}
early=['Q-1105','Q-1110','Q-1112','YB-1102','YB-1104','YB-1107','YB-1130'];assert all(id in unchanged for id in early)
catalog=digest([{'id':id,'revision':c['revision'],'sha256':digest(c)} for id,(_,c) in sorted(target.items())]);assert catalog=='dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270'
assert digest([{'id':id,'revision':c['revision'],'sha256':digest(c)} for id,(_,c) in sorted(source.items())])==pins['source_catalog_digest']=='97bf4bb876640ec11612ae9fdd9e3baceb2cd88075e7f8d0ad59d80e4f49f6db'
original=ROOT/pins['source_ledger']['path'];rollback=R/'authoring/rollback-470r3.sqlite';candidate=R/'authoring/candidate.sqlite';assert sha(original)==sha(rollback)==pins['source_ledger']['sha256']
before=ro(original);after=ro(candidate)
for db in [before,after]:assert db.execute('PRAGMA integrity_check').fetchall()==[('ok',)] and not db.execute('PRAGMA foreign_key_check').fetchall()
oldrevs=before.execute('SELECT * FROM revisions ORDER BY card_id,revision').fetchall();newrevs=after.execute('SELECT * FROM revisions ORDER BY card_id,revision').fetchall();assert len(oldrevs)==983 and len(newrevs)==1126
assert set(oldrevs)<=set(newrevs);addedrevs=set(newrevs)-set(oldrevs);assert len(addedrevs)==143
assert {r[0] for r in addedrevs}==set(changed)
for id,revision,h,body in newrevs:
 if id in target and revision==target[id][1]['revision']:assert h==digest(target[id][1]) and json.loads(body)==target[id][1]
old_events=before.execute('SELECT * FROM events ORDER BY seq').fetchall();new_events=after.execute('SELECT * FROM events ORDER BY seq').fetchall();assert len(old_events)==185 and len(new_events)==215 and old_events==new_events[:185]
previous='0'*64
for seq,kind,body,prev,h in new_events:assert prev==previous and h==digest({'kind':kind,'body':json.loads(body),'previous':prev});previous=h
assert before.execute('SELECT * FROM reservations ORDER BY card_id').fetchall()==after.execute('SELECT * FROM reservations ORDER BY card_id').fetchall()
assert before.execute('SELECT count(*) FROM reservations').fetchone()[0]==547
old_batches=dict(before.execute('SELECT id,request FROM batches'));new_batches=dict(after.execute('SELECT id,request FROM batches'));assert len(old_batches)==len(new_batches)==41 and old_batches.keys()==new_batches.keys()
revised=[];recorded=[]
for _,kind,body,_,_ in new_events[185:]:
 b=json.loads(body)
 if kind=='REQUEST_REVISED':
  old=b['previous_request'];new=b['request'];id=new['batch_id'];assert old==json.loads(old_batches[id]) and new==json.loads(new_batches[id]);assert all(old[k]==new[k] for k in ['mode','first','count']);revised.append(id)
 else:assert kind=='DRAFT_RECORDED';recorded.append(b['batch_id'])
assert len(revised)==len(set(revised))==12 and len(recorded)==len(set(recorded))==18
assert {k for k in old_batches if old_batches[k]!=new_batches[k]}==set(revised)
for item in load(R/'authoring/transaction-receipts.json'):
 revision=item['request_revision']
 if revision:
  id=item['batch_id'];assert revision['expected_request_sha256']==json.loads(old_batches[id])['request_sha256'];assert revision['new_request_sha256']==sha(R/'authoring'/f'{id}-request.json')
before.close();after.close()
# Recompute stored historical diagnostic summaries, without calling stale compiled planners.
diagnostic=[]
for name in ['coverage.json','coverage-private-chat.json']:
 r=load(R/'checks/draft-check-round01'/name);assert len(r['cells'])==5880 and len(r['sessions'])==4214 and len(r['private_sessions'])==420
 if r['capabilities']:
  assert r['capabilities']==['private_text_chat'] and r['private_coverage']=='PASS' and all(s['status']=='PASS' for s in r['private_sessions'])
  for mode,n in counts.items():
   for context in ['online','in_person']:
    rows=[c for c in r['cells'] if c['mode']==mode and c['context']==context and c['stage']>=3 and c['comfort']>=1 and c['resolved_class'] in ['F','G','M','S','R']];assert rows and {x['private_baseline_card_count'] for x in rows}=={n}
 diagnostic.append({'file':name,'private_coverage':r['private_coverage'],'private_statuses':dict(collections.Counter(x['status'] for x in r['private_sessions'])),'qualification':'HISTORICAL_COMPILED_ONLY_NOT_FINAL_CURRENT_SOURCE_DOCKER'})
assert all(not load(R/'HANDOFF.json')[k] for k in ['human_approval','runtime_activation','full_P04_PASS','full_P05_PASS'])
result={'at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'INDEPENDENT_MECHANICAL_METADATA_HISTORY_PASS','manifest_files_verified':666,'catalog_digest':catalog,'changed':143,'unchanged_raw':327,'all_text_fields_unchanged':locale_count,'changed_card_locale_fields_verified':locale_changed_count,'old21':old21,'mode_counts':dict(counts),'early7_unchanged':early,'history':{'old_revisions':983,'new_revisions':1126,'old_events_exact_prefix':185,'new_events':215,'reservations':547,'batches':41,'CAS_revisions':12,'records':18},'historical_diagnostics':diagnostic,'human_approval':False,'runtime_activation':False,'final_current_source_Docker':'PENDING_ROOT','full_stage_pass':False}
(OUT/'audit-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(OUT/'per-id-technical-applicability.json').write_text(json.dumps({'scope':'INDEPENDENT_METADATA_APPLICABILITY_NOT_HUMAN_LANGUAGE_APPROVAL','cards':sorted(per_id,key=lambda x:x['id'])},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,ensure_ascii=False,indent=2))
