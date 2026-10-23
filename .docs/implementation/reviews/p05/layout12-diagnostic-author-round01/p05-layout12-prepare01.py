from pathlib import Path
import json, shutil

root=Path('C:/.projects/venus')
parent=root/'.artifacts/p05-pilot-bundle-source12/.artifacts/p05-v2-layout-producer-resume11'
dest=parent.with_name('p05-v2-layout-producer-resume12')
assert not dest.exists()
shutil.copytree(parent,dest,ignore=shutil.ignore_patterns('ROOT_RUN_ACK.json'))
run=(dest/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume11',b'p05-v2-layout-producer-resume12')
assert run!=(parent/'run.mjs').read_bytes()
(dest/'run.mjs').write_bytes(run)
ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':'658b710bdca35b678421a51c1c276028305f28362901b2c065a3867aa754f4de','image':'sha256:021a57ecd11d8e5df300a5030c78312f66c5595ebb5d97f156ab71cf7de3b689','scope':'DIAGNOSTIC_ONLY_LAYOUT12_PENDING_NEW_NONAUTHOR_REVIEW_AND_ROOT_ACK'}
(dest/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n',encoding='utf-8')
collected=json.loads((root/'.artifacts/p05-layout12-author01/STATIC-CODE-SOURCES.json').read_text())
codes=[code for code in collected['codes'] if code!='OBSERVER_']
original=(parent/'probe-policy.mjs').read_bytes().decode()
start=original.index('export function safeFailure(error)')
imports="import {types} from 'node:util';\nimport {fileURLToPath} from 'node:url';\n"
addition=(root/'.artifacts/p05-layout12-safe-failure.txt').read_text(encoding='utf-8')
addition=addition.replace('STATIC_CODES',json.dumps(codes,separators=(',',':'))).replace('STATIC_MODULES',json.dumps(collected['modules'],separators=(',',':')))
updated=original[:start]+addition
updated=updated.replace("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\n"+imports,1)
(dest/'probe-policy.mjs').write_bytes(updated.encode())
print(json.dumps({'status':'PREPARED_PENDING_CONTROLS','codes':len(codes),'modules':len(collected['modules']),'root_ack':False}))
