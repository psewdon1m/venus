from pathlib import Path
import json
p=Path('.docs/implementation/reviews/p05/topic-map-round-01.semantic-probe.json');r=json.loads(p.read_text('utf-8'));m=json.loads(Path('.docs/implementation/evidence/p05/topic-map-candidate-01/private-topic-map.candidate.v1.json').read_text('utf-8'));e={x['card_id']:x for x in m['entries']}
for c in r['controls']:
 actual=not bool(set(c['excluded_topics'])&set(e[c['card_id']]['topic_ids']));assert actual==c['actual_allowed'];print(c['name'], 'SEMANTIC_MISMATCH' if actual!=c['reviewer_expected_allowed'] else 'PASS')
assert sum(c['actual_allowed']!=c['reviewer_expected_allowed'] for c in r['controls'])==6
print('REPRODUCED_6_MISMATCHES_AND_7_POSITIVE_CONTROLS; candidate runtime not executed')
