"""Validate accepted P00 against its immutable byte archive, not later-stage source."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import tempfile
import zipfile
from p00_evidence import validate_gate
from source_revisions import authorized_plan_revision, validate_source_revisions

ARCHIVE_SHA = 'bf2b3e8b02acf1a2904b1614049b46ae9c8f5b3c244ef1856682257825babb0d'

def validate_p00_history(root):
    archive = root/'tools/fixtures/p00-2.zip'
    if hashlib.sha256(archive.read_bytes()).hexdigest() != ARCHIVE_SHA:
        return ['historical P00 archive digest mismatch']
    with tempfile.TemporaryDirectory(prefix='venus-p00-') as directory:
        frozen = Path(directory)
        with zipfile.ZipFile(archive) as z:
            # Compress-Archive emits directory entries and Windows separators.
            names = [name.replace('\\', '/') for name in z.namelist()]
            if len(names) != len(set(names)):
                return ['duplicate historical P00 archive member']
            for info, name in zip(z.infolist(), names):
                parts = PurePosixPath(name)
                if parts.is_absolute() or '..' in parts.parts or ':' in name:
                    return ['unsafe historical P00 archive member']
                if info.is_dir(): continue
                target = frozen/name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(z.read(info))
        registry = json.loads((frozen/'.docs/implementation/p00-registry.json').read_text('utf-8'))
        report = json.loads((frozen/registry['current_gate_report']['path']).read_text('utf-8'))
        errors = validate_gate(frozen, report, registry['independent_reviewers'])
        inputs = json.loads((frozen/report['inputs']['path']).read_text('utf-8'))['files']
        errors.extend(validate_source_revisions(root))
        for name, expected in inputs.items():
            if name.startswith('.docs/'):
                current = root/name
                if ((not current.is_file() or hashlib.sha256(current.read_bytes()).hexdigest() != expected)
                        and not authorized_plan_revision(root, name, expected)):
                    errors.append('P00 normative input changed without a new revision: '+name)
        return errors
