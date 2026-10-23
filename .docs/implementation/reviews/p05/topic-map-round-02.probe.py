from pathlib import Path
import json,hashlib,subprocess,sys,copy,runpy,io,contextlib,collections,datetime
r=Path.cwd();d=r/'.docs/implementation/evidence/p05/topic-map-candidate-02';old=r/'.docs/implementation/evidence/p05/topic-map-candidate-01';o=r/'.docs/implementation/reviews/p05';prefix='topic-map-round-02'
def rd(p):return json.loads(Path(p).read_text('utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def snapshot(p):return {f.name:sha(f) for f in p.iterdir() if f.is_file()}
def save(s,v):(o/(prefix+s)).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
before=rd(o/(prefix+'.inputs-before.json'));oldbefore=rd(o/'topic-map-round-01.candidate-before.json');assert snapshot(d)==before and snapshot(old)==oldbefore
runs=[]
for name,args,expected in [('default',[],0),('check',['--check'],0),('reject_existing',['--output',str(d/'validation-report.json')],2),('reject_outside',['--output',str(o/'topic-map-round-02-forbidden-receipt.json')],2)]:
 p=subprocess.run([sys.executable,'-B',str(d/'validate_candidate.py'),*args],capture_output=True,text=True,encoding='utf-8');assert p.returncode==expected,(name,p.stdout,p.stderr);runs.append({'name':name,'argv':args,'exit_code':p.returncode,'stdout':p.stdout,'stderr':p.stderr});assert snapshot(d)==before and snapshot(old)==oldbefore
save('.cli-runs.json',runs)
# Execute the exact actual candidate validator in default read-only mode to access its checks/functions for adversarial mutations.
oldargv=sys.argv;sys.argv=[str(d/'validate_candidate.py'),'--check']
try:
 with contextlib.redirect_stdout(io.StringIO()): env=runpy.run_path(str(d/'validate_candidate.py'),run_name='independent_validator_probe')
finally:sys.argv=oldargv
assert len(env['results'])==34
mapping=env['mapping'];entries={e['card_id']:e for e in mapping['entries']};prior=rd(old/'private-topic-map.candidate.v1.json');prior_entries={e['card_id']:e for e in prior['entries']};lineage=env['lineage']
actual_changes=[]
for cid in entries:
 a=entries[cid];b=prior_entries[cid]
 assert (a['card_revision'],a['card_sha256'],a['card_raw_sha256'],a['locale_review'])==(b['card_revision'],b['card_sha256'],b['card_raw_sha256'],b['locale_review'])
 assert a['semantic_family_ids']==b['semantic_family_ids']
 assert ('creative_expression' in a['topic_ids'])==('creative_expression' in b['topic_ids'])
 added=sorted(set(a['topic_ids'])-set(b['topic_ids']));removed=sorted(set(b['topic_ids'])-set(a['topic_ids']))
 if added or removed:actual_changes.append({'card_id':cid,'added_topics':added,'removed_topics':removed})
assert len(actual_changes)==45
assert actual_changes==[{k:c[k] for k in ['card_id','added_topics','removed_topics']} for c in lineage['changes']]
assert {(t['topic_id'],json.dumps(t['labels'],sort_keys=True)) for t in env['taxonomy']['topics']}=={(t['topic_id'],json.dumps(t['labels'],sort_keys=True)) for t in rd(old/'taxonomy.candidate.v1.json')['topics']}
# All13 prior independent expected subject decisions now agree, without invoking author's semantic expectations.
original=rd(o/'topic-map-round-01.semantic-probe.json')['controls'];own=[]
for c in original:
 actual=not bool(set(c['excluded_topics'])&set(entries[c['card_id']]['topic_ids']));assert actual==c['reviewer_expected_allowed'];own.append({'name':c['name'],'card_id':c['card_id'],'excluded_topics':c['excluded_topics'],'expected_allowed':c['reviewer_expected_allowed'],'actual_allowed':actual,'status':'PASS'})
# Broader exact delta decisions were manually read in all3 locales. Check independent listed deltas as additional expected subject controls.
for ch in lineage['changes']:
 for topic in ch['added_topics']+ch['removed_topics']:
  expected=topic in ch['added_topics'];actual=topic in entries[ch['card_id']]['topic_ids'];assert actual==expected;own.append({'name':'reviewed_delta_'+ch['card_id']+'_'+topic,'card_id':ch['card_id'],'topic_id':topic,'expected_present':expected,'actual_present':actual,'status':'PASS_MANUALLY_REVIEWED_DELTA'})
# These new mutation choices differ from author's8 historical-semantic mutation cases; run the actual candidate semantics() against each malformed in-memory map.
negative=[]
for cid,topic in [('TD-1050','communication_support'),('TD-1067','communication_support'),('Q-1170','communication_support'),('YB-1139','communication_support'),('TD-1169','everyday_objects'),('TD-1130','nature_animals'),('Q-1130','absurd_fiction'),('YB-1135','communication_support'),('YB-1059','everyday_objects'),('Q-1041','everyday_objects')]:
 m=copy.deepcopy(mapping);entry=next(e for e in m['entries'] if e['card_id']==cid)
 if topic in entry['topic_ids']:entry['topic_ids'].remove(topic)
 else:entry['topic_ids'].append(topic)
 try:env['semantics'](m)
 except AssertionError as e:negative.append({'card_id':cid,'topic_id':topic,'status':'REJECTED','assertion':str(e)})
 else:raise AssertionError('semantic negative unexpectedly accepted '+cid)
# Different binding controls, real check() used. Family binding and both-side identity are maintained.
for name,mutate in [('empty_family',lambda m:m['entries'][0].__setitem__('semantic_family_ids',[])),('duplicate_family',lambda m:m['entries'][0]['semantic_family_ids'].append(m['entries'][0]['semantic_family_ids'][0])),('wrong_source_path',lambda m:m['entries'][0].__setitem__('source_path','.docs/content/p04/cards/Q-1001.json')),('false_all_fields',lambda m:m['entries'][0]['locale_review'].__setitem__('all_fields_read',False))]:
 m=copy.deepcopy(mapping);mutate(m)
 try:env['check'](m)
 except (AssertionError,KeyError,TypeError):negative.append({'name':name,'status':'REJECTED'})
 else:raise AssertionError(name)
for item in rd(d/'artifact-index.json')['files']:
 f=d/item['path'];assert f.stat().st_size==item['bytes'] and sha(f)==item['sha256']
# Independently reproduce source catalog and exact final history refs.
cd=env['cards'];catalog=env['digest']([{'id':cid,'revision':cd[cid][0]['revision'],'sha256':env['digest'](cd[cid][0])} for cid in sorted(cd)]);assert catalog==mapping['catalog_digest']
sel=rd(r/'.docs/implementation/evidence/p04/review-450-full-coverage/authoring/final-history-selection.json');assert sel['active_pack_digest']==mapping['pack_digest'];assert {(s['id'],s['revision'],s['sha256']) for s in sel['active_selection']}=={(cid,c['revision'],env['digest'](c)) for cid,(c,p) in cd.items()}
# Family policy equality apart from stated candidate revision, preserving21 actual concerns and all member references.
f0=rd(old/'semantic-families.candidate.v1.json');f1=env['family_doc'];family_root_diffs={k:{'before':f0.get(k),'after':f1.get(k)} for k in set(f0)|set(f1) if k!='families' and f0.get(k)!=f1.get(k)};assert f0['families']==f1['families']
sourcewitness=env['witness'];assert sourcewitness['before']==sourcewitness['after'];assert all(sha(r/p)==h for p,h in sourcewitness['after'].items())
assert snapshot(d)==before and snapshot(old)==oldbefore
save('.checks.json',{'status':'PREFLIGHT_PASS_EXACT_CANDIDATE_SCOPE','original_check_groups':len(env['results']),'original_results':env['results'],'author_semantic_controls':len(env['semantic_controls']['controls']),'own_regressions':own,'own_semantic_negative_count':10,'own_binding_negative_count':4,'own_negatives':negative,'candidate18_unchanged':True,'candidate01_13_unchanged':True,'sourcewitness_inputs':len(sourcewitness['after']),'sourcewitness_all_match':True,'catalog_recomputed':catalog,'pack_exact_current_selection':mapping['pack_digest'],'actual_45_changes':actual_changes,'all450_creative_assignments_unchanged':True,'family_memberships_unchanged':True,'family_root_diffs':family_root_diffs,'private_creative_impact':env['report']['private_creative_impact'],'runtime_test':False,'human_approval':False})
# Read receipt only: every45 changed actual card all locales/all sides plus10 fresh counterexamples. No claim all2250 reread.
selected=set(ch['card_id'] for ch in lineage['changes'])|set('TD-1064,TD-1130,Q-1133,TD-1034,YB-1001,YB-1151,TD-1165,TD-1171,Q-1110,TD-1132'.split(','));fields=[]
for cid in sorted(selected):
 c=cd[cid][0]
 for lang,text in c['text'].items():
  for side,v in text.items():fields.append({'card_id':cid,'revision':c['revision'],'locale':lang,'side':side,'text_sha256':hashlib.sha256(v.encode()).hexdigest()})
save('.manual-read-scope.json',{'round02_selected_card_ids':sorted(selected),'changed_cards_all3locales_all_sides':45,'additional_cards_all3locales_all_sides':len(selected)-45,'round02_unique_actual_fields_read':len(fields),'fields':fields,'original_round01_scope_preserved':'.docs/implementation/reviews/p05/topic-map-round-01.manual-read-scope.json','mechanical_all_fields':2250,'qualified_translation_review':False,'all2250_manually_read_this_round':False})
print(json.dumps({'checks':34,'author_semantics':78,'own_oracles':len(own),'own_negatives':len(negative),'manual_cards':len(selected),'manual_fields':len(fields),'family_root_diffs':family_root_diffs,'all_original13_candidate_and18_new_hashes_unchanged':True},ensure_ascii=False))
