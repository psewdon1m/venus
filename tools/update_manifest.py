"""Explicitly refresh the source consistency manifest; review its diff before committing."""
import hashlib
from pathlib import Path
from source_inventory import source_files
root = Path(__file__).resolve().parents[1]
paths = sorted(p for p in source_files(root) if p.name != 'FILE_MANIFEST.sha256')
(root/'FILE_MANIFEST.sha256').write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(root).as_posix()}\n' for p in paths), encoding='utf-8')
print(f'Recorded {len(paths)} source files')
