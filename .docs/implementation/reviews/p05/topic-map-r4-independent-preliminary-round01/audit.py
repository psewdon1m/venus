from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,unicodedata,collections
r=Path(__file__).parent;c=Path('.docs/implementation/evidence/p05/topic-map-r4-candidate-01');read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'));sha=lambda b:hashlib.sha256(b).hexdigest()
def canonical(v):
 if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
 if isinstance(v,list):return '['+','.join(map(canonical,v))+']'
 if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
 return json.dumps(v,separators=(',',':'))
digest=lambda v:sha(canonical(v).encode())
assert sha((c/'INDEX.json').read_bytes())=='b3a62c3c9a97744010b50a95f575ca3f2a3f1d37800e6744c04ca65fbc482244'
index=read(c/'INDEX.json');assert len(index['files'])==29
for f in index['files']:
 b=(c/f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
bindings=read(c/'source-bindings.json');m=read(c/'private-topic-map.candidate.v1.json');t=read(c/'taxonomy.candidate.v1.json');oldroot=Path('.docs/implementation/evidence/p05/topic-map-candidate-02');old=read(oldroot/'private-topic-map.candidate.v1.json')
assert t['topics']==read(oldroot/'taxonomy.candidate.v1.json')['topics'] and len(t['topics'])==13
for path,pin in bindings['prior_candidate_all_file_sha256'].items():assert sha(Path(path).read_bytes())==pin
assert len(bindings['prior_candidate_all_file_sha256'])==18
r4=Path('.docs/implementation/evidence/p04/review470-r4');manifest=read(r4/'manifest.json');assert len(manifest['files'])==666
for f in manifest['files']:
 b=Path(f['path']).read_bytes();assert len(b)==f['bytes'] and sha(b)==f['sha256']
entries={e['card_id']:e for e in m['entries']};previous={e['card_id']:e for e in old['entries']};refs={x['id']:x for x in bindings['current_references']}
assert len(entries)==len(refs)==470 and len(previous)==450
same=[];changed=[];new=[];count=0
for ident,e in entries.items():
 ref=refs[ident];raw=Path(ref['path']).read_bytes();card=json.loads(raw)
 assert sha(raw)==ref['raw_sha256']==e['card_raw_sha256']
 assert digest(card)==ref['canonical_sha256']==e['card_sha256']
 assert digest(card['text'])==ref['text_sha256'] and digest(card['authoring'])==ref['provenance_sha256']
 assert e['card_revision']==ref['revision']==card['revision'] and card['status']=='draft' and ref['human_approved'] is False
 hashes={l:{f:sha(text.encode())for f,text in fields.items()}for l,fields in card['text'].items()}
 assert hashes==ref['locale_field_sha256']==e['locale_review']['field_sha256'];count+=sum(map(len,hashes.values()))
 for key in ['mode','interaction','meeting_contexts','required_capabilities']:assert e[key]==card[key]
 assert 'SEMANTIC_DISTINCTNESS_NOT_PROVEN'in e['unresolved_flags']
 if ident in previous:
  oldcard=read(Path(previous[ident]['source_path']))
  if oldcard['text']==card['text']:
   same.append(ident);assert e['topic_ids']==previous[ident]['topic_ids'] and e['rationale']==previous[ident]['rationale']
   assert e['locale_review']['field_sha256']==previous[ident]['locale_review']['field_sha256'] and set(previous[ident]['unresolved_flags'])<=set(e['unresolved_flags'])
  else:changed.append(ident)
 else:new.append(ident)
assert count==2340 and len(same)==310 and len(changed)==135 and len(new)==25
comparison=bindings['comparison']
assert sorted(same)==comparison['exact_text_equivalent_ids'] and sorted(changed)==comparison['changed_old_ids'] and sorted(new)==comparison['new_ids']
assert sorted(set(previous)-set(entries))==comparison['removed_old_ids'] and len(comparison['removed_old_ids'])==5
reading=read(c/'reading160.json');assert {v['id'] for v in reading}==set(changed+new)
short={v['shorthand']:v['topic_id']for v in t['topics']};notes={}
for line in (c/'classification160.author.tsv').read_text(encoding='utf-8').splitlines():
 ident,tags,rationale=line.split('|',2);notes[ident]=(set(short[k]for k in tags if not k.isspace()),rationale)
assert set(notes)==set(changed+new)
for v in reading:
 e=entries[v['id']];card=read(Path(e['source_path']));assert v['text']==card['text'] and v['field_sha256']==e['locale_review']['field_sha256']
 assert notes[v['id']]==(set(e['topic_ids']),e['rationale'])
responders={l:{v['text'][l]['responder']for v in reading if v['id'].startswith('YB-')}for l in ['ru','en','tr']}
assert all(len(values)==1 for values in responders.values())
for d in [m,t,bindings,read(c/'semantic-families.candidate.v1.json')]:assert d['approved'] is False and d['runtime_eligible'] is False and d['runtime_activation'] is False and d['owner_review_status']=='HOLD'
finding={'id':'P05-R4-TOPIC-ENOUGHNESS-001','priority':'P2','card_id':'YB-1175','card_sha256':entries['YB-1175']['card_sha256'],'current_topics':entries['YB-1175']['topic_ids'],'missing_topic':'personal_boundaries','reason':'All three proposal locales ask to retain a little pleasure without improvement even by magic. Own rationale says personal enoughness; taxonomy B explicitly includes personal enoughness. This is substantive content, not responder/consent boilerplate.','requested_resolution':'Add B or provide an explicit consistent taxonomy interpretation before final data acceptance; preserve candidate01/HOLD.'}
assert 'personal_boundaries'not in entries['YB-1175']['topic_ids']
(r/'FINDINGS.json').write_text(json.dumps([finding],indent=2)+'\n',encoding='utf-8')
out={'status':'MECHANICAL_BINDINGS_PASS_TOPIC_FINDING_OPEN_FULL_SEMANTIC_REVIEW_PENDING','at_utc':datetime.now(timezone.utc).isoformat(),'candidate_children_verified':29,'r4_manifest_files_verified':666,'previous_candidate_files_verified':18,'cards':470,'locale_fields':2340,'exact_text_transfers':310,'changed_old':135,'new':25,'removed_old':5,'taxonomy_definitions_exact_reused':13,'manual_annotations_verified':160,'reviewer_substantive_read_ids':[v['id']for v in reading],'reviewer_read_languages':['ru','en','tr'],'reviewer_read_all_TD_sides':True,'YB_responder_exact_dedup_per_language':True,'semantic_distinctness_review':'DEFERRED_TO_FROZEN_ADDITIVE02','human_HOLD':True,'runtime_activation':False,'findings':[finding['id']]}
(r/'audit.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8');print(json.dumps({k:v for k,v in out.items() if k!='reviewer_substantive_read_ids'},indent=2))
