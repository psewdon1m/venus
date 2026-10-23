"""Package explicit author decisions only; immutable r4/previous candidate inputs.
No automatic classifier/singleton fallback; every one-card family requires explicit manual contrast row.
Existing canonical JSON/ref/locale binding mechanics; no runtime registry or C2 execution.
"""
from pathlib import Path
import collections,copy,hashlib,json,sys,unicodedata
ROOT=Path.cwd().resolve();OUT=Path(__file__).resolve().parent;PREV=ROOT/'.docs/implementation/evidence/p05/topic-map-r4-candidate-01';R4=ROOT/'.docs/implementation/evidence/p04/review470-r4';STATUS='AUTHOR_PENDING_INDEPENDENT_AND_HUMAN'
assert OUT==ROOT/'.docs/implementation/evidence/p05/topic-map-r4-candidate-03'
PARENT=ROOT/'.docs/implementation/evidence/p05/topic-map-r4-candidate-02'
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def canonical(v):
 if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
 if isinstance(v,list):return '['+','.join(canonical(x)for x in v)+']'
 if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
 return json.dumps(v,separators=(',',':'))
def digest(v):return hashlib.sha256(canonical(v).encode()).hexdigest()
def save(n,v):
 p=OUT/n;p.parent.mkdir(exist_ok=True);assert not p.exists(),n
 p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def pending():return dict(schema=1,classification_status=STATUS,approved=False,runtime_eligible=False,runtime_activation=False,owner_review_status='HOLD')
def ref(c):return dict(card_id=c['id'],card_revision=c['revision'],card_sha256=digest(c),interaction=c['interaction'])
REVIEW=ROOT/'.docs/implementation/reviews/p05/topic-map-r4-independent-final-round01'
assert sha(REVIEW/'INDEX.json')=='2d36d2bb5b333df7ad96c18608314be9ba59810bbf6f8ea7d97222fc05d87dd9'
reviewindex=read(REVIEW/'INDEX.json');assert all(sha(REVIEW/f['path'])==f['sha256']for f in reviewindex['files'])
reviewpin=dict(index_path=(REVIEW/'INDEX.json').relative_to(ROOT).as_posix(),index_sha256=sha(REVIEW/'INDEX.json'),handoff_sha256=sha(REVIEW/'HANDOFF.json'),report_sha256=sha(REVIEW/'REPORT.md'),findings_sha256=sha(REVIEW/'FINDINGS.json'),status='FAIL_SEMANTIC_OPERATION_DISTINCTNESS',finding_ids=[f['id']for f in read(REVIEW/'FINDINGS.json')])
parentindex=read(PARENT/'INDEX.json');assert sha(PARENT/'INDEX.json')=='f523fd367fdde47317272e8b60edb65cc651f7a62a43c5f3b2f32c7e0c15eebc'
assert all(sha(PARENT/f['path'])==f['sha256']for f in parentindex['files'])
previndex=read(PREV/'INDEX.json');assert sha(PREV/'INDEX.json')=='b3a62c3c9a97744010b50a95f575ca3f2a3f1d37800e6744c04ca65fbc482244'
assert all(sha(PREV/f['path'])==f['sha256']for f in previndex['files'])
b=read(PREV/'source-bindings.json');cards={r['id']:read(ROOT/r['path'])for r in b['current_references']};oldmap=read(PREV/'private-topic-map.candidate.v1.json');old={e['card_id']:e for e in oldmap['entries']};oldsem=read(PREV/'semantic-families.candidate.v1.json')
assert len(cards)==len(old)==470
for r in b['current_references']:
 c=cards[r['id']];assert sha(ROOT/r['path'])==r['raw_sha256']and digest(c)==r['canonical_sha256']and c['revision']==r['revision']
 assert {l:{f:hashlib.sha256(v.encode()).hexdigest()for f,v in fs.items()}for l,fs in c['text'].items()}==r['locale_field_sha256']
