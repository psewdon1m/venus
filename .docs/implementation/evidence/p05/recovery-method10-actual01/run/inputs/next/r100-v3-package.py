"""Bounded diagnostic export/archive helpers. No Docker, selector or measurements."""
import argparse,hashlib,io,json,os,re,stat,tarfile,zipfile,importlib.util,sys
from pathlib import Path
spec=importlib.util.spec_from_file_location('owned_allocation_metric',Path(__file__).with_name('allocated-tree.py'));allocation=importlib.util.module_from_spec(spec);spec.loader.exec_module(allocation);inspect_tree=allocation.inspect_tree
spec=importlib.util.spec_from_file_location('method05_host_guard',Path(__file__).with_name('host-output-guard.py'));guard_module=importlib.util.module_from_spec(spec);spec.loader.exec_module(guard_module);HostOutputGuard=guard_module.HostOutputGuard
LIMIT=20*1024**2
def portable(name):
    parts=name.split('/')
    for p in parts:
        if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,127}',p) or p.endswith('.') or re.fullmatch(r'(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?',p):raise ValueError('EXPORT_PATH_GRAMMAR')
    return parts
def check(root,limit=LIMIT):
    report=inspect_tree(root)
    if max(report['allocated_bytes'],report['logical_bytes'])>limit:raise ValueError('PACKAGE_ALLOCATED_CAP')
    return report
def regular_directory(path):
    s=path.lstat()
    if not stat.S_ISDIR(s.st_mode) or stat.S_ISLNK(s.st_mode) or (os.name=='nt' and s.st_file_attributes&0x400):raise ValueError('PACKAGE_PARENT_LINK_OR_NON_DIRECTORY')
def mkdir_new_root(root,guard):
    for p in reversed(root.parents):regular_directory(p)
    guard.before(0)
    root.mkdir(mode=0o700,exist_ok=False);regular_directory(root)
def make_parents(root,parts,guard):
    current=root
    for part in parts:
        regular_directory(current);current=current/part
        if not current.exists():guard.before(0);current.mkdir(mode=0o700)
        regular_directory(current)
def extract(blob,destination,guard):
    root=Path(destination).absolute();guard.before();mkdir_new_root(root,guard);records=[];partition=guard.partition(root,LIMIT)
    # Tar is produced by the pinned owned read-only volume helper; still reject links,
    # unusual paths, duplicates, devices and large fields before writing any member.
    if Path(blob).stat().st_size>LIMIT:raise ValueError('EXPORT_TAR_CAP')
    with tarfile.open(blob,'r:') as tar:
        seen=set();members=[];logical=0
        for m in tar:
            name=m.name.removeprefix('./').rstrip('/')
            if name in ('','.'):continue
            parts=portable(name)
            if name in seen:raise ValueError('EXPORT_DUPLICATE_MEMBER')
            seen.add(name)
            if not (m.isdir() or m.isfile()):raise ValueError('EXPORT_NONREGULAR_MEMBER')
            if m.isfile():
                if m.size<0 or m.size>8*1024**2:raise ValueError('EXPORT_MEMBER_CAP')
                logical+=m.size
                if logical>LIMIT:raise ValueError('EXPORT_TOTAL_CAP')
            members.append((m,parts))
        if len(members)>512:raise ValueError('EXPORT_FILE_COUNT_CAP')
        for m,parts in members:
            guard.before();check(root);target=root.joinpath(*parts);make_parents(root,parts[:-1],guard);check(root)
            if m.isdir():
                if not target.exists():guard.before(0);target.mkdir(mode=0o700)
                regular_directory(target)
            else:
                source=tar.extractfile(m);b=source.read(m.size+1)
                if len(b)!=m.size:raise ValueError('EXPORT_TRUNCATED_MEMBER')
                partition.refresh();partition.write(target,b)
                records.append({'path':'/'.join(parts),'bytes':m.size,'sha256':hashlib.sha256(b).hexdigest()})
            check(root)
    return {'status':'EXPORTED_REGULAR_FILES_VERIFIED','files':records,'allocation':check(root),'original_tar_sha256':hashlib.sha256(Path(blob).read_bytes()).hexdigest()}
def archive(root,target,guard):
    root=Path(root).absolute();target=Path(target).absolute();buffer=io.BytesIO()
    # Inputs/export/control are the only declared source roots; no parent walk.
    maps=[]
    with zipfile.ZipFile(buffer,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for directory in ['inputs','export','control/receipts']:
            base=root/directory
            if not base.exists():continue
            check(base,8*1024**2 if directory=='control/receipts' else 16*1024**2 if directory=='inputs' else LIMIT)
            for p in sorted(base.rglob('*')):
                if p.is_file():
                    b=p.read_bytes();name=p.relative_to(root).as_posix();z.writestr(name,b);maps.append({'path':name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
                    if buffer.tell()>LIMIT:raise ValueError('ARCHIVE_BUFFER_CAP')
    data=buffer.getvalue()
    if len(data)>LIMIT:raise ValueError('ARCHIVE_FINAL_CAP')
    guard.before()
    if not target.parent.exists():guard.before(0);target.parent.mkdir()
    guard.partition(target.parent,LIMIT).write(target,data)
    check(target.parent)
    return {'status':'ARCHIVED_EXACT_OWNED_FILES','archive_bytes':len(data),'archive_sha256':hashlib.sha256(data).hexdigest(),'files':maps,'allocation':check(target.parent)}
PACKAGE_FAILURE_REASONS={'HOST_PARENT_REPARSE_OR_NON_DIRECTORY', 'EXPORT_TAR_CAP', 'STAGE_PARTITION_REQUIRED', 'ARCHIVE_FINAL_CAP', 'SUPERVISOR_COUNTER_REORDERED', 'PARTITION_LIMIT_INVALID', 'LIVE_OWNER_GUARD_CONFIG_REQUIRED', 'EXPORT_TRUNCATED_MEMBER', 'HOST_WRITE_PARTITION_SCOPE', 'SUPERVISOR_CAPACITY_FAULT_LATCHED', 'SUPERVISOR_SAMPLE_STALE', 'PACKAGE_ALLOCATED_CAP', 'SUPERVISOR_INITIAL_ADVANCE_MISSING', 'EXPORT_PATH_GRAMMAR', 'ALLOCATION_QUANTUM_UNKNOWN', 'SUPERVISOR_COUNTER_INVALID', 'EXPORT_TOTAL_CAP', 'SUPERVISOR_SPACE_LOW', 'METHOD05_WRITE_AUTHORITY_REQUIRED', 'ARCHIVE_BUFFER_CAP', 'EXPORT_FILE_COUNT_CAP', 'EXPORT_MEMBER_CAP', 'HOST_WRITE_AUTHORITY_REQUIRED', 'ACTUAL_HOST_SPACE_LOW_OR_INVALID', 'STAGE_INPUT_CAP', 'PROSPECTIVE_WRITE_SIZE_INVALID', 'ALLOCATION_QUANTUM_UNSUPPORTED', 'PACKAGE_PARENT_LINK_OR_NON_DIRECTORY', 'SUPERVISOR_OWNER_MISMATCH', 'EXPORT_NONREGULAR_MEMBER', 'EXPORT_DUPLICATE_MEMBER', 'SUPERVISOR_SPACE_INVALID', 'FIXED_HOST_BUDGET_REQUIRED'}
def failure_envelope(error,stage):
    reason=str(error).removeprefix('HOST_OUTPUT_STOP_NOT_ACCEPTED:')
    if reason not in PACKAGE_FAILURE_REASONS:reason=None
    return {'transport':'PYTHON_PACKAGE_FAILURE_V1','status':'NOT_ACCEPTED','stage':stage,'exception_class':type(error).__name__ if type(error).__name__ in ['OutputStopped','OSError','PermissionError','ValueError','AssertionError','FileNotFoundError'] else 'OTHER','reason':reason,'os_errno':error.errno if isinstance(getattr(error,'errno',None),int) else None,'winerror':error.winerror if isinstance(getattr(error,'winerror',None),int) else None,'primary':True}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--extract');p.add_argument('--destination');p.add_argument('--archive');p.add_argument('--target');p.add_argument('--stage');p.add_argument('--partition');p.add_argument('--limit',type=int);p.add_argument('--guard-config');a=p.parse_args()
    try:
        if not(a.extract or a.archive or a.stage):print(json.dumps({'status':'NOT_RUN','selector_invocations':0}))
        else:
            if not a.guard_config:raise ValueError('LIVE_OWNER_GUARD_CONFIG_REQUIRED')
            guard=HostOutputGuard(json.loads(Path(a.guard_config).read_text(encoding='utf-8')))
            if a.extract:result=extract(a.extract,a.destination,guard)
            elif a.archive:result=archive(a.archive,a.target,guard)
            else:
                if not a.partition or a.limit not in [8*1024**2,16*1024**2,20*1024**2]:raise ValueError('STAGE_PARTITION_REQUIRED')
                data=sys.stdin.buffer.read(a.limit+1)
                if len(data)>a.limit:raise ValueError('STAGE_INPUT_CAP')
                result=guard.partition(a.partition,a.limit).write(a.stage,data);result.update({'status':'GUARDED_HOST_STAGE_COMPLETE','sha256':hashlib.sha256(data).hexdigest()})
            print(json.dumps(result))
    except Exception as error:
        stage='EXTRACT' if a.extract else 'ARCHIVE' if a.archive else 'STAGE'
        print(json.dumps(failure_envelope(error,stage)),file=sys.stderr)
        raise SystemExit(1)
