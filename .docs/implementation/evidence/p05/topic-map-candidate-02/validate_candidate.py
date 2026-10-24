"""Mechanical candidate binding checks; never a semantic or human-approval gate."""
from pathlib import Path
import argparse
import collections
import copy
import hashlib
import json
import unicodedata

ROOT = Path.cwd().resolve()
OUT = Path(__file__).resolve().parent
STATUS = 'CANDIDATE_AGENT_CLASSIFIED_PENDING_INDEPENDENT_AND_HUMAN_REVIEW'
assert OUT == ROOT / '.docs/implementation/evidence/p05/topic-map-candidate-02'
parser = argparse.ArgumentParser(description=__doc__)
mode = parser.add_mutually_exclusive_group()
mode.add_argument('--check', action='store_true', help='Read-only validation (also the default); never writes a receipt.')
mode.add_argument('--output', type=Path, help='Write one NEW receipt under this candidate directory; existing files are refused.')
args = parser.parse_args()
output = args.output.resolve() if args.output else None
if output is not None:
    if output.parent != OUT or output.exists():
        parser.error('--output must be a new file directly in this candidate directory; existing receipts are immutable')

def read(p):
    return json.loads(Path(p).read_text(encoding='utf-8-sig'))

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def canonical(v):
    if isinstance(v, str):
        return json.dumps(unicodedata.normalize('NFC', v), ensure_ascii=False, separators=(',', ':'))
    if isinstance(v, list):
        return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, separators=(',', ':'))

def digest(v):
    return hashlib.sha256(canonical(v).encode('utf-8')).hexdigest()

cards = {c['id']: (c, p) for p in (ROOT / '.docs/content/p04-r2-full/cards').glob('*.json') for c in [read(p)]}
taxonomy = read(OUT / 'taxonomy.candidate.v1.json')
family_doc = read(OUT / 'semantic-families.candidate.v1.json')
mapping = read(OUT / 'private-topic-map.candidate.v1.json')
corpus = read(OUT / 'localized-review-corpus.json')
witness = read(OUT / 'source-witness.json')
lineage = read(OUT / 'lineage.json')
boundary_audit = read(OUT / 'boundary-audit.json')
semantic_controls = read(OUT / 'semantic-controls.json')
source_clusters = read(ROOT / family_doc['source_path'])
known_topics = {t['topic_id'] for t in taxonomy['topics']}
known_families = {f['semantic_family_id']: f for f in family_doc['families']}

def check(doc):
    assert doc['schema'] == 1
    assert doc['classification_status'] == STATUS
    assert doc['approved'] is False and doc['runtime_eligible'] is False and doc['owner_review_status'] == 'HOLD'
    assert doc['taxonomy_digest'] == digest(taxonomy)
    assert doc['taxonomy_raw_sha256'] == sha(OUT / 'taxonomy.candidate.v1.json')
    assert doc['semantic_policy_digest'] == digest(family_doc)
    assert doc['semantic_policy_raw_sha256'] == sha(OUT / 'semantic-families.candidate.v1.json')
    assert doc['catalog_digest'] == witness['catalog_digest_recomputed']
    assert doc['pack_digest'] == witness['pack_digest_from_hash_bound_current_history_selection']
    entries = doc['entries']
    assert len(entries) == len(cards) == 450
    assert len({e['card_id'] for e in entries}) == 450
    assert {e['card_id'] for e in entries} == set(cards)
    for e in entries:
        c, p = cards[e['card_id']]
        assert e['classification_status'] == STATUS
        assert e['card_revision'] == c['revision']
        assert e['card_sha256'] == digest(c) and e['card_raw_sha256'] == sha(p)
        assert e['source_path'] == p.relative_to(ROOT).as_posix()
        assert e['mode'] == c['mode'] and e['interaction'] == c['interaction']
        assert e['rationale'].strip()
        assert e['topic_ids'] and len(set(e['topic_ids'])) == len(e['topic_ids'])
        assert set(e['topic_ids']) <= known_topics
        assert e['semantic_family_ids'] and len(set(e['semantic_family_ids'])) == len(e['semantic_family_ids'])
        assert set(e['semantic_family_ids']) <= set(known_families)
        assert e['locale_review']['languages_read'] == ['ru', 'en', 'tr'] and e['locale_review']['all_fields_read'] is True
        assert set(e['locale_review']['field_sha256']) == {'ru', 'en', 'tr'}
        for lang in ['ru', 'en', 'tr']:
            expected_keys = {'questions': {'question'}, 'truth_or_dare': {'truth', 'dare'}, 'yes_but': {'proposal', 'responder'}}[c['mode']]
            assert set(c['text'][lang]) == expected_keys
            assert set(e['locale_review']['field_sha256'][lang]) == expected_keys
            for k, v in c['text'][lang].items():
                assert v.strip() and e['locale_review']['field_sha256'][lang][k] == hashlib.sha256(v.encode('utf-8')).hexdigest()
        assert {'INDEPENDENT_SUBJECT_REVIEW_REQUIRED', 'HUMAN_EDITORIAL_AND_RU_EN_TR_REVIEW_REQUIRED'} <= set(e['unresolved_flags'])
        for fid in e['semantic_family_ids']:
            f = known_families[fid]
            assert any(r['card_id'] == e['card_id'] and r['card_revision'] == e['card_revision'] and r['card_sha256'] == e['card_sha256'] for r in f['members'])
            if f['status'].startswith('IDENTITY_'):
                assert 'SINGLETON_PLACEHOLDER_CROSS_CARD_SIMILARITY_UNPROVEN' in e['unresolved_flags']
    return True

