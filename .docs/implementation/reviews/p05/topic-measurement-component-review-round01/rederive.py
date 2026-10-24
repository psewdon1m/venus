"""Independent complete finite support proof; no selector samples/statistics."""
from pathlib import Path
import collections,hashlib,itertools,json,sys,zipfile
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4];B=ROOT/'.artifacts/p05-topic-measurements';P=ROOT/'.docs/implementation/reviews/p05/topic-measurement-executable-preparation-01'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def h(b):return hashlib.sha256(b).hexdigest()
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
def require(v,message):
 if not v:raise AssertionError(message)
idx=load(P/'INDEX.json');require(h((P/'INDEX.json').read_bytes())=='0cbf5b1c018dd7ac247eb3049b07d6237568c783274c2ea14652e2665b872055','candidate index SHA')
for x in idx['files']:
 b=(P/x['path']).read_bytes();require(len(b)==x['bytes'] and h(b)==x['sha256'],'candidate child '+x['path'])
pins=load(P/'author-inputs.json');compiled=load(P/'compiled-inputs.json')
for n,s in {**pins,**compiled}.items():require(h((ROOT/n).read_bytes())==s,'live paused/compiled pin '+n)
with zipfile.ZipFile(P/'author-checkpoint.zip') as z:
 names=[i.filename for i in z.infolist() if not i.is_dir()];require(len(names)==len(set(names))==61,'61 unique ZIP inputs')
 aligned={'.artifacts/p05-topic-measurements/'+n:h(z.read(n)) for n in names};require(aligned==pins,'ZIP declared relative archive root')
require(h((P/'author-checkpoint.zip').read_bytes())=='1f2d00e442779d13d7dc3dc90f16e760e8edcbb26a5940ab81a96ef73e20ec61','checkpoint ZIP SHA')
F=B/'fixture-checkpoint02';cards=load(F/'cards.json');byid={c['id']:c for c in cards};entries={e['card_id']:e for e in load(F/'map.json')['entries']};families=load(F/'semantic.json')['families']
require(len(cards)==len(byid)==len(entries)==4930,'fixture cards');require(len(families)==1057,'family count')
private=[x for x in families if x['semantic_family_id'].startswith('M-PRIVATE')];public=[x for x in families if x['semantic_family_id'].startswith('M-PUBLIC')]
require(len(private)==672 and len(public)==384,'distinct units, not variant multiplication')
require(all(len(x['members'])==6 for x in private),'six variants are one family')
excluded={m['card_id'] for f in families if f['mixed_visibility'] or f['repertoire']=='exclude' for m in f['members']};require(excluded=={'Q-9000','Q-9001'},'whole mixed family quarantine')
unions=[['creative'],['music'],['romance'],['creative','music'],['creative','romance'],['music','romance'],['creative','music','romance']]
unionfamilies=collections.defaultdict(set)
for c in cards:
 e=entries[c['id']];require(len(e['semantic_family_ids'])==1,'single explicit family per fixture card')
 if c['interaction']=='pair_private' and c['id'] not in excluded:
  require(c['relationship_scope']=='friend_or_more' and c['min_comfort']==1 and c['min_progression_stage']==3 and c['consent']=='bilateral' and not c['requires_physical_contact'] and not c['requires_going_away'],'homogeneous private hard metadata')
  require(c['meeting_contexts'] in [['online'],['in_person']],'one exact context')
  require(c['required_capabilities']==(['private_text_chat'] if c['meeting_contexts']==['online'] else []),'private cap exact')
  unionfamilies[tuple(e['topic_ids'])].update(e['semantic_family_ids'])
require(set(unionfamilies)==set(map(tuple,unions)) and all(len(s)==96 for s in unionfamilies.values()),'seven independent96-family unions')
sets=load(B/'support-checkpoint03-exactbytes/family-sets.json')
for key,value in sets.items():require(h(compact(value))==key and len(value)==len(set(value)),'retained list SHA/unique '+key)
rows=[json.loads(line) for line in (B/'support-checkpoint03-exactbytes/rows.ndjson').read_text(encoding='utf-8').splitlines()]
require(len(rows)==11760,'complete compressed rows')
expectedkeys=set(itertools.product(['DEFAULT_OFF','CHAT_ON'],['T0_ALL','T1_EMPTY','T2_COMMON','T3_ASYMMETRIC_EXCLUSION','T4_PRIVATE_PRIOR','T5_PUBLIC_AND_PRIVATE_PRIOR','T6_TARGETED_CHANGES'],['online','in_person'],range(1,5),range(5),['X','J','F','G','M','S','R'],['questions','truth_or_dare','yes_but']))
actualkeys=set();cardorder=sorted(cards,key=lambda c:c['id']);cache={};verified_refs=0
def equal_ref(ref,expected):
 require(ref['count']==len(expected) and ref['sha256']==h(compact(expected)) and sets[ref['sha256']]==expected,'exact independently rederived residual reference')
