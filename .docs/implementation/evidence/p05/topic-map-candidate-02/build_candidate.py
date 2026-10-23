"""Package manual, card-by-card notes. No keyword or category classifier.

Run from repository root. Writes only next to this script. Does not approve cards.
"""
from pathlib import Path
import collections
import hashlib
import json
import unicodedata

ROOT = Path.cwd().resolve()
OUT = Path(__file__).resolve().parent
assert OUT == ROOT / '.docs/implementation/evidence/p05/topic-map-candidate-02'
STATUS = 'CANDIDATE_AGENT_CLASSIFIED_PENDING_INDEPENDENT_AND_HUMAN_REVIEW'
CATALOG = '5de601019fc8eae1c9491a610984e485e3fedce0d36d3d1326b8a589ee528bd4'
PACK = 'sha256:c668e4e8514d6acd97904c14937787e2f67af909d4af204252efb05d8a076484'
CLUSTERS_PATH = '.docs/implementation/evidence/p04/review-450-full-coverage/semantic-cluster-dispositions.json'
FINAL_MAP_PATH = '.docs/implementation/evidence/p04/review-450-full-coverage/final-card-map.json'
SELECTION_PATH = '.docs/implementation/evidence/p04/review-450-full-coverage/authoring/final-history-selection.json'

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def canonical(value):
    if isinstance(value, str):
        return json.dumps(unicodedata.normalize('NFC', value), ensure_ascii=False, separators=(',', ':'))
    if isinstance(value, list):
        return '[' + ','.join(canonical(v) for v in value) + ']'
    if isinstance(value, dict):
        return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(value[k]) for k in sorted(value)) + '}'
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))

def digest(value):
    return hashlib.sha256(canonical(value).encode('utf-8')).hexdigest()

def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

PRIOR = ROOT / '.docs/implementation/evidence/p05/topic-map-candidate-01'
REVIEW = ROOT / '.docs/implementation/reviews/p05/topic-map-round-01.json'
prior_review = read(REVIEW)
prior_hashes = {p.name: sha(p) for p in PRIOR.iterdir() if p.is_file()}
assert prior_hashes == prior_review['candidate_hashes'], 'original candidate01 changed'
prior_mapping = read(PRIOR / 'private-topic-map.candidate.v1.json')
prior_by_id = {r['card_id']: r for r in prior_mapping['entries']}
lineage = {
    'schema': 1, 'revision': 'P05-TOPIC-CANDIDATE-LINEAGE-02',
    'prior_candidate_directory': PRIOR.relative_to(ROOT).as_posix(),
    'prior_all_13_file_hashes': prior_hashes,
    'review_path': REVIEW.relative_to(ROOT).as_posix(), 'review_sha256': sha(REVIEW),
    'review_md_path': prior_review['report_path'], 'review_md_sha256': sha(ROOT / prior_review['report_path']),
    'source_cards_unchanged': True,
    'supersedes_for_candidate_work_only': True, 'promotes_or_approves': False,
}

