"""Stable implementation identity; evolving journals, gate evidence and status are derived."""
import hashlib
import json
from pathlib import Path
import re
from source_inventory import source_files
ROOT=Path(__file__).resolve().parents[1]
EXCLUDED_FILES={'FILE_MANIFEST.sha256','.docs/implementation/status.md','.docs/implementation/presentations-registry.json'}
EXCLUDED_PREFIXES=('.history/','.docs/implementation/evidence/','.docs/implementation/reviews/')
def included(name):return name not in EXCLUDED_FILES and not name.startswith(EXCLUDED_PREFIXES) and not re.fullmatch(r'\.docs/implementation/p\d{2}-registry\.json',name)
def digest(data):return hashlib.sha256(data).hexdigest()
def inventory(root=ROOT):return {p.relative_to(root).as_posix():digest(p.read_bytes()) for p in source_files(root) if included(p.relative_to(root).as_posix())}
def identity(files):return digest(json.dumps(files,sort_keys=True,separators=(',',':')).encode())
if __name__=='__main__':print(identity(inventory()))
