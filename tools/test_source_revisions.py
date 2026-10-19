"""Tamper boundaries for the single owner-authorized plan supersession."""
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

from p00_history import validate_p00_history
from source_revisions import (ADR_PATH, ARCHIVE_PATH, ARCHIVE_SHA, AUTHORITY_PATH,
    LINKS, MANIFEST_PATH, ORIGINAL_PLAN_SHA, PLAN_PATH, authorized_plan_revision,
    expected_manifest, validate_source_revisions)

ROOT = Path(__file__).resolve().parents[1]


class ExactPlanRevisionTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='venus-source-revision-test-')
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        archive_bytes = (ROOT / ARCHIVE_PATH).read_bytes()
        self.assertEqual(hashlib.sha256(archive_bytes).hexdigest(), ARCHIVE_SHA)
        with zipfile.ZipFile(ROOT / ARCHIVE_PATH) as archive:
            for entry in archive.infolist():
                if entry.is_dir():
                    continue
                target = self.root / entry.filename.replace('\\', '/')
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(archive.read(entry))
        for path in (ARCHIVE_PATH, PLAN_PATH, ADR_PATH, AUTHORITY_PATH, MANIFEST_PATH):
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes((ROOT / path).read_bytes())

    def mutate_manifest(self, mutate):
        value = copy.deepcopy(expected_manifest())
        mutate(value)
        (self.root / MANIFEST_PATH).write_text(json.dumps(value), encoding='utf-8')

    def assert_blocked(self):
        self.assertTrue(validate_source_revisions(self.root))
        self.assertFalse(authorized_plan_revision(self.root, PLAN_PATH, ORIGINAL_PLAN_SHA))
        self.assertTrue(validate_p00_history(self.root))

    def test_exact_revision_preserves_full_original_history_and_all_eight_rows(self):
        self.assertEqual(validate_source_revisions(self.root), [])
        self.assertEqual(validate_p00_history(self.root), [])
        for requirement_id in LINKS:
            self.assertTrue(authorized_plan_revision(
                self.root, PLAN_PATH, ORIGINAL_PLAN_SHA, requirement_id))
        from check_p00 import check_rows
        import csv
        with (self.root / '.docs/implementation/traceability.csv').open(encoding='utf-8', newline='') as f:
            rows = list(csv.DictReader(f))
        self.assertEqual(check_rows(self.root, rows), [])

    def test_plan_byte_drift_fails(self):
        with (self.root / PLAN_PATH).open('ab') as f:
            f.write(b'\nunreviewed change\n')
        self.assert_blocked()

    def test_recomputed_plan_hash_cannot_authorize_drift(self):
        (self.root / PLAN_PATH).write_bytes(b'new unreviewed plan')
        self.mutate_manifest(lambda m: m['revisions'][0].update(
            current_sha256=hashlib.sha256(b'new unreviewed plan').hexdigest()))
        self.assert_blocked()

    def test_owner_authority_byte_drift_fails(self):
        with (self.root / AUTHORITY_PATH).open('ab') as f:
            f.write(b' ')
        self.assert_blocked()

    def test_recomputed_owner_authority_hash_cannot_authorize_drift(self):
        (self.root / AUTHORITY_PATH).write_text('{"source":{"kind":"agent"}}', encoding='utf-8')
        self.mutate_manifest(lambda m: m['authority'].update(sha256=hashlib.sha256(
            (self.root / AUTHORITY_PATH).read_bytes()).hexdigest()))
        self.assert_blocked()

    def test_adr_byte_drift_fails(self):
        with (self.root / ADR_PATH).open('ab') as f:
            f.write(b'\nunapproved ADR change')
        self.assert_blocked()

    def test_recomputed_adr_hash_cannot_authorize_drift(self):
        (self.root / ADR_PATH).write_bytes(b'changed ADR')
        self.mutate_manifest(lambda m: m['adr'].update(
            sha256=hashlib.sha256(b'changed ADR').hexdigest()))
        self.assert_blocked()

    def test_original_hash_mismatch_fails(self):
        self.mutate_manifest(lambda m: m['revisions'][0].update(original_sha256='0' * 64))
        self.assert_blocked()

    def test_additional_exception_path_fails(self):
        self.mutate_manifest(lambda m: m['revisions'].append({
            **m['revisions'][0], 'path': '.docs/README.md'}))
        self.assert_blocked()

    def test_extra_requirement_or_wildcard_fails(self):
        for requirement_id in ('PLAN-P00-*', 'V-001'):
            with self.subTest(requirement_id=requirement_id):
                self.mutate_manifest(lambda m: m['revisions'][0]['requirement_links'].append({
                    **m['revisions'][0]['requirement_links'][0], 'legacy_requirement_id': requirement_id}))
                self.assert_blocked()

    def test_missing_requirement_link_fails(self):
        self.mutate_manifest(lambda m: m['revisions'][0]['requirement_links'].pop())
        self.assert_blocked()

    def test_unrelated_normative_change_is_not_exempt(self):
        with (self.root / '.docs/README.md').open('ab') as f:
            f.write(b'\nunrelated normative change')
        # The supplement only validates its own finite input set; the complete
        # historical validator must still reject every other normative change.
        self.assertEqual(validate_source_revisions(self.root), [])
        self.assertTrue(any('normative input changed' in error for error in validate_p00_history(self.root)))
        self.assertFalse(authorized_plan_revision(self.root, '.docs/README.md', ORIGINAL_PLAN_SHA))

    def test_historical_csv_cannot_be_rehashed_to_current_source(self):
        path = self.root / '.docs/implementation/traceability.csv'
        path.write_bytes(path.read_bytes().replace(ORIGINAL_PLAN_SHA.encode(), b'0' * 64))
        self.assert_blocked()

    def test_historical_adr_index_cannot_be_edited(self):
        with (self.root / '.docs/adr/index.json').open('ab') as f:
            f.write(b' ')
        self.assert_blocked()

    def test_archive_bytes_cannot_be_changed(self):
        with (self.root / ARCHIVE_PATH).open('ab') as f:
            f.write(b'archive tamper')
        self.assert_blocked()

    def test_unknown_row_wrong_old_hash_or_noncanonical_path_never_resolve(self):
        for source, old_hash, requirement in (
            (PLAN_PATH, ORIGINAL_PLAN_SHA, 'PLAN-P00-UNREGISTERED'),
            (PLAN_PATH, '0' * 64, 'PLAN-P00-BASELINE'),
            ('.docs/../.docs/10_IMPLEMENTATION_PLAN.md', ORIGINAL_PLAN_SHA, 'PLAN-P00-BASELINE'),
            ('.docs/contracts/api.v1.openapi.json', ORIGINAL_PLAN_SHA, 'PLAN-P00-BASELINE'),
        ):
            with self.subTest(source=source, requirement=requirement):
                self.assertFalse(authorized_plan_revision(self.root, source, old_hash, requirement))

    def test_runtime_acceptance_cannot_be_promoted_by_supplement(self):
        for field, value in (('acceptance', 'PASSED'), ('runtime_acceptance', 'PASS')):
            with self.subTest(field=field):
                self.mutate_manifest(lambda m: m.update({field: value}))
                self.assert_blocked()
        self.mutate_manifest(lambda m: m['revisions'][0]['requirement_links'][0].update(status='PASS'))
        self.assert_blocked()

    def test_duplicate_json_key_and_extra_metadata_fail(self):
        manifest = json.dumps(expected_manifest())
        (self.root / MANIFEST_PATH).write_text('{"schema_version":2,' + manifest[1:], encoding='utf-8')
        self.assert_blocked()
        self.mutate_manifest(lambda m: m.update(ignore_all_other_paths=True))
        self.assert_blocked()

    def test_absent_supplement_keeps_original_archive_compatible_but_does_not_authorize_current_plan(self):
        (self.root / MANIFEST_PATH).unlink()
        self.assertEqual(validate_source_revisions(self.root), [])
        self.assertFalse(authorized_plan_revision(self.root, PLAN_PATH, ORIGINAL_PLAN_SHA))
        self.assertTrue(any('normative input changed' in error for error in validate_p00_history(self.root)))
        with zipfile.ZipFile(self.root / ARCHIVE_PATH) as archive:
            name = next(n for n in archive.namelist() if n.replace('\\', '/') == PLAN_PATH)
            (self.root / PLAN_PATH).write_bytes(archive.read(name))
        self.assertEqual(validate_p00_history(self.root), [])


if __name__ == '__main__':
    unittest.main()