results = []
def test(name, fn):
    fn()
    results.append({'name': name, 'result': 'PASS'})

test('exact_450_refs_hashes_fields_topics_and_pending_flags', lambda: check(mapping))
test('source_before_after_unchanged_and_current', lambda: (witness['before'] == witness['after'] and witness['source_unchanged'] is True and all(sha(ROOT / p) == h for p, h in witness['after'].items())) or (_ for _ in ()).throw(AssertionError()))

def source_families():
    assert len(source_clusters['clusters']) == 21
    refs = 0
    for old in source_clusters['clusters']:
        f = known_families[old['cluster_id']]
        assert {(r['card_id'], r['card_revision'], r['card_sha256']) for r in f['members']} == {(r['id'], r['revision'], r['canonical_sha256']) for r in old['active_members']}
        assert f['inactive_original_ids_not_mapped_to_replacements'] == old['inactive_member_ids']
        refs += len(f['members'])
    assert refs == 37
    assert sum(f['status'].startswith('IDENTITY_') for f in known_families.values()) == 413
test('21_source_families_37_active_refs_413_unproven_identity_placeholders', source_families)

def mixed():
    fs = [f for f in family_doc['families'] if f['mixed_visibility']]
    assert {f['semantic_family_id'] for f in fs} == {'P04-SEM-17', 'P04-SEM-18'}
    assert all(f['repertoire_proposal'] == 'EXCLUDE_WHOLE_FAMILY_FROM_NEW_TOPIC_ENABLED_REPERTOIRE_INDEPENDENT_OF_PRIVATE_HISTORY' for f in fs)
    assert {r['card_id'] for f in fs for r in f['members']} == {'TD-1005', 'YB-1005', 'YB-1133', 'YB-1113', 'YB-1126'}
test('mixed_17_18_whole_family_exclusion_proposal_independent_of_private_events', mixed)

def corpus_check():
    assert len(corpus['cards']) == 450
    assert {r['card_id'] for r in corpus['cards']} == set(cards)
    for row in corpus['cards']:
        c, _ = cards[row['card_id']]
        assert row['text'] == c['text'] and row['card_revision'] == c['revision'] and row['card_sha256'] == digest(c)
test('localized_review_corpus_exact_unmodified_all_2250_fields', corpus_check)

def locale_flags():
    by_id = {r['card_id']: r for r in mapping['entries']}
    assert 'TR_WORD_SENSE_WRITTEN_NOTE_VERSUS_MUSICAL_NOTE_REVIEW' in by_id['TD-1132']['unresolved_flags']
    assert 'TR_MOON_FLOWER_LEXICAL_AMBIGUITY_REVIEW' in by_id['YB-1072']['unresolved_flags']
    assert 'OPEN_ENDED_NEUTRAL_TOPIC_IS_NOT_A_CONTROLLED_VOCABULARY' in by_id['Q-1115']['unresolved_flags']
    assert 'food_drink' in by_id['Q-1102']['topic_ids'] and 'leisure' in by_id['Q-1102']['topic_ids']
    assert {'music_sound', 'friendship'} <= set(by_id['Q-1110']['topic_ids'])
    assert 'food_drink' in by_id['TD-1033']['topic_ids']
    assert 'music_sound' not in by_id['YB-1168']['topic_ids']
    assert 'food_drink' not in by_id['TD-1172']['topic_ids']
test('manual_union_examples_lexical_counterexamples_and_unresolved_flags', locale_flags)

