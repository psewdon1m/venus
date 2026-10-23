"""Windows-only owned worker tree. No shell/taskkill/Docker/external PID input.
The child runs an inert stdin gate until this private, non-inheritable job owns it.
Native Job lifecycle references: Microsoft Learn Job Objects; QueryInformationJobObject.
"""
import argparse,ctypes,json,os,queue,re,subprocess,sys,threading,time
from pathlib import Path
from ctypes import wintypes as W

def emit(value):print(json.dumps(value,separators=(',',':')),flush=True)

class Basic(ctypes.Structure):
    _fields_=[('process_time',ctypes.c_int64),('job_time',ctypes.c_int64),('flags',W.DWORD),('minimum',ctypes.c_size_t),('maximum',ctypes.c_size_t),('active_limit',W.DWORD),('affinity',ctypes.c_size_t),('priority',W.DWORD),('scheduling',W.DWORD)]
class IO(ctypes.Structure):
    _fields_=[(n,ctypes.c_uint64) for n in ['read_ops','write_ops','other_ops','read_bytes','write_bytes','other_bytes']]
class Extended(ctypes.Structure):
    _fields_=[('basic',Basic),('io',IO),('process_memory',ctypes.c_size_t),('job_memory',ctypes.c_size_t),('peak_process',ctypes.c_size_t),('peak_job',ctypes.c_size_t)]
class Accounting(ctypes.Structure):
    _fields_=[('user',ctypes.c_int64),('kernel',ctypes.c_int64),('period_user',ctypes.c_int64),('period_kernel',ctypes.c_int64),('faults',W.DWORD),('total',W.DWORD),('active',W.DWORD),('terminated',W.DWORD)]

def api():
    if os.name!='nt':raise RuntimeError('WINDOWS_JOB_REQUIRED')
    dll=ctypes.WinDLL('kernel32',use_last_error=True)
    for name,args,result in [('CreateJobObjectW',[ctypes.c_void_p,W.LPCWSTR],W.HANDLE),('OpenJobObjectW',[W.DWORD,W.BOOL,W.LPCWSTR],W.HANDLE),('SetInformationJobObject',[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD],W.BOOL),('QueryInformationJobObject',[W.HANDLE,ctypes.c_int,ctypes.c_void_p,W.DWORD,ctypes.c_void_p],W.BOOL),('AssignProcessToJobObject',[W.HANDLE,W.HANDLE],W.BOOL),('TerminateJobObject',[W.HANDLE,W.UINT],W.BOOL),('CloseHandle',[W.HANDLE],W.BOOL)]:
        fn=getattr(dll,name);fn.argtypes=args;fn.restype=result
    return dll

def checked(ok):
    if not ok:raise ctypes.WinError(ctypes.get_last_error())

def active(dll,handle):
    result=Accounting();checked(dll.QueryInformationJobObject(handle,1,ctypes.byref(result),ctypes.sizeof(result),None));return result.active

def verify(owner):
    dll=api();name='Local\\VenusStats32.'+owner;handle=dll.OpenJobObjectW(4,False,name)
    if not handle:
        error=ctypes.get_last_error()
        if error==2:return {'owner':owner,'kind':'VERIFY','active_processes':0,'job_destroyed':True}
        raise ctypes.WinError(error)
    try:return {'owner':owner,'kind':'VERIFY','active_processes':active(dll,handle),'job_destroyed':False}
    finally:checked(dll.CloseHandle(handle))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--owner',required=True);parser.add_argument('--verify',action='store_true');parser.add_argument('--node');parser.add_argument('--target');parser.add_argument('--argument');args=parser.parse_args();assert re.fullmatch('[a-f0-9]{32}',args.owner)
    if args.verify:emit(verify(args.owner));return
    dll=api();name='Local\\VenusStats32.'+args.owner;job=None;child=None;assigned=False;errors=[];stop_requested=False
    try:
        ctypes.set_last_error(0);job=dll.CreateJobObjectW(None,name);checked(job)
        if ctypes.get_last_error()==183:raise RuntimeError('OWNER_JOB_ALREADY_EXISTS')
        limits=Extended();limits.basic.flags=0x2000|0x8;limits.basic.active_limit=32 # KILL_ON_JOB_CLOSE | ACTIVE_PROCESS; no breakaway flags.
        checked(dll.SetInformationJobObject(job,9,ctypes.byref(limits),ctypes.sizeof(limits)))
        for p in [args.node,args.target]:assert p and Path(p).is_absolute() and Path(p).is_file()
        entry=Path(__file__).resolve().with_name('owned-entry.mjs');assert entry.is_file()
        child=subprocess.Popen([args.node,str(entry),args.owner,args.target,args.argument or ''],stdin=subprocess.PIPE,stdout=sys.stderr,stderr=sys.stderr,creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,close_fds=True)
        checked(dll.AssignProcessToJobObject(job,W.HANDLE(int(child._handle))));assigned=True
        assert active(dll,job)==1
        child.stdin.write(('READY:'+args.owner+'\n').encode());child.stdin.flush();child.stdin.close()
        emit({'kind':'READY','owner':args.owner,'worker_pid':child.pid,'job':name,'active_processes':1,'job_flags':limits.basic.flags})
        commands=queue.Queue()
        def reader():
            line=sys.stdin.buffer.readline(129)
            commands.put(line)
        threading.Thread(target=reader,daemon=True).start()
        while child.poll() is None:
            try:
                line=commands.get(timeout=.025)
                if line!=('STOP:'+args.owner+'\n').encode():errors.append({'kind':'INVALID_OR_CLOSED_OWNER_CONTROL'})
                stop_requested=True;break
            except queue.Empty:pass
        # A normally exited parent can leave descendants; they must be stopped too.
        if active(dll,job)>0:
            if not dll.TerminateJobObject(job,137):errors.append({'kind':'TERMINATE_JOB_FAILED','winerror':ctypes.get_last_error()})
            deadline=time.monotonic()+3
            while active(dll,job)>0 and time.monotonic()<deadline:time.sleep(.025)
            if active(dll,job)>0:
                checked(dll.CloseHandle(job));job=None # kernel KILL_ON_JOB_CLOSE fallback, then independent named-job verification.
                deadline=time.monotonic()+3
                while time.monotonic()<deadline:
                    if verify(args.owner)['active_processes']==0:break
                    time.sleep(.025)
                if verify(args.owner)['active_processes']!=0:raise RuntimeError('OWNED_DESCENDANTS_SURVIVED_STOP')
        count=active(dll,job) if job else verify(args.owner)['active_processes'];assert count==0
        code=child.wait(timeout=1)
        emit({'kind':'TERMINAL','owner':args.owner,'status':'STOP_CONFIRMED' if stop_requested else 'EXIT_CONFIRMED','active_processes':0,'worker_code':code,'stop_requested':stop_requested,'errors':errors})
    except BaseException as error:
        errors.append({'kind':type(error).__name__,'winerror':getattr(error,'winerror',None)})
        if job:
            dll.CloseHandle(job);job=None
        if child is not None and not assigned and child.poll() is None:child.kill();child.wait(timeout=1)
        confirmed=False
        if assigned:
            until=time.monotonic()+3
            while time.monotonic()<until:
                try:
                    if verify(args.owner)['active_processes']==0:confirmed=True;break
                except BaseException:pass
                time.sleep(.025)
        emit({'kind':'TERMINAL','owner':args.owner,'status':'STOP_FAILED','active_processes':0 if confirmed else None,'worker_unconfirmed':not confirmed,'errors':errors});sys.exit(1)
    finally:
        if job:checked(dll.CloseHandle(job))

if __name__=='__main__':main()
