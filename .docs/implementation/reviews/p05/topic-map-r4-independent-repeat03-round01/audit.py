from pathlib import Path
import json,hashlib,unicodedata,collections
from datetime import datetime,timezone
out=Path(__file__).parent;c=Path('.docs/implementation/evidence/p05/topic-map-r4-candidate-03');old=c.parent/'topic-map-r4-candidate-02';previous=Path('.docs/implementation/reviews/p05/topic-map-r4-independent-final-round01');read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest()
def canonical(v):
 if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
 if isinstance(v,list):return '['+','.join(map(canonical,v))+']'
 if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
 return json.dumps(v,separators=(',',':'))
digest=lambda v:sha(canonical(v).encode())
for folder,pin,count in [(c,'cd877e03114ccb954a467532815e00e7f758162a466e5f299bf1da575f24eaeb',31),(old,'f523fd367fdde47317272e8b60edb65cc651f7a62a43c5f3b2f32c7e0c15eebc',37),(previous,'2d36d2bb5b333df7ad96c18608314be9ba59810bbf6f8ea7d97222fc05d87dd9',15)]:
 assert sha((folder/'INDEX.json').read_bytes())==pin;idx=read(folder/'INDEX.json');assert len(idx['files'])==count
 for r in idx['files']:
  raw=(folder/r['path']).read_bytes();assert sha(raw)==r['sha256'] and len(raw)==r['bytes']
lineage=read(c/'lineage-and-bindings.json');assert lineage['r4_source_bindings']==read(old/'lineage-and-bindings.json')['r4_source_bindings']
for path,pin in lineage['parent02_all_files_sha256'].items():assert sha(Path(path).read_bytes())==pin
for r in read(Path('.docs/implementation/evidence/p04/review470-r4/manifest.json'))['files']:
 raw=Path(r['path']).read_bytes();assert sha(raw)==r['sha256'] and len(raw)==r['bytes']
entries={e['card_id']:e for e in read(c/'private-topic-map.candidate.v1.json')['entries']};prior={e['card_id']:e for e in read(old/'private-topic-map.candidate.v1.json')['entries']};audit={e['card_id']:e for e in read(c/'semantic-operation-audit470.json')['cards']};prioraudit={e['card_id']:e for e in read(old/'semantic-operation-audit470.json')['cards']};changed=[];fields=0
assert len(entries)==len(audit)==470 and set(entries)==set(prior)==set(prioraudit)
for ident,e in entries.items():
 keys=[k for k in set(e)|set(prior[ident])if e.get(k)!=prior[ident].get(k)]
 if keys:assert keys==['semantic_family_ids'];changed.append(ident)
 raw=Path(e['source_path']).read_bytes();card=json.loads(raw);assert sha(raw)==e['card_raw_sha256'] and digest(card)==e['card_sha256'];assert card['revision']==e['card_revision'] and card['status']=='draft'
 assert audit[ident]['actual_instruction_sides']==prioraudit[ident]['actual_instruction_sides']==card['text']
 hashes={l:{k:sha(v.encode())for k,v in d.items()}for l,d in card['text'].items()};assert hashes==e['locale_review']['field_sha256']==audit[ident]['locale_field_sha256'];fields+=sum(map(len,hashes.values()))
 assert e['topic_ids']==prior[ident]['topic_ids'];assert audit[ident]['card_sha256']==prioraudit[ident]['card_sha256']==digest(card)
