"""Finite actual Windows writes with injected free/counter inputs. No Docker/selector."""
import importlib.util, json, tempfile, shutil, os, io, tarfile, hashlib, zipfile, subprocess
from pathlib import Path
folder=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
g=load('guard05',folder/'host-output-guard.py');p=load('package05',folder/'r100-v3-package.py')
base=Path('.artifacts/p05').resolve();owned=Path(tempfile.mkdtemp(prefix='method05-output-',dir=base));checks=[];root_counter=0
def check(name,fn):fn();checks.append({'name':name,'status':'PASS'})
def denied(fn,expected=None):
    try:fn()
    except Exception as e:
        if expected:assert expected in str(e),(expected,str(e))
        return str(e)
    raise AssertionError('EXPECTED_DENIAL')
def fixture():
    global root_counter
    root_counter+=1;root=owned/str(root_counter);root.mkdir();(root/'archive').mkdir();(root/'inputs').mkdir();(root/'control').mkdir();(root/'control/receipts').mkdir()
    state={'free':12*1024**3,'counter':0,'clock':0.,'advance':True,'owner':'a'*32,'allowed':True,'fault':None,'reads':0}
    config={'method_revision':'METHOD05-HOST-OUTPUT-FENCES','global_owned_cap_bytes':g.CAP,'reserve_bytes':g.RESERVE,'kind':'ROOT_R100_V3_OPERATIONAL_DIAGNOSTIC_ACK','status':'AUTHORIZED','owner':'a'*32,'host_output_path':str(root),'control_directory':str(root/'control/live')}
    def sample():
        state['reads']+=1
        if state['advance']:state['counter']+=1
        return {'owner':state['owner'],'counter':state['counter'],'available_bytes':str(12*1024**3),'host_output_allowed':state['allowed'],'capacity_fault':state['fault']}
    def space():
        if state['free'] is None:raise OSError('INERT_UNKNOWN')
        return state['free']
    guard=g.HostOutputGuard(config,space_probe=space,read_sample=sample,clock=lambda:state['clock'],wait=lambda seconds:state.__setitem__('clock',state['clock']+seconds))
    return root,state,guard,config
def tar(root,data,name='progress/001.bin',kind=tarfile.REGTYPE):
    b=io.BytesIO()
    with tarfile.open(fileobj=b,mode='w') as t:
        info=tarfile.TarInfo(name);info.type=kind;info.size=len(data) if kind==tarfile.REGTYPE else 0;t.addfile(info,io.BytesIO(data) if info.size else None)
    target=root/'archive/source.tar';target.write_bytes(b.getvalue());return target
def chunk_fault(operation,unknown=False):
    root,state,guard,_=fixture();data=os.urandom(210000);blob=tar(root,data) if operation=='extract' else None
    if operation=='archive':(root/'inputs/random.bin').write_bytes(data)
    real_write=os.write;writes=[]
    def write(fd,b):
        count=real_write(fd,b);writes.append(count);state['free']=None if unknown else 0;return count
    os.write=write
    try:
        target=root/('export/progress/001.bin' if operation=='extract' else 'archive/result.zip' if operation=='archive' else 'archive/prefix.tar')
        call=(lambda:p.extract(blob,root/'export',guard)) if operation=='extract' else (lambda:p.archive(root,target,guard)) if operation=='archive' else (lambda:guard.partition(root/'archive',p.LIMIT).write(target,data))
        denied(call,'ACTUAL_HOST_SPACE_UNKNOWN' if unknown else 'ACTUAL_HOST_SPACE_LOW_OR_INVALID')
        assert writes==[65536],writes
        assert target.is_file() and target.stat().st_size==65536
        state['free']=12*1024**3
        denied(lambda:guard.before(),'HOST_OUTPUT_STOP_NOT_ACCEPTED')
        assert target.stat().st_size==65536
        return {'written_prefix_bytes':65536,'further_writes':0,'fault_latched_after_recovery':True}
    finally:os.write=real_write
