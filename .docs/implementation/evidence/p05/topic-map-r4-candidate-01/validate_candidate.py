"""Read-only mechanical checks and bounded author controls; not a semantic/human approval gate.
Reuses candidate02 canonical/ref/locale/tag mutation checks and exact-text semantic expectations.
No runtime selector, test framework, receipt overwrite or production writes.
"""
from pathlib import Path
import collections,copy,hashlib,json,unicodedata
O=Path(__file__).resolve().parent; ROOT=Path.cwd().resolve(); OLD=ROOT/'.docs/implementation/evidence/p05/topic-map-candidate-02'
S='AUTHOR_PENDING_INDEPENDENT_AND_HUMAN'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def canonical(v):
 if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
 if isinstance(v,list):return '['+','.join(canonical(x)for x in v)+']'
 if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
 return json.dumps(v,separators=(',',':'))
def digest(v):return hashlib.sha256(canonical(v).encode()).hexdigest()
b=read(O/'source-bindings.json');m=read(O/'private-topic-map.candidate.v1.json');t=read(O/'taxonomy.candidate.v1.json');s=read(O/'semantic-families.candidate.v1.json');p=read(O/'mixed-visibility-proposal.json');co=read(O/'localized-review-corpus.json')
cards={r['id']:read(ROOT/r['path'])for r in b['current_references']};entries={e['card_id']:e for e in m['entries']};prior={e['card_id']:e for e in read(OLD/'private-topic-map.candidate.v1.json')['entries']};same=set(b['comparison']['exact_text_equivalent_ids']);known={x['topic_id']for x in t['topics']};families={f['semantic_family_id']:f for f in s['historical_concerns']+s['new_operation_concerns']}
# Pure exact controls; these editorial expectations do not claim an automatic language classifier.
old_controls=read(OLD/'semantic-controls.json')['controls'];reused=[c for c in old_controls if c['card_id']in same];not_reused=[c['name']for c in old_controls if c['card_id']not in same]
new_controls=[('Q-1019','communication_support',True),('Q-1019','personal_boundaries',True),('Q-1045','absurd_fiction',False),('Q-1045','everyday_objects',True),('TD-1018','personal_boundaries',True),('TD-1018','music_sound',True),('TD-1159','communication_support',False),('TD-1159','absurd_fiction',False),('YB-1172','communication_support',False),('YB-1108','personal_boundaries',False),('YB-1108','communication_support',False),('YB-1159','personal_boundaries',True),('Q-1176','music_sound',False),('TD-1110','nature_animals',True),('TD-1027','nature_animals',True),('YB-1031','humor_wordplay',False),('Q-1162','everyday_objects',True),('Q-1175','communication_support',True)]
def validate(doc):
 assert doc['classification_status']==S and not doc['approved'] and not doc['runtime_eligible'] and not doc['runtime_activation'] and doc['owner_review_status']=='HOLD'
 assert doc['runtime_schema_compatible']is False
 assert doc['pack_digest']==b['pack_digest']=='sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4'
 assert doc['catalog_digest']==b['catalog_digest'] and doc['taxonomy_digest']==digest(t) and doc['semantic_policy_digest']==digest(s)
 assert len(doc['entries'])==470 and len({e['card_id']for e in doc['entries']})==470
 assert {e['card_id']for e in doc['entries']}==set(cards)
 for e in doc['entries']:
  c=cards[e['card_id']];r=next(r for r in b['current_references']if r['id']==c['id'])
  assert e['card_revision']==c['revision'] and e['card_sha256']==digest(c) and e['card_raw_sha256']==sha(ROOT/r['path'])
  assert e['source_path']==r['path'] and e['mode']==c['mode'] and e['interaction']==c['interaction']
  assert e['meeting_contexts']==c['meeting_contexts'] and e['required_capabilities']==c['required_capabilities']
  assert e['classification_status']==S and e['rationale'].strip() and e['topic_ids'] and len(e['topic_ids'])==len(set(e['topic_ids'])) and set(e['topic_ids'])<=known
  assert e['locale_review']['languages_read']==['ru','en','tr'] and e['locale_review']['all_fields_read']
  assert set(e['locale_review']['field_sha256'])=={'ru','en','tr'}
  for l,fs in c['text'].items():assert e['locale_review']['field_sha256'][l]=={f:hashlib.sha256(v.encode()).hexdigest()for f,v in fs.items()}
  assert 'SEMANTIC_DISTINCTNESS_NOT_PROVEN'in e['unresolved_flags']
  assert set(e['semantic_family_ids'])<=set(families) and all(any(x['card_id']==c['id']for x in families[f]['members'])for f in e['semantic_family_ids'])
  if c['id']in same:
   old=prior[c['id']];assert e['topic_ids']==old['topic_ids'] and e['rationale']==old['rationale']
   assert set(old['unresolved_flags'])<=set(e['unresolved_flags']) and e['locale_review']['field_sha256']==old['locale_review']['field_sha256']
 for ctl in reused:
  e=next(e for e in doc['entries']if e['card_id']==ctl['card_id']);assert cards[e['card_id']]['text']==ctl['source_text']
  assert (ctl['topic_id']in e['topic_ids'])==ctl['expected_present']
 for i,tag,want in new_controls:assert (tag in next(e for e in doc['entries']if e['card_id']==i)['topic_ids'])==want
