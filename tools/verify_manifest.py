#!/usr/bin/env python3
"""Verify every packaged Venus documentation file against FILE_MANIFEST.sha256.

Usage (from any cwd): python tools/verify_manifest.py
This is an accidental-corruption/consistency check, NOT publisher authentication.
"""
from __future__ import annotations

import hashlib
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "FILE_MANIFEST.sha256"
errors: list[str] = []
listed: dict[str, str] = {}

if not MANIFEST.is_file():
    print("FAIL: FILE_MANIFEST.sha256 is missing")
    sys.exit(1)

for lineno, row in enumerate(MANIFEST.read_text(encoding="utf-8").splitlines(), 1):
    if not row.strip():
        continue
    match = re.fullmatch(r"([a-f0-9]{64})  (.+)", row)
    if not match:
        errors.append(f"line {lineno}: malformed sha256 manifest row")
        continue
    digest, path = match.groups()
    target = (ROOT / path).resolve()
    if path in listed:
        errors.append(f"line {lineno}: duplicate path {path}")
    if path == "FILE_MANIFEST.sha256" or not target.is_relative_to(ROOT.resolve()):
        errors.append(f"line {lineno}: unsafe path {path}")
        continue
    listed[path] = digest
    if not target.is_file():
        errors.append(f"missing: {path}")
    elif hashlib.sha256(target.read_bytes()).hexdigest() != digest:
        errors.append(f"digest mismatch: {path}")

actual = {
    path.relative_to(ROOT).as_posix()
    for path in ROOT.rglob("*")
    if path.is_file() and path.name != "FILE_MANIFEST.sha256"
    and "__pycache__" not in path.parts and path.suffix != ".pyc"
}
for unlisted in sorted(actual - listed.keys()):
    errors.append(f"unlisted file: {unlisted}")
for nonexistent in sorted(listed.keys() - actual):
    errors.append(f"listed but absent: {nonexistent}")

for error in errors:
    print("ERROR", error)
print(f"Checked {len(listed)} packaged paths; errors={len(errors)}")
if errors:
    sys.exit(1)
print("PASS: packaged bytes match manifest; provenance/signatures require release verification.")