# Topic descriptions are authored here. Shorthand is used only in the manual TSV.
DEFINITIONS = [
    ('A', 'creative_expression', 'Слова, рисунки и творческие образы', 'Words, pictures and creative expression', 'Sözcükler, resimler ve yaratıcı anlatım',
     'Prompt explicitly asks for a name, caption, fictional dialogue/story, visual design, verbal image, written performance or discussion of books/art.',
     'Ordinary answering or reading UI alone does not qualify. A creative task can also require food, music or other subject tags; this is never a replacement for those tags.'),
    ('F', 'absurd_fiction', 'Сказки и невозможные выдумки', 'Fairy tales and impossible inventions', 'Masallar ve imkânsız hayaller',
     'Explicit magic, personified inanimate objects, impossible transformations, invented creatures/worlds or deliberately absurd physical scenarios.',
     'Merely hypothetical everyday choices, fictional examples of normal life, a drawn object or a musical metaphor need not imply an impossible fictional world.'),
    ('O', 'everyday_objects', 'Вещи и домашняя обстановка', 'Everyday objects and furnishings', 'Gündelik eşyalar ve ev düzeni',
     'A concrete manufactured object, furnishing, clothing item, package/container, stationery, craft or appliance is itself a character, has its identity/role/physical features described, supplies the imagined setting/container, or is a substantive metaphor/comparison. Negated objects still count when their absence is part of the requested scene.',
     'Writing an answer or making a caption/postcard does not alone make its output medium an object subject. Mere room occurrence uses places_travel. A named prop that is only incidental background need not count. Instruments use music_sound, with everyday_objects added when material/structure is itself discussed. Food on containers is contextual, not automatic.'),
    ('D', 'food_drink', 'Еда, напитки и посуда для них', 'Food, drinks and their utensils', 'Yiyecekler, içecekler ve sofra eşyaları',
     'Food/drink, ingredients, flavours, cooking, cafés/menus, meals/picnics, cups/kettles/saucepans or food metaphors appear in any card side, even an optional example.',
     'Personal aesthetic taste is not food. Non-food jars, lids and boxes do not necessarily imply eating; the context determines whether food utensils are involved.'),
    ('P', 'places_travel', 'Места, маршруты и путешествия', 'Places, routes and travel', 'Yerler, rotalar ve yolculuklar',
     'Named or invented places, room layouts, imagined cities/venues, routes, maps, transport, travel or spatial journey metaphors are substantive content.',
     'Private channel, room ID and meeting_context metadata are not geographical topics. A bare metaphorical inner part does not automatically describe a physical place.'),
    ('N', 'nature_animals', 'Природа, погода и животные', 'Nature, weather and animals', 'Doğa, hava ve hayvanlar',
     'Plants/animals, weather/seasons, celestial objects, landscapes, natural water/ice or explicit nature comparisons are substantive prompt content, including named examples. An unspecified transparent water drop used as a shape/image is conservatively natural water; a leaf or rain example independently establishes nature.',
     'Generic colour, human mood, everyday sound drip and an explicitly household tap drop with no natural comparison are not nature. Fictional dragons are fiction; realistic animal types such as cats, owls and hedgehogs also receive nature. Food liquids and an imagined sea of lemonade are food/fiction/place content, not automatically natural water.'),
    ('M', 'music_sound', 'Музыка, звуки и тишина', 'Music, sound and silence', 'Müzik, sesler ve sessizlik',
     'Music, instruments, genres, melodies, timbre, rhythm, audio backgrounds, sound descriptions, acoustics or deliberate sonic silence are subjects.',
     'Life pace, written-note wording, personal voice/style and a quiet social atmosphere are not automatically musical. Tag sound only when the prompt actually discusses hearing, sound or deliberate acoustic absence.'),
    ('L', 'leisure', 'Отдых, игры и увлечения', 'Leisure, games and hobbies', 'Dinlenme, oyunlar ve hobiler',
     'Hobbies, reading as an activity, board games/riddles as shared leisure, holidays/days off, festivals/celebrations, recreational walks, magic shows or cinema.',
     'The fact that Venus is a game does not classify every prompt as leisure. Creative production is also tagged creative_expression where explicit; a standalone wording puzzle is humour/creative expression without necessarily a leisure scene.'),
    ('H', 'humor_wordplay', 'Юмор, нелепицы и игра слов', 'Humour, absurdity and wordplay', 'Mizah, saçmalık ve sözcük oyunları',
     'Explicit joke, pun, amusing/funny result, word puzzle/riddle, comic exaggeration, humorous instruction/title or absurd bureaucratic claim.',
     'Not every fictional world or warm exchange is humour. Consent/refusal examples are not comic merely because a character speaks.'),
    ('R', 'friendship', 'Дружба, компания и сотрудничество', 'Friendship, company and cooperation', 'Arkadaşlık, birlikte olma ve iş birliği',
     'Friends, friendly care, shared social rituals, companionship, a narrative team/shared project, recognition, gifts or cooperation are substantive subjects.',
     'P1/P2 placeholders, bilateral workflow and two people composing an unrelated answer do not by themselves mean friendship. This tag does not imply romance or a relationship outside the room.'),
    ('C', 'communication_support', 'Общение, поддержка и благодарность', 'Communication, support and thanks', 'İletişim, destek ve teşekkür',
     'An explicit interpersonal intent or speech act is the requested subject/outcome: invitation or coordinating signal, greeting/introduction (including CV self-presentation), thanks/cheer, apology, refusal, request/application, complaint, account of a character\'s own conduct, announcement, clarification, listening, advice/support, turn-taking or conversational closing/change. Fictional speakers count. Explicit communication wording/style or who receives a disclosure also counts.',
     'Generic answer/write/discuss/exchange procedure, arbitrary questions about another subject, arbitrary dialogue/argument, personal inner-character dialogue, artistic letters as a medium, news/forecast/report/expository explanation and advertising text without the listed interpersonal purpose do not by themselves qualify. Every YesBut offer/responder consent/stop instruction is procedure, not its subject.'),
    ('B', 'personal_boundaries', 'Личные границы, выбор и приватность', 'Personal boundaries, choice and privacy', 'Kişisel sınırlar, seçim ve mahremiyet',
     'Explicit pressure-free choice, declining/advice permission, opting to observe, changed decisions, private meaning/disclosure, preserving unknown details, personal enoughness or sensory load/autonomy are central subjects, including metaphors.',
     'Mandatory if-you-wish/stop/consent boilerplate does not add this tag by itself. An ordinary choice of colour or object is not automatically a boundary exercise.'),
    ('E', 'personal_experience', 'Свои привычки, ощущения и предпочтения', 'Personal habits, feelings and preferences', 'Kişisel alışkanlıklar, duygular ve tercihler',
     'An explicitly personal mood, comfort, aesthetic preference, routine, remembered pleasure, attention, sense of ownership or creative self-portrait is requested; invented answers may remain possible.',
     'P1/P2 naming and choosing a detail in a purely fictional neutral task do not alone make the subject personal. This is not counselling, trauma, diagnosis or an assertion about a participant.'),
]
short = {r[0]: r[1] for r in DEFINITIONS}
taxonomy = {
    'schema': 1, 'taxonomy_revision': 'P05-TOPICS-CANDIDATE-02', 'classification_status': STATUS,
    'approved': False, 'runtime_eligible': False,
    'policy': {
        'scope': 'Subjects explicitly present in service card text, including optional examples and all localized sides; not participant free speech or future user-authored conditions.',
        'union_rule': 'Union across question or both truth/dare or proposal/responder, and RU/EN/TR; any excluded tag blocks the whole service prompt under a future separately reviewed policy.',
        'boilerplate_rule': 'Invitation/action consent and stop boilerplate are procedure, not automatically personal_boundaries or communication_support topics.',
        'category_rule': 'Historical category is metadata only and is never used as an exhaustive subject classifier.',
        'unknown_rule': 'Unknown ID/revision/hash, missing locale, unknown topic or unresolved required review is not eligible for promotion.',
        'romance': 'No explicit romantic/sexual subject was identified in these exact 450 revised draft prompts. The proposed starting romance label is not added solely because participants are a private pair. Qualified human review remains required.',
        'response_scope': 'No promise that human free-text answers, advice or YesBut conditions stay inside these subjects. New condition/topic content needs its own policy and new bilateral consent.',
    },
    'topics': [{'topic_id': r[1], 'labels': dict(zip(['ru', 'en', 'tr'], r[2:5])), 'include': r[5], 'exclude': r[6], 'shorthand': r[0]} for r in DEFINITIONS],
}
save('taxonomy.candidate.v1.json', taxonomy)