try:
    for operation in ['stage','extract','archive']:
        check('actual '+operation+' stops before second64KiB chunk after actual free falls to0',lambda operation=operation:chunk_fault(operation))
    check('actual extraction unknown free stops after first chunk',lambda:chunk_fault('extract',True))
    def zero_first():
        root,state,guard,_=fixture();state['free']=0;target=root/'archive/none.tar';denied(lambda:guard.partition(root/'archive',p.LIMIT).write(target,b'INERT'),'ACTUAL_HOST_SPACE_LOW');assert not target.exists()
    check('cached12GiB supervisor cannot override actual0 before first output',zero_first)
    def exact():
        root,state,guard,_=fixture();data=b'INERT-NOT-A-SAMPLE'*9000;target=root/'archive/positive.tar';r=guard.partition(root/'archive',p.LIMIT).write(target,data);assert target.read_bytes()==data and r['bytes']==len(data);assert state['reads']>4
    check('guarded positive multi-chunk write exact bytes/hash',exact)
    def extraction():
        root,state,guard,_=fixture();data=b'INERT-POSITIVE';r=p.extract(tar(root,data),root/'export',guard);assert r['status']=='EXPORTED_REGULAR_FILES_VERIFIED';assert (root/'export/progress/001.bin').read_bytes()==data;assert r['files'][0]['sha256']==hashlib.sha256(data).hexdigest()
    check('guarded extraction exact regular file and hash',extraction)
    def archive():
        root,state,guard,_=fixture();(root/'inputs/pin.json').write_bytes(b'INERT_PIN');target=root/'archive/positive.zip';r=p.archive(root,target,guard);assert r['status']=='ARCHIVED_EXACT_OWNED_FILES';assert hashlib.sha256(target.read_bytes()).hexdigest()==r['archive_sha256'];assert zipfile.ZipFile(target).read('inputs/pin.json')==b'INERT_PIN'
    check('guarded archive readable exact owned bytes and hash',archive)
    def stale():
        _,state,guard,_=fixture();guard.before();state['advance']=False;state['clock']+=2.001;denied(lambda:guard.before(),'SUPERVISOR_SAMPLE_STALE')
    check('reader-local2.001s stale guard rejects',stale)
    def initial():
        _,state,guard,_=fixture();state['counter']=1;state['advance']=False;denied(lambda:guard.before(),'SUPERVISOR_');assert guard.armed is False and state['counter']==1
    check('new Python writer requires actual initial counter advance',initial)
    def reorder():
        _,state,guard,_=fixture();guard.before();state['advance']=False;state['counter']=1;denied(lambda:guard.before(),'SUPERVISOR_COUNTER_REORDERED')
    check('supervisor counter rollback rejects',reorder)
    for field,value,reason in [('owner','wrong','OWNER_MISMATCH'),('allowed',False,'CAPACITY_FAULT_LATCHED'),('fault',{'reason':'low'},'CAPACITY_FAULT_LATCHED')]:
        def invalid(field=field,value=value,reason=reason):
            _,state,guard,_=fixture();state[field]=value;denied(lambda:guard.before(),reason)
        check('guard rejects '+field,invalid)
    def authority():
        _,_,_,config=fixture();config['method_revision']='METHOD04';denied(lambda:g.HostOutputGuard(config),'METHOD05_WRITE_AUTHORITY_REQUIRED')
    check('old authority schema rejected',authority)
    def partition_scope():
        root,_,guard,_=fixture();denied(lambda:guard.partition(root/'inputs',16*1024**2),'HOST_WRITE_PARTITION_SCOPE')
    check('output helper cannot mutate immutable input partition',partition_scope)
    def cap():
        root,_,guard,_=fixture();target=root/'archive/oversize';denied(lambda:guard.partition(root/'archive',p.LIMIT).write(target,b'I'*(20*1024**2)),'PROSPECTIVE_ALLOCATED_PARTITION_CAP');assert not target.exists()
    check('allocated cap reserves metadata before create',cap)
    for name in ['base:stream','CON','LPT1.txt','../escape','trail.']:
        def grammar(name=name):
            root,_,guard,_=fixture();denied(lambda:guard.partition(root/'archive',p.LIMIT).write(root/'archive'/name,b'INERT'));assert not (root/'escape').exists()
        check('portable output name denied '+name,grammar)
    def hardlink():
        root,_,guard,_=fixture();a=root/'archive/base';a.write_bytes(b'INERT');os.link(a,root/'archive/hard');denied(lambda:guard.partition(root/'archive',p.LIMIT))
    check('actual NTFS hardlink allocation rejected',hardlink)
    if os.name=='nt':
        def ads():
            root,_,guard,_=fixture();(root/'archive/base').write_bytes(b'INERT');stream=Path(str(root/'archive/base')+':hidden');stream.write_bytes(b'INERT');denied(lambda:guard.partition(root/'archive',p.LIMIT));stream.unlink()
        check('actual NTFS ADS refused by allocation inventory',ads)
        def junction(path,target):
            result=subprocess.run(['pwsh.exe','-NoLogo','-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';New-Item -ItemType Junction -Path $env:VENUS_GUARD_LINK -Target $env:VENUS_GUARD_TARGET | Out-Null"],env={**os.environ,'VENUS_GUARD_LINK':str(path),'VENUS_GUARD_TARGET':str(target)},capture_output=True,text=True,timeout=10);assert result.returncode==0,result.stderr
        def root_link():
            root,_,guard,_=fixture();target=root/'outside';target.mkdir();(root/'archive').rmdir();junction(root/'archive',target)
            try:denied(lambda:guard.partition(root/'archive',p.LIMIT));assert list(target.iterdir())==[]
            finally:(root/'archive').rmdir()
        check('actual root junction denied without outside write',root_link)
        def nested_link():
            root,_,guard,_=fixture();partition=guard.partition(root/'archive',p.LIMIT);target=root/'outside';target.mkdir();link=root/'archive/nested';junction(link,target)
            try:denied(lambda:partition.write(link/'outside.bin',b'INERT'),'HOST_PARENT_REPARSE');assert list(target.iterdir())==[]
            finally:link.rmdir()
        check('actual post-init nested junction denied before create',nested_link)
        def replaced_root():
            root,_,guard,_=fixture();partition=guard.partition(root/'archive',p.LIMIT);target=root/'outside';target.mkdir();(root/'archive').rename(root/'prior-archive');junction(root/'archive',target)
            try:denied(lambda:partition.write(root/'archive/outside.bin',b'INERT'),'HOST_PARENT_REPARSE');assert list(target.iterdir())==[]
            finally:(root/'archive').rmdir()
        check('actual replaced root junction denied before create',replaced_root)
    print(json.dumps({'status':'PASS_AUTHOR_FINITE_ONLY','checks':checks,'count':len(checks),'source':{n:hashlib.sha256((folder/n).read_bytes()).hexdigest() for n in ['host-output-guard.py','r100-v3-package.py','method05-output-controls.py','allocated-tree.py']},'actual_platform':os.name,'real_output_writes':True,'injected_space_and_supervisor':True,'Docker_calls':0,'selector_invocations':0,'statistics_RUN':False},indent=2))
finally:
    assert owned.parent==base and owned.name.startswith('method05-output-')
    shutil.rmtree(owned)
