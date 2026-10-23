"""Package the explicit manual r4 annotations; no classifier, runtime activation or source writes.
Canonical JSON and source-reference checks follow candidate02's existing mechanical checks.
Run once as author, or --check read-only after packaging. Inputs/cards remain immutable.
"""
from pathlib import Path
import collections, copy, hashlib, json, sys, unicodedata
ROOT=Path.cwd().resolve(); OUT=Path(__file__).resolve().parent
assert OUT==ROOT/'.docs/implementation/evidence/p05/topic-map-r4-candidate-01'
OLD=ROOT/'.docs/implementation/evidence/p05/topic-map-candidate-02'
R4=ROOT/'.docs/implementation/evidence/p04/review470-r4'
STATUS='AUTHOR_PENDING_INDEPENDENT_AND_HUMAN'
def read(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def canonical(v):
    if isinstance(v,str):return json.dumps(unicodedata.normalize('NFC',v),ensure_ascii=False,separators=(',',':'))
    if isinstance(v,list):return '['+','.join(canonical(x)for x in v)+']'
    if isinstance(v,dict):return '{'+','.join(json.dumps(k,ensure_ascii=False)+':'+canonical(v[k])for k in sorted(v))+'}'
    return json.dumps(v,separators=(',',':'))
def digest(v):return hashlib.sha256(canonical(v).encode()).hexdigest()
def field_hashes(c):return {l:{f:hashlib.sha256(t.encode()).hexdigest()for f,t in fs.items()}for l,fs in c['text'].items()}
def save(n,v):
    p=OUT/n;assert not p.exists(),f'Output exists: {n}'
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def base():return dict(schema=1,classification_status=STATUS,approved=False,runtime_eligible=False,runtime_activation=False,owner_review_status='HOLD')
def ref(c):return dict(card_id=c['id'],card_revision=c['revision'],card_sha256=digest(c),interaction=c['interaction'])
old=read(OLD/'private-topic-map.candidate.v1.json'); old_by={c['card_id']:c for c in old['entries']}
index=read(R4/'source-index470.json'); records=index['cards']; cards={r['id']:read(ROOT/r['path'])for r in records}; paths={r['id']:r['path']for r in records}
old_tax=read(OLD/'taxonomy.candidate.v1.json'); shorthand={t['shorthand']:t['topic_id']for t in old_tax['topics']}
manual={}
for line in (OUT/'classification160.author.tsv').read_text(encoding='utf-8-sig').splitlines():
    i,codes,note=line.split('|');assert i not in manual
    codes=''.join(codes.split());assert set(codes)<=set(shorthand)
    manual[i]=(sorted({shorthand[c]for c in codes}),note)
same={i for i,c in cards.items()if i in old_by and field_hashes(c)==old_by[i]['locale_review']['field_sha256']}
changed=set(cards)-same; removed=set(old_by)-set(cards)
assert len(same)==310 and len(changed)==160 and len(removed)==5
assert set(manual)==changed and len(changed&set(old_by))==135 and len(set(cards)-set(old_by))==25
assert len(cards)==len(records)==470
for r in records:
    c=cards[r['id']];assert c['id']==r['id'] and c['revision']==r['revision']
    assert sha(ROOT/r['path'])==r['raw_sha256'] and digest(c)==r['canonical_sha256']
    assert digest(c['text'])==r['text_sha256'] and digest(c['authoring'])==r['provenance_sha256']
cat=digest([dict(id=r['id'],revision=r['revision'],sha256=r['canonical_sha256'])for r in records])
assert cat==index['catalog_digest']=='dfb3a2871d2e988be97cc89cbd50a362eeffa5e60ae0c5258a4219c646f0a270'
freeze=read(ROOT/'.artifacts/p05-unified-source-freeze01.json')
assert freeze['identity']=='b244e61aa326b7b3717a6b37040be59a78a549241f745d9275be1738dcbe30b4' and len(freeze['files'])==1819
# Root confirms live API timing-fix WIP; b244 is historical context only.
# This data-only artifact binds r4 cards directly and does not certify current app source.
source_drift=read(OUT/'initial-source-drift-fail.json')['drift'] # immutable observation, not a current-app gate
# Existing manifestFor payload shape, independently recomputed from exact cards (draft revision1).
counts=lambda vs:dict(sorted(collections.Counter(vs).items()))
policy=read(ROOT/'packages/relationship-engine/src/card-schema.json') # pin only; policy digest comes from the frozen runtime identity file below
identity=(ROOT/'packages/relationship-engine/src/policy-identity.ts').read_text(encoding='utf-8')
import re
policy_sha=re.search(r"sha256:([a-f0-9]{64})",identity).group(1)
payload=dict(schema_version=1,pack_id='venus-cards-core',pack_revision=1,content_contract_revision='CARD-1',policy_revision='RE-1',policy_sha256=policy_sha,status='illustrative_draft_candidate',locale_codes=['ru','en','tr'],total_cards=470,reviewed_cards=sum(c['status']=='reviewed'for c in cards.values()),mode_counts=counts(c['mode']for c in cards.values()),category_counts=counts(c['mode']+'/'+c['category']for c in cards.values()),eligibility_cell_counts=counts(c['mode']+'/'+ctx+'/C'+str(c['min_comfort'])+'/S'+str(c['min_progression_stage'])+'/'+c['relationship_scope']for c in cards.values()for ctx in c['meeting_contexts']),cards=[dict(id=i,revision=cards[i]['revision'],sha256=digest(cards[i]),status=cards[i]['status'])for i in sorted(cards)],caveats=['Human identity/competence/rights are externally established; machine checks alone are insufficient.'])
pack='sha256:'+digest(payload); assert pack==read(R4/'HANDOFF.json')['pack_digest']=='sha256:d1a7cb38be173c673665c30ae8e91792940438b675f8830d72503eebed9985d4'
old_files={p.relative_to(ROOT).as_posix():sha(p)for p in OLD.iterdir()if p.is_file()}
# Keep all historical concerns, including removed refs; never remap replacements by ID.
old_sem=read(OLD/'semantic-families.candidate.v1.json'); historical=[]; families=[]
for f in old_sem['families']:
    if not f['semantic_family_id'].startswith('P04-SEM-'):continue
    current=[ref(cards[m['card_id']])for m in f['members']if m['card_id']in cards]
    inactive=[m for m in f['members']if m['card_id']not in cards]
    h=dict(semantic_family_id=f['semantic_family_id'],status='HISTORICAL_CONCERN_CURRENT_EQUIVALENCE_UNRESOLVED',original_review_description_ru=f['original_review_description_ru'],members=current,prior_exact_members=f['members'],removed_since_450=inactive,inactive_original_ids_not_mapped_to_replacements=f['inactive_original_ids_not_mapped_to_replacements'],mixed_visibility=len({m['interaction']=='pair_private'for m in current})>1,prior_mixed_visibility=f['mixed_visibility'],resolution='NO_CURRENT_EQUIVALENCE_OR_DISTINCTNESS_APPROVAL; retain historical concern, inspect exact current operations')
    historical.append(h)
for line in (OUT/'semantic-operations.author.tsv').read_text(encoding='utf-8-sig').splitlines():
    i,ids,strength,note=line.split('|');ids=ids.split();assert len(ids)==len(set(ids)) and set(ids)<=set(cards)
    members=[ref(cards[i])for i in ids]
    families.append(dict(semantic_family_id=i,status=STATUS,classification=strength,operation_rationale=note,members=members,mixed_visibility=len({m['interaction']=='pair_private'for m in members})>1,resolution='INDEPENDENT_AND_HUMAN_DISPOSITION_REQUIRED_NOT_RUNTIME_POLICY'))
family_ids=collections.defaultdict(list)
for f in historical+families:
    for m in f['members']:family_ids[m['card_id']].append(f['semantic_family_id'])
all_flags=['INDEPENDENT_SUBJECT_REVIEW_REQUIRED','HUMAN_EDITORIAL_AND_RU_EN_TR_REVIEW_REQUIRED','SEMANTIC_DISTINCTNESS_NOT_PROVEN']
entries=[];corpus=[]
for i,c in cards.items():
    prior=old_by.get(i);reused=i in same
    topics,note=(prior['topic_ids'],prior['rationale'])if reused else manual[i]
    flags=list(dict.fromkeys((prior['unresolved_flags']if prior else[])+all_flags))
    if i=='Q-1176':flags.append('ALBUM_MEDIUM_AMBIGUOUS_NO_AUTOMATIC_MUSIC_TAG')
    e=dict(card_id=i,card_revision=c['revision'],card_sha256=digest(c),card_raw_sha256=sha(ROOT/paths[i]),source_path=paths[i],mode=c['mode'],interaction=c['interaction'],meeting_contexts=c['meeting_contexts'],required_capabilities=c['required_capabilities'],topic_ids=topics,semantic_family_ids=family_ids[i],semantic_status='CONCERN_CANDIDATE_UNRESOLVED'if family_ids[i]else'UNREVIEWED_CROSS_CARD_DISTINCTNESS_NO_SINGLETON_ASSUMPTION',rationale=note,classification_status=STATUS,annotation_origin='REUSED_EXACT_ALL_LOCALE_FIELDS_310'if reused else'AUTHOR_READ_AND_CLASSIFIED_CURRENT_ALL_LOCALES_160',locale_review=dict(languages_read=['ru','en','tr'],all_fields_read=True,status='AGENT_CANDIDATE_ONLY_NOT_QUALIFIED_TRANSLATION_APPROVAL',field_sha256=field_hashes(c)),unresolved_flags=flags,prior_annotation_lineage=copy.deepcopy(prior)if prior else None)
    entries.append(e);corpus.append(dict(card_id=i,card_revision=c['revision'],card_sha256=digest(c),interaction=c['interaction'],topic_ids=topics,rationale=note,text=c['text'],field_sha256=field_hashes(c),annotation_origin=e['annotation_origin']))
# Strong concerns and partial overlaps remain visible separately; no implicit singleton families.
semantic=dict(**base(),revision='P05-R4-SEMANTIC-CANDIDATE-01',policy=dict(scope='17 explicit current operation-overlap concerns plus21historical concerns. No exhaustive semantic470 acceptance.',visibility='Public selection must not depend on hidden private history. Public history may constrain private selection; exact pair private history may constrain that pair only.',singletons='No singleton identity families are manufactured. Empty semantic_family_ids is unresolved data, NOT a distinctness assertion or runtime-compatible map.',activation='All family decisions remain pending. Any mixed-visibility disposition must be unconditional for the full family in a new versioned repertoire, never triggered by a hidden private event.'),historical_concerns=historical,new_operation_concerns=families,semantic_distinctness_proven_ids=[],semantic_distinctness_unresolved_ids=sorted(cards),no_concern_assigned_ids=sorted(i for i in cards if not family_ids[i]))
tax=dict(**base(),taxonomy_revision='P05-R4-TOPICS-INHERITED-02',topics=old_tax['topics'],policy=copy.deepcopy(old_tax['policy']),lineage=dict(source_path=(OLD/'taxonomy.candidate.v1.json').relative_to(ROOT).as_posix(),source_sha256=sha(OLD/'taxonomy.candidate.v1.json'),definitions_canonical_sha256=digest(old_tax['topics'])))
tax['policy']['romance']='No new romance taxonomy inferred from private transport or pair metadata. The13inherited subjects are candidate annotations only; human editorial/language review remains required for470.'
proposal=dict(**base(),revision='P05-R4-MIXED-VISIBILITY-PROPOSAL-01',historical_removed_ids=sorted(removed),historical17_18='All5oldmixed members absent from currentr4; no replacement IDs inherit those families. Historical exclusion proposal remains lineage only.',policy='Proposal only: if a current cross-visibility family is accepted as a conflict, exclude every exact member unconditionally in a NEW reviewed repertoire; never filter public pool from hidden private history.',families=[dict(semantic_family_id=f['semantic_family_id'],classification=f['classification'],members=f['members'],proposal='UNCONDITIONAL_ALL_MEMBERS_ONLY_IF_FAMILY_CONFLICT_ACCEPTED; NOT_APPLIED')for f in families if f['mixed_visibility']],required_before_any_adoption=['independent semantic disposition including distinctions/false positives','owner/human exactcard approval remains HOLD','fresh separately versioned source/map binding','C2 private baseline25 and safe-public pool coverage/fairness/privacy after static exclusions','compatible rollback preserving privacy and monotonic history'],excluded_card_ids_applied=[])
inputs=dict(**base(),historical_context_source_identity=freeze['identity'],historical_context_included_files=1819,current_app_source_status='ROOT_OWNED_WIP_NOT_CERTIFIED_BY_THIS_DATA_CANDIDATE',current_observed_baseline_drift=source_drift,source_freeze_path='.artifacts/p05-unified-source-freeze01.json',source_freeze_sha256=sha(ROOT/'.artifacts/p05-unified-source-freeze01.json'),source_scope='b244 is historical context only. Root-owned newer API/cases timing fix and added source files are WIP. This artifact certifies exact470r4data bindings, not current application/tree identity.',catalog_digest=cat,pack_digest=pack,pack_manifest_payload=payload,source_index_sha256=sha(R4/'source-index470.json'),r4_input_freeze_sha256=sha(R4/'current-input-freeze.json'),r4_handoff_sha256=sha(R4/'HANDOFF.json'),r4_manifest_sha256=sha(R4/'manifest.json'),r4_ledger_sha256=sha(ROOT/read(R4/'current-input-freeze.json')['ledger_path']),prior_candidate_all_file_sha256=old_files,current_references=[dict(**r,locale_field_sha256=field_hashes(cards[r['id']]))for r in records],comparison=dict(exact_text_equivalent_ids=sorted(same),changed_old_ids=sorted(changed&set(old_by)),new_ids=sorted(set(cards)-set(old_by)),removed_old_ids=sorted(removed)),author_reading=dict(required160_ids=sorted(changed),all160_actual_languages=['ru','en','tr'],all_sides_read=True,repeated_responder_checked_equal=True,scope='Author reading, not independent/human language approval;310annotations reused by exactfield equivalence.20extraoldcards all-locales read for operation comparisons.'))
mapdoc=dict(**base(),map_revision='P05-TOPIC-MAP-R4-CANDIDATE-01',pack_digest=pack,catalog_digest=cat,taxonomy_digest=digest(tax),semantic_policy_digest=digest(semantic),runtime_schema_compatible=False,incompatibility='Pending approval and unresolved semantic membership are deliberately not adapted to RuntimeTopicMap. This data draft must not be loaded or registered.',entries=entries)
if '--check'in sys.argv:
    expected={'source-bindings.json':inputs,'taxonomy.candidate.v1.json':tax,'semantic-families.candidate.v1.json':semantic,'private-topic-map.candidate.v1.json':mapdoc,'localized-review-corpus.json':dict(**base(),cards=corpus),'mixed-visibility-proposal.json':proposal}
    for n,v in expected.items():assert read(OUT/n)==v,n+' differs from exactinputs/manualnotes'
    print(json.dumps(dict(status='MECHANICAL_BINDING_CHECK_PASS_NOT_SEMANTIC_APPROVAL',cards=470,fields=sum(len(fs)for c in cards.values()for fs in c['text'].values()),reused=310,authored=160,changed_old=135,new=25,removed=5,topics=13,historical_concerns=len(historical),new_concerns=len(families),semantic_distinctness_unresolved=470,historical_baseline_entry_count=1819,current_app_source_certified=False,pack_digest=pack,catalog_digest=cat)))
else:
    for n,v in [('source-bindings.json',inputs),('taxonomy.candidate.v1.json',tax),('semantic-families.candidate.v1.json',semantic),('private-topic-map.candidate.v1.json',mapdoc),('localized-review-corpus.json',dict(**base(),cards=corpus)),('mixed-visibility-proposal.json',proposal)]:save(n,v)
    print('PACKAGED470/2340fields;310reused+160authored; noapproval/noactivation; use --check read-only')
