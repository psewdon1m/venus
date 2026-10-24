from pathlib import Path
import json,shutil
r=Path('C:/.projects/venus');o=r/'.docs/implementation/reviews/p05/layout22-terminal-readiness-author-round01';p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-v2-layout-producer-resume21';c=p.with_name('p05-v2-layout-producer-resume22');assert not c.exists();shutil.copytree(p,c)
s=(p/'measure.mjs').read_text();s=s.replace('import {bounded,assertFreshScope','import {absoluteBudget,bounded,assertFreshScope')
marker='export async function prepareSceneProjection(page,scene,role,required,budget){';assert s.count(marker)==1
s=s.replace(marker,(o/'diagnostic-body.txt').read_text()+'\n'+marker.replace('required,budget)','required,budget,onTerminalReadiness=()=>{})'))
s=s.replace(" await bounded(budget,'positive-scene-preparation',async()=>{"," try{await bounded(budget,'positive-scene-preparation',async()=>{")
needle='  await handle.dispose();\n });\n}';assert s.count(needle)==1
s=s.replace(needle,"  await handle.dispose();\n });}catch(error){\n  let terminal={scope:'POST_FAILURE_SINGLE_READ_NOT_FAILED_TIME_OR_ACCEPTANCE',captured_failure_only:true,diagnostic_budget_ms:1000,capture_available:false};\n  try{const state=await bounded(absoluteBudget(1000),'terminal-preparation-diagnostic',()=>page.evaluate(terminalReadinessProjection,{positive,forbidden,required}));assert(Buffer.byteLength(JSON.stringify(state))<=8192,'TERMINAL_READINESS_DIAGNOSTIC_BOUND');terminal={...terminal,capture_available:true,state};}catch{/* unavailable diagnostic does not replace the original failure */}\n  try{onTerminalReadiness(terminal);}catch{/* callback/save failure does not replace the original failure */}\n  throw error;\n }\n}")
s=s.replace('onObservation=()=>{},onCheckpoint=()=>{}})','onObservation=()=>{},onCheckpoint=()=>{},onTerminalReadiness=()=>{}})')
s=s.replace('prepareSceneProjection(actor.page,scene,role,required,budget);','prepareSceneProjection(actor.page,scene,role,required,budget,onTerminalReadiness);')
(c/'measure.mjs').write_text(s,encoding='utf8',newline='\n')
s=(p/'browser.mjs').read_text().replace('let service,xserver,owned,driver,error;','let service,xserver,owned,driver,error,terminalReadinessFailure=null;')
needle='nativeMeasurement:measurements.get(role.actor),onObservation:';assert s.count(needle)==1
s=s.replace(needle,'nativeMeasurement:measurements.get(role.actor),onTerminalReadiness:value=>{terminalReadinessFailure??=value;},onObservation:')
needle="if(row){row.status='FAIL';row.failure=safeFailure(e);}recordX11Failure(e);throw e;";assert s.count(needle)==1
s=s.replace(needle,"if(row){row.status='FAIL';row.failure=safeFailure(e);}if(terminalReadinessFailure&&!report.terminal_preparation_failure){report.terminal_preparation_failure=terminalReadinessFailure;try{save();}catch{report.terminal_preparation_diagnostic_save_failed=true;}}recordX11Failure(e);throw e;")
(c/'browser.mjs').write_text(s,encoding='utf8',newline='\n')
(c/'run.mjs').write_bytes((p/'run.mjs').read_bytes().replace(b'p05-v2-layout-producer-resume21',b'p05-v2-layout-producer-resume22'))
b=json.loads((c/'binding.json').read_text());ack={'schema_version':1,'root_run_ack':False,'independent_producer_review':'PENDING','independent_review_path':None,'independent_review_index_sha256':None,'producer_runtime_digest':None,'source_identity':b['source_identity'],'image':b['image'],'scope':'A17_LAYOUT22_TERMINAL_PREPARATION_DIAGNOSTIC_PENDING_NONAUTHOR_REVIEW','operational_resource_profile':'LAYOUT21_BROWSER_PID512','browser_pids_limit':512};(c/'ROOT_RUN_ACK.json').write_text(json.dumps(ack,indent=2)+'\n')
print(json.dumps({'status':'PREPARED_NO_NATIVE','producer':str(c)}))