assert sorted(changed)==['Q-1127','YB-1039','YB-1055','YB-1127'] and fields==2340
s=read(c/'semantic-families.candidate.v1.json');os=read(old/'semantic-families.candidate.v1.json');fam={f['semantic_family_id']:f for f in s['families']};ofam={f['semantic_family_id']:f for f in os['families']};retired=set(ofam)-set(fam);new=set(fam)-set(ofam)
assert len(fam)==393 and len(retired)==4 and new=={'R4-OP-F-short-drawing-caption'}
assert retired=={prior[i]['semantic_family_ids'][0]for i in changed}
assert sum(fam[k]==ofam[k]for k in set(fam)&set(ofam))==390
expected={'R4-OP-F-short-drawing-caption':{'Q-1127','YB-1127'},'R4-OP-F-fictional-newcomer-welcome':{'TD-1014','YB-1014','YB-1055'},'R4-OP-F-concert-unexpected-attendee':{'TD-1044','YB-1039','YB-1049'}}
for fid,ids in expected.items():
 f=fam[fid];assert {r['card_id']for r in f['members']}==ids and f['classification']=='EXPLICIT_FAMILY'and f['mixed_visibility']is False and f['repertoire']=='eligible'
 for i in ids:assert fid in entries[i]['semantic_family_ids']
for f in fam.values():
 for r in f['members']:assert r['card_revision']==entries[r['card_id']]['card_revision'] and r['card_sha256']==entries[r['card_id']]['card_sha256']
assert len([f for f in fam.values()if len(f['members'])>1])==48 and len([f for f in fam.values()if len(f['members'])==1])==345
mixed=[f for f in fam.values()if f['mixed_visibility']];oldmixed=[f for f in ofam.values()if f['mixed_visibility']];assert mixed==oldmixed and len(mixed)==19
excluded=sorted({r['card_id']for f in mixed for r in f['members']});assert len(excluded)==59;proposal=read(c/'mixed-visibility-proposal.json');assert proposal['proposed_static_excluded_card_ids']==read(old/'mixed-visibility-proposal.json')['proposed_static_excluded_card_ids']==excluded and proposal['production_excluded_ids_applied']==[]
for f in ['taxonomy.candidate.v1.json','projection/taxonomy.json','projection/pack-manifest.json']:assert(c/f).read_bytes()==(old/f).read_bytes()
assert read(c/'concern-dispositions.json')['dispositions']==read(old/'concern-dispositions.json')['dispositions']
for name in ['private-topic-map.candidate.v1.json','semantic-families.candidate.v1.json','mixed-visibility-proposal.json','lineage-and-bindings.json']:
 d=read(c/name);assert d['approved']is False and d['runtime_eligible']is False and d['runtime_activation']is False and d['owner_review_status']=='HOLD'
for name in ['map.json','semantic.json','taxonomy.json']:
 d=read(c/'projection'/name);assert d['classification_status']=='SYNTHETIC_MACHINE_FIXTURE'and d['approved']is False and d['runtime_eligible']is False and d['owner_review_status']=='SYNTHETIC_ONLY'
ps=read(c/'projection/semantic.json');assert ps['families']==[{k:f[k]for k in ['semantic_family_id','classification','mixed_visibility','repertoire','members']}for f in s['families']]
pm=read(c/'projection/map.json');assert len(pm['entries'])==470
for e in pm['entries']:assert e['semantic_family_ids']==entries[e['card_id']]['semantic_family_ids'] and not(set(e['semantic_family_ids'])&retired)
result={'status':'PASS_TARGETED_EXACT_DATA_RECONCILIATION_ONLY','at_utc':datetime.now(timezone.utc).isoformat(),'candidate03_children':31,'candidate02_children_unchanged':37,'previous_independent_children_unchanged':15,'r4_manifest_children':666,'real470_raw_canonical_and_actual_text_exact':470,'locale_fields_exact':fields,'entry_changes_memberships_only':sorted(changed),'map_entries_raw_equal':466,'unchanged_family_records':390,'retired_four_singletons':sorted(retired),'new_caption_family':sorted(new),'families':393,'multi':48,'singles':345,'mixed_family_records_exact':19,'excluded_IDs_exact':59,'allowed_IDs':411,'all470_topics_unchanged':True,'taxonomy_and_manifest_raw_unchanged':True,'all38_prior_dispositions_exact':True,'prior_full_read_carry':'By exact actual text/card/field bindings only; previous02 FAIL preserved','no_approval_or_activation':True,'C2':'NOT_RUN'}
(out/'audit.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8');print(json.dumps(result,indent=2))
