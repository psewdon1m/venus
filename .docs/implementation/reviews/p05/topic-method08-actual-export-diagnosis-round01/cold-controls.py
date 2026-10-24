from pathlib import Path
import ctypes,hashlib,importlib.util,json,os,subprocess,tempfile
ROOT=Path.cwd();OUT=Path(__file__).resolve().parent
RUN=ROOT/'.artifacts/p05-recovery-source1274-01/.artifacts/p05/r100-v3-7da46d477970'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
allocation=load('diag_allocation',RUN/'inputs/next/allocated-tree.py')
guard=load('diag_guard',RUN/'inputs/next/host-output-guard.py')
before={p.relative_to(RUN).as_posix():sha(p) for p in RUN.rglob('*') if p.is_file()}
report=allocation.inspect_tree(RUN/'archive');assert report['files']==0 and report['logical_bytes']==0
results=[{'name':'exact retained archive readonly allocation succeeds','status':'PASS','allocation':report}]
cfg=json.loads((RUN/'inputs/root-ack.json').read_text());sample=json.loads((RUN/'control/live/host-space.json').read_text())
nextsample=json.loads((RUN/'control/live/host-space-next.json').read_text());assert sample['counter']==812 and nextsample['counter']==816
assert not (RUN/'control/live/watchdog-state.json').exists() and not (RUN/'control/live/watchdog-terminal.json').exists()
clock=[0]
def wait(dt):clock[0]+=dt
g=guard.HostOutputGuard(cfg,space_probe=lambda:200*1024**3,read_sample=lambda:sample,clock=lambda:clock[0],wait=wait)
try:g.partition(RUN/'archive',20*1024**2)
except guard.OutputStopped as e:
 assert str(e)=='HOST_OUTPUT_STOP_NOT_ACCEPTED:SUPERVISOR_SAMPLE_STALE';results.append({'name':'exact guard cold replay static retained counter fails before tar creation','status':'PASS','observed_error':str(e),'qualification':'Possible exact package failure path after lost supervisor; not recovered actual truncated exception'})
else:raise AssertionError('stale sample accepted')
paths=[{'path':str(p),'characters':len(str(p))} for p in [RUN/'archive',RUN/'archive/native-prefix.tar',RUN/'inputs/next/r100-v3-package.py']]
assert max(p['characters'] for p in paths)<260;results.append({'name':'actual package and tar paths below260; exact archive native API succeeds','status':'PASS','paths':paths,'qualification':'Does not prove every Windows path/API race absent'})
# Native Windows sharing violation in a separate disposable fixture. The original
# prefix is not touched. Demonstrates one real source of the residual temp file.
node='C:/Temp/venus-p01-toolchain/node-v24.22.0-win-x64/node.exe'
with tempfile.TemporaryDirectory(prefix='venus-method08-forensic-') as temp:
 root=Path(temp);source=root/'host-space-next.json';target=root/'host-space.json';source.write_text('next');target.write_text('old')
 from ctypes import wintypes
 dll=ctypes.WinDLL('kernel32',use_last_error=True);dll.CreateFileW.argtypes=[wintypes.LPCWSTR,wintypes.DWORD,wintypes.DWORD,ctypes.c_void_p,wintypes.DWORD,wintypes.DWORD,wintypes.HANDLE];dll.CreateFileW.restype=wintypes.HANDLE;dll.CloseHandle.argtypes=[wintypes.HANDLE]
 handle=dll.CreateFileW(str(target),0x80000000,3,None,3,0,None) # read handle shares read/write, denies delete
 assert handle!=ctypes.c_void_p(-1).value
 try:
  code="const f=require('fs');try{f.renameSync(process.argv[1],process.argv[2]);process.exitCode=2;}catch(e){console.log(JSON.stringify({code:e.code,errno:e.errno,syscall:e.syscall,source_retained:f.existsSync(process.argv[1])}));}"
  run=subprocess.run([node,'-e',code,str(source),str(target)],capture_output=True,text=True,timeout=5);assert run.returncode==0
  native=json.loads(run.stdout);assert native['code'] in ['EPERM','EACCES','EBUSY'] and native['source_retained']
 finally:dll.CloseHandle(handle)
 results.append({'name':'native Windows deny-delete read handle blocks atomic rename and retains temp','status':'PASS','native_result':native,'qualification':'Independent platform reproducer; actual reader/errno was not captured'})
after={p.relative_to(RUN).as_posix():sha(p) for p in RUN.rglob('*') if p.is_file()};assert before==after
results.append({'name':'retained actual prefix bytes unchanged by all controls','status':'PASS','files':len(before)})
data={'status':'PASS_DIAGNOSIS_CONTROLS_ONLY','actual_run_accepted':False,'controls':results,'input_pins':before,'source_helpers':{n:sha(RUN/'inputs/next'/n) for n in ['r100-v3-launcher.mjs','r100-v3-watchdog.mjs','r100-v3-package.py','allocated-tree.py','host-output-guard.py']}}
(OUT/'cold-controls.json').write_text(json.dumps(data,indent=2)+'\n');print(json.dumps({'status':data['status'],'controls':len(results),'actual_prefix_changed':False,'native_result':native}))