def lineage_check():
    prior = ROOT / lineage['prior_candidate_directory']
    assert len(lineage['prior_all_13_file_hashes']) == 13
    assert {p.name: sha(p) for p in prior.iterdir() if p.is_file()} == lineage['prior_all_13_file_hashes']
    assert lineage['review_md_sha256'] == sha(ROOT / lineage['review_md_path'])
    assert lineage['review_sha256'] == sha(ROOT / lineage['review_path'])
    assert mapping['lineage']['prior_map_raw_sha256'] == lineage['prior_all_13_file_hashes']['private-topic-map.candidate.v1.json']
    assert lineage['new_map_raw_sha256'] == sha(OUT / 'private-topic-map.candidate.v1.json')
    assert lineage['new_taxonomy_digest'] == digest(taxonomy)
    assert len(boundary_audit['entries']) == boundary_audit['cards_reviewed_for_boundaries'] == 450
    assert {r['card_id'] for r in boundary_audit['entries']} == set(cards)
    by_id = {e['card_id']: e for e in mapping['entries']}
    for r in boundary_audit['entries']:
        e = by_id[r['card_id']]
        assert r['card_revision'] == e['card_revision'] and r['card_sha256'] == e['card_sha256']
        assert r['field_sha256'] == e['locale_review']['field_sha256']
        assert all(present == (topic in e['topic_ids']) for topic, present in r['boundary_decisions'].items())
test('immutable_candidate01_lineage_and_all450_boundary_audit_bindings', lineage_check)

def semantics(doc):
    by_id = {e['card_id']: e for e in doc['entries']}
    for control in semantic_controls['controls']:
        e = by_id[control['card_id']]
        c, _ = cards[control['card_id']]
        assert control['card_sha256'] == digest(c) == e['card_sha256']
        assert control['source_text'] == c['text']
        actual_present = control['topic_id'] in e['topic_ids']
        assert actual_present == control['expected_present'], control['name']
        # Candidate policy simulation only, not a runtime-selector claim.
        assert (not actual_present) == control['expected_allowed_if_only_this_topic_excluded']
    return True
test('manual_subject_semantic_positive_and_negative_controls', lambda: semantics(mapping))
for cid, topic, value in [
    ('Q-1015', 'communication_support', False), ('Q-1129', 'communication_support', True),
    ('Q-1115', 'communication_support', True), ('Q-1063', 'everyday_objects', False),
    ('YB-1026', 'everyday_objects', False), ('YB-1066', 'nature_animals', True),
    ('YB-1113', 'communication_support', True), ('YB-1014', 'everyday_objects', False),
]:
    d = copy.deepcopy(mapping)
    e = next(e for e in d['entries'] if e['card_id'] == cid)
    if value:
        e['topic_ids'] = sorted(set(e['topic_ids']) | {topic})
    else:
        e['topic_ids'] = [t for t in e['topic_ids'] if t != topic]
    try:
        semantics(d)
    except AssertionError:
        results.append({'name': 'semantic_reject_known_wrong_subject_' + cid + '_' + topic, 'result': 'PASS_REJECTED_SEMANTIC_MUTATION'})
    else:
        raise AssertionError('Semantic control accepted wrong subject: ' + cid)

def negative(name, mutate):
    d = copy.deepcopy(mapping)
    mutate(d)
    try:
        check(d)
    except (AssertionError, KeyError, TypeError):
        results.append({'name': name, 'result': 'PASS_REJECTED_MUTATION'})
        return
    raise AssertionError('Mutation incorrectly accepted: ' + name)

