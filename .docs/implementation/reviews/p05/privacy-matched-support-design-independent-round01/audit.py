from pathlib import Path
import hashlib,json,base64,datetime
R=Path('C:/.projects/venus');O=Path(__file__).resolve().parent;A=R/'.docs/implementation/reviews/p05/privacy-matched-support-source-audit-round01'
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));pin=lambda p:{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
assert pin(A/'INDEX.json')['sha256']=='47b5e5a26300518e248a94d57915be14c8a23e707bc18c1de4707066ac23ae41'
index=read(A/'INDEX.json')
for f in index['files']:assert pin(A/f['path'])=={k:f[k] for k in ['bytes','sha256']}
inputs=read(A/'INPUTS.json')
for n,p in inputs['pins'].items():assert pin(R/n)==p
c=read(A/'CONSTRUCTION-INPUTS.json');grid=read(R/'.docs/implementation/reviews/p05/privacy-matched-a18-actual-independent-round01/CELL-COVERAGE.json')['cells'];count=0
assert [x['descriptor']['ordinal'] for x in c['fixed_existing_R100_descriptors']]==[7,27,29,41,69]
for x in c['fixed_existing_R100_descriptors']:
 d=x['descriptor'];obs=grid[d['cell']]['observations'][1];assert d['rounds']==100 and obs['ordinal']==d['ordinal'] and obs['seed']==d['seed'];assert obs['arms']==x['entire_executed_native_arms'];assert x['prior_private_rows']==obs['prior_private_rows']>0
 for k in x['proposed_supplemental_comparisons']:
  count+=1;pair=obs['comparisons'][k];assert pair['classification']=='OUT_OF_SUPPORT_REFUSAL_OR_SAFE_EMPTY' and pair['positive_private'] and pair['sequence_equal'] and pair['public_trace_equal']
  for arm in ['base',k]:assert obs['arms'][arm]['status']=='SAFE_REFUSAL' and obs['arms'][arm]['private_safe_empty']==0 and obs['arms'][arm]['completed']<100
assert count==8
pack=read(R/'.artifacts/p05-pilot-bundle-source15/packages/card-catalog/src/owner-provisional-pilot.json');decode=lambda x:json.loads(base64.b64decode(x));mapping=decode(pack['bytes']['map']);semantic=decode(pack['bytes']['semantic']);entries={x['card_id']:x for x in mapping['entries']};excluded={m['card_id'] for f in semantic['families'] if f['repertoire']=='exclude' for m in f['members']};cards=[decode(x) for x in pack['cards']]
for context in ['online','in_person']:
 pool=[x for x in cards if x['id'] not in excluded and x['mode']=='truth_or_dare' and x['interaction']=='pair_private' and context in x['meeting_contexts']];assert len(pool)==42
 assert all('creative_expression' in entries[x['id']]['topic_ids'] for x in pool)
 keep=[x for x in pool if 'absurd_fiction' not in entries[x['id']]['topic_ids']];assert len(keep)==22 and len({f for x in keep for f in entries[x['id']]['semantic_family_ids']})==19
for f in c['new_R20_fixtures']:
 obs=grid[f['cell']]['observations'][0];assert obs['seed']==f['seed'] and f['rounds']==obs['rounds']==20 and f['exclusion']=='absurd_fiction' and f['excluded_member_ordinal']==0
consumer=(R/'.artifacts/p05-privacy-matched01/consumer.mjs').read_text();assert "base.status==='COMPLETE_DOMAIN_MODEL'&&variant.status==='COMPLETE_DOMAIN_MODEL'" in consumer
prereg=read(R/'.artifacts/p05-privacy-matched01/PREREG.json');assert prereg['thresholds']['required_common_cells_per_comparison']==42
d={'status':'PASS_SOURCE_PINS_AND_STATIC_CONSTRUCTION_CHECKS_NOT_METHOD_CLOSURE','author_INDEX':pin(A/'INDEX.json'),'author_children_verified':len(index['files']),'input_pins_verified':len(inputs['pins']),'existing_refused_comparison_branches_verified':count,'proposed_exclusion_fixtures':2,'partial_TD_static_removed':20,'partial_TD_static_remaining':22,'remaining_families':19,'original_complete_arm_guard_present':True,'original_required_common_cells':42,'finding':'P2_REFUSED_PREFIXES_CANNOT_COUNT_AS_FULL_COMMON_SUPPORT_WITH_UNCHANGED_COMPLETE_ARM_GUARD','native_actions':0,'model_reexecutions':0,'created_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat()}
(O/'VERIFICATION.json').write_text(json.dumps(d,indent=2)+'\n');(O/'INPUT-PINS.json').write_text(json.dumps({'author_index':{'path':str(A/'INDEX.json'),**pin(A/'INDEX.json')},'author_files':index['files'],'source_and_norms':inputs['pins']},indent=2)+'\n');print(json.dumps(d))
