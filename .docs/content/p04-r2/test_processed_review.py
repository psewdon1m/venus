"""Evidence/content checks; no claim to verify natural-language competence or runtime UX."""
from pathlib import Path
import collections, hashlib, json, re, sqlite3, unittest, unicodedata
from jsonschema import Draft202012Validator

ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'.docs/content/p04-r2'
EVIDENCE=ROOT/'.docs/implementation/evidence/p04/review-450-processing'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def digest(v):return hashlib.sha256(json.dumps(v,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()

class ProcessedReviewTests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.ledger=read(BASE/'dispositions.json');cls.rows=cls.ledger['cards'];cls.original={p.stem:read(p) for p in (ROOT/'.docs/content/p04/cards').glob('*.json')}
  cls.cards={r['id']:read(ROOT/r['candidate_path']) for r in cls.rows if r['candidate_path']}
 def test_all_authoritative_rows_bound_exactly(self):
  text=(ROOT/'.docs/implementation/evidence/Venus_P04_FULL_REVIEW_450_2026-10-19.md').read_text(encoding='utf-8-sig')
  ids=re.findall(r'^\| \*\*`((?:Q|TD|YB)-\d+)`\*\* \|.*?\| `(KEEP|EDIT|RECONTEXT|MOVE_TO_RULES|REPLACE|HOLD)` \|',text,re.M)
  self.assertEqual(450,len(ids));self.assertEqual(dict(ids),{r['id']:r['decision'] for r in self.rows})
  self.assertEqual({'KEEP':162,'EDIT':120,'RECONTEXT':29,'MOVE_TO_RULES':71,'REPLACE':67,'HOLD':1},dict(collections.Counter(r['decision'] for r in self.rows)))
 def test_original_card_bytes_unchanged(self):
  inv=read(EVIDENCE/'r1-input-inventory.json')
  for item in inv['cards']:
   self.assertEqual(item['raw_sha256'],sha(ROOT/f'.docs/content/p04/cards/{item["id"]}.json'))
   self.assertEqual(item['canonical_sha256'],digest(self.original[item['id']]))
 def test_all_candidate_schema_and_hashes(self):
  validator=Draft202012Validator(read(ROOT/'.docs/contracts/card.schema.json'))
  for row in self.rows:
   if row['candidate_path']:
    p=ROOT/row['candidate_path'];c=self.cards[row['id']]
    self.assertEqual([],list(validator.iter_errors(c)),row['id'])
    self.assertEqual(row['new_raw_sha256'],sha(p));self.assertEqual(row['new_canonical_sha256'],digest(c))
 def test_revisions_and_unmodified_keep_bytes(self):
  for row in self.rows:
   if not row['candidate_path']:continue
   c=self.cards[row['id']];old=self.original[row['id']]
   self.assertEqual(old['id'],c['id']);self.assertEqual(old['mode'],c['mode'])
   self.assertEqual(1 if c==old else 2,c['revision'])
   if row['decision']=='KEEP' and c['mode']!='yes_but':self.assertEqual(sha(ROOT/row['candidate_path']),row['r1_raw_sha256'])
 def test_move_to_rules_never_random_or_relabelled(self):
  rules=read(BASE/'rules-extraction.json')['rules'];moved={r['id'] for r in self.rows if r['decision']=='MOVE_TO_RULES'}
  self.assertEqual(71,len(rules));self.assertEqual(moved,{r['source_card_id'] for r in rules})
  self.assertFalse(moved&set(self.cards))
  self.assertTrue(all(r['implementation_status']=='NOT_IMPLEMENTED_BY_THIS_CHANGE' for r in rules))
 def test_p0_individual_veto_and_quarantine(self):
  tr=self.cards['YB-1111']['text']['tr']['proposal']
  self.assertIn('Her biriniz hoşunuza gitmeyen bir ifadeyi',tr);self.assertNotIn('ikinizin de sevmediği',tr)
  hold=next(r for r in self.rows if r['id']=='YB-1148');self.assertIn('/quarantine/',hold['candidate_path']);self.assertEqual('HOLD_PENDING_VERIFICATION',hold['approval_status'])
  self.assertIn('не техническая защита',self.cards['YB-1148']['text']['ru']['proposal'])
  self.assertIn('not technical protection',self.cards['YB-1148']['text']['en']['proposal'])
  self.assertIn('teknik olarak engellemez',self.cards['YB-1148']['text']['tr']['proposal'])
 def test_bilateral_responder_preserves_both_choices(self):
  for c in self.cards.values():
   if c['mode']!='yes_but':continue
   self.assertIn('согласия {P1}',c['text']['ru']['responder']);self.assertIn('подтверждения обоих',c['text']['ru']['responder'])
   self.assertIn('both explicitly confirm',c['text']['en']['responder']);self.assertIn('Her biriniz vazgeçebilirsiniz',c['text']['tr']['responder'])
 def test_no_premature_approval(self):
  for c in self.cards.values():
   self.assertEqual('draft',c['status']);self.assertIsNone(c['authoring']['reviewed_by']);self.assertIsNone(c['authoring']['reviewed_at']);self.assertEqual('needs_review',c['authoring']['rights_status'])
 def test_private_policy_and_public_recontext_consistency(self):
  for row in self.rows:
   if not row['candidate_path']:continue
   c=self.cards[row['id']]
   if c['interaction']=='pair_private':
    self.assertGreaterEqual(c['min_progression_stage'],3)
    if 'online' in c['meeting_contexts']:self.assertIn('private_text_chat',c['required_capabilities'])
   if row['decision']=='RECONTEXT' and self.original[c['id']]['interaction']=='pair_private':
    self.assertEqual('pair_public',c['interaction']);self.assertEqual(1,c['min_progression_stage']);self.assertEqual(0,c['min_comfort'])
    texts=' '.join(v for loc in c['text'].values() for v in loc.values())
    for phrase in ['в личном чате','в вашем личном','private chat','privately','özel sohbet','özel konuş']:self.assertNotIn(phrase,texts,c['id'])
 def test_unicode_and_required_runtime_scenarios(self):
  for c in self.cards.values():
   for fields in c['text'].values():
    for value in fields.values():self.assertEqual(value,unicodedata.normalize('NFC',value));self.assertNotIn('i\u0307',value)
  self.assertEqual(21,len(read(BASE/'semantic-clusters.json')['clusters']))
  scenarios=read(BASE/'required-scenarios.json')['scenarios'];self.assertEqual([f'V{i:02}' for i in range(1,16)],[s['id'] for s in scenarios])
  self.assertTrue(all(s['runtime_verification']=='NOT_RUN_BY_THIS_CONTENT_PROCESSOR' for s in scenarios))
 def test_extracted_ux_requirements_cover_every_removed_id(self):
  ux=read(BASE/'product-ux-requirements.json')['requirements']
  self.assertEqual(19,len(ux));self.assertEqual({r['id'] for r in self.rows if r['decision']=='MOVE_TO_RULES'},{i for u in ux for i in u['source_card_ids']})
  self.assertTrue(all(u['implementation_status']=='NOT_IMPLEMENTED_BY_THIS_CHANGE' and len(u['acceptance_scenario'])>40 for u in ux))
 def test_real_authoring_replay_preserves_old_revisions_and_chain(self):
  replay=EVIDENCE/'authoring/run-02'
  receipt=read(EVIDENCE/'authoring/snapshot-receipt.json')
  self.assertEqual(receipt['source_raw_sha256_before'],sha(ROOT/receipt['source_path']))
  exported=read(replay/'after-export.json');previous='0'*64
  for event in exported['events']:
   self.assertEqual(previous,event['previous']);self.assertEqual(digest({k:event[k] for k in ['kind','body','previous']}),event['hash']);previous=event['hash']
  self.assertEqual(previous,exported['head'])
  db=sqlite3.connect((replay/'r2-authoring.sqlite').as_uri()+'?mode=ro',uri=True)
  try:
   r1={row[0]:json.loads(row[1]) for row in db.execute('SELECT card_id,body FROM revisions WHERE revision=1')}
   self.assertEqual(self.original,r1)
   newest={row[0]:json.loads(row[1]) for row in db.execute('SELECT card_id,body FROM revisions ORDER BY card_id,revision')}
   self.assertEqual(450,len(newest));self.assertEqual(721,db.execute('SELECT count(*) FROM revisions').fetchone()[0])
   for key,c in self.cards.items():self.assertEqual(c,newest[key])
  finally:db.close()

if __name__=='__main__':unittest.main(verbosity=2)