source_paths = [p.relative_to(ROOT).as_posix() for p in sorted((ROOT / '.docs/content/p04-r2-full/cards').glob('*.json'))]
source_paths += [CLUSTERS_PATH, FINAL_MAP_PATH, SELECTION_PATH, '.docs/P05_TOPIC_ADVICE_DESIGN.md', '.docs/content/p04-r2-full/README.md', 'packages/relationship-engine/src/pack.ts', 'AGENTS.md']
before = {p: sha(ROOT / p) for p in source_paths}
final = {r['id']: r for r in read(ROOT / FINAL_MAP_PATH)['cards']}
selected = {r['id']: r for r in read(ROOT / SELECTION_PATH)['active_selection']}
clusters = read(ROOT / CLUSTERS_PATH)
notes = {}
for line in (OUT / 'classification-notes.tsv').read_text(encoding='utf-8-sig').splitlines():
    if not line.strip():
        continue
    cid, tags, why = line.split('|', 2)
    assert cid not in notes, f'duplicate manual row: {cid}'
    assert all(tag in short for tag in tags.split(',')), cid
    assert len(set(tags.split(','))) == len(tags.split(',')), cid
    notes[cid] = (sorted(short[t] for t in tags.split(',')), why)
cards = [read(ROOT / p) for p in source_paths if '/cards/' in p]
assert len(cards) == len(notes) == len(final) == len(selected) == 450
assert set(notes) == {c['id'] for c in cards} == set(final) == set(selected)
assert digest([{'id': c['id'], 'revision': c['revision'], 'sha256': digest(c)} for c in sorted(cards, key=lambda c: c['id'])]) == CATALOG
family_for = collections.defaultdict(list)
families = []
active_source_refs = 0
mixed_ids = set()
for cluster in clusters['clusters']:
    members = []
    for ref in cluster['active_members']:
        c = next(c for c in cards if c['id'] == ref['id'])
        assert c['revision'] == ref['revision'] and digest(c) == ref['canonical_sha256'], ref
        family_for[c['id']].append(cluster['cluster_id'])
        members.append({'card_id': c['id'], 'card_revision': c['revision'], 'card_sha256': digest(c), 'interaction': c['interaction']})
        active_source_refs += 1
    private = any(m['interaction'] == 'pair_private' for m in members)
    public = any(m['interaction'] != 'pair_private' for m in members)
    mixed = private and public
    if mixed:
        mixed_ids.update(m['card_id'] for m in members)
    families.append({
        'semantic_family_id': cluster['cluster_id'],
        'status': 'SOURCE_CONSERVATIVE_FAMILY_PENDING_INDEPENDENT_AND_HUMAN_REVIEW',
        'original_review_description_ru': cluster['repeated_result'],
        'description_scope': 'Historical similarity concern, not a claim that these changed revisions still have identical semantics. Conservative grouping keeps unresolved concern visible.',
        'members': members, 'inactive_original_ids_not_mapped_to_replacements': cluster['inactive_member_ids'],
        'mixed_visibility': mixed,
        'repertoire_proposal': 'EXCLUDE_WHOLE_FAMILY_FROM_NEW_TOPIC_ENABLED_REPERTOIRE_INDEPENDENT_OF_PRIVATE_HISTORY' if mixed else 'PENDING_SEMANTIC_DISPOSITION',
    })

