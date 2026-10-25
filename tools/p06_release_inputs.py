"""Prepare candidate metadata, not a release approval or private-key generator."""
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
from stage_inventory import inventory, identity

root=Path(__file__).resolve().parents[1]
tag=os.environ['RELEASE_TAG']
source=os.environ['RELEASE_SHA']
metadata=json.loads((root/'.artifacts/p06-image-metadata.json').read_text())
digest=metadata['containerimage.digest']
reference='ghcr.io/psewdon1m/venus@'+digest
config_digest=metadata['containerimage.config.digest']
assert re.fullmatch(r'sha256:[a-f0-9]{64}',config_digest)
subprocess.run(['docker','pull',reference],check=True)
image=json.loads(subprocess.check_output(['docker','image','inspect',reference]))[0]
assert image['Id'] in [digest,config_digest]
assert reference in image.get('RepoDigests',[])
trust_file=root/'infra/venus/release-trust.json'
trust=json.loads(trust_file.read_text())
if trust.get('environment')!='service' or trust.get('owner_approved') is not True or not trust.get('public_key_pem','').startswith('-----BEGIN PUBLIC KEY-----'):
    raise SystemExit('SERVICE_TRUST_ANCHOR_NOT_PROVISIONED')
candidate={'version':tag.removeprefix('venus-v'),'main_sha':source,'source_identity':identity(inventory(root)),
           'image_reference':reference,'oci_digest':digest,'config_digest':config_digest,
           'trust_file':str(trust_file),'private_key_file':str(Path(os.environ['RUNNER_TEMP'])/'venus-signing.pem'),
           'environment':'standalone-local-presentations-v4','compose_template':str(root/'infra/venus/compose.presentations.standalone.yml'),'distribution_directory':str(root/'.artifacts/delivery-release'),'output':str(root/'.artifacts/p06-service-release')}
(root/'.artifacts/p06-service-candidate.json').write_text(json.dumps(candidate,indent=2)+'\n')
print(json.dumps({'status':'CANDIDATE_INPUTS_ONLY','main_sha':source,'OCI':digest,'config_digest':config_digest,
                  'trust_key_id':trust['key_id'],'private_key_read':False}))
