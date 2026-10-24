"""Finite actual NTFS + injected WinAPI error controls; never runs engine/Docker."""
from pathlib import Path
import importlib.util, tempfile, shutil, json, ctypes, time, hashlib, os

base=Path('.artifacts/p05').resolve()
root=Path(tempfile.mkdtemp(prefix='method07-native-controls-',dir=base))
folder=Path('.artifacts/p05-topic-measurements-method07').resolve()
def load(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
a=load('allocation07',folder/'allocated-tree.py')
p=load('package07',folder/'r100-v3-package.py')
g=load('guard07',folder/'host-output-guard.py')
checks=[]
def check(name,fn):fn();checks.append({'name':name,'status':'PASS'})
def denied(fn):
    try:fn()
    except (ValueError,OSError):return
    raise AssertionError('EXPECTED_DENIAL')
try:
    def ordinary():
        f=root/'normal';f.mkdir();(f/'data').write_bytes(b'actual-ntfs-data')
        x=a.inspect_tree(f);assert x['files']==1 and x['logical_bytes']==16
    check('actual NTFS default data accepted and allocation measured',ordinary)
    def file_ads():
        f=root/'normal/data';stream=Path(str(f)+':hidden');stream.write_bytes(b'x')
        try:denied(lambda:a.inspect_tree(f.parent))
        finally:stream.unlink()
    check('actual file alternate stream rejected',file_ads)
    def directory_ads():
        f=root/'normal';stream=Path(str(f)+':hidden');stream.write_bytes(b'x')
        try:denied(lambda:a.inspect_tree(f))
        finally:stream.unlink()
    check('actual directory alternate stream rejected',directory_ads)
    check('actual empty directory allowed',lambda:a.inspect_tree(root))
    check('missing path rejected',lambda:denied(lambda:a.inspect_tree(root/'missing')))
    real_api=a.stream_api
    class D(ctypes.Structure):_fields_=[('size',ctypes.c_int64),('name',ctypes.c_wchar*296)]
    class API:
        def __init__(self,first=None,next_error=38,name='::$DATA',close=True):
            self.first=first;self.next_error=next_error;self.name=name;self.close=close;self.closed=0
        def FindFirstStreamW(self,path,level,info,flags):
            if self.first is not None:ctypes.set_last_error(self.first);return ctypes.c_void_p(-1).value
            info._obj.name=self.name;return 7
        def FindNextStreamW(self,handle,info):ctypes.set_last_error(self.next_error);return False
        def FindClose(self,handle):self.closed+=1;ctypes.set_last_error(5);return self.close
    def simulated(api,should_deny):
        a.stream_api=lambda:(api,D)
        try:
            if should_deny:denied(lambda:a.windows_streams(root))
            else:a.windows_streams(root)
            assert api.closed==(0 if api.first is not None else 1)
        finally:a.stream_api=real_api
    for error in (1,2,5,87):
        check(f'FindFirstStream API error {error} rejected',lambda error=error:simulated(API(first=error),True))
    check('FindFirstStream EOF38 alone allowed',lambda:simulated(API(first=38),False))
    check('FindNextStream error rejected and handle closed',lambda:simulated(API(next_error=5),True))
    check('unknown named stream rejected and handle closed',lambda:simulated(API(name=':evil:$DATA'),True))
    check('default stream EOF accepted and handle closed',lambda:simulated(API(),False))
    check('failed handle close rejected',lambda:simulated(API(close=False),True))
    # Exact failed-run bytes, actual host free-space probe and real guarded writes.
    # Only heartbeat replies are injected for this finite control; no RUN promotion.
    fixture=root/'extraction';fixture.mkdir();(fixture/'archive').mkdir()
    counter=0
    def sample():
        global counter
        counter+=1
        return {'owner':'b'*32,'counter':counter,'available_bytes':str(shutil.disk_usage(fixture).free),
                'host_output_allowed':True,'capacity_fault':None}
    config={'method_revision':'METHOD05-HOST-OUTPUT-FENCES','global_owned_cap_bytes':g.CAP,
            'reserve_bytes':g.RESERVE,'kind':'ROOT_R100_V3_OPERATIONAL_DIAGNOSTIC_ACK',
            'status':'AUTHORIZED','owner':'b'*32,'host_output_path':str(fixture),
            'control_directory':str(fixture/'control/live')}
    guard=g.HostOutputGuard(config,read_sample=sample)
    src=base/'r100-v3-1fb203e0154f'
    start=time.monotonic();result=p.extract(src/'archive/native-prefix.tar',fixture/'export',guard)
    elapsed=time.monotonic()-start
    expected=json.loads((src/'control/receipts/native-inventory.json').read_bytes())['files']
    assert sorted(result['files'],key=lambda x:x['path'])==sorted(expected,key=lambda x:x['path'])
    assert elapsed<60
    checks.append({'name':'exact actual R100 prefix guarded extraction within unchanged60s bound',
                   'status':'PASS','elapsed_seconds':elapsed,'files':len(expected),
                   'input_tar_sha256':hashlib.sha256((src/'archive/native-prefix.tar').read_bytes()).hexdigest(),
                   'actual_host_space':True,'injected_supervisor_counter':True})
    print(json.dumps({'status':'AUTHOR_FINITE_CONTROLS_PASS_NOT_ACTUAL_R100',
                      'checks':checks,'count':len(checks),'Docker_calls':0,'selector_invocations':0},indent=2))
finally:
    assert root.parent==base and root.name.startswith('method07-native-controls-')
    shutil.rmtree(root)