negative('reject_missing_card', lambda d: d['entries'].pop())
negative('reject_duplicate_card', lambda d: d['entries'].__setitem__(1, copy.deepcopy(d['entries'][0])))
negative('reject_unknown_card', lambda d: d['entries'][0].__setitem__('card_id', 'Q-9999'))
negative('reject_revision_drift', lambda d: d['entries'][0].__setitem__('card_revision', 999))
negative('reject_canonical_hash_drift', lambda d: d['entries'][0].__setitem__('card_sha256', '0' * 64))
negative('reject_raw_hash_drift', lambda d: d['entries'][0].__setitem__('card_raw_sha256', '0' * 64))
negative('reject_unknown_topic', lambda d: d['entries'][0]['topic_ids'].append('other'))
negative('reject_empty_topic', lambda d: d['entries'][0].__setitem__('topic_ids', []))
negative('reject_duplicate_topic', lambda d: d['entries'][0]['topic_ids'].append(d['entries'][0]['topic_ids'][0]))
negative('reject_unknown_family', lambda d: d['entries'][0]['semantic_family_ids'].append('UNKNOWN'))
negative('reject_missing_locale', lambda d: d['entries'][0]['locale_review']['field_sha256'].pop('tr'))
negative('reject_missing_side', lambda d: next(e for e in d['entries'] if e['mode'] == 'truth_or_dare')['locale_review']['field_sha256']['ru'].pop('dare'))
negative('reject_changed_locale_field_hash', lambda d: d['entries'][0]['locale_review']['field_sha256']['ru'].__setitem__('question', '0' * 64))
negative('reject_false_approval', lambda d: d.__setitem__('approved', True))
negative('reject_false_runtime_eligibility', lambda d: d.__setitem__('runtime_eligible', True))
negative('reject_human_hold_removed', lambda d: d.__setitem__('owner_review_status', 'APPROVED'))
negative('reject_pending_review_flags_removed', lambda d: d['entries'][0].__setitem__('unresolved_flags', []))
negative('reject_taxonomy_digest_drift', lambda d: d.__setitem__('taxonomy_digest', '0' * 64))

report = {
    'schema': 1, 'result': 'PASS_MECHANICAL_CANDIDATE_BINDING_ONLY',
    'semantic_or_translation_approval': False, 'full_stage_pass': False,
    'input_hashes': {n: sha(OUT / n) for n in ['classification-notes.tsv', 'taxonomy.candidate.v1.json', 'semantic-families.candidate.v1.json', 'private-topic-map.candidate.v1.json', 'localized-review-corpus.json', 'source-witness.json', 'build_candidate.py', 'validate_candidate.py', 'lineage.json', 'boundary-audit.json', 'semantic-controls.json']},
    'checks': results,
    'counts': {
        'cards': 450, 'modes': dict(collections.Counter(e['mode'] for e in mapping['entries'])),
        'topics': len(known_topics), 'multi_tag_cards': sum(len(e['topic_ids']) > 1 for e in mapping['entries']),
        'localized_fields': sum(len(text) for c, _ in cards.values() for text in c['text'].values()),
        'source_clusters': 21, 'active_source_cluster_refs': 37, 'unproven_singleton_placeholders': 413,
        'topic_counts_all': dict(sorted(collections.Counter(t for e in mapping['entries'] for t in e['topic_ids']).items())),
        'topic_counts_private': dict(sorted(collections.Counter(t for e in mapping['entries'] if e['interaction'] == 'pair_private' for t in e['topic_ids']).items())),
        'unresolved_flags': dict(sorted(collections.Counter(f for e in mapping['entries'] for f in e['unresolved_flags']).items())),
    },
    'limits': [
        'Mechanical checks do not determine semantic correctness or translation quality.',
        '413 singleton placeholders are explicitly not a semantic originality proof. Existing concerns remain unresolved too.',
        'This excluded evidence does not change runtime policy, human approval, current pack, snapshot, production registry, source manifest or stage status.',
        'Subject map cannot constrain participant free speech or future free-form YesBut conditions.',
    ],
}
report['semantic_control_scope'] = {'count': len(semantic_controls['controls']), 'status': 'AUTHOR_DEFINED_SEMANTIC_REGRESSIONS_NOT_INDEPENDENT_OR_HUMAN_APPROVAL', 'runtime_test': False}
report['private_creative_impact'] = {}
for m in ['questions', 'truth_or_dare', 'yes_but']:
    private = [e for e in mapping['entries'] if e['mode'] == m and e['interaction'] == 'pair_private']
    remaining = [e for e in private if 'creative_expression' not in e['topic_ids']]
    report['private_creative_impact'][m] = {'private_total': len(private), 'remaining_excluding_creative': len(remaining), 'remaining_by_context': dict(collections.Counter(context for e in remaining for context in cards[e['card_id']][0]['meeting_contexts']))}
assert {m: v['remaining_excluding_creative'] for m, v in report['private_creative_impact'].items()} == {'questions': 28, 'truth_or_dare': 0, 'yes_but': 4}
report['private_creative_impact_scope'] = 'Raw candidate-only counts before runtime eligibility, history, mixed-family removals or other exclusions; not C2/viable-session coverage.'
if output is not None:
    with output.open('x', encoding='utf-8') as stream:
        stream.write(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'result': report['result'], 'checks': len(results), 'semantic_controls': len(semantic_controls['controls']), 'counts': report['counts'], 'private_creative_impact': report['private_creative_impact'], 'receipt_written': output.name if output else None, 'read_only': output is None}, ensure_ascii=False, indent=2))
