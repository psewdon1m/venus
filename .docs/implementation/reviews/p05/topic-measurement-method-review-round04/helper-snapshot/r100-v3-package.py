"""Bounded diagnostic export/archive helpers. No Docker, selector or measurements."""
import argparse,hashlib,io,json,os,re,stat,tarfile,zipfile,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('owned_allocation_metric',Path(__file__).with_name('allocated-tree.py'));allocation=importlib.util.module_from_spec(spec);spec.loader.exec_module(allocation);inspect_tree=allocation.inspect_tree
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
def mkdir_new_root(root):
    for p in reversed(root.parents):regular_directory(p)
    root.mkdir(mode=0o700,exist_ok=False);regular_directory(root)
def make_parents(root,parts):
    current=root
    for part in parts:
        regular_directory(current);current=current/part
        if not current.exists():current.mkdir(mode=0o700)
        regular_directory(current)
def extract(blob,destination):
    root=Path(destination).absolute();mkdir_new_root(root);records=[]
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
            check(root);target=root.joinpath(*parts);make_parents(root,parts[:-1]);check(root)
            if m.isdir():
                if not target.exists():target.mkdir(mode=0o700)
                regular_directory(target)
            else:
                source=tar.extractfile(m)
                with open(target,'xb') as f:
                    left=m.size;digest=hashlib.sha256()
                    while left:
                        b=source.read(min(left,1024**2))
                        if not b:raise ValueError('EXPORT_TRUNCATED_MEMBER')
                        f.write(b);digest.update(b);left-=len(b)
                    f.flush();os.fsync(f.fileno())
                records.append({'path':'/'.join(parts),'bytes':m.size,'sha256':digest.hexdigest()})
            check(root)
    return {'status':'EXPORTED_REGULAR_FILES_VERIFIED','files':records,'allocation':check(root),'original_tar_sha256':hashlib.sha256(Path(blob).read_bytes()).hexdigest()}
def archive(root,target):
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
    target.parent.mkdir(exist_ok=True)
    with open(target,'xb') as f:f.write(data);f.flush();os.fsync(f.fileno())
    check(target.parent)
    return {'status':'ARCHIVED_EXACT_OWNED_FILES','archive_bytes':len(data),'archive_sha256':hashlib.sha256(data).hexdigest(),'files':maps,'allocation':check(target.parent)}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--extract');p.add_argument('--destination');p.add_argument('--archive');p.add_argument('--target');a=p.parse_args()
    print(json.dumps(extract(a.extract,a.destination) if a.extract else archive(a.archive,a.target) if a.archive else {'status':'NOT_RUN','selector_invocations':0}))
