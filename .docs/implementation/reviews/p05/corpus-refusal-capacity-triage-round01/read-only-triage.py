from pathlib import Path
import json,hashlib,base64,gzip,collections
r=Path('C:/.projects/venus');out=r/'.artifacts/p05-refusal-capacity-triage01';out.mkdir(exist_ok=False)
registry=r/'packages/card-catalog/src/owner-provisional-pilot.json';reg=json.loads(registry.read_text(encoding='utf8'))
cards=[json.loads(base64.b64decode(x))for x in reg['cards']];mp=json.loads(base64.b64decode(reg['bytes']['map']));sem=json.loads(base64.b64decode(reg['bytes']['semantic']))
excluded={m['card_id']for f in sem['families']if f['repertoire']=='exclude'for m in f['members']};entries={e['card_id']:e for e in mp['entries']}
capacity=[]
for mode in ['questions','truth_or_dare','yes_but']:
 for context in ['online','in_person']:
  public=[c for c in cards if c['mode']==mode and c['id']not in excluded and c['interaction']!='pair_private' and context in c['meeting_contexts'] and c['min_comfort']==0 and c['relationship_scope']in ['none','acquaintance'] and not c['requires_physical_contact']and not c['requires_going_away']and not c['required_capabilities']]
  hist=collections.Counter(len(entries[c['id']]['semantic_family_ids'])for c in public)
  stages=[]
  for stage in [1,2,3,4]:
   rows=[c for c in public if c['min_progression_stage']<=stage]
   stages.append({'stage':stage,'public_card_ids':len(rows),'semantic_families':len({f for c in rows for f in entries[c['id']]['semantic_family_ids']}),'interactions':dict(collections.Counter(c['interaction']for c in rows))})
  capacity.append({'mode':mode,'context':context,'public_upper_bound_distinct_families':stages[-1]['semantic_families'],'min_private_needed_for_R100_if_all_public_families_reachable':max(0,100-stages[-1]['semantic_families']),'public_family_memberships_per_card':dict(hist),'stages':stages})
cost=json.loads((r/'.artifacts/p05-fixedrange-cost-acks01/MANIFEST.json').read_text());prefixes=[]
for p in cost['rows']:
 root=r/'.artifacts/p05-fixedranges'/p['owner']/'export/raw/payload';idx=json.loads((root/'FINAL_INDEX.json').read_text());rows=[]
 for segment in idx['segments']:
  data=(root/segment['file']).read_bytes();assert hashlib.sha256(data).hexdigest()==segment['sha256']
  rows.extend(json.loads(line)for line in gzip.decompress(data).splitlines())
 actual=[x['value']for x in rows if x['kind']=='corpus-case'];ref=[]
 for row in actual:
  result=row['result']
  if result.get('status')=='SAFE_REFUSAL':ref.append({'ordinal':row['ordinal'],'cell_or_descriptor':result.get('cell',result.get('descriptor')),'requested':result.get('requested_rounds'),'selected':result.get('selected_rounds'),'completed':result.get('completed_rounds'),'reason':result.get('error_code',result.get('refusal'))})
 prefix={'section':p['section'],'range':p['range'],'cases':len(actual),'refusals':ref}
 if p['section']=='m3-inference':prefix['longest_completed']=[{'ordinal':row['ordinal'],'descriptor':row['result']['descriptor'],'completed':row['result']['completed_rounds'],'private_opportunities':row['result']['counts']['Kprivate'],'public_disclosures':len(row['result']['history']['public_history'])}for row in actual if row['result']['requested_rounds']>=95]
 prefixes.append(prefix)
result={'scope':'STATIC_METADATA_AND_EXISTING_PREFIX_READ_ONLY_NO_NEW_NATIVE_OUTCOMES','registry_sha256':hashlib.sha256(registry.read_bytes()).hexdigest(),'cards':len(cards),'excluded':len(excluded),'capacity_static_upper_bounds_not_seed_outcomes':capacity,'existing_prefixes':prefixes}
(out/'READONLY-RESULT.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
print(json.dumps({'capacity':capacity,'prefix_refusal_counts':{p['section']:len(p['refusals'])for p in prefixes},'inference_longest':prefixes[-1].get('longest_completed')}))
