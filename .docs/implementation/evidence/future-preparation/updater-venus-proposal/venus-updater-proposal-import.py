import subprocess,tarfile,io,json,hashlib
from pathlib import Path
source=Path(r'C:\.projects\exocortex\updater');root=Path(r'C:\Temp\venus-updater-support-proposal');root.mkdir()
sha='17e2dcf1e72bbc6492ea5692520932d1c95a618f'
raw=subprocess.check_output(['git','-C',str(source),'archive','--format=tar',sha,'go.mod','go.sum','internal/kernel','internal/releaseauth'])
files={}
with tarfile.open(fileobj=io.BytesIO(raw)) as archive:
    for member in archive:
        if not member.isfile():continue
        path=(root/member.name).resolve();assert path.is_relative_to(root.resolve())
        data=archive.extractfile(member).read();path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
        files[member.name]=hashlib.sha256(data).hexdigest()
(root/'proposal-origin.json').write_text(json.dumps({'kind':'ISOLATED_SOURCE_ONLY_PROPOSAL_NOT_RELEASE','upstream_repository':'https://github.com/psewdon1m-exocortex/updater','upstream_sha':sha,'files':files},indent=2)+'\n')
print(json.dumps({'files':len(files),'source':sha,'target':str(root),'foreign_checkout_modified':False}))
