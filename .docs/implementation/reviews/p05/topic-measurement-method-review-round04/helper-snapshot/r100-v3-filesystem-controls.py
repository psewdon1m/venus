"""Finite actual Windows allocation/path controls; no Docker or measurement samples."""
import importlib.util,json,os,subprocess,tempfile,shutil,io,tarfile,hashlib,datetime,zipfile
from pathlib import Path
folder=Path(__file__).parent
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
account=load('account',folder/'allocated-tree.py');package=load('package',folder/'r100-v3-package.py');base=Path('.artifacts/p05').resolve();root=Path(tempfile.mkdtemp(prefix='author-v3-filesystem-',dir=base)).resolve();assert root.parent==base and root.name.startswith('author-v3-filesystem-');checks=[]
def ok(name,fn):fn();checks.append({'name':name,'status':'PASS'})
def denied(fn):
    try:fn()
    except Exception:return
    raise AssertionError('EXPECTED_DENIAL')
try:
    owned=root/'owned';owned.mkdir();(owned/'one.bin').write_bytes(os.urandom(8193))
    def regular():
        r=account.inspect_tree(owned);assert r['files']==1 and r['logical_bytes']==8193 and r['allocated_bytes']>=8193
    ok('actual native allocation includes file slack',regular)
    if os.name=='nt':
        ads=owned/'one.bin:hidden';ads.write_bytes(b'INERT');ok('actual NTFS file ADS rejected',lambda:denied(lambda:account.inspect_tree(owned)));ads.unlink()
        directory_ads=Path(str(owned)+':hidden');directory_ads.write_bytes(b'INERT');ok('actual NTFS directory ADS rejected',lambda:denied(lambda:account.inspect_tree(owned)));directory_ads.unlink()
        target=root/'sibling';target.mkdir();junction=root/'junction'
        result=subprocess.run(['pwsh.exe','-NoLogo','-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';New-Item -ItemType Junction -Path $env:VENUS_TEST_JUNCTION -Target $env:VENUS_TEST_TARGET | Out-Null"],env={**os.environ,'VENUS_TEST_JUNCTION':str(junction),'VENUS_TEST_TARGET':str(target)},capture_output=True,text=True,timeout=10);assert result.returncode==0
        ok('actual root junction rejected before reading target',lambda:denied(lambda:account.inspect_tree(junction)));junction.rmdir()
    def tar_blob(name,content=b'INERT',kind=tarfile.REGTYPE):
        output=io.BytesIO()
        with tarfile.open(fileobj=output,mode='w') as t:
            info=tarfile.TarInfo(name);info.type=kind;info.size=len(content) if kind==tarfile.REGTYPE else 0;t.addfile(info,io.BytesIO(content) if info.size else None)
        path=root/('tar-'+hashlib.sha256(output.getvalue()).hexdigest()+'.tar');path.write_bytes(output.getvalue());return path
    blob=tar_blob('progress/001.json')
    def positive():
        result=package.extract(blob,root/'actual-export');assert (root/'actual-export/progress/001.json').read_bytes()==b'INERT';assert result['files'][0]['sha256']==hashlib.sha256(b'INERT').hexdigest()
    ok('bounded regular tar extraction exact bytes/hash',positive)
    for n in ['../outside','C:stream','CON','safe:stream','/absolute']:
        ok('hostile tar member rejected '+n,lambda n=n:denied(lambda:package.extract(tar_blob(n),root/('negative-'+str(len(checks))))))
    ok('tar symbolic link rejected',lambda:denied(lambda:package.extract(tar_blob('link',kind=tarfile.SYMTYPE),root/'link-negative')))
    def zipped():
        case=root/'archive-case';(case/'inputs').mkdir(parents=True);(case/'inputs/one.txt').write_bytes(b'INERT INPUT');(case/'archive').mkdir();r=package.archive(case,case/'archive/exact.zip')
        with zipfile.ZipFile(case/'archive/exact.zip') as z:assert z.namelist()==['inputs/one.txt'];assert z.read('inputs/one.txt')==b'INERT INPUT'
        assert r['archive_sha256']==hashlib.sha256((case/'archive/exact.zip').read_bytes()).hexdigest()
    ok('archive exact input bytes and SHA',zipped)
    print(json.dumps({'status':'PASS_AUTHOR_FILESYSTEM_CONTROLS_ONLY','controls':checks,'platform':os.name,'root':str(root),'Docker_calls':0,'selector_invocations':0,'statistical_samples':0,'independent_acceptance':False}))
finally:
    assert root.parent==base and root.name.startswith('author-v3-filesystem-') and root.resolve()==root
    # Only this exact freshly created directory; no linked target is recursively removed.
    for p in root.iterdir():
        if getattr(p,'is_junction',lambda:False)():p.rmdir()
    shutil.rmtree(root)
