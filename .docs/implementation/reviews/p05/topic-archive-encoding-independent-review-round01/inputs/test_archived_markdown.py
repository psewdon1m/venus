"""Historical captures keep their bytes; current Markdown stays strict UTF-8."""
from pathlib import Path
import tempfile
import unittest
from archived_markdown import ARCHIVES, read_markdown, archive_errors

REPOSITORY = Path(__file__).resolve().parents[1]


class ArchivedMarkdownTests(unittest.TestCase):
    def test_actual_ancestor_directory_symlink_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            container = Path(temporary)
            root = container / 'repository'
            root.mkdir()
            for relative in ARCHIVES:
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes((REPOSITORY / relative).read_bytes())
            self.assertEqual(archive_errors(root), [])
            source = root / '.docs/implementation/reviews/p05/topic-measurement-design-review-round01/source'
            target = container / 'held-original-source'
            self.assertTrue(source.resolve().is_relative_to(container.resolve()))
            self.assertTrue(target.resolve().is_relative_to(container.resolve()))
            source.rename(target)
            source.symlink_to(target, target_is_directory=True)
            try:
                errors = archive_errors(root)
                self.assertEqual(len(errors), 4)
                self.assertTrue(all('linked ancestor' in value for value in errors))
            finally:
                source.unlink()

    def test_archive_inventory_rejects_deleted_capture(self):
        self.assertEqual(archive_errors(REPOSITORY), [])
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for relative in ARCHIVES:
                path = root / relative
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes((REPOSITORY / relative).read_bytes())
            self.assertEqual(archive_errors(root), [])
            removed = next(iter(ARCHIVES))
            (root / removed).unlink()
            failures = archive_errors(root)
            self.assertEqual(len(failures), 1)
            self.assertIn(removed, failures[0])

    def test_normal_markdown_is_utf8_with_its_own_base(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / 'current.md'
            path.write_text('Текущий документ — UTF-8', encoding='utf-8')
            self.assertEqual(read_markdown(path, root), ('Текущий документ — UTF-8', root))

    def test_unknown_non_utf8_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            path = root / 'new-evidence.md'
            path.write_bytes(b'Undeclared \x97 encoding')
            with self.assertRaises(UnicodeDecodeError):
                read_markdown(path, root)

    def test_all_exact_archives_are_decoded_with_declared_link_context(self):
        self.assertEqual(len(ARCHIVES), 11)
        for relative, record in ARCHIVES.items():
            with self.subTest(path=relative):
                path = REPOSITORY / relative
                text, base = read_markdown(path, REPOSITORY)
                self.assertEqual(text, path.read_bytes().decode(record['encoding']))
                self.assertEqual(base, (REPOSITORY / record['origin']).parent if record['origin'] else path.parent)

    def test_any_changed_archived_bytes_fail_even_valid_utf8(self):
        for relative in ARCHIVES:
            with self.subTest(path=relative), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                path = root / relative
                path.parent.mkdir(parents=True)
                path.write_text('A rewritten valid UTF-8 file', encoding='utf-8')
                with self.assertRaisesRegex(ValueError, 'immutable archived Markdown bytes changed'):
                    read_markdown(path, root)

    def test_same_size_archived_corruption_fails(self):
        for relative in ARCHIVES:
            with self.subTest(path=relative), tempfile.TemporaryDirectory() as temporary:
                root = Path(temporary)
                path = root / relative
                path.parent.mkdir(parents=True)
                raw = bytearray((REPOSITORY / relative).read_bytes())
                raw[0] ^= 1
                path.write_bytes(raw)
                with self.assertRaisesRegex(ValueError, 'immutable archived Markdown bytes changed'):
                    read_markdown(path, root)


if __name__ == '__main__':
    unittest.main()