tax=read(PREV/'taxonomy.candidate.v1.json');families=[];memberships=collections.defaultdict(list);fnotes=[]
for line in (OUT/'families.author.tsv').read_text(encoding='utf-8-sig').splitlines():
 key,ids,note=line.split('|');ids=ids.split();assert len(ids)>1 and len(set(ids))==len(ids)and set(ids)<=set(cards)
 fid='R4-OP-F-'+key;assert len(fid)<=128
 f=dict(semantic_family_id=fid,classification='EXPLICIT_FAMILY',mixed_visibility=len({cards[i]['interaction']=='pair_private'for i in ids})>1,repertoire='exclude'if len({cards[i]['interaction']=='pair_private'for i in ids})>1 else'eligible',members=[ref(cards[i])for i in ids],author_kind='MULTI_CARD_OPERATION_FAMILY',operation_rationale=note,author_status=STATUS)
 families.append(f);fnotes.append(dict(family_id=fid,author_key=key,ids=ids,rationale=note))
 for i in ids:memberships[i].append(fid)
distinct={}
for line in (OUT/'distinct.author.tsv').read_text(encoding='utf-8-sig').splitlines():
 i,neighbors,note=line.split('|');neighbors=neighbors.split();assert i in cards and i not in memberships and i not in distinct
 assert len(neighbors)>=2 and len(set(neighbors))==len(neighbors)and i not in neighbors and set(neighbors)<=set(cards)and note.strip()
 # Content-derived family name is only an identifier; distinctness decision comes from explicit row/actual review, never ID absence.
 fid='R4-OP-S-'+digest(dict(operation=old[i]['rationale'],neighbors=neighbors,contrast=note))[:24]
 families.append(dict(semantic_family_id=fid,classification='EXPLICIT_FAMILY',mixed_visibility=False,repertoire='eligible',members=[ref(cards[i])],author_kind='EXPLICIT_REVIEWED_SINGLE_OPERATION',operation_rationale=old[i]['rationale'],contrast_rationale=note,compared_neighbor_ids=neighbors,author_status=STATUS));memberships[i].append(fid);distinct[i]=(neighbors,note)
assert len(distinct)==345 and len(fnotes)==48 and len(memberships)==470 and set(memberships)==set(cards)
assert len({f['semantic_family_id']for f in families})==len(families)==393
concerns={f['semantic_family_id']:f for f in oldsem['historical_concerns']+oldsem['new_operation_concerns']};dispositions=[]
for line in (OUT/'concern-dispositions.author.tsv').read_text(encoding='utf-8-sig').splitlines():
 key,decision,note=line.split('|');assert key in concerns
 f=concerns[key];dispositions.append(dict(concern_id=key,author_decision=decision,rationale=note,prior_exact_concern=f,current_family_refs={m['card_id']:memberships[m['card_id']]for m in f['members']},classification_status=STATUS,independent_or_human_disposition=False))