entries = []
for c in sorted(cards, key=lambda c: c['id']):
    cid = c['id']
    h = digest(c)
    raw = sha(ROOT / final[cid]['path'])
    assert c['revision'] == final[cid]['revision'] == selected[cid]['revision']
    assert h == final[cid]['canonical_sha256'] == selected[cid]['sha256']
    assert raw == final[cid]['raw_sha256']
    unresolved = ['INDEPENDENT_SUBJECT_REVIEW_REQUIRED', 'HUMAN_EDITORIAL_AND_RU_EN_TR_REVIEW_REQUIRED']
    source_family = bool(family_for[cid])
    if not source_family:
        fid = 'P05-CAND-SINGLE-' + cid
        family_for[cid].append(fid)
        families.append({'semantic_family_id': fid, 'status': 'IDENTITY_PLACEHOLDER_NOT_PROOF_OF_SEMANTIC_UNIQUENESS', 'members': [{'card_id': cid, 'card_revision': c['revision'], 'card_sha256': h, 'interaction': c['interaction']}], 'mixed_visibility': False, 'repertoire_proposal': 'CROSS_CARD_SIMILARITY_REVIEW_REQUIRED'})
        unresolved.append('SINGLETON_PLACEHOLDER_CROSS_CARD_SIMILARITY_UNPROVEN')
    else:
        unresolved.append('SOURCE_SEMANTIC_DISPOSITION_UNRESOLVED')
    if cid in mixed_ids:
        unresolved.append('MIXED_VISIBILITY_WHOLE_FAMILY_EXCLUSION_PROPOSED_NOT_APPROVED')
    if cid == 'TD-1132':
        unresolved.append('TR_WORD_SENSE_WRITTEN_NOTE_VERSUS_MUSICAL_NOTE_REVIEW')
    if cid == 'YB-1072':
        unresolved.append('TR_MOON_FLOWER_LEXICAL_AMBIGUITY_REVIEW')
    if cid == 'Q-1115':
        unresolved.append('OPEN_ENDED_NEUTRAL_TOPIC_IS_NOT_A_CONTROLLED_VOCABULARY')
    if cid in {'Q-1031', 'Q-1039', 'Q-1041', 'Q-1130'}:
        unresolved.append('METAPHOR_FICTION_BOUNDARY_EDITORIAL_REVIEW_REQUIRED')
    entry = {
        'card_id': cid, 'card_revision': c['revision'], 'card_sha256': h, 'card_raw_sha256': raw,
        'card_sha256_algorithm': 'RE-1 canonical JSON SHA256, NFC string values, sorted object keys',
        'source_path': final[cid]['path'], 'mode': c['mode'], 'interaction': c['interaction'],
        'topic_ids': notes[cid][0], 'semantic_family_ids': sorted(family_for[cid]),
        'rationale': notes[cid][1], 'classification_status': STATUS,
        'locale_review': {'languages_read': ['ru', 'en', 'tr'], 'all_fields_read': True,
                          'status': 'AGENT_CANDIDATE_READING_ONLY_NOT_QUALIFIED_TRANSLATION_APPROVAL',
                          'field_sha256': {lang: {k: hashlib.sha256(v.encode('utf-8')).hexdigest() for k, v in c['text'][lang].items()} for lang in ['ru', 'en', 'tr']}},
        'unresolved_flags': unresolved,
    }
    entries.append(entry)

