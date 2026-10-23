"""Read-only allocated-file accounting. No Docker, producer or sample execution."""
import argparse,ctypes,json,os,stat,sys,subprocess
from pathlib import Path

def windows_allocation(path):
    from ctypes import wintypes
    class Standard(ctypes.Structure):
        _fields_=[('allocation',ctypes.c_int64),('eof',ctypes.c_int64),('links',wintypes.DWORD),('deleted',ctypes.c_ubyte),('directory',ctypes.c_ubyte)]
    dll=ctypes.WinDLL('kernel32',use_last_error=True)
    dll.CreateFileW.argtypes=[wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE]
    dll.CreateFileW.restype=wintypes.HANDLE
    dll.GetFileInformationByHandleEx.argtypes=[wintypes.HANDLE,ctypes.c_int,ctypes.c_void_p,wintypes.DWORD]
    dll.GetFileInformationByHandleEx.restype=wintypes.BOOL
    dll.CloseHandle.argtypes=[wintypes.HANDLE]
    handle=dll.CreateFileW(str(path),0x80,7,None,3,0x02000000|0x00200000,None)
    if handle==ctypes.c_void_p(-1).value:raise ctypes.WinError(ctypes.get_last_error())
    try:
        info=Standard()
        if not dll.GetFileInformationByHandleEx(handle,1,ctypes.byref(info),ctypes.sizeof(info)):raise ctypes.WinError(ctypes.get_last_error())
        if info.deleted or info.allocation<0:raise ValueError('ALLOCATION_METRIC_UNAVAILABLE')
        return info.allocation
    finally:dll.CloseHandle(handle)

def inspect_tree(root):
    root=Path(os.path.abspath(root))
    def streams():
        if os.name!='nt':return
        script="$ErrorActionPreference='Stop'; if($PSVersionTable.PSVersion -lt [Version]'7.2'){ throw 'WINDOWS_STREAM_ENUMERATOR_VERSION_REQUIRED' }; $r=[Environment]::GetEnvironmentVariable('VENUS_ALLOCATED_TREE_ROOT'); $items=@(Get-Item -LiteralPath $r -Force)+@(Get-ChildItem -LiteralPath $r -Recurse -Force); foreach($i in $items){ foreach($s in @(Get-Item -LiteralPath $i.FullName -Stream * -ErrorAction Stop)){ if($s.Stream -ne ':$DATA'){ Write-Output 'NONDEFAULT_STREAM'; exit 12 } } }"
        result=subprocess.run(['pwsh.exe','-NoLogo','-NoProfile','-NonInteractive','-Command',script],capture_output=True,text=True,timeout=10,env={**os.environ,'VENUS_ALLOCATED_TREE_ROOT':str(root)})
        if result.returncode!=0 or result.stdout.strip():raise ValueError('ALTERNATE_STREAM_OR_ENUMERATOR_UNAVAILABLE')
    for node in [*reversed(root.parents),root]:
        s=node.lstat()
        if stat.S_ISLNK(s.st_mode) or (os.name=='nt' and s.st_file_attributes&0x400):raise ValueError('LINK_OR_REPARSE_ANCESTOR')
        if not stat.S_ISDIR(s.st_mode):raise ValueError('ANCESTOR_NOT_DIRECTORY')
    streams();records=[];seen=set()
    def visit(path):
        before=path.lstat()
        if stat.S_ISLNK(before.st_mode) or (os.name=='nt' and before.st_file_attributes&0x400):raise ValueError('LINK_OR_REPARSE_TREE')
        directory=stat.S_ISDIR(before.st_mode)
        if not directory and not stat.S_ISREG(before.st_mode):raise ValueError('NONREGULAR_TREE')
        if not directory and before.st_nlink!=1:raise ValueError('MULTILINK_FILE')
        identity=(before.st_dev,before.st_ino)
        if identity in seen:raise ValueError('DUPLICATE_FILE_IDENTITY')
        seen.add(identity)
        allocated=windows_allocation(path) if os.name=='nt' else before.st_blocks*512
        after=path.lstat()
        if (after.st_dev,after.st_ino,after.st_size,after.st_mtime_ns)!=(before.st_dev,before.st_ino,before.st_size,before.st_mtime_ns):raise ValueError('TREE_CHANGED_DURING_ACCOUNTING')
        records.append({'path':'.' if path==root else path.relative_to(root).as_posix(),'directory':directory,'logical_bytes':0 if directory else before.st_size,'allocated_bytes':allocated})
        if directory:
            for child in sorted(path.iterdir()):visit(child)
            final=path.lstat()
            if (final.st_dev,final.st_ino,final.st_mtime_ns)!=(before.st_dev,before.st_ino,before.st_mtime_ns):raise ValueError('DIRECTORY_CHANGED_DURING_ACCOUNTING')
    visit(root)
    streams()
    return {'status':'READ_ONLY_ALLOCATED_TREE','platform':sys.platform,'root':str(root),'metric':'NTFS FileStandardInfo AllocationSize' if os.name=='nt' else 'POSIX st_blocks *512','logical_bytes':sum(r['logical_bytes'] for r in records),'allocated_bytes':sum(r['allocated_bytes'] for r in records),'files':sum(not r['directory'] for r in records),'directories':sum(r['directory'] for r in records),'records':records,'scope':'Owned file/directory allocation only; excludes Docker/VHD extents and external filesystem metadata. Sampled scan, not concurrent hostile race proof.'}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root');args=parser.parse_args()
    print(json.dumps(inspect_tree(args.root) if args.root else {'status':'NOT_RUN','read_only':True,'usage':'--root=<owned-directory>'}))
