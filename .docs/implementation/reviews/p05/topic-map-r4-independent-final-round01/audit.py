from pathlib import Path
import json,hashlib,unicodedata,collections
from datetime import datetime,timezone
out=Path(__file__).parent;c=Path('.docs/implementation/evidence/p05/topic-map-r4-candidate-02');prior=c.parent/'topic-map-r4-candidate-01';read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest()
def canonical(v):
 if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
 if isinstance(v,list):return '['+','.join(map(canonical,v))+']'
 if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
 return json.dumps(v,separators=(',',':'))
digest=lambda v:sha(canonical(v).encode())
assert sha((c/'INDEX.json').read_bytes())=='f523fd367fdde47317272e8b60edb65cc651f7a62a43c5f3b2f32c7e0c15eebc'
indexes={}
for folder,expected in [(c,37),(prior,29),(Path('.docs/implementation/reviews/p05/topic-map-r4-independent-preliminary-round01'),14)]:
 idx=read(folder/'INDEX.json');assert len(idx['files'])==expected
 for r in idx['files']:
  raw=(folder/r['path']).read_bytes();assert len(raw)==r['bytes'] and sha(raw)==r['sha256']
 indexes[folder.as_posix()]={'index_sha256':sha((folder/'INDEX.json').read_bytes()),'children':expected}
lineage=read(c/'lineage-and-bindings.json');bindings=lineage['r4_source_bindings'];m=read(c/'private-topic-map.candidate.v1.json');sem=read(c/'semantic-families.candidate.v1.json');tax=read(c/'taxonomy.candidate.v1.json');oldm=read(prior/'private-topic-map.candidate.v1.json');oldsem=read(prior/'semantic-families.candidate.v1.json');audit=read(c/'semantic-operation-audit470.json');prop=read(c/'mixed-visibility-proposal.json');dispositions=read(c/'concern-dispositions.json')['dispositions'];refs={r['id']:r for r in bindings['current_references']};entries={e['card_id']:e for e in m['entries']};oldentries={e['card_id']:e for e in oldm['entries']};cards={};fields=0
for path,pin in lineage['prior_all_files_sha256'].items():assert sha(Path(path).read_bytes())==pin
for path,pin in bindings['prior_candidate_all_file_sha256'].items():assert sha(Path(path).read_bytes())==pin
manifest=read(Path('.docs/implementation/evidence/p04/review470-r4/manifest.json'));assert len(manifest['files'])==666
for r in manifest['files']:
 raw=Path(r['path']).read_bytes();assert len(raw)==r['bytes'] and sha(raw)==r['sha256']
assert len(entries)==len(refs)==470
for ident,e in entries.items():
 ref=refs[ident];raw=Path(ref['path']).read_bytes();card=json.loads(raw);cards[ident]=card
 assert sha(raw)==ref['raw_sha256']==e['card_raw_sha256'] and digest(card)==ref['canonical_sha256']==e['card_sha256']
 assert digest(card['text'])==ref['text_sha256'] and digest(card['authoring'])==ref['provenance_sha256']
 assert card['revision']==ref['revision']==e['card_revision'] and card['status']=='draft' and ref['human_approved'] is False
 h={lang:{k:sha(v.encode())for k,v in row.items()}for lang,row in card['text'].items()};assert h==ref['locale_field_sha256']==e['locale_review']['field_sha256'];fields+=sum(map(len,h.values()))
 for k in ['mode','interaction','meeting_contexts','required_capabilities']:assert e[k]==card[k]
 before=oldentries[ident];assert e['topic_ids']==(sorted(before['topic_ids']+['personal_boundaries'])if ident=='YB-1175'else before['topic_ids']);assert e['rationale']==(before['rationale']+' Additive02 correction: preserving a pleasure against magical improvement is personal enoughness under unchanged personal_boundaries definition.' if ident=='YB-1175'else before['rationale'])
 assert set(before['unresolved_flags'])<=set(e['inherited_unresolved_flags'])
assert fields==2340 and tax['topics']==read(prior/'taxonomy.candidate.v1.json')['topics']
for lang in ['ru','en','tr']:assert len({x['text'][lang]['responder']for x in cards.values()if x['id'].startswith('YB-')})==1
families={f['semantic_family_id']:f for f in sem['families']};assert len(families)==396
membership=collections.defaultdict(list);multi=[];single=[];mixed=[]
for fid,f in families.items():
 assert f['classification']=='EXPLICIT_FAMILY'
 for ref in f['members']:
  card=cards[ref['card_id']];assert ref['card_revision']==card['revision'] and ref['card_sha256']==digest(card) and ref['interaction']==card['interaction'];membership[card['id']].append(fid)
 actualmixed=len({r['interaction']=='pair_private'for r in f['members']})>1;assert f['mixed_visibility']==actualmixed;assert f['repertoire']==('exclude'if actualmixed else'eligible')
 if actualmixed:mixed.append(fid)
 if len(f['members'])>1:multi.append(fid)
 else:single.append(fid);assert len(set(f['compared_neighbor_ids']))>=2 and all(i in cards for i in f['compared_neighbor_ids']) and f['contrast_rationale'].strip()