for row in rows:
 k=row['key'];cap,regime,context,stage,comfort,cl,mode=k['capability'],k['topic_regime'],k['context'],k['stage'],k['comfort'],k['class_profile'],k['mode'];key=(cap,regime,context,stage,comfort,cl,mode);require(key not in actualkeys,'duplicate guard');actualkeys.add(key)
 status='RULE_EXCLUDED_STAGE' if stage<3 else 'RULE_EXCLUDED_COMFORT' if comfort==0 else 'RULE_EXCLUDED_CLASS' if cl in ['X','J'] else 'CAPABILITY_UNAVAILABLE' if context=='online' and cap=='DEFAULT_OFF' else 'TOPIC_SAFE_EMPTY' if regime=='T1_EMPTY' else 'SUPPORTED_COMPLETE'
 require(row['expected_status']==status,'independent guard precedence')
 raw=[c['id'] for c in cardorder if c['mode']==mode and c['interaction']=='pair_private'];quarantine=[n for n in raw if n not in excluded]
 hard=[n for n in quarantine if context in byid[n]['meeting_contexts']] if status not in ['RULE_EXCLUDED_STAGE','RULE_EXCLUDED_COMFORT','RULE_EXCLUDED_CLASS','CAPABILITY_UNAVAILABLE'] else []
 allow=set() if regime=='T1_EMPTY' else {'creative'} if regime=='T2_COMMON' else {'creative','music','romance'};denied={'creative'} if regime=='T3_ASYMMETRIC_EXCLUSION' else set()
 topic=[n for n in hard if set(entries[n]['topic_ids'])<=allow and not(set(entries[n]['topic_ids'])&denied)]
 prior={f'M-PRIVATE-U0-F{i}' for i in range(3)} if regime in ['T4_PRIVATE_PRIOR','T5_PUBLIC_AND_PRIVATE_PRIOR'] else set()
 no_private=[n for n in topic if not(set(entries[n]['semantic_family_ids'])&prior)];target=[n for n in no_private if regime!='T6_TARGETED_CHANGES' or 'creative' in entries[n]['topic_ids']]
 residual=sorted({f for n in target for f in entries[n]['semantic_family_ids']})
 expected={'baseline_raw_card_ids':raw,'after_whole_family_quarantine':quarantine,'after_context_class_comfort_capability':hard,'after_full_union_allow_exclude':topic,'after_room_public_semantic_history':topic,'after_same_pair_private_semantic_history':no_private,'after_targeted_topics':target,'distinct_residual_family_ids':residual}
 for field,value in expected.items():equal_ref(row[field],value);verified_refs+=1
 require(row['sorted_family_sha256']==h(compact(residual)) and row['baseline_common']==len(hard),'direct scalars')
 require(row['remaining_private_opportunities']==25 and row['remaining_candidate_attempt_budget']==75 and row['conservative_max_initial_candidate_demand']==75,'conservative R100 initial demand')
 require(k['requested_full_topic_union']==(['creative'] if regime=='T6_TARGETED_CHANGES' else []),'target full union')
 require([x['topic_ids'] for x in row['per_union']]==unions,'complete union order')
 for x in row['per_union']:
  fs=sorted({f for n in target if entries[n]['topic_ids']==x['topic_ids'] for f in entries[n]['semantic_family_ids']});equal_ref(x['families'],fs);verified_refs+=1
  require(not fs or len(fs)>=93,'single union residual >=93 >=75, no cards/actors multiplication')
require(actualkeys==expectedkeys,'lossless complete finite cartesian guard coverage')
# Reachability and demand for every registered N/R are explicit rather than
# executed sessions. Actor pair permutation cannot change checked homogeneous metadata.
reachable={r:sorted({min(4,1+(4*(i-1))//max(1,r-1)) for i in range(1,r+1)}) for r in range(1,101)}
require(all(3*((r+3)//4)<=75 for r in range(1,101)),'all100 R demand bounds')
support=load(B/'support-checkpoint03-exactbytes/report.json')
require(len(support['T6_exclusion_transitions'])==3*2*7,'all42 possible exclusion transitions')
for t in support['T6_exclusion_transitions']:
 expected=sorted({f for union,fs in unionfamilies.items() if not(set(union)&set(t['excluded_full_union'])) for f in fs});equal_ref(t['residual'],expected)
 require(t['status']==('SUPPORTED_COMPLETE' if expected else 'TOPIC_SAFE_EMPTY'),'T6 intended empty retained')
for x in support['public_support']:
 fs=sorted({f for c in cards if c['mode']==x['mode'] and c['interaction']==x['interaction'] and c['id'] not in excluded for f in entries[c['id']]['semantic_family_ids']});equal_ref(x['initial_families'],fs);require(len(fs)==128 and x['worst_three_public_prior']==125 and x['maximum_round_demand']==100,'public family bound')
names=load(B/'contracts/public-features.json')['names'];require(len(names)==len(set(names))==1075 and h(compact(names))=='2eba539a5104c8102606b8880f5d0113448a8d8fba11f1838cca16d50ad88bdd','exact feature order/hash')
result={'schema_version':1,'scope':'INDEPENDENT_COMPLETE_FINITE_CORPUS_AND_RESIDUAL_SUPPORT_REDERIVATION_NOT_STATISTICAL_SELECTOR_ACCEPTANCE','paused_author_inputs_verified':61,'compiled_inputs_verified':len(compiled),'fixture_cards':4930,'distinct_families':1057,'private_distinct_families':672,'private_variants_per_family':6,'full_unions':7,'families_per_full_union':96,'compressed_rows_verified':len(rows),'unique_complete_guard_keys':len(actualkeys),'losslessly_represented_guard_N_R_axes':len(rows)*7*100,'exact_residual_references_compared':verified_refs,'minimum_nonempty_supported_exact_union_residual':93,'maximum_conservative_candidate_demand':75,'T6_transitions_verified':42,'feature_names':1075,'feature_name_sha256':h(compact(names)),'R_reachability_sets':reachable,'statistical_samples_executed':0,'sessions_simulated':0,'human_approval':False,'full_stage_acceptance':False}
(OUT/'finite-rederivation.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in result.items() if k!='R_reachability_sets'}))