validate(m)
for d in [b,t,s,p,co]:assert d['classification_status']==S and d['approved']is False and d['runtime_eligible']is False and d['runtime_activation']is False and d['owner_review_status']=='HOLD'
assert t['topics']==read(OLD/'taxonomy.candidate.v1.json')['topics'] and len(t['topics'])==13
assert len(s['historical_concerns'])==21 and sum(len(f['prior_exact_members'])for f in s['historical_concerns'])==37
assert sum(len(f['members'])for f in s['historical_concerns'])==32 and sum(len(f['removed_since_450'])for f in s['historical_concerns'])==5
assert len(s['new_operation_concerns'])==17 and s['semantic_distinctness_proven_ids']==[] and s['semantic_distinctness_unresolved_ids']==sorted(cards)
assert s['no_concern_assigned_ids']==sorted(i for i,e in entries.items()if not e['semantic_family_ids'])
assert p['excluded_card_ids_applied']==[] and len(p['historical_removed_ids'])==5
assert {f['semantic_family_id']for f in p['families']}=={f['semantic_family_id']for f in s['new_operation_concerns']if f['mixed_visibility']}
for f in families.values():
 for r in f['members']:assert r==dict(card_id=r['card_id'],card_revision=cards[r['card_id']]['revision'],card_sha256=digest(cards[r['card_id']]),interaction=cards[r['card_id']]['interaction'])
 assert f['mixed_visibility']==(len({r['interaction']=='pair_private'for r in f['members']})>1)
assert all(sha(ROOT/n)==h for n,h in b['prior_candidate_all_file_sha256'].items())
assert read(O/'localized-review-corpus.json')['cards']==[dict(card_id=e['card_id'],card_revision=e['card_revision'],card_sha256=e['card_sha256'],interaction=e['interaction'],topic_ids=e['topic_ids'],rationale=e['rationale'],text=cards[e['card_id']]['text'],field_sha256=e['locale_review']['field_sha256'],annotation_origin=e['annotation_origin'])for e in m['entries']]
# Bounded in-memory negative controls: never edit live card files or candidates.
mutations=[('approval',lambda d:d.update(approved=True)),('runtime',lambda d:d.update(runtime_eligible=True)),('activation',lambda d:d.update(runtime_activation=True)),('schema_eligibility',lambda d:d.update(runtime_schema_compatible=True)),('HOLD',lambda d:d.update(owner_review_status='APPROVED')),('pack',lambda d:d.update(pack_digest='sha256:'+'0'*64)),('catalog',lambda d:d.update(catalog_digest='0'*64)),('taxonomy',lambda d:d.update(taxonomy_digest='0'*64)),('semantic',lambda d:d.update(semantic_policy_digest='0'*64)),('unknown_id',lambda d:d['entries'][0].update(card_id='Q-9999')),('revision',lambda d:d['entries'][0].update(card_revision=9999)),('raw_hash',lambda d:d['entries'][0].update(card_raw_sha256='0'*64)),('canonical_hash',lambda d:d['entries'][0].update(card_sha256='0'*64)),('unknown_topic',lambda d:d['entries'][0].update(topic_ids=['invented_unknown'])),('missing_locale',lambda d:d['entries'][0]['locale_review']['field_sha256'].pop('tr')),('field_hash',lambda d:d['entries'][0]['locale_review']['field_sha256']['ru'].update(question='0'*64)),('unknown_family',lambda d:d['entries'][0].update(semantic_family_ids=['SINGLE-BY-ID'])),('duplicate',lambda d:d['entries'].append(copy.deepcopy(d['entries'][0]))),('inherited_flags',lambda d:d['entries'][0].update(unresolved_flags=[])),('new_wrong_pause_tag',lambda d:next(e for e in d['entries']if e['card_id']=='Q-1019')['topic_ids'].remove('personal_boundaries'))]
rejected=[]
for name,mut in mutations:
 d=copy.deepcopy(m);mut(d)
 try:validate(d)
 except (AssertionError,KeyError,StopIteration):rejected.append(name)
 else:raise AssertionError('Mutation accepted: '+name)
print(json.dumps(dict(status='AUTHOR_MECHANICAL_AND_BOUNDED_CONTROLS_PASS_NOT_SEMANTIC_APPROVAL',cards=470,locale_fields=2340,prior_semantic_controls_reused=len(reused),prior_controls_not_reused_due_to_changed_or_removed_source=not_reused,new_author_semantic_controls=len(new_controls),negative_mutations_rejected=rejected,topics=13,historical_concerns=21,historical_current_refs=32,historical_removed_refs=5,new_operation_concerns=17,current_mixed_concerns=len(p['families']),no_concern_assigned_ids=len(s['no_concern_assigned_ids']),all470_semantic_distinctness_still_unresolved=True,source_current_app_certified=False),ensure_ascii=False,indent=2))
