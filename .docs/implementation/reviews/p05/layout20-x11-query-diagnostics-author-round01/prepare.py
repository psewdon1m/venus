from pathlib import Path
import shutil,json,hashlib
r=Path('C:/.projects/venus');work=r/'.artifacts/p05-layout20-query-author01';p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume19';c=p.with_name('p05-v2-layout-producer-resume20')
assert not c.exists();shutil.copytree(p,c)
b=(p/'x11.mjs').read_text();body=(work/'x11-diagnostic-body.txt').read_text()
b=b.replace("import {randomUUID} from 'node:crypto';","import {randomUUID,createHash} from 'node:crypto';\nimport {types} from 'node:util';")
b=b.replace("import {display,xdo} from '../../tests/p05/display.mjs';","import {display,xdo as rawXdo} from '../../tests/p05/display.mjs';")
b=b.replace('export {display};','export {display};\n'+body)
move="await bounded(budget,'content-focus',()=>page.bringToFront());"
assert b.count(move)==1
b=b.replace(" const title='Venus layout '+randomUUID();"," "+move+"\n const title='Venus layout '+randomUUID();")
b=b.replace(' '+move+"assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;"," assert.equal(xdo(xserver.name,'getwindowfocus'),id);return id;")
assert b.count(move)==1
(c/'x11.mjs').write_text(b,encoding='utf8',newline='\n')
b=(p/'browser.mjs').read_text().replace("import {display,launch,native200,resetNative} from './x11.mjs';","import {display,launch,native200,resetNative,x11CommandFailure} from './x11.mjs';")
b=b.replace(" const screenshots=screenshotBudget();", " const recordX11Failure=error=>{const safe=x11CommandFailure(error);if(safe&&!report.x11_command_failure){report.x11_command_failure=safe;try{save();}catch{report.x11_diagnostic_save_failed=true;}}};\n const screenshots=screenshotBudget();")
b=b.replace("if(row){row.status='FAIL';row.failure=safeFailure(e);}throw e;", "if(row){row.status='FAIL';row.failure=safeFailure(e);}recordX11Failure(e);throw e;")
b=b.replace("report.failure=safeFailure(e);report.status='FAIL';const a=", "report.failure=safeFailure(e);report.status='FAIL';recordX11Failure(e);const a=")
assert b.count('recordX11Failure(e)')==2
(c/'browser.mjs').write_text(b,encoding='utf8',newline='\n')
(c/'run.mjs').write_bytes((p/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume19',b'p05-v2-layout-producer-resume20'))
binding=json.loads((c/'binding.json').read_text());ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':binding['source_identity'],'image':binding['image'],'scope':'A17_LAYOUT20_SAFE_X11_QUERY_FAILURE_DIAGNOSTIC_PENDING_NONAUTHOR_REVIEW'}
(c/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n')
op={'status':'AUTHOR_METHOD20_PENDING_NONAUTHOR_REVIEW_NOT_NATIVE','source_identity':binding['source_identity'],'image':binding['image'],'root_run_ack':False,'native_runs':0,'behavior_change':'Same single bringToFront moved before title/search; final focus checks and original query behavior unchanged','diagnostics':'Fixed <=1024-byte safe failure metadata attached to original error; existing browser catches serialize once before cleanup; no raw args/output/titles, no resource snapshot/timer/profiler','prior_actual_failure':'27PASS1FAIL23NOTRUN; query status/code/signal/stderr/resource/cause UNKNOWN','diagnosis_index':'.docs/implementation/reviews/p05/a17-layout19-failure-diagnosis-independent-round01/INDEX.json','diagnosis_sha256':'56eb613dcb25d2a7febce3299dfad9a2c37677f1ba8b4739c3505b5cab277f3d'}
(c/'OPERATIONAL20.json').write_text(json.dumps(op,indent=2)+'\n')
print(json.dumps({'status':'PREPARED_NOT_RUN','producer':str(c),'source':binding['source_identity'],'image':binding['image']}))
