"""Reproducible draft processing. Never promotes content or changes r1 sources."""
from pathlib import Path
import collections, copy, datetime, hashlib, json, re, shutil, sqlite3, unicodedata

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / '.docs/content/p04-r2'
EVIDENCE = ROOT / '.docs/implementation/evidence/p04/review-450-processing'
REVIEW = ROOT / '.docs/implementation/evidence/Venus_P04_FULL_REVIEW_450_2026-10-19.md'
ORIGINAL = ROOT / '.docs/content/p04/cards'

def sha(raw): return hashlib.sha256(raw).hexdigest()
def canonical(value): return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))
def digest(value): return sha(canonical(value).encode())
def differences(before,after,prefix=''):
    if isinstance(before,dict) and isinstance(after,dict):
        return [change for key in sorted(set(before)|set(after)) for change in differences(before.get(key),after.get(key),prefix+'/'+key)]
    return [] if before==after else [{'path':prefix,'before':before,'after':after}]
def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf8')

def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    raw = REVIEW.read_bytes(); text = raw.decode('utf-8-sig')
    pattern = r'\| \*\*`((?:Q|TD|YB)-\d+)`\*\* \| (.*?) \| `(KEEP|EDIT|RECONTEXT|MOVE_TO_RULES|REPLACE|HOLD)` \| `(P[0-3])` \| `(.*?)` \| (.*?) \|$'
    rows = []
    for line_no, line in enumerate(text.splitlines(), 1):
        match = re.match(pattern, line)
        if match:
            row = dict(zip(['id', 'context', 'decision', 'priority', 'axes', 'comment'], match.groups()))
            row['source_review_line'] = line_no; row['axes'] = [] if row['axes'] == '—' else row['axes'].split(',')
            rows.append(row)
    expected = {'KEEP':162,'EDIT':120,'RECONTEXT':29,'MOVE_TO_RULES':71,'REPLACE':67,'HOLD':1}
    assert len(rows) == len({r['id'] for r in rows}) == 450
    assert dict(collections.Counter(r['decision'] for r in rows)) == expected
    originals = {p.stem: json.loads(p.read_text(encoding='utf-8-sig')) for p in ORIGINAL.glob('*.json')}
    raw_originals = {p.stem: sha(p.read_bytes()) for p in ORIGINAL.glob('*.json')}
    assert set(originals) == {r['id'] for r in rows}
    r1_digest = digest([{'id': k, 'revision': v['revision'], 'sha256':digest(v)} for k,v in sorted(originals.items())])
    assert r1_digest == '08b327efd3071608ec14b21de6ebeaf91793f61d43c1a71968921967944ba306', r1_digest
    baseline = EVIDENCE / 'r1-input-inventory.json'
    input_inventory = {'review_path':str(REVIEW.relative_to(ROOT)).replace('\\','/'), 'review_raw_sha256':sha(raw), 'catalog_digest':r1_digest, 'cards':[{'id':k,'revision':v['revision'],'canonical_sha256':digest(v),'raw_sha256':raw_originals[k]} for k,v in sorted(originals.items())]}
    if baseline.exists(): assert json.loads(baseline.read_text(encoding='utf8')) == input_inventory
    else: save(baseline, input_inventory)
    overrides = json.loads((OUT / 'text-overrides.json').read_text(encoding='utf8'))
    ux_requirements=json.loads((OUT/'product-ux-requirements.json').read_text(encoding='utf8'))['requirements']
    ux_by_card={r['id']: [u for u in ux_requirements if r['id'] in u['source_card_ids']] for r in rows if r['decision']=='MOVE_TO_RULES'}
    assert all(ux_by_card.values())
    assert {i for u in ux_requirements for i in u['source_card_ids']}==set(ux_by_card)
    required = {r['id'] for r in rows if r['decision'] in ['EDIT','REPLACE','HOLD']}
    assert required <= set(overrides), sorted(required-set(overrides))
    candidate=[]; ledger=[]; rules=[]; diffs=[]
    responders = {
      'ru':'{P2} может согласиться, предложить условие или отказаться без объяснений. Новое условие требует свободного согласия {P1}; начать можно только после явного подтверждения обоих. Каждый может передумать.',
      'en':'{P2} may agree, suggest a condition, or decline without a reason. A new condition requires a free choice by {P1}; start only after both explicitly confirm. Either person may change their mind.',
      'tr':'{P2} kabul edebilir, bir koşul önerebilir veya gerekçe göstermeden reddedebilir. Yeni koşulu {P1} özgürce değerlendirmelidir; ancak ikiniz de açıkça onayladıktan sonra başlayın. Her biriniz vazgeçebilirsiniz.'}
    for row in rows:
        card=copy.deepcopy(originals[row['id']]); actions=[]
        row.update(r1_revision=card['revision'], r1_canonical_sha256=digest(card), r1_raw_sha256=raw_originals[card['id']])
        if row['decision']=='MOVE_TO_RULES':
            row.update(action='REMOVE_FROM_RANDOM_CATALOG; EXTRACT_PRODUCT_REQUIREMENT',revision_status='REMOVED_FROM_R2_CANDIDATE',candidate_path=None,new_revision=None,new_canonical_sha256=None,new_raw_sha256=None,approval_status='NOT_APPROVED',replacement_new_id=None)
            rules.append({'requirement_id':'P04-RULE-'+card['id'],'source_card_id':card['id'],'source_card_revision':card['revision'],'source_card_sha256':digest(card),'review_line':row['source_review_line'],'review_comment':row['comment'],'product_requirement_ids':[u['id'] for u in ux_by_card[card['id']]],'requirements':[u['requirement'] for u in ux_by_card[card['id']]],'source_text':card['text'],'implementation_status':'NOT_IMPLEMENTED_BY_THIS_CHANGE','required_verification':[u['acceptance_scenario'] for u in ux_by_card[card['id']]]})
            ledger.append(row); continue
        for locale, fields in overrides.get(card['id'],{}).items():
            assert locale in ['ru','en','tr']
            card['text'][locale].update(fields)
        if card['id'] in overrides: actions.append('TRILINGUAL_DRAFT_REWRITE' if row['decision']=='REPLACE' else 'LOCAL_REVIEW_CORRECTION')
        if row['decision']=='RECONTEXT':
            if card['interaction']=='pair_private':
                # The engine requires private cards to start at S3. Neutral recommendations
                # become public; never lower private thresholds against the policy.
                card.update(interaction='pair_public',participants_required=2,relationship_scope='acquaintance',min_comfort=0,min_progression_stage=1,consent='bilateral',meeting_contexts=['online','in_person'],required_capabilities=[],safety_tags=['neutral'])
                actions.append('NEUTRAL_PUBLIC_PAIR_S1_C0; PRIVATE_POOL_COVERAGE_GAP_RETAINED')
            else: actions.append('TEXT_ONLY_ALTERNATIVE_OR_PUBLIC_OPT_IN_REQUIREMENT')
        # Each repeated yes_but responder must preserve individual veto and reconfirmation.
        if card['mode']=='yes_but':
            for locale in responders: card['text'][locale]['responder']=responders[locale]
            actions.append('GLOBAL_YB_INDIVIDUAL_VETO_AND_BILATERAL_RECONFIRMATION')
        for locale in card['text']:
            for field, value in card['text'][locale].items():
                normalized=unicodedata.normalize('NFC',value.replace('i\u0307','i'))
                if normalized != value: actions.append('TR_UNICODE_CORRECTION')
                card['text'][locale][field]=normalized
        if card != originals[card['id']]:
            card['revision']=originals[card['id']]['revision']+1
            card['authoring']['source_notes'] = 'R2 agent-authored processing of the user-supplied full 450-card HOLD review dated 2026-10-19. Stable ID and original r1 preserved in the disposition ledger. No external card collection used. Corrections, replacements and RU/EN/TR localizations remain draft; editorial, safety, rights, similarity, diversity and language verification of changed hashes is pending. This record is not an approval.'
        assert card['status']=='draft' and card['authoring']['reviewed_by'] is None
        p=OUT / ('quarantine' if row['decision']=='HOLD' else 'cards') / (card['id']+'.json')
        if card == originals[card['id']]:
            p.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(ORIGINAL / p.name,p)
        else: save(p,card)
        row.update(action='; '.join(actions) or 'PRESERVE_EXACT_R1_BYTES',revision_status='REVISED_DRAFT_PENDING_VERIFICATION' if actions else 'UNCHANGED_R1_DRAFT',candidate_path=str(p.relative_to(ROOT)).replace('\\','/'),new_revision=card['revision'],new_canonical_sha256=digest(card),new_raw_sha256=sha(p.read_bytes()),approval_status='HOLD_PENDING_VERIFICATION' if row['decision']=='HOLD' else 'DRAFT_NOT_APPROVED',replacement_semantics_explicit=row['decision']=='REPLACE')
        if row['decision']=='REPLACE': row['replacement_note']='The old meaning is retired; a new draft meaning is explicitly attached to the same stable card ID at revision 2. Review/hash binding must never reuse r1 approvals.'
        if card!=originals[card['id']]:diffs.append({'id':card['id'],'r1_canonical_sha256':digest(originals[card['id']]),'r2_canonical_sha256':digest(card),'changes':differences(originals[card['id']],card)})
        if row['decision']!='HOLD': candidate.append(card)
        ledger.append(row)
    save(OUT/'dispositions.json', {'schema_version':1,'source_review_raw_sha256':sha(raw),'source_catalog_digest':r1_digest,'source_overall_decision':'HOLD','decision_counts':expected,'active_draft_count':len(candidate),'quarantined_count':1,'removed_to_rules_count':len(rules),'all_human_approvals_pending':True,'cards':ledger})
    save(OUT/'revision-diffs.json',{'schema_version':1,'changed_card_count':len(diffs),'cards':diffs})
    save(OUT/'rules-extraction.json',{'schema_version':1,'implementation_status':'REQUIREMENTS_ONLY_NOT_IMPLEMENTED','rules':rules})
    clusters=[]
    for line_no,line in enumerate(text.splitlines(),1):
        if ' ↔ ' in line and line.startswith('| `'):
            cols=[c.strip() for c in line.strip('|').split('|')]
            ids=re.findall(r'(?:Q|TD|YB)-\d+',cols[0])
            if ids: clusters.append({'cluster_id':f'P04-SEM-{len(clusters)+1:02}','source_review_line':line_no,'card_ids':ids,'severity':cols[1],'repeated_result':cols[2],'required_disposition':cols[3],'runtime_status':'NOT_IMPLEMENTED_BY_THIS_CHANGE','verification_status':'PENDING; test same-session/same-pair adjacency and cross-mode semantic exclusion after integration'})
    save(OUT/'semantic-clusters.json',{'schema_version':1,'clusters':clusters})
    scenarios=[]
    for line_no,line in enumerate(text.splitlines(),1):
        if re.match(r'\| V\d\d \|',line):
            cols=[c.strip() for c in line.strip('|').split('|')]; scenarios.append({'id':cols[0],'source_review_line':line_no,'scenario':cols[1],'expected':cols[2],'runtime_verification':'NOT_RUN_BY_THIS_CONTENT_PROCESSOR'})
    save(OUT/'required-scenarios.json', {'schema_version':1,'scenarios':scenarios})
    assert len(rules)==71 and len(candidate)==378 and len(scenarios)==15 and len(clusters)==21
    assert {p.stem:sha(p.read_bytes()) for p in ORIGINAL.glob('*.json')}==raw_originals
    print(json.dumps({'status':'DRAFT_PROCESSED_NOT_APPROVED','source_digest':r1_digest,'active':len(candidate),'quarantine':1,'removed':len(rules),'dispositions':len(ledger),'clusters':len(clusters),'scenarios':len(scenarios)},ensure_ascii=False))

if __name__=='__main__': main()
