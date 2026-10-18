#!/usr/bin/env python3
"""Self-contained documentation integrity check (file links, reference assets, snapshots)."""
from pathlib import Path
import json
import re
import hashlib
import sys
from urllib.parse import unquote
from source_inventory import source_files

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'.docs'
REQUIRED=['README.md', '.docs/README.md']+[f'.docs/{i:02d}_{name}.md' for i,name in [
(1,'PRODUCT_VISION'),(2,'TECHNICAL_ARCHITECTURE'),(3,'VISUAL_DIRECTION'),
(4,'UI_UX_AND_INTERACTIONS'),(5,'CI_QUALITY_AND_RELEASES'),
(6,'DEPLOYMENT_AND_OPERATIONS'),(7,'KNOWN_AND_EXPECTED_PROBLEMS'),
(8,'RELATIONSHIP_ENGINE'),(9,'CARD_AUTHORING_AND_AUTOMATION')]]
REQUIRED += ['.docs/contracts/relationship-policy.v1.json','tools/check_relationship_policy.py','.docs/contracts/card.schema.json','tools/validate_cards.py',
             '.docs/contracts/card-batch.schema.json','tools/validate_card_batch.py','tools/build_card_pack.py',
             '.docs/examples/card-batch-request.json','.docs/examples/pack-candidate-manifest.json','tools/test_contracts.py',
             '.docs/source-snapshots/PART_04_BOOTSTRAP_AND_DEPLOYMENT.md',
             '.docs/source-snapshots/PART_05_CI_RELEASES_AND_LOCAL_UPDATES.md',
             '.docs/source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md']
LINKS=re.compile(r'!?\[[^\]\n]*\]\(([^)]+)\)')
REQUIRED += ['.docs/10_IMPLEMENTATION_PLAN.md', '.docs/implementation/README.md',
             '.docs/implementation/traceability.csv', '.docs/implementation/status.md',
             '.docs/implementation/USER_DECISIONS.md', '.docs/implementation/CONTRACTS.md',
             '.docs/implementation/UI_FLOWS.md', '.docs/adr/README.md', '.docs/adr/index.json',
             '.docs/contracts/api.v1.openapi.json', '.docs/contracts/projections.v1.schema.json',
             '.docs/contracts/events.v1.schema.json', '.docs/contracts/state-machines.v1.json',
             'tools/check_p00.py', 'tools/p00_rules_reference.py', 'tools/test_p00.py']
REQUIRED += ['tools/p00_evidence.py', '.docs/implementation/user-decisions.v1.json',
             '.docs/contracts/service-entry-policy.v1.json', '.docs/implementation/DIV-20261018-01.md']
errors=[]
for rel in REQUIRED:
 if not (ROOT/rel).is_file():errors.append(f'missing required file: {rel}')
markdown = [p for p in source_files(ROOT) if p.suffix == '.md']
for p in markdown:
 # The supplied central Part04/05/12 snapshots are intentionally immutable
 # and contain upstream links to Part00/01/03/06/07/09/13 not supplied here.
 # Their absence must be documented as an external dependency, not repaired
 # by editing source snapshots or faking replacement files.
 if (DOCS / "source-snapshots") in p.parents:
  continue
 text=p.read_text(encoding='utf-8')
 for raw in LINKS.findall(text):
  link=raw.strip().split(' "')[0]
  if not link or link.startswith(('https://','http://','mailto:','data:','#')):continue
  path=unquote(link.split('#')[0])
  if not path:continue
  dest=(p.parent/path).resolve()
  if not dest.is_relative_to(ROOT.resolve()):errors.append(f'{p.relative_to(ROOT)}: escaped root {link}')
  elif not dest.exists(): errors.append(f'{p.relative_to(ROOT)}: broken link {link}')
# Verify primary and additional visual references against their audited source map.
reference_map=DOCS/'assets/references/source-map.json'
if reference_map.exists():
    references=json.loads(reference_map.read_text(encoding='utf-8')).get('references',[])
    for item in references:
        target=DOCS/'assets/references'/item['file']
        if not target.is_file():errors.append(f'missing visual reference: {item["file"]}');continue
        if hashlib.sha256(target.read_bytes()).hexdigest()!=item['sha256']:
            errors.append(f'visual reference digest mismatch: {item["file"]}')
    if len(references)!=10:errors.append('visual reference map needs exactly 10 images')
else:
    errors.append('missing visual source-map.json')

# Exact historical catalogue IDs remain stable; this is inventory only, not a PASS release gate.
known=(DOCS/'source-snapshots/PART_12_KNOWN_DEPLOYMENT_AND_OPERATIONS_PROBLEMS.md')
if known.is_file():
    known_ids=re.findall(r'\*\*([A-Z]+-[0-9]{2})\*\*',known.read_text(encoding='utf-8'))
    if len(known_ids)!=118 or len(set(known_ids))!=len(known_ids):
        errors.append(f'Part12 expected 118 distinct active source IDs, found {len(known_ids)} ({len(set(known_ids))} unique)')
refs=list((DOCS/'assets/references').glob('*.png'))
if len(refs)!=10:errors.append(f'expected 10 author-provided reference images, found {len(refs)}')
examples=list((DOCS/'examples/cards').glob('*.json'))
if len(examples)<9:errors.append(f'expected >=9 illustrative cards, found {len(examples)}')
# Verify documented snapshot bytes against canonical upstream attachment hashes recorded in manifest.
manifest=DOCS/'source-snapshots/source-hashes.json'
if manifest.exists():
 for item in json.loads(manifest.read_text(encoding='utf-8'))['source_files']:
  f=DOCS/'source-snapshots'/item['file']
  if not f.exists():errors.append('snapshot missing: '+item['file']);continue
  sha=hashlib.sha256(f.read_bytes()).hexdigest()
  if sha!=item['sha256']:errors.append('modified normative snapshot: '+item['file'])
print(f'Venus docs: {len(markdown)} markdown files, {len(refs)} moodboard images, {len(examples)} draft cards, {len(errors)} errors.')
if errors:
 for e in errors: print('ERROR',e)
 sys.exit(1)
print('PASS: required files, linked assets and snapshot hashes')
