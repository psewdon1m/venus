"""METHOD05 host-write guard. All CLI writes require this guard; no Docker."""
import json,os,shutil,time,ctypes,stat,importlib.util,re
from pathlib import Path
spec=importlib.util.spec_from_file_location('method05_allocated',Path(__file__).with_name('allocated-tree.py'));allocation=importlib.util.module_from_spec(spec);spec.loader.exec_module(allocation)
CAP=128*1024**2;RESERVE=10*1024**3;MARGIN=1024**2
class OutputStopped(ValueError):pass
class HostOutputGuard:
    def __init__(self,config,*,space_probe=None,read_sample=None,clock=time.monotonic,wait=time.sleep):
        if config.get('method_revision')!='METHOD05-HOST-OUTPUT-FENCES':raise OutputStopped('METHOD05_WRITE_AUTHORITY_REQUIRED')
        if config.get('global_owned_cap_bytes')!=CAP or config.get('reserve_bytes')!=RESERVE:raise OutputStopped('FIXED_HOST_BUDGET_REQUIRED')
        if config.get('kind')!='ROOT_R100_V3_OPERATIONAL_DIAGNOSTIC_ACK' or config.get('status')!='AUTHORIZED' or not re.fullmatch(r'[a-f0-9]{32}',config.get('owner','')):raise OutputStopped('HOST_WRITE_AUTHORITY_REQUIRED')
        self.config=config;self.root=Path(config['host_output_path']).absolute();self.owner=config['owner'];self.clock=clock;self.wait=wait
        self.space_probe=space_probe or (lambda:shutil.disk_usage(self.root).free)
        self.read_sample=read_sample or (lambda:json.loads((Path(config['control_directory'])/'host-space.json').read_text(encoding='utf-8')))
        self.counter=None;self.advanced=None;self.armed=False;self.fault=None
    def stop(self,reason):
        self.fault=self.fault or reason
        raise OutputStopped('HOST_OUTPUT_STOP_NOT_ACCEPTED:'+self.fault)
    def sample(self):
        if self.fault:self.stop(self.fault)
        try:available=self.space_probe()
        except Exception as e:self.stop('ACTUAL_HOST_SPACE_UNKNOWN:'+type(e).__name__)
        if not isinstance(available,int) or available<RESERVE+CAP:self.stop('ACTUAL_HOST_SPACE_LOW_OR_INVALID')
        try:row=self.read_sample()
        except Exception as e:self.stop('SUPERVISOR_SAMPLE_UNKNOWN:'+type(e).__name__)
        if row.get('owner')!=self.owner:self.stop('SUPERVISOR_OWNER_MISMATCH')
        seq=row.get('counter')
        if not isinstance(seq,int) or isinstance(seq,bool) or seq<=0:self.stop('SUPERVISOR_COUNTER_INVALID')
        if self.counter is not None and seq<self.counter:self.stop('SUPERVISOR_COUNTER_REORDERED')
        now=self.clock()
        if seq!=self.counter:self.counter=seq;self.advanced=now
        if now-self.advanced>2:self.stop('SUPERVISOR_SAMPLE_STALE')
        if row.get('host_output_allowed') is not True or row.get('capacity_fault'):self.stop('SUPERVISOR_CAPACITY_FAULT_LATCHED')
        try:reported=int(row['available_bytes'])
        except Exception:self.stop('SUPERVISOR_SPACE_INVALID')
        if reported<RESERVE+CAP:self.stop('SUPERVISOR_SPACE_LOW')
        return available
    def arm(self):
        self.sample();initial=self.counter;start=self.clock()
        while self.counter==initial:
            if self.clock()-start>=2:self.stop('SUPERVISOR_INITIAL_ADVANCE_MISSING')
            self.wait(.025);self.sample()
        self.armed=True
    def before(self,next_bytes=0):
        if not self.armed:self.arm()
        self.sample()
        if not isinstance(next_bytes,int) or next_bytes<0 or next_bytes>20*1024**2:self.stop('PROSPECTIVE_WRITE_SIZE_INVALID')
        return True
    def partition(self,root,limit):
        root=Path(root).absolute();allowed={self.root/'export':20*1024**2,self.root/'archive':20*1024**2,self.root/'control/receipts':8*1024**2}
        if allowed.get(root)!=limit:self.stop('HOST_WRITE_PARTITION_SCOPE')
        return Partition(self,root,limit)

