"""Exact owner-authorized plan revision; never an exemption for arbitrary drift.

Pins are deliberate review inputs. Updating this module/manifest is a source change
requiring independent review; no command regenerates acceptance from current bytes.
Historical CSV/archive and all other P00 normative inputs remain immutable.
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
from pathlib import Path
import zipfile

PLAN_PATH = '.docs/10_IMPLEMENTATION_PLAN.md'
MANIFEST_PATH = '.docs/implementation/source-revisions.v2.json'
ARCHIVE_PATH = 'tools/fixtures/p00-2.zip'
ARCHIVE_SHA = 'bf2b3e8b02acf1a2904b1614049b46ae9c8f5b3c244ef1856682257825babb0d'
ORIGINAL_PLAN_SHA = 'd3b423ca33d9a4f5a63335ae5bd4309536f69b0ffc9c6276257e2cf16a98640d'
PLAN_SHA = '8b5e6a51a1e129c73114cc55843ed8d8cb78dff6bfd8f20fb356a684c1509ae9'
AUTHORITY_PATH = '.docs/implementation/user-decisions.v2.json'
AUTHORITY_SHA = '965ae74e75bc778cd8c66d86cb7505e34ade38a3b7d388246b2e4c75f453cfe9'
ADR_PATH = '.docs/adr/ADR-019-standalone-local-pilot.md'
ADR_SHA = '056fe00e29e117f6e1ef7e4884e1f6d3d6ca61fa9a1a27e22a4b9fc17de26dca'
AUTHORITY_IDS = ['U-008', 'U-009', 'U-011', 'U-017']
REVISION = 'STANDALONE-LOCAL-PILOT-20261019'


# Exact additive chain for the owner's functional-first order. V2 remains sealed.
V3_PATH = '.docs/implementation/source-revisions.v3.json'
V3_INPUTS = {
    MANIFEST_PATH: 'de15000772bfc1bc6b4dedb683daff5462366f911e4ba993527c431ae8c9430b',
    '.docs/implementation/evidence/pipeline-v3-owner-order01/PLAN-v2-SNAPSHOT.md': PLAN_SHA,
    PLAN_PATH: '171139ce387bc9af063fdf7f5e68b235166c7b2fa1728a745a159e182b46c501',
    '.docs/implementation/user-decisions.v7.json': '951e1c50f75226b1616ab04e6bad9700683ab63ef42db673de8a08264d491970',
    '.docs/adr/ADR-035-functional-development-before-final-pilot.md': '7e9b077ee378a290f89fe3f85369ffd24f9113c8e128256097fa48f9e449a009',
}


def expected_v3():
    return {'schema_version': 3, 'revision': 'FUNCTIONAL-STAGES-FIRST-20261025',
            'previous_revision': REVISION, 'decision_ids': ['U-022', 'U-023'],
            'runtime_acceptance': 'NOT_RUN', 'inputs': V3_INPUTS,
            'compatibility': 'Execution order only; preserve original requirements and stage gates',
            'rollback': 'Restore pinned V2 plan and remove this addendum together; preserve all proof'}


def current_plan_sha(root):
    supplement = root / V3_PATH
    if not supplement.exists():
        return PLAN_SHA
    if supplement.stat().st_size > 16384 or _json(supplement.read_bytes()) != expected_v3():
        raise ValueError('v3 source revision differs from exact owner-authorized chain')
    for name, expected in V3_INPUTS.items():
        target = root / name
        if not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest() != expected:
            raise ValueError('v3 source revision input missing/stale: ' + name)
    return V3_INPUTS[PLAN_PATH]


# This finite map is the complete exemption surface: exactly these eight old
# source rows, only the plan path and only its pinned original -> current bytes.
LINKS = {
    'PLAN-P00-BASELINE': ('PLAN-P00-V2-BASELINE', 'P00',
        'Preserve original baseline/archive bytes and verify applicable rollback evidence.'),
    'PLAN-P00-REGISTRY': ('PLAN-P00-V2-REGISTRY', 'P00',
        'Account for standalone requirements, explicit deferred scope and source-bound statuses.'),
    'PLAN-P00-CONTRACTS': ('PLAN-P00-V2-CONTRACTS', 'P00',
        'Version standalone entry/update/media contracts without overwriting original P00 contracts.'),
    'PLAN-P00-RULES': ('PLAN-P03-V2-RULES', 'P03',
        'Re-run consent/privacy/rules regressions for changed runtime; retain historical P03 scope.'),
    'PLAN-P00-FLOWS': ('PLAN-P05-LOCAL-UI', 'P05',
        'Exercise local desktop browser/locale/accessibility flows including explicit 18+ admission.'),
    'PLAN-P00-ACCEPTANCE': ('PLAN-P00-V2-ACCEPTANCE', 'P00',
        'Independent scope-v2 source/implementation review; owner scope decision is not runtime PASS.'),
    'PLAN-P00-FAIRNESS': ('PLAN-P03-V2-FAIRNESS', 'P03',
        'Reassess applicability of historical fairness/inference evidence before new pack/runtime claims.'),
    'PLAN-P00-RECOVERY': ('PLAN-P06-RECOVERY', 'P06',
        'Measure local host-file backup/restore; do not invent owner-approved production RPO/RTO.'),
}


def _json(raw):
    def unique_pairs(pairs):
        obj = {}
        for key, value in pairs:
            if key in obj:
                raise ValueError('duplicate source revision JSON key: ' + key)
            obj[key] = value
        return obj
    return json.loads(raw, object_pairs_hook=unique_pairs)


def _descriptor(path, sha):
    return {'path': path, 'sha256': sha}


def expected_manifest():
    """An explicit specification for this one revision, not a current-file scanner."""
    return {
        'schema_version': 2,
        'revision': REVISION,
        'acceptance': 'IN_REVIEW',
        'runtime_acceptance': 'NOT_RUN',
        'original_archive': _descriptor(ARCHIVE_PATH, ARCHIVE_SHA),
        'authority': {**_descriptor(AUTHORITY_PATH, AUTHORITY_SHA),
                      'decision_ids': AUTHORITY_IDS},
        'adr': {**_descriptor(ADR_PATH, ADR_SHA), 'id': 'ADR-019'},
        'revisions': [{
            'path': PLAN_PATH,
            'original_sha256': ORIGINAL_PLAN_SHA,
            'current_sha256': PLAN_SHA,
            'source_version': '2.0.0',
            'requirement_links': [{
                'legacy_requirement_id': legacy,
                'local_check_id': check_id,
                'stage': stage,
                'description': description,
                'status': 'NOT_RUN',
                'evidence': None,
            } for legacy, (check_id, stage, description) in LINKS.items()],
        }],
    }


def validate_source_revisions(root: Path):
    """Return errors; absent supplement is valid only for unchanged old trees.

    Actual authorization also checks current bytes; callers must never accept a
    mismatch solely because this function returns [] on an old archive tree.
    """
    manifest_path = root / MANIFEST_PATH
    if not manifest_path.exists():
        return []
    try:
        if manifest_path.stat().st_size > 128 * 1024:
            raise ValueError('source revision manifest too large')
        raw = manifest_path.read_bytes()
        manifest = _json(raw)
        # Exact structure disallows extra exception paths, wildcard IDs, changed
        # acceptance/status, extra metadata and recomputed authority/hash fields.
        if type(manifest.get('schema_version')) is not int or manifest != expected_manifest():
            raise ValueError('source revision manifest differs from reviewed exact revision')
        for name, expected in ((PLAN_PATH, current_plan_sha(root)), (AUTHORITY_PATH, AUTHORITY_SHA),
                               (ADR_PATH, ADR_SHA), (ARCHIVE_PATH, ARCHIVE_SHA)):
            path = root / name
            if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                raise ValueError('source revision input missing/stale: ' + name)
        authority = _json((root / AUTHORITY_PATH).read_bytes())
        if (authority.get('schema_version') != 2 or authority.get('revision') != REVISION or
                authority.get('source', {}).get('kind') != 'direct_user_messages'):
            raise ValueError('source revision authority is not the pinned owner decision revision')
        ids = [row['id'] for row in authority['decisions']]
        if len(ids) != len(set(ids)) or not set(AUTHORITY_IDS).issubset(ids):
            raise ValueError('source revision authority decisions missing/duplicate')
        # Reconstitute the immutable original, not values copied from live CSV.
        with zipfile.ZipFile(root / ARCHIVE_PATH) as archive:
            members = {name.replace('\\', '/'): name for name in archive.namelist()}
            old_plan = archive.read(members[PLAN_PATH])
            if hashlib.sha256(old_plan).hexdigest() != ORIGINAL_PLAN_SHA:
                raise ValueError('source revision original plan hash mismatch')
            rows = list(csv.DictReader(io.StringIO(archive.read(
                members['.docs/implementation/traceability.csv']).decode('utf-8'))))
            old_rows = [row for row in rows if row['source'] == PLAN_PATH]
            if (len(old_rows) != len(LINKS) or {row['requirement_id'] for row in old_rows} != set(LINKS) or
                    any(row['source_sha256'] != ORIGINAL_PLAN_SHA for row in old_rows)):
                raise ValueError('source revision immutable eight-row linkage mismatch')
            for immutable in ('.docs/implementation/traceability.csv', '.docs/adr/index.json'):
                if (root / immutable).read_bytes() != archive.read(members[immutable]):
                    raise ValueError('source revision historical file changed: ' + immutable)
        return []
    except (OSError, ValueError, TypeError, KeyError, AttributeError, zipfile.BadZipFile) as exc:
        return ['source revision invalid: ' + str(exc)]


def authorized_plan_revision(root: Path, source: str, original_sha: str,
                             requirement_id: str | None = None):
    """Only the pinned original plan/rows may resolve through this supplement."""
    if (source != PLAN_PATH or original_sha != ORIGINAL_PLAN_SHA or
            (requirement_id is not None and requirement_id not in LINKS) or
            not (root / MANIFEST_PATH).is_file()):
        return False
    return not validate_source_revisions(root)