family_doc = {
    'schema': 1, 'revision': 'P05-SEMANTIC-CANDIDATE-02', 'classification_status': STATUS,
    'approved': False, 'runtime_eligible': False, 'source_path': CLUSTERS_PATH, 'source_sha256': before[CLUSTERS_PATH],
    'policy': {
        'scope': 'Existing 21 historical concerns with exact current active references; other references get explicit identity placeholders only. No exhaustive 101025-pair semantic analysis is claimed.',
        'singletons': 'Do not interpret a P05-CAND-SINGLE ID as editorial uniqueness or use it to close semantic repeat gates. It exists only to keep a known exact reference traceable for subsequent review.',
        'visibility': 'Public future sequence never depends on hidden private history. Public history may constrain private selection; private history may constrain that exact private pair, not public selection.',
        'mixed_resolution': 'Conservatively exclude all exact members of P04-SEM-17 and P04-SEM-18 from a new versioned repertoire unconditionally. No dynamic public-half removal after private events. No historical card edits. Alternative differentiated families require fresh review and a new digest.',
        'inactive_refs': 'Inactive originals remain listed only as source lineage. Replacement IDs are not assigned the old family by ID range or replacement relationship.',
    },
    'families': families,
}
save('semantic-families.candidate.v1.json', family_doc)
map_doc = {
    'schema': 1, 'map_revision': 'P05-TOPIC-MAP-CANDIDATE-02', 'classification_status': STATUS,
    'pack_digest': PACK, 'catalog_digest': CATALOG, 'taxonomy_digest': digest(taxonomy),
    'taxonomy_raw_sha256': sha(OUT / 'taxonomy.candidate.v1.json'),
    'semantic_policy_digest': digest(family_doc), 'semantic_policy_raw_sha256': sha(OUT / 'semantic-families.candidate.v1.json'),
    'approved': False, 'runtime_eligible': False, 'owner_review_status': 'HOLD',
    'lineage': {'prior_map_raw_sha256': prior_hashes['private-topic-map.candidate.v1.json'], 'review_md_sha256': lineage['review_md_sha256']},
    'entries': entries,
}
save('private-topic-map.candidate.v1.json', map_doc)
review_rows = []
for c in sorted(cards, key=lambda c: c['id']):
    e = next(e for e in entries if e['card_id'] == c['id'])
    review_rows.append({'card_id': c['id'], 'card_revision': c['revision'], 'card_sha256': digest(c), 'topic_ids': e['topic_ids'], 'rationale': e['rationale'], 'text': c['text'], 'unresolved_flags': e['unresolved_flags']})
