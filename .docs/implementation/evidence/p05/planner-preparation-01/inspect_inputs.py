"""Read-only preparation probe; emits only a new exclusive scratch receipt."""
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[5]
OUT = Path(__file__).with_name('source-witness.json')
BASE = '.docs/implementation/evidence/p05/topic-map-candidate-02/'
PATHS = [
    'AGENTS.md', '.docs/10_IMPLEMENTATION_PLAN.md', '.docs/P05_TOPIC_ADVICE_DESIGN.md',
    '.docs/implementation/p05-work-map.json',
    'packages/relationship-engine/src/engine.ts', 'packages/relationship-engine/src/types.ts',
    'packages/relationship-engine/src/pack.ts', 'packages/relationship-engine/src/policy.json',
    'packages/relationship-engine/src/policy-identity.ts', 'packages/relationship-engine/src/engine.test.ts',
    'packages/relationship-engine/src/private-conversation.ts',
    'tools/build_card_pack.py', 'tools/card-catalog.mjs',
    '.docs/implementation/reviews/p05/topic-map-round-02.md',
    BASE+'private-topic-map.candidate.v1.json', BASE+'taxonomy.candidate.v1.json',
    BASE+'semantic-families.candidate.v1.json',
]
def sha(raw):
    return hashlib.sha256(raw).hexdigest()
def read(relative):
    return json.loads((ROOT/relative).read_text(encoding='utf-8'))
before = {p:sha((ROOT/p).read_bytes()) for p in PATHS}
mapping = read(BASE+'private-topic-map.candidate.v1.json')
taxonomy = read(BASE+'taxonomy.candidate.v1.json')
semantic = read(BASE+'semantic-families.candidate.v1.json')
assert before[BASE+'private-topic-map.candidate.v1.json'] == '000f5e35e3efed601a69ebbd3c428d9bf9e55d101df6edfef74c935209f1295b'
entries = mapping['entries']
assert len(entries)==450 and len({e['card_id'] for e in entries})==450
known = {t['topic_id'] for t in taxonomy['topics']}
assert len(known)==13
for entry in entries:
    assert entry['topic_ids'] and set(entry['topic_ids'])<=known
    card = read(entry['source_path'])
    assert card['id']==entry['card_id'] and card['revision']==entry['card_revision']
    assert sha((ROOT/entry['source_path']).read_bytes())==entry['card_raw_sha256']
mixed = [f for f in semantic['families'] if f['mixed_visibility']]
assert {f['semantic_family_id'] for f in mixed}=={'P04-SEM-17','P04-SEM-18'}
excluded = sorted(m['card_id'] for f in mixed for m in f['members'])
assert excluded==['TD-1005','YB-1005','YB-1113','YB-1126','YB-1133']
assert all(not doc['approved'] and not doc['runtime_eligible'] for doc in [mapping,taxonomy,semantic])
assert mapping['owner_review_status']=='HOLD'
after = {p:sha((ROOT/p).read_bytes()) for p in PATHS}
assert before==after
report = {
    'schema_version':1, 'scope':'READONLY_PREPARATION_STRUCTURAL_PROBE_NOT_RUNTIME_OR_CONTENT_APPROVAL',
    'created_at':datetime.now(timezone.utc).isoformat(),
    'contextual_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    'source_dirty':bool(subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip()),
    'inputs_raw_sha256':before, 'inputs_unchanged':True,
    'candidate_counts':{'cards':len(entries),'topics':len(known),'families':len(semantic['families']),
       'identity_placeholders':sum(f['semantic_family_id'].startswith('P05-CAND-SINGLE-') for f in semantic['families']),
       'historical_concerns':sum(f['semantic_family_id'].startswith('P04-SEM-') for f in semantic['families']),
       'private_cards':sum(e['interaction']=='pair_private' for e in entries)},
    'mixed_unconditional_proposed_exclusions':excluded,
    'private_raw_by_mode_if_creative_excluded':dict(Counter(e['mode'] for e in entries if e['interaction']=='pair_private' and 'creative_expression' not in e['topic_ids'])),
    'human_hold_retained':True, 'runtime_activation':False,
    'status':'PREPARATION_STRUCTURAL_PASS',
}
with OUT.open('x',encoding='utf-8') as file:
    json.dump(report,file,ensure_ascii=False,indent=2)
    file.write('\n')
print(json.dumps({k:report[k] for k in ['status','inputs_unchanged','candidate_counts','mixed_unconditional_proposed_exclusions','private_raw_by_mode_if_creative_excluded']},ensure_ascii=False))
