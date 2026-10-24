"""Finite exact450 upper-bound and certificate-corruption controls only."""
from pathlib import Path
import collections,copy,hashlib,json
OUT=Path(__file__).resolve().parent;ROOT=OUT.parents[4];B=ROOT/'.artifacts/p05-topic-measurements'
def load(p):return json.loads(p.read_text(encoding='utf-8'))
def h(b):return hashlib.sha256(b).hexdigest()
def compact(v):return json.dumps(v,ensure_ascii=False,separators=(',',':')).encode()
report=load(B/'draft-capacity-result.json');design=load(B/'draft-capacity-design.json')
for n,s in report['inputs'].items():assert h((ROOT/n).read_bytes())==s,n
mapping=load(ROOT/design['inputs'][0]);semantic=load(ROOT/design['inputs'][1]);cards=[load(ROOT/e['source_path']) for e in mapping['entries']];assert len(cards)==450
excluded={m['card_id'] for f in semantic['families'] if f.get('mixed_visibility') or f['semantic_family_id'] in ['P04-SEM-17','P04-SEM-18'] for m in f['members']};assert sorted(excluded)==report['excluded_whole_family_card_ids']
policy=load(ROOT/'packages/relationship-engine/src/policy.json');classes=['X','J','F','G','M','S','R'];seen=set();gaps=0;examples=[]
for row in report['rows']:
 size,mode,context,cl=row['size'],row['mode'],row['context'],row['class_profile'];key=(size,mode,context,cl);assert key not in seen;seen.add(key);ids=set()
 for c in cards:
  if c['mode']!=mode or c['interaction']=='pair_private' or c['id'] in excluded:continue
  if context not in c['meeting_contexts'] or c['min_progression_stage']>4 or c['required_capabilities'] or c['min_comfort']!=0:continue
  if c['requires_physical_contact'] or c['requires_going_away'] or c['relationship_scope'] not in ['none','acquaintance']:continue
  if c['interaction']=='pair_public':
   if cl=='X' or classes.index(cl)<classes.index(policy['relationship_scope_min_class'][c['relationship_scope']]):continue
  elif c['relationship_scope']!='none':continue
  ids.add(c['id'])
 upper=len(ids);intentional=mode=='yes_but' and cl=='X';expected='EXPECTED_SAFE_REFUSAL' if intentional else 'CONDITIONAL_CONTENT_GAP' if upper<100 else 'UPPER_BOUND_NOT_SUFFICIENT_TO_CERTIFY_SUPPORT'
 assert row['card_ids']==sorted(ids) and row['optimistic_distinct_hard_public_card_upper_bound']==upper and row['status']==expected
 assert row['conditional_deficit_R_interval']==([upper+1,100] if not intentional and upper<100 else None)
 gaps+=expected=='CONDITIONAL_CONTENT_GAP'
 if size==2 and cl in ['F','X']:examples.append({'mode':mode,'context':context,'class':cl,'upper':upper,'status':expected})
assert len(seen)==294 and gaps==196
# A verifier that rederives sets must reject tempting but invalid support units.
sets=load(B/'support-checkpoint03-exactbytes/family-sets.json');rows=[json.loads(s) for s in (B/'support-checkpoint03-exactbytes/rows.ndjson').read_text(encoding='utf-8').splitlines()]
row=next(r for r in rows if r['expected_status']=='SUPPORTED_COMPLETE' and r['distinct_residual_family_ids']['count']>0);ref=row['distinct_residual_family_ids'];expected=sets[ref['sha256']]
def valid(candidate,array=expected):return candidate['count']==len(array) and candidate['sha256']==h(compact(array)) and len(array)==len(set(array)) and array==expected
mutations=[]
for name,ref_mut,array in [('variant_multiplication',dict(ref,count=ref['count']*6),expected),('actor_pair_multiplication',dict(ref,count=ref['count']*28),expected),('family_list_changed',ref,expected[:-1]),('same_size_family_id_corruption',ref,[expected[0]+'x',*expected[1:]]),('duplicate_family_padding',ref,[expected[0],*expected[1:-1],expected[0]])]:
 rejected=not valid(ref_mut,array);assert rejected;mutations.append({'id':name,'status':'EXPECTED_REJECTION','scope':'Independent certificate-verifier control, not a production parser claim'})
result={'schema_version':1,'scope':'INDEPENDENT_FINITE_450_CONDITIONAL_UPPER_BOUND_AND_CERTIFICATE_CONTROLS','exact_source_card_raw_pins_verified':450,'finite_profiles_verified':294,'lossless_R_rows':29400,'conditional_gap_profiles':196,'examples':examples,'corruption_controls':mutations,'statistical_samples_executed':0,'selector_sessions_executed':0,'synthetic_conversion_of450':False,'human_approval':False,'full_stage_acceptance':False}
(OUT/'capacity-and-corruption.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result))
