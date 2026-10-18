import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile
import shutil
from source_inventory import source_files
from p00_history import validate_p00_history

ROOT = Path(__file__).resolve().parents[1]

class PortableHistoryAndInventory(unittest.TestCase):
    def test_accepted_history_is_valid_and_normative_drift_rejected(self):
        self.assertEqual(validate_p00_history(ROOT), [])
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root/'tools/fixtures').mkdir(parents=True)
            shutil.copyfile(ROOT/'tools/fixtures/p00-2.zip', root/'tools/fixtures/p00-2.zip')
            self.assertTrue(any('normative input changed' in e for e in validate_p00_history(root)))

    def test_archive_digest_and_path_traversal_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d); (root/'tools/fixtures').mkdir(parents=True)
            path = root/'tools/fixtures/p00-2.zip'
            with zipfile.ZipFile(path,'w') as archive: archive.writestr('../escape','unsafe')
            self.assertEqual(validate_p00_history(root), ['historical P00 archive digest mismatch'])
            with patch('p00_history.ARCHIVE_SHA', hashlib.sha256(path.read_bytes()).hexdigest()):
                self.assertEqual(validate_p00_history(root), ['unsafe historical P00 archive member'])

    def test_inventory_excludes_generated_files_but_includes_new_sources(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for name in ['node_modules/a.md','.git/a.md','apps/web/dist/a.js','.artifacts/report.json','tools/__pycache__/a.pyc','apps/api/src/new.ts','new-doc.md']:
                p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text('fixture')
            self.assertEqual(sorted(p.relative_to(root).as_posix() for p in source_files(root)), ['apps/api/src/new.ts','new-doc.md'])

if __name__ == '__main__': unittest.main()
