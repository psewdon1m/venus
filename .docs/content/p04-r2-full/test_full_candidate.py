"""Content/history regression checks; never approves human meaning, rights or translations.
Docker: python -B .../test_full_candidate.py --coverage-dir /tmp/p04-full/check --report /tmp/p04-full/tests.json
"""
from pathlib import Path
import argparse
from collections import Counter
import hashlib,json,re,sqlite3,sys,unittest
ROOT=Path(__file__).resolve().parents[3]
FULL=ROOT/'.docs/content/p04-r2-full'
EVIDENCE=ROOT/'.docs/implementation/evidence/p04/review-450-full-coverage'
parser=argparse.ArgumentParser()
parser.add_argument('--coverage-dir',type=Path,default=EVIDENCE/'full-check-02')
parser.add_argument('--report',type=Path)
args=parser.parse_args()
def load(path):return json.loads(path.read_text(encoding='utf-8'))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def canon(value):return json.dumps(value,ensure_ascii=False,separators=(',',':'),sort_keys=True)
def digest(value):return hashlib.sha256(canon(value).encode()).hexdigest()
CARDS={p.stem:load(p) for p in sorted((FULL/'cards').glob('*.json'))}
SOURCE=load(EVIDENCE/'source-copy-receipt.json')
CHANGES=load(EVIDENCE/'copied-card-revisions.json')['revisions']
NEW=load(EVIDENCE/'new-materialization.json')['cards']
BATCHES=load(FULL/'request-index.json')['batches']
TR_IDS=[1007,1038,1071,1086,1103,1106,1124,1128,1135,1141,1145]
class FullCandidateTests(unittest.TestCase):
 def test_original450_and_frozen379_unchanged(self):
  self.assertEqual(len(SOURCE['r1_card_raw_sha256']),450)
  for name,h in SOURCE['r1_card_raw_sha256'].items():self.assertEqual(sha(ROOT/'.docs/content/p04/cards'/name),h,name)
  for name,h in SOURCE['r2_card_raw_sha256'].items():self.assertEqual(sha(ROOT/name),h,name)
  frozen=SOURCE['freeze'];self.assertEqual(sha(ROOT/frozen['card_map_path']),frozen['card_map_raw_sha256']);self.assertEqual(sha(ROOT/'.docs/content/p04-r2/dispositions.json'),frozen['dispositions_raw_sha256'])
 def test_packaged_readonly_original_ledger_snapshot(self):
  self.assertEqual(SOURCE['original_ledger_raw_sha256_before'],SOURCE['original_ledger_raw_sha256_after'])
  snapshot=EVIDENCE/'authoring/r1-readonly-backup.sqlite';self.assertEqual(sha(snapshot),SOURCE['readonly_backup_raw_sha256'])
  db=sqlite3.connect(snapshot.resolve().as_uri()+'?mode=ro',uri=True)
  try:
   for table,count in [('batches',27),('reservations',450),('revisions',450),('events',54)]:self.assertEqual(db.execute('SELECT COUNT(*) FROM '+table).fetchone()[0],count)
   for identity,body in db.execute('SELECT card_id,body FROM revisions'):self.assertEqual(json.loads(body),load(ROOT/'.docs/content/p04/cards'/f'{identity}.json'))
  finally:db.close()
 def test_exact_active_selection_excludes_removed_and_quarantine(self):
  old={Path(name).stem for name in SOURCE['r2_card_raw_sha256'] if '/cards/' in name};new={r['id'] for r in NEW}
  self.assertEqual(len(CARDS),450);self.assertEqual(set(CARDS),old|new);self.assertEqual(len(new),72);self.assertFalse(new&old)
  self.assertNotIn('YB-1148',CARDS);self.assertFalse(set(SOURCE['old_removed_ids'])&set(CARDS));self.assertTrue(all(int(i.split('-')[1])>=1151 for i in new))
 def test_draft_rights_and_physical_guards(self):
  for c in CARDS.values():
   self.assertEqual(c['status'],'draft');self.assertEqual(c['authoring']['rights_status'],'needs_review');self.assertIsNone(c['authoring']['reviewed_by']);self.assertIsNone(c['authoring']['reviewed_at']);self.assertEqual(c['authoring']['origin'],'agent');self.assertFalse(c['requires_physical_contact']);self.assertFalse(c['requires_going_away'])
 def test_balanced150_and30_categories(self):
  for mode in ['questions','truth_or_dare','yes_but']:
   cards=[c for c in CARDS.values() if c['mode']==mode];self.assertEqual(len(cards),150);self.assertEqual(Counter(c['category'] for c in cards),dict.fromkeys(['icebreaker','music','humor','friendship','boundaries'],30))
 def test_actual_public_and_private_profiles(self):
  for mode in ['questions','truth_or_dare','yes_but']:
   cards=[c for c in CARDS.values() if c['mode']==mode];public=[c for c in cards if c['interaction']!='pair_private'];self.assertEqual(len(public),100)
   for c in public:self.assertEqual(c['min_comfort'],0);self.assertEqual(c['min_progression_stage'],1);self.assertIn(c['relationship_scope'],['none','acquaintance']);self.assertEqual(set(c['meeting_contexts']),{'online','in_person'})
   for ctx in ['in_person','online']:
    private=[c for c in cards if c['interaction']=='pair_private' and c['meeting_contexts']==[ctx]];self.assertEqual(len(private),25)
    for c in private:self.assertEqual(c['relationship_scope'],'friend_or_more');self.assertEqual(c['min_comfort'],1);self.assertEqual(c['min_progression_stage'],3);self.assertEqual(c['consent'],'bilateral');self.assertEqual(c['required_capabilities'],['private_text_chat'] if ctx=='online' else [])
 def test_copied_revision_lineage_and_exact_untouched_bytes(self):
  changed={r['id']:r for r in CHANGES}
  for identity,c in CARDS.items():
   if int(identity.split('-')[1])>=1151:continue
   old=load(ROOT/'.docs/content/p04-r2/cards'/f'{identity}.json')
   if identity in changed:
    row=changed[identity];self.assertEqual(c['revision'],old['revision']+1);self.assertEqual(sha(ROOT/row['before_snapshot']),row['before_raw_sha256']);self.assertEqual(sha(FULL/'cards'/f'{identity}.json'),row['after_raw_sha256'])
   else:self.assertEqual(sha(FULL/'cards'/f'{identity}.json'),sha(ROOT/'.docs/content/p04-r2/cards'/f'{identity}.json'))
 def test_schema_roles_and_locale_parity(self):
  sys.path.insert(0,str(ROOT/'tools'));from validate_cards import check_card
  from jsonschema import Draft202012Validator,FormatChecker
  v=Draft202012Validator(load(ROOT/'.docs/contracts/card.schema.json'),format_checker=FormatChecker())
  for identity,c in CARDS.items():self.assertEqual(list(v.iter_errors(c)),[],identity);self.assertEqual(check_card(c),[],identity)
 def test_known12_turkish_repairs(self):
  for n in TR_IDS:self.assertRegex(CARDS[f'YB-{n}']['text']['tr']['proposal'],r'(meyi|mayı) öner[.:]');self.assertNotRegex(CARDS[f'YB-{n}']['text']['tr']['proposal'],r'(gerekmiyor|gerekmiyor|ediyor\?|paylaşabilirsiniz|anlatabilirsiniz|geçebilirsiniz) öner')
  text=CARDS['TD-1108']['text']['tr']['dare'];self.assertIn('açık ve somut bir açıklama',text);self.assertNotIn('kesin açıklama',text)
 def test_round02_actor_number_repairs(self):
  self.assertIn('расскажите только друг другу',CARDS['TD-1161']['text']['ru']['dare']);self.assertNotIn('и расскажи только',CARDS['TD-1161']['text']['ru']['dare'])
  self.assertIn('Penceredeki anlatıcılar olun',CARDS['TD-1158']['text']['tr']['dare']);self.assertIn('Be narrators at a window',CARDS['TD-1158']['text']['en']['dare'])
 def test_named_semantic_pairs_changed_outputs(self):
  expected={'YB-1003':('proposal','two clues'),'TD-1056':('dare','laundry bill'),'YB-1116':('proposal','shared imaginary joke'),'YB-1150':('proposal','for tomorrow')}
  for identity,(field,marker) in expected.items():self.assertIn(marker,CARDS[identity]['text']['en'][field]);self.assertNotEqual(CARDS[identity]['text'],load(ROOT/'.docs/content/p04-r2/cards'/f'{identity}.json')['text'])
  self.assertNotIn('closing word',CARDS['Q-1150']['text']['en']['question']);self.assertIn('time traveller',CARDS['TD-1022']['text']['en']['truth']);self.assertIn('what material',CARDS['YB-1131']['text']['en']['proposal']);self.assertNotIn('thank',CARDS['TD-1070']['text']['en']['dare'].lower())
 def test_requests_reserved_before_new_draft_events(self):
  exported=load(EVIDENCE/'authoring/full-after-export-final.json');events=exported['events'];previous='0'*64
  for row in events:self.assertEqual(row['previous'],previous);self.assertEqual(row['hash'],digest({'kind':row['kind'],'body':row['body'],'previous':previous}));previous=row['hash']
  self.assertEqual(previous,exported['head'])
  for batch in BATCHES:
   request=load(ROOT/batch['path']);self.assertEqual(sha(ROOT/batch['path']),batch['request_sha256']);reserved=[r for r in events if r['kind']=='RESERVED' and r['body']['batch_id']==batch['batch_id']];recorded=[r for r in events if r['kind']=='DRAFT_RECORDED' and r['body']['batch_id']==batch['batch_id']];self.assertEqual(len(reserved),1);self.assertTrue(recorded);self.assertLess(reserved[0]['seq'],min(r['seq'] for r in recorded));self.assertEqual(reserved[0]['body']['request_sha256'],batch['request_sha256']);self.assertEqual(request['source_catalog_digest'],SOURCE['source_pack_digest'])
 def test_owned_ledger_history522_selects450_current(self):
  db=sqlite3.connect((EVIDENCE/'authoring/full-authoring.sqlite').resolve().as_uri()+'?mode=ro',uri=True)
  try:
   latest={}
   for identity,rev,h,body in db.execute('SELECT card_id,revision,hash,body FROM revisions ORDER BY card_id,revision'):latest[identity]=(rev,h,json.loads(body))
   self.assertEqual(len(latest),522)
   for identity,c in CARDS.items():self.assertEqual(latest[identity],(c['revision'],digest(c),c),identity)
  finally:db.close()
 def test_actual_full_C2_bound_to_final450(self):
  directory=args.coverage_dir;analysis=load(directory/'analysis.json');manifest=load(directory/'manifest.json');index=load(directory/'input-index.json')
  self.assertEqual(manifest['total_cards'],450);self.assertEqual(manifest['reviewed_cards'],0);self.assertEqual(len(index['files']),450);self.assertTrue(index['snapshot_directory_unchanged']);self.assertEqual({Path(p).name:h for p,h in index['files'].items()},{p.name:sha(p) for p in (FULL/'cards').glob('*.json')})
  self.assertEqual(analysis['exact_duplicates'],0);self.assertEqual(len(analysis['similarity_queue']),0)
  for name in ['coverage.json','coverage-private-chat.json']:
   coverage=load(directory/name);self.assertEqual(coverage['private_coverage'],'PASS');self.assertEqual(coverage['neutral20'],'PASS');self.assertEqual(coverage['pack_digest'],'sha256:'+manifest['canonical_payload_sha256']);self.assertEqual(len(coverage['cells']),5880)
   neutral=[r for r in coverage['sessions'] if r['profile']=='neutral_C0_F'];self.assertEqual(len(neutral),4200);self.assertTrue(all(r['status']=='PASS' for r in neutral));self.assertEqual({r['rounds'] for r in neutral},set(range(1,101)))
   for mode in ['questions','truth_or_dare','yes_but']:
    for ctx in ['online','in_person']:
     row=next(c for c in coverage['cells'] if c['mode']==mode and c['context']==ctx and c['size']==2 and c['comfort']==1 and c['stage']==3 and c['resolved_class']=='F');available=ctx=='in_person' or name=='coverage-private-chat.json';self.assertEqual(row['private_baseline_card_count'],25 if available else 0);self.assertEqual(row['private_profile_status'],'SUPPORTED' if available else 'CAPABILITY_UNAVAILABLE')
result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FullCandidateTests))
summary={'schema_version':1,'status':'PASS' if result.wasSuccessful() and not result.skipped else 'PASS_WITH_EXPLICIT_SKIP' if result.wasSuccessful() else 'FAIL','tests_run':result.testsRun,'failures':len(result.failures),'errors':len(result.errors),'skipped':[reason for _,reason in result.skipped],'active_draft_cards':len(CARDS),'coverage_dir':str(args.coverage_dir),'approval_scope':'AUTOMATED_DRAFT_REGRESSION_ONLY','human_approval':False}
if args.report:
 args.report.parent.mkdir(parents=True,exist_ok=True)
 with args.report.open('x',encoding='utf-8') as f:json.dump(summary,f,indent=2);f.write('\n')
print(json.dumps(summary));sys.exit(0 if result.wasSuccessful() else 1)
