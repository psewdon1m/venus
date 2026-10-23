"""One manual, pinned completed-owner batch. Default: metadata preflight only.

No Docker, model execution, statistical credit, background service or retry loop.
All destructive filesystem operations remain in this Python process. PowerShell
is used only for native junction creation with separately passed path arguments.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess

WORKSPACE = Path('C:/.projects/venus')
SOURCE = WORKSPACE / '.artifacts/p05-fixedranges'
DESTINATION = Path('E:/.venus-artifacts/venus-p05-20261022/raw')
OUTPUT = WORKSPACE / '.artifacts/p05-raw-storage-relocation01'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def plain(path):
    s = path.lstat()
    assert not (s.st_file_attributes & stat.FILE_ATTRIBUTE_REPARSE_POINT), path
    return s


def exact_child(path, parent, leaf):
    assert path.absolute() == parent.absolute() / leaf and path.parent == parent
    assert re.fullmatch(r'[0-9a-f]{32}(?:\.storage-backup01)?', leaf)
    assert parent.resolve() == parent.absolute(), parent
    if path.exists():
        plain(path)
        assert path.resolve() == parent.resolve() / leaf


def tree(path, allow_owner_junction=False):
    if allow_owner_junction:
        assert os.path.isjunction(path)
    else:
        plain(path)
    result = {}
    for base, dirs, files in os.walk(path, followlinks=False):
        base = Path(base)
        for name in sorted(dirs):
            child = base / name
            assert stat.S_ISDIR(plain(child).st_mode)
            result[child.relative_to(path).as_posix() + '/'] = {'directory': True}
        for name in sorted(files):
            child = base / name
            before = plain(child)
            assert stat.S_ISREG(before.st_mode) and before.st_nlink == 1, child
            digest = sha(child)
            after = plain(child)
            assert (before.st_size, before.st_mtime_ns) == (after.st_size, after.st_mtime_ns)
            result[child.relative_to(path).as_posix()] = {'bytes': before.st_size, 'sha256': digest}
    assert result and 'host-report.json' in result and 'export-pins.json' in result
    return dict(sorted(result.items()))


def validate_host(row, plan):
    owner = row['owner']
    assert re.fullmatch(r'[0-9a-f]{32}', owner)
    logical = SOURCE / owner
    exact_child(logical, SOURCE, owner)
    assert sha(logical / 'host-report.json') == row['host_report_sha256']
    assert sha(logical / 'export-pins.json') == row['export_pins_sha256']
    host = json.loads((logical / 'host-report.json').read_text())
    assert host['status'] == 'RANGE_EXECUTION_COMPLETE_NOT_STATISTICAL_ACCEPTANCE'
    assert host['owner'] == owner and host['range'] == row['range']
    assert host['source_identity'] == plan['source_identity'] and host['image'] == plan['image']
    assert host['worker_exit'] == 0 and host['timeout'] is False
    assert host['cleanup'] == 'COMPLETE' and host['cleanup_errors'] == []
    assert all(host[k] is True for k in ['writer_stopped', 'export_verified', 'producer_unchanged'])
    evidence = WORKSPACE / row['evidence_path']
    assert evidence.resolve().is_relative_to(WORKSPACE.resolve() / '.artifacts')
    assert sha(evidence) == row['evidence_sha256']
    return logical


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--plan', type=Path, required=True)
    ap.add_argument('--plan-sha256', required=True)
    ap.add_argument('--execute', action='store_true')
    ap.add_argument('--root-authorization', default='')
    args = ap.parse_args()
    assert sha(args.plan) == args.plan_sha256
    plan = json.loads(args.plan.read_text())
    assert plan['workspace'] == WORKSPACE.as_posix()
    assert plan['source_parent'] == SOURCE.as_posix()
    assert plan['physical_destination_parent'] == DESTINATION.as_posix()
    assert len({r['owner'] for r in plan['owners']}) == len(plan['owners'])
    assert SOURCE.resolve() == SOURCE.absolute()
    for key in ['manifest', 'selected']:
        assert sha(WORKSPACE / plan[key + '_path']) == plan[key + '_sha256']
    manifest = json.loads((WORKSPACE / plan['manifest_path']).read_text())
    selected = json.loads((WORKSPACE / plan['selected_path']).read_text())['records']
    eligible = {r['owner']: r['range'] for r in selected}
    eligible.update({r['owner']: r['range'] for r in manifest['prefixes']})
    eligible.update({r['owner']: r['range'] for r in manifest['jobs']})
    for row in plan['owners']:
        assert eligible[row['owner']] == row['range']
        validate_host(row, plan)
    if not args.execute:
        print(json.dumps({'status': 'METADATA_PREFLIGHT_ONLY_NO_STORAGE_MUTATION', 'owners': len(plan['owners'])}))
        return
    assert args.root_authorization == 'ROOT_APPROVED_BYTE_STORAGE_OPERATION'
    marker = DESTINATION.parent / 'STORAGE-OWNER.json'
    marker_bytes = (json.dumps({'workspace': WORKSPACE.as_posix(), 'scope': 'P05_COMPLETED_RAW_BYTE_STORAGE_ONLY'}, sort_keys=True) + '\n').encode()
    if DESTINATION.parent.exists():
        assert marker.is_file() and marker.read_bytes() == marker_bytes
    # All existing ancestors must be physical directories. Never use a link as an E parent.
    for parent in reversed(DESTINATION.parents):
        if parent.exists():
            plain(parent)
    DESTINATION.mkdir(parents=True, exist_ok=True)
    if not marker.exists():
        marker.write_bytes(marker_bytes)
    plain(DESTINATION)
    assert DESTINATION.resolve() == DESTINATION.absolute()
    receipt_dir = OUTPUT / ('execution-' + datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
    receipt_dir.mkdir()
    for row in plan['owners']:
        owner = row['owner']
        source = validate_host(row, plan)
        target = DESTINATION / owner
        backup = SOURCE / (owner + '.storage-backup01')
        exact_child(source, SOURCE, owner)
        exact_child(backup, SOURCE, backup.name)
        exact_child(target, DESTINATION, owner)
        assert not target.exists() and not backup.exists()
        receipt = {'owner': owner, 'source': str(source), 'target': str(target), 'backup': str(backup),
                   'plan_sha256': args.plan_sha256, 'phases': [], 'status': 'IN_PROGRESS'}
        receipt_file = receipt_dir / (owner + '.json')

        def record(phase):
            receipt['phases'].append({'phase': phase, 'utc': datetime.datetime.now(datetime.timezone.utc).isoformat()})
            receipt_file.write_text(json.dumps(receipt, indent=2) + '\n')

        renamed = False
        deleting_backup = False
        try:
            expected = tree(source)
            assert expected['host-report.json']['sha256'] == row['host_report_sha256']
            assert expected['export-pins.json']['sha256'] == row['export_pins_sha256']
            pins = json.loads((source / 'export-pins.json').read_text())
            pinned = {}
            for item in pins['files']:
                leaf = item['path'].replace('\\', '/')
                assert not leaf.startswith('/') and '..' not in leaf.split('/') and ':' not in leaf
                assert 'export/' + leaf not in pinned
                pinned['export/' + leaf] = {'bytes': item['bytes'], 'sha256': item['sha256']}
            exported = {k: v for k, v in expected.items() if k.startswith('export/') and 'bytes' in v}
            assert exported == pinned and sum(v['bytes'] for v in exported.values()) == pins['bytes']
            receipt['files'] = expected
            size = sum(v.get('bytes', 0) for v in expected.values())
            receipt['bytes'] = size
            assert shutil.disk_usage(DESTINATION).free >= size + 4 * 1024**3
            record('SOURCE_TREE_HASHED_CLOSED_OWNER')
            shutil.copytree(source, target, symlinks=False)
            assert tree(target) == expected and tree(source) == expected
            record('PHYSICAL_E_COPY_AND_SOURCE_ALL_HASHES_IDENTICAL')
            exact_child(source, SOURCE, owner)
            exact_child(backup, SOURCE, backup.name)
            assert not backup.exists()
            source.rename(backup)
            renamed = True
            record('C_ORIGINAL_RENAMED_TO_CHECKED_BACKUP')
            # Native creation only. -File parameter arguments are never shell command text.
            completed = subprocess.run(['powershell.exe', '-NoProfile', '-NonInteractive', '-File',
                                        str(OUTPUT / 'create-junction.ps1'), '-Link', str(source), '-Target', str(target)],
                                       capture_output=True, text=True)
            assert completed.returncode == 0, 'JUNCTION_CREATE_FAILED'
            assert os.path.isjunction(source) and source.resolve() == target.resolve()
            assert tree(source, allow_owner_junction=True) == expected
            assert tree(backup) == expected and tree(target) == expected
            record('LOGICAL_C_READBACK_AND_BACKUP_AND_E_ALL_HASHES_IDENTICAL')
            # Verify exact resolved backup stays in intended workspace, is never a junction,
            # and its only recovery copy is already authenticated at E before recursive delete.
            exact_child(backup, SOURCE, backup.name)
            assert backup.resolve().is_relative_to(WORKSPACE.resolve() / '.artifacts/p05-fixedranges')
            plain(backup)
            assert tree(backup) == expected and tree(target) == expected
            deleting_backup = True
            shutil.rmtree(backup)
            assert not backup.exists()
            receipt['status'] = 'COMPLETE_BYTE_PRESERVING_LOGICAL_PATH_UNCHANGED'
            record('VALIDATED_C_BACKUP_REMOVED_E_RECOVERABLE')
        except BaseException as error:
            receipt['status'] = 'FAIL'
            receipt['error_type'] = type(error).__name__
            record('FAIL_BEFORE_ROLLBACK_REVIEW')
            if renamed and not deleting_backup:
                # Remove only this validated junction (never recursively); restore original C tree.
                if os.path.isjunction(source):
                    assert source.parent == SOURCE and source.name == owner and source.resolve() == target.resolve()
                    os.rmdir(source)
                assert not source.exists()
                exact_child(backup, SOURCE, backup.name)
                assert tree(backup) == expected
                backup.rename(source)
                record('ROLLBACK_C_ORIGINAL_RESTORED_E_COPY_RETAINED')
            elif deleting_backup:
                # Never replace complete E storage with a partially deleted C backup.
                receipt['status'] = 'FAIL_C_BACKUP_CLEANUP_REVIEW_REQUIRED_E_AND_C_LINK_RETAINED'
                record('ROLLBACK_NOT_ATTEMPTED_AFTER_BACKUP_DELETE_STARTED')
            else:
                record('C_ORIGINAL_UNCHANGED_PARTIAL_E_COPY_RETAINED_IF_ANY')
            raise
    print(json.dumps({'status': 'BATCH_COMPLETE_BYTE_STORAGE_ONLY_NOT_STATISTICAL_ACCEPTANCE',
                      'owners': len(plan['owners']), 'receipts': str(receipt_dir)}))


if __name__ == '__main__':
    main()