def safe_directory(path):
    for p in [*reversed(path.parents),path]:
        s=p.lstat()
        if not stat.S_ISDIR(s.st_mode) or stat.S_ISLNK(s.st_mode) or (os.name=='nt' and s.st_file_attributes&0x400):raise OutputStopped('HOST_PARENT_REPARSE_OR_NON_DIRECTORY')
def quantum(root):
    if os.name=='nt':
        from ctypes import wintypes
        dll=ctypes.WinDLL('kernel32',use_last_error=True);a=wintypes.DWORD();b=wintypes.DWORD();c=wintypes.DWORD();d=wintypes.DWORD()
        dll.GetDiskFreeSpaceW.argtypes=[wintypes.LPCWSTR,*([ctypes.POINTER(wintypes.DWORD)]*4)];dll.GetDiskFreeSpaceW.restype=wintypes.BOOL
        if not dll.GetDiskFreeSpaceW(str(Path(root).anchor),ctypes.byref(a),ctypes.byref(b),ctypes.byref(c),ctypes.byref(d)):raise OutputStopped('ALLOCATION_QUANTUM_UNKNOWN')
        size=a.value*b.value
    else:size=os.statvfs(root).f_frsize
    if not isinstance(size,int) or size<=0 or size>65536:raise OutputStopped('ALLOCATION_QUANTUM_UNSUPPORTED')
    return size
class Partition:
    def __init__(self,guard,root,limit):
        self.guard=guard;self.root=Path(root).absolute();self.limit=limit
        if limit not in [8*1024**2,16*1024**2,20*1024**2]:raise OutputStopped('PARTITION_LIMIT_INVALID')
        safe_directory(self.root);self.block=quantum(self.root);self.refresh()
    def refresh(self):
        self.guard.before();self.baseline=allocation.inspect_tree(self.root)
        if max(self.baseline['logical_bytes'],self.baseline['allocated_bytes'])+MARGIN>self.limit:self.guard.stop('PARTITION_METADATA_HEADROOM')
    def reserve(self,length):
        self.guard.before(length);rounded=(length+self.block-1)//self.block*self.block
        if max(self.baseline['logical_bytes'],self.baseline['allocated_bytes'])+rounded+MARGIN>self.limit:self.guard.stop('PROSPECTIVE_ALLOCATED_PARTITION_CAP')
    def write(self,target,data):
        target=Path(target).absolute();relative=target.relative_to(self.root)
        for part in relative.parts:
            if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]{0,127}',part) or part.endswith('.') or re.fullmatch(r'(?i)(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?',part):self.guard.stop('HOST_OUTPUT_RELATIVE_SCOPE')
        safe_directory(target.parent);self.reserve(len(data));self.guard.before(0)
        fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL|getattr(os,'O_BINARY',0)|getattr(os,'O_NOFOLLOW',0),0o600)
        try:
            expected=os.fstat(fd);located=target.lstat()
            if (expected.st_dev,expected.st_ino)!=(located.st_dev,located.st_ino) or expected.st_nlink!=1:self.guard.stop('HOST_OUTPUT_IDENTITY_CHANGED')
            offset=0
            while offset<len(data):
                chunk=memoryview(data)[offset:offset+65536];self.guard.before(len(chunk));safe_directory(target.parent)
                count=os.write(fd,chunk)
                if count<=0:self.guard.stop('HOST_OUTPUT_WRITE_INCOMPLETE')
                offset+=count
                actual=allocation.windows_allocation(target) if os.name=='nt' else os.fstat(fd).st_blocks*512
                if max(self.baseline['logical_bytes'],self.baseline['allocated_bytes'])+max(offset,actual)+MARGIN>self.limit:self.guard.stop('ALLOCATED_PARTITION_CAP_AFTER_CHUNK')
            self.guard.before(0);os.fsync(fd)
        finally:os.close(fd)
        self.refresh()
        return {'bytes':len(data),'path':str(target)}
