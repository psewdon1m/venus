"""Verify a completed earlier stage on immutable Git bytes, without mutating the checkout."""
import io
import os
from pathlib import Path,PurePosixPath
import subprocess
import sys
import tarfile
import tempfile

ROOT=Path(__file__).resolve().parents[1]
P01='934d9a1efcccfb4380e708a8f5143a43efbc3a71'
def verify_p01():
    raw=subprocess.check_output(['git','archive','--format=tar',P01],cwd=ROOT)
    git_dir=subprocess.check_output(['git','rev-parse','--absolute-git-dir'],cwd=ROOT,text=True).strip()
    with tempfile.TemporaryDirectory(prefix='venus-p01-history-') as d:
        root=Path(d)
        with tarfile.open(fileobj=io.BytesIO(raw),mode='r:') as archive:
            for member in archive:
                path=PurePosixPath(member.name)
                if path.is_absolute() or '..' in path.parts or '\\' in member.name or ':' in member.name or member.issym() or member.islnk():raise ValueError('Unsafe historical archive member')
                if not member.isfile():continue
                target=root/member.name;target.parent.mkdir(parents=True,exist_ok=True)
                with archive.extractfile(member) as source:target.write_bytes(source.read())
        env={**os.environ,'GIT_DIR':git_dir,'GIT_WORK_TREE':str(root),'PYTHONDONTWRITEBYTECODE':'1'}
        return subprocess.run([sys.executable,'-B',str(root/'tools/p01_gate.py'),'verify'],cwd=root,env=env,check=False).returncode

if __name__=='__main__':sys.exit(verify_p01())
