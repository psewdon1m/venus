from pathlib import Path
import json
r=Path.cwd();base=r/'.artifacts/p05-topic-measurements-method09'
def change(name,old,new):
 p=base/name;s=p.read_text(encoding='utf-8');assert s.count(old)==1,(name,old[:90],s.count(old));p.write_text(s.replace(old,new),encoding='utf-8',newline='\n')
change('r100-v3-launcher.mjs'," let phase='BOOTSTRAP'", " let supervisorCapture=null;let phase='BOOTSTRAP'")
change('r100-v3-launcher.mjs',"stdio:['ignore','ignore','ignore','ipc']});watchdog.on('message'", "stdio:['ignore','pipe','pipe','ipc']});supervisorCapture=captureProcess(watchdog,{onFault:reason=>{capacityFault??=reason;}});watchdog.on('message'")
change('r100-v3-launcher.mjs',"'GUARDED_TAR_STAGE_FAILED:'+staged.stderr.toString('utf8').slice(0,256)","'GUARDED_TAR_STAGE_FAILED:'+JSON.stringify(packageFailure(staged.stderr.toString('utf8'),'STAGE'))")
change('r100-v3-launcher.mjs',"assert.equal(extraction.code,0);", "assert.equal(extraction.code,0,'GUARDED_EXTRACTION_FAILED:'+JSON.stringify(packageFailure(extraction.stderr.toString('utf8'),'EXTRACT')));")
change('r100-v3-launcher.mjs',"assert.equal(packaged.code,0);", "assert.equal(packaged.code,0,'GUARDED_ARCHIVE_FAILED:'+JSON.stringify(packageFailure(packaged.stderr.toString('utf8'),'ARCHIVE')));")
change('r100-v3-launcher.mjs',"  if(error||capacityFault||cleanup!=='completed'", "  const supervisorDiagnostics=snapshotDiagnostics(supervisorCapture);if(supervisorDiagnostics.stdout_truncated||supervisorDiagnostics.stderr_truncated||supervisorDiagnostics.spawn_error||!externalReport)error??='SUPERVISOR_DIAGNOSTICS_OR_TERMINAL_IPC_INCOMPLETE';\n  if(error||capacityFault||cleanup!=='completed'")
change('r100-v3-launcher.mjs',"const terminal={terminal_transport:","const terminal={supervisor_diagnostics:supervisorDiagnostics,terminal_transport:")
change('verify-terminal.mjs',"['terminal_transport','status'","['supervisor_diagnostics','terminal_transport','status'")
change('verify-terminal.mjs'," assert.equal(row.status,'COMPLETE_NON_GATING');", " assert.deepEqual(Object.keys(row.supervisor_diagnostics).sort(),['stdout','stderr','stdout_truncated','stderr_truncated','spawn_error'].sort());assert.equal(row.supervisor_diagnostics.stdout_truncated,false);assert.equal(row.supervisor_diagnostics.stderr_truncated,false);assert.equal(row.supervisor_diagnostics.spawn_error,null);assert.equal(row.supervisor_diagnostics.stderr,'');assert(Buffer.byteLength(row.supervisor_diagnostics.stdout)<=16384);assert.equal(JSON.parse(row.supervisor_diagnostics.stdout).status,'SUPERVISOR_COMPLETE_NON_GATING');\n assert.equal(row.status,'COMPLETE_NON_GATING');")
for p in base.iterdir():
 if p.is_file() and p.suffix in ['.mjs','.json']:
  b=p.read_bytes();p.write_bytes(b.replace(b'.artifacts/p05-topic-measurements-method08',b'.artifacts/p05-topic-measurements-method09').replace(b'EXACT_METHOD08_LAUNCHER_REQUIRED',b'EXACT_METHOD09_LAUNCHER_REQUIRED'))
print(json.dumps({'status':'AUTHORED_NOT_TESTED','directory':str(base)}))