assert len(multi)==47 and len(single)==349 and set(membership)==set(cards)
for ident,e in entries.items():assert sorted(membership[ident])==sorted(e['semantic_family_ids'])
assert len({r['card_id']for f in families.values()if len(f['members'])>1 for r in f['members']})==121
assert len(mixed)==19
excluded=sorted({r['card_id']for fid in mixed for r in families[fid]['members']});assert len(excluded)==59 and prop['proposed_static_excluded_card_ids']==excluded and prop['production_excluded_ids_applied']==[]
a={r['card_id']:r for r in audit['cards']};assert set(a)==set(cards)
for ident,r in a.items():
 assert r['actual_instruction_sides']==cards[ident]['text'] and r['card_raw_sha256']==entries[ident]['card_raw_sha256'] and r['card_sha256']==digest(cards[ident]) and r['locale_field_sha256']==entries[ident]['locale_review']['field_sha256']
 assert r['semantic_family_ids']==entries[ident]['semantic_family_ids'] and r['independent_human_pending'] is True
 for n in r['compared_operations']:assert n['card_id']in cards and n['card_sha256']==digest(cards[n['card_id']])
residual=read(c/'residual393-reading.json');assert {r['card_id']for r in residual}==set(oldsem['no_concern_assigned_ids']) and len(residual)==393
for r in residual:assert r['text']==cards[r['card_id']]['text']
concerns={r['semantic_family_id']:r for r in oldsem['historical_concerns']+oldsem['new_operation_concerns']};assert len(concerns)==38 and len(dispositions)==38
for d in dispositions:assert d['prior_exact_concern']==concerns[d['concern_id']]
assert {d['concern_id']for d in dispositions}==set(concerns)
removed=['TD-1005','YB-1005','YB-1113','YB-1126','YB-1133'];assert lineage['removed_ids_not_reassigned']==removed and not(set(removed)&set(cards))
for doc in [lineage,m,sem,tax,audit,prop]:assert doc['approved']is False and doc['runtime_eligible']is False and doc['runtime_activation']is False and doc['owner_review_status']=='HOLD'
pm=read(c/'projection/map.json');ps=read(c/'projection/semantic.json');pt=read(c/'projection/taxonomy.json')
for doc in [pm,ps,pt]:assert doc['classification_status']=='SYNTHETIC_MACHINE_FIXTURE'and doc['approved']is False and doc['runtime_eligible']is False and doc['owner_review_status']=='SYNTHETIC_ONLY'
assert ps['families']==[{k:f[k]for k in ['semantic_family_id','classification','mixed_visibility','repertoire','members']}for f in sem['families']]
assert len(pm['entries'])==470 and len(ps['families'])==396
for e in pm['entries']:
 original=entries[e['card_id']]
 for k in ['card_id','card_revision','card_sha256','mode','interaction','topic_ids','semantic_family_ids']:assert e[k]==original[k]
 assert e['locale_field_sha256']==original['locale_review']['field_sha256']
export=read(c/'projection/EXPORT.json');assert export['registry_activation']is False and export['actual_C2']=='NOT_RUN'
summary={'status':'MECHANICAL_EXACT_BINDINGS_PASS_SEMANTIC_FINDINGS_SEPARATE','at_utc':datetime.now(timezone.utc).isoformat(),'indexes':indexes,'r4_manifest_children':666,'cards_raw_canonical_provenance_text_verified':470,'locale_fields':fields,'families':396,'multi_families':47,'multi_unique_ids':121,'explicit_singles':349,'all_explicit_memberships_exact':True,'prior_residual393_faithful':393,'prior_concern_dispositions':38,'removed_IDs_retained_only_as_lineage':removed,'mixed_families':19,'whole_cluster_excluded':59,'allowed':411,'topic_fix_YB1175':True,'other469_topics_exact':True,'all470_card_texts_unchanged':True,'no_activation_or_approval':True,'projection_flags_exact':True,'actual_C2':'NOT_RUN','application_source_certified':False}
(out/'audit.json').write_text(json.dumps(summary,indent=2)+'\n',encoding='utf-8');print(json.dumps(summary,indent=2))