assert len(dispositions)==38 and {d['concern_id']for d in dispositions}==set(concerns)
removed=b['comparison']['removed_old_ids'];assert set(removed)=={'TD-1005','YB-1005','YB-1113','YB-1126','YB-1133'}and not(set(removed)&set(memberships))
entries=copy.deepcopy(oldmap['entries']);audit=[]
for e in entries:
 i=e['card_id'];e['semantic_family_ids']=memberships[i];e['semantic_status']='AUTHOR_BOUNDED_OPERATION_AUDIT_COMPLETE_PENDING_INDEPENDENT_AND_HUMAN';e['inherited_unresolved_flags']=e['unresolved_flags'];e['unresolved_flags']=['INDEPENDENT_SUBJECT_AND_SEMANTIC_REVIEW_REQUIRED','HUMAN_EDITORIAL_AND_RU_EN_TR_REVIEW_REQUIRED']
 if i=='YB-1175':e['topic_ids']=sorted(set(e['topic_ids'])|{'personal_boundaries'});e['rationale']+=' Additive02 correction: preserving a pleasure against magical improvement is personal enoughness under unchanged personal_boundaries definition.'
 if i=='Q-1176':e['unresolved_flags'].append('ALBUM_MEDIUM_AMBIGUOUS_NO_AUTOMATIC_MUSIC_TAG')
 details=[]
 if i in distinct:
  ns,why=distinct[i];details=[dict(card_id=n,operation_summary=old[n]['rationale'],card_sha256=digest(cards[n]),locale_field_sha256=old[n]['locale_review']['field_sha256'])for n in ns];judgment=why
 else:
  judgment='Author operation-family decision: '+' '.join(f['operation_rationale']for f in families if f['semantic_family_id']in memberships[i]);ns=sorted({m['card_id']for f in families if f['semantic_family_id']in memberships[i]for m in f['members']if m['card_id']!=i});details=[dict(card_id=n,operation_summary=old[n]['rationale'],card_sha256=digest(cards[n]))for n in ns]
 audit.append(dict(card_id=i,card_revision=e['card_revision'],card_raw_sha256=e['card_raw_sha256'],card_sha256=e['card_sha256'],source_path=e['source_path'],locale_field_sha256=e['locale_review']['field_sha256'],operation_summary=old[i]['rationale'],actual_instruction_sides=cards[i]['text'],semantic_family_ids=memberships[i],author_judgment=judgment,compared_operations=details,reading=dict(languages=['ru','en','tr'],all_fields=True,actual_text=True,qualified_translation_approval=False),technical_semantic_unresolved=False,independent_human_pending=True))
