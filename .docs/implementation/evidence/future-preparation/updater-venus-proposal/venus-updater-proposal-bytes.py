import subprocess,json,sys
from pathlib import Path
source=Path(r'C:\.projects\exocortex\updater');root=Path(r'C:\Temp\venus-updater-support-proposal');mode=sys.argv[1]
assert mode in ('baseline','patched')
origin=json.loads((root/'proposal-origin.json').read_bytes())
for name in origin['files']:
    raw=subprocess.check_output(['git','-C',str(source),'show',origin['upstream_sha']+':'+name])
    if mode=='patched' and name=='internal/kernel/register.go':
        old=b'"wyvern", "updater", "mastermind"}'
        assert raw.count(old)==1;raw=raw.replace(old,b'"wyvern", "updater", "mastermind", "venus"}')
    if mode=='patched' and name=='internal/releaseauth/verify.go':
        old=b'"wyvern", "window", "mastermind":'
        assert raw.count(old)==1;raw=raw.replace(old,b'"wyvern", "window", "mastermind", "venus":')
    (root/name).write_bytes(raw)
for name in ['proposal-origin.json','internal/kernel/venus_proposal_test.go','internal/releaseauth/venus_proposal_test.go']:
    path=root/name;path.write_bytes(path.read_bytes().replace(b'\r\n',b'\n'))
print(json.dumps({'mode':mode,'raw_upstream_files':len(origin['files']),'production_delta':'two exact allowlist entries' if mode=='patched' else 'none','no_checkout_mutation':True}))
