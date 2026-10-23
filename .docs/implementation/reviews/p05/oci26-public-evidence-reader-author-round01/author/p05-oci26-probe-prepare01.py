from pathlib import Path
import json,re,hashlib,uuid,datetime
r=Path('C:/.projects/venus');d=r/'.artifacts/p05-oci26-reader-probe01';assert not d.exists();d.mkdir();source=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer25/host-runner.mjs';text=source.read_bytes().decode();old=re.search(r'async function evidence\(name\).*?const script="([^"]+)";return',text).group(1)
script='''p=/evidence/$1
[ -e "$p" ] || exit 0
meta=$(/usr/bin/stat -c '%f:%s' -- "$p") || exit 1
mode=${meta%%:*}
size=${meta#*:}
[ "$((0x$mode & 0xf000))" -eq "$((0x8000))" ] && [ "$size" -le 2097152 ] || exit 8
exec /usr/bin/cat -- "$p"
'''
sha=lambda b:hashlib.sha256(b).hexdigest();data={'old':old,'candidate':script,'old_script_sha256':sha(old.encode()),'candidate_script_sha256':sha(script.encode()),'source_sha256':sha(source.read_bytes())};(d/'INPUTS.json').write_text(json.dumps(data,indent=2)+'\n')
owner=uuid.uuid4().hex;project='venus-oci26-reader-'+uuid.uuid4().hex[:12];config={'owner':owner,'project':project,'image':'sha256:f9e93cf5aa8cadbe5ee69d72e2af760c0f3c5a81772c45d41d47427740ce75c2','authorization':'ROOT_EXPLICIT_ONE_OWNED_FINITE_EQUIVALENCE_CONTAINER_NOT_OCI_RUN','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'native_whole_trial':False,'private_or_DB_mounts':False};(d/'AUTHORIZATION.json').write_text(json.dumps(config,indent=2)+'\n');print(json.dumps(config))