semantic=dict(**pending(),revision='P05-R4-SEMANTIC-CANDIDATE-03',families=families,author_technical_unresolved_ids=[],author_bounded_operation_audit_complete_ids=sorted(cards),independent_human_pending_ids=sorted(cards),policy=dict(scope='470actualcards read across RU/EN/TR and all instruction sides; explicit48multi families plus345manual single-operation decisions with2specific neighbor contrasts. No automatic singleton/IDdistinctness fallback; no absolute allpairs theorem or qualified translation approval.',singletons='Single-member families are explicit authored judgments supported by actual operation and at least2specific neighboring operations/contrasts, not identity placeholders.',visibility='All mixed families must be excluded as complete exact clusters in any proposed repertoire; public selection must never change because of hidden private history.',acceptance='Author data complete only. Independent/human semantic acceptance and source content HOLD remain separate.'))
mapdoc=dict(**pending(),map_revision='P05-TOPIC-MAP-R4-CANDIDATE-03',pack_digest=b['pack_digest'],catalog_digest=b['catalog_digest'],taxonomy_digest=digest(tax),semantic_policy_digest=digest(semantic),entries=entries,author_semantic_data_complete=True,runtime_approved=False,synthetic_projection_only='projection/; separate false/false/SYNTHETIC_ONLY wrappers, no registry admission')
mixed=[f for f in families if f['mixed_visibility']];excluded=sorted({m['card_id']for f in mixed for m in f['members']})
proposal=dict(**pending(),revision='P05-R4-REPERTOIRE-PROPOSAL-03',mixed_families=mixed,proposed_static_excluded_card_ids=excluded,production_excluded_ids_applied=[],old_removed_ids_not_transferred=removed,policy='Whole exact families only, unconditionally in prospective separately versioned repertoire; synthetic projection evaluates this declared scenario, not production activation.',future_requirements=['independent semantics/topic data review','human/editorial owner exactcard disposition remains HOLD','actual currentV2C2/private25/neutral20/fairness/privacy under this repertoire','compatible versioned adoption and rollback preserving monotonic history/privacy'])
fixture=dict(classification_status='SYNTHETIC_MACHINE_FIXTURE',approved=False,runtime_eligible=False,owner_review_status='SYNTHETIC_ONLY')
ptax=dict(schema='venus.topic-map.v1',taxonomy_revision='P05-R4-TOPICS-DRAFT-MACHINE-02',**fixture,topics=[dict(topic_id=t['topic_id'],labels=t['labels'])for t in tax['topics']])
psem=dict(schema='venus.topic-map.v1',semantic_revision='P05-R4-OPS-DRAFT-MIXED-EXCLUDED-03',**fixture,families=[{k:f[k]for k in ['semantic_family_id','classification','mixed_visibility','repertoire','members']}for f in families])
pm=dict(schema='venus.topic-map.v1',map_revision='P05-R4-MAP-DRAFT-MACHINE-03',**fixture,pack_digest=b['pack_digest'],taxonomy_digest=digest(ptax),semantic_policy_digest=digest(psem),entries=[dict(card_id=e['card_id'],card_revision=e['card_revision'],card_sha256=e['card_sha256'],mode=e['mode'],interaction=e['interaction'],topic_ids=e['topic_ids'],semantic_family_ids=e['semantic_family_ids'],locale_field_sha256=e['locale_review']['field_sha256'])for e in entries])
manifest={**b['pack_manifest_payload'],'canonical_payload_sha256':b['pack_digest'].removeprefix('sha256:')}
lineage=dict(**pending(),independent_parent02_review=reviewpin,parent02_index_sha256=sha(PARENT/'INDEX.json'),parent02_all_files_sha256={q.relative_to(ROOT).as_posix():sha(q)for q in PARENT.rglob('*')if q.is_file()},topic_changes_from_parent02=[],targeted_semantic_membership_changes_from_parent02=['Q-1127','YB-1039','YB-1055','YB-1127'],prior_candidate_index_sha256=sha(PREV/'INDEX.json'),prior_all_files_sha256={q.relative_to(ROOT).as_posix():sha(q)for q in PREV.rglob('*')if q.is_file()},r4_source_bindings=b,current_app_source='Root reported aa1205/1823; not bound or certified by this data-onlycandidate.470r4bytes/taxonomy are exact inputs.',topic_changes=[dict(card_id='YB-1175',before=old['YB-1175']['topic_ids'],after=next(e['topic_ids']for e in entries if e['card_id']=='YB-1175'),reason='Independentpre-read06 finding: enoughness explicitly belongs personal_boundaries; immutabledefinition applied without pool adjustment')],taxonomy_definitions_changed=False,cardtext_status_provenance_reviewer_changed=False,removed_ids_not_reassigned=removed)
outputs={'lineage-and-bindings.json':lineage,'private-topic-map.candidate.v1.json':mapdoc,'semantic-families.candidate.v1.json':semantic,'semantic-operation-audit470.json':dict(**pending(),cards=audit),'concern-dispositions.json':dict(**pending(),dispositions=dispositions),'mixed-visibility-proposal.json':proposal,'projection/map.json':pm,'projection/taxonomy.json':ptax,'projection/semantic.json':psem,'projection/pack-manifest.json':manifest}
if '--check'in sys.argv:
 for n,v in outputs.items():assert read(OUT/n)==v,n+' differs from exactinputs/explicitauthornotes'
 assert (OUT/'taxonomy.candidate.v1.json').read_bytes()==(PREV/'taxonomy.candidate.v1.json').read_bytes()
 print(json.dumps(dict(status='AUTHOR_DATA_BINDING_CHECK_PASS_NOT_INDEPENDENT_OR_HUMAN_APPROVAL',cards=470,locale_fields=2340,multi_families=48,explicit_single_operation_families=345,total_families=393,technical_unresolved=0,independent_human_pending=470,mixed_families=len(mixed),proposed_excluded_ids=len(excluded),topic_changes_from_parent02=0,carried_YB1175_topic_correction=1,card_changes=0,prior_candidate_immutable=True,source_app_certified=False)))
else:
 assert not(OUT/'taxonomy.candidate.v1.json').exists();(OUT/'taxonomy.candidate.v1.json').write_bytes((PREV/'taxonomy.candidate.v1.json').read_bytes())
 for n,v in outputs.items():save(n,v)
 print('PACKAGED470/393families/0technicalunresolved, authorpending; C2NOTRUN/registryunchanged')
