"""Read-only allocated-file accounting. No Docker, producer or sample execution."""
import argparse,ctypes,json,os,stat,sys
from functools import cache
from pathlib import Path

@cache
def stream_api():
    from ctypes import wintypes
    class StreamData(ctypes.Structure):
        _fields_=[('size',ctypes.c_int64),('name',wintypes.WCHAR*(260+36))]
    dll=ctypes.WinDLL('kernel32',use_last_error=True)
    dll.FindFirstStreamW.argtypes=[wintypes.LPCWSTR,ctypes.c_int,ctypes.POINTER(StreamData),wintypes.DWORD]
    dll.FindFirstStreamW.restype=wintypes.HANDLE
    dll.FindNextStreamW.argtypes=[wintypes.HANDLE,ctypes.POINTER(StreamData)]
    dll.FindNextStreamW.restype=wintypes.BOOL
    dll.FindClose.argtypes=[wintypes.HANDLE]
    dll.FindClose.restype=wintypes.BOOL
    return dll,StreamData

def windows_streams(path):
    """Reject every named NTFS stream; EOF alone is valid for empty directories."""
    dll,Data=stream_api();info=Data()
    handle=dll.FindFirstStreamW(str(path),0,ctypes.byref(info),0)
    if handle==ctypes.c_void_p(-1).value:
        error=ctypes.get_last_error()
        if error==38:return  # ERROR_HANDLE_EOF: no streams, not API failure.
        raise ctypes.WinError(error)
    try:
        while True:
            if info.name!='::$DATA':raise ValueError('ALTERNATE_STREAM_OR_ENUMERATOR_UNAVAILABLE')
            if not dll.FindNextStreamW(handle,ctypes.byref(info)):
                error=ctypes.get_last_error()
                if error!=38:raise ctypes.WinError(error)
                break
    finally:
        if not dll.FindClose(handle):raise ctypes.WinError(ctypes.get_last_error())

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
        pending=[root]
        while pending:
            path=pending.pop();info=path.lstat()
            if stat.S_ISLNK(info.st_mode) or info.st_file_attributes&0x400:raise ValueError('LINK_OR_REPARSE_TREE')
            windows_streams(path)
            if stat.S_ISDIR(info.st_mode):pending.extend(sorted(path.iterdir()))
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
