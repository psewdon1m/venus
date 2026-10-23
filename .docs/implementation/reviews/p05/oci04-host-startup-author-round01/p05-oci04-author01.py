from pathlib import Path
import json,shutil,hashlib,datetime
r=Path.cwd();parent=r/'.artifacts/p05-recovery-source1274-01/.artifacts/p05-oci-rollback-producer-resume03';out=parent.with_name('p05-oci-rollback-producer-resume04');assert not out.exists();shutil.copytree(parent,out)
p=out/'driver.mjs';s=p.read_text(encoding='utf-8');i=s.index('export function producerMap(');j=s.index('export async function run(',i);functions=s[i:j]
proof="""/** Inert shared proof functions; never imports the CLI entrypoint. */
import assert from 'node:assert/strict';
import {readFileSync,lstatSync,readdirSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {setTimeout,clearTimeout} from 'node:timers';
const directory=dirname(fileURLToPath(import.meta.url)),sha=b=>createHash('sha256').update(b).digest('hex');
"""+functions
(out/'source-proof.mjs').write_text(proof,encoding='utf-8',newline='\n')
s=s[:i]+"export {producerMap,verifyIncluded} from './source-proof.mjs';\n"+s[j:]
s=s.replace("import {readFileSync,lstatSync,readdirSync} from 'node:fs';","import {readFileSync} from 'node:fs';").replace("import {spawn} from 'node:child_process';\n",'').replace("import {clearTimeout} from 'node:timers';\n",'')
s=s.replace("import {validateRunAuthority} from './contract.mjs';","import {validateRunAuthority} from './contract.mjs';\nimport {producerMap,verifyIncluded} from './source-proof.mjs';")
p.write_text(s,encoding='utf-8',newline='\n')
p=out/'host-runner.mjs';s=p.read_text(encoding='utf-8');assert s.count("from './driver.mjs'")==1;p.write_text(s.replace("from './driver.mjs'","from './source-proof.mjs'"),encoding='utf-8',newline='\n')
p=out/'BINDING.json';b=json.loads(p.read_text(encoding='utf-8'));b['status']='AUTHOR_OPERATIONAL_BINDING_PENDING_INDEPENDENT_REVIEW';b['root_run_ack']=False;b['operational_parent_producer_index_sha256']=hashlib.sha256((parent/'INDEX.json').read_bytes()).hexdigest();b['startup_fix']={'revision':'OCI04_INERT_SHARED_SOURCE_PROOF','diagnosis_index_sha256':'e50c8fece79d03524bef8b221f79d8ed7c79fff5f1a8c7cf94438f8c93f6515c','changed_executable_scope':['driver.mjs','host-runner.mjs','source-proof.mjs'],'approval':'PENDING_INDEPENDENT_REVIEW','full14_actual':'NOT_RUN'};p.write_text(json.dumps(b,indent=2)+'\n',encoding='utf-8',newline='\n')
(out/'HANDOFF.json').write_text(json.dumps({'status':'AUTHOR_READY_HOST_STARTUP_FIX_REVIEW_REQUIRED_NOT_RUN','writes':'AUTHORING_IN_PROGRESS','created_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'root_run_ack':False,'parent03_actual':'STARTUP_EXIT13_ALL14_NOT_RUN_NO_RESOURCES','source_scope':'RESTORED_HISTORICAL1274_NOT_CURRENT_LIVE_STAGE','preserved_runtime':'29 prior modules except driver/host-runner import refactor; all worker/fixture/14controls/resource policies unchanged','human470':'HOLD_UNCHANGED','full_P05_PASS':False},indent=2)+'\n',encoding='utf-8',newline='\n')
(out/'README-resume04.md').write_text('# OCI04 host startup correction\n\nAuthor checkpoint, independent review required. Extracts exact producerMap/verifyIncluded bodies into an inert same-directory source-proof module. Both CLI driver and host-runner import it; no host-runner edge to the CLI driver remains. Actual OCI03 exited13 before executePlan or resources due to independently reproduced ESM/TLA cycle. No await is dropped. All application/PG/14 controls/512MiB/900s policies remain. Included ACK template stays unauthorized; fresh root activation/refreeze/ACK follows separate review. No actual04 RUN or whole stage acceptance.\n',encoding='utf-8',newline='\n')
print(json.dumps({'status':'AUTHORED_NOT_TESTED','producer':str(out)}))