save('localized-review-corpus.json', {'schema': 1, 'status': STATUS, 'source_texts_are_unmodified_copies_for_review_only': True, 'cards': review_rows})
after = {p: sha(ROOT / p) for p in source_paths}
assert before == after, 'source changed during packaging'
assert prior_hashes == {p.name: sha(p) for p in PRIOR.iterdir() if p.is_file()}, 'original candidate01 changed during build'
changes = []
for e in entries:
    old = prior_by_id[e['card_id']]
    assert (e['card_revision'], e['card_sha256'], e['card_raw_sha256']) == (old['card_revision'], old['card_sha256'], old['card_raw_sha256'])
    added = sorted(set(e['topic_ids']) - set(old['topic_ids']))
    removed = sorted(set(old['topic_ids']) - set(e['topic_ids']))
    if added or removed:
        changes.append({'card_id': e['card_id'], 'card_revision': e['card_revision'], 'card_sha256': e['card_sha256'], 'added_topics': added, 'removed_topics': removed, 'rationale': e['rationale']})
lineage['changes'] = changes
lineage['new_taxonomy_digest'] = digest(taxonomy)
lineage['new_map_raw_sha256'] = sha(OUT / 'private-topic-map.candidate.v1.json')
save('lineage.json', lineage)
save('boundary-audit.json', {
    'schema': 1, 'status': 'CANDIDATE_BOUNDARY_REAUDIT_NOT_APPROVAL',
    'read_scope': 'All 450 exact cards/all 2250 RU/EN/TR fields were read during candidate01 authoring. Current raw/canonical/field hashes are unchanged. This follow-up revisits the subject/procedure, concrete-object and natural/household-water boundaries across that entire reading and per-card notes; proposed corrections and controls were reread in current RU/EN/TR on all sides. This is not qualified translation approval.',
    'classification_method': 'Manual subject judgments and explicit per-card changes, not a keyword/category inference or assertion that mechanical bindings prove semantics.',
    'taxonomy_digest': digest(taxonomy), 'cards_reviewed_for_boundaries': 450,
    'entries': [{'card_id': e['card_id'], 'card_revision': e['card_revision'], 'card_sha256': e['card_sha256'], 'field_sha256': e['locale_review']['field_sha256'], 'subject_rationale': e['rationale'],
                 'boundary_decisions': {t: t in e['topic_ids'] for t in ['communication_support', 'everyday_objects', 'nature_animals']},
                 'changed_topics': next((r for r in changes if r['card_id'] == e['card_id']), None), 'status': STATUS} for e in entries],
    'remaining_ambiguities': ['All candidate annotations require independent and human review.', 'Q-1031/Q-1039/Q-1041/Q-1130 metaphor versus impossible-fiction judgments remain explicitly flagged after removing conservative fiction tags where the current text supplies only ordinary imagery. No creative-expression tags were removed.', 'Unspecified transparent drop TD-1130 stays natural-water imagery; explicit domestic tap drop YB-1066 and ordinary drip sound TD-1064 do not.'],
})
save('source-witness.json', {
    'schema': 1, 'scope': 'Exact read inputs before/after this packaging execution; not a whole-worktree clean-source proof',
    'before': before, 'after': after, 'source_unchanged': before == after,
    'catalog_digest_recomputed': CATALOG, 'pack_digest_from_hash_bound_current_history_selection': PACK,
    'manual_notes_raw_sha256': sha(OUT / 'classification-notes.tsv'),
})
print(json.dumps({'status': 'PACKAGED_CANDIDATE_NOT_APPROVED', 'entries': len(entries), 'topics': len(DEFINITIONS), 'source_clusters': len(clusters['clusters']), 'active_cluster_refs': active_source_refs, 'singletons': sum(f['status'].startswith('IDENTITY_') for f in families), 'mixed_exclusion_proposal_ids': sorted(mixed_ids), 'topic_counts': dict(collections.Counter(t for e in entries for t in e['topic_ids']))}, ensure_ascii=False, indent=2))
