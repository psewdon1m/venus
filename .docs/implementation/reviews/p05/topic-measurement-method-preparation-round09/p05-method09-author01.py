from pathlib import Path
import shutil,json,hashlib
r=Path.cwd();base=r/'.artifacts/p05-topic-measurements-method09';assert not base.exists();shutil.copytree(r/'.artifacts/p05-topic-measurements-method08',base)
def change(name,old,new):
 p=base/name;s=p.read_text(encoding='utf-8');assert s.count(old)==1,(name,old[:90],s.count(old));p.write_text(s.replace(old,new),encoding='utf-8',newline='\n')
change('r100-v3-watchdog.mjs',"function guardedAtomic(target,value){sample();if(capacityFault)return false;const b=Buffer.byteLength(JSON.stringify(value));assert(b<=65536,'SUPERVISOR_RECEIPT_CAP');return rawAtomic(target,value)!==false;}","function guardedAtomic(target,value){try{sample();if(capacityFault)return false;const b=Buffer.byteLength(JSON.stringify(value));assert(b<=65536,'SUPERVISOR_RECEIPT_CAP');return rawAtomic(target,value)!==false;}catch(error){latch('SUPERVISOR_RECEIPT_WRITE_FAILED:'+String(error.code??error.name)+':'+String(error.message).slice(0,2048));return false;}}")
change('r100-v3-watchdog.mjs',"const result=await supervise(JSON.parse(raw));console.log(JSON.stringify(result));if(result.status!=='SUPERVISOR_COMPLETE_NON_GATING')process.exitCode=1;","try{const result=await supervise(JSON.parse(raw));console.log(JSON.stringify(result));if(result.status!=='SUPERVISOR_COMPLETE_NON_GATING')process.exitCode=1;}catch(error){const failure={type:'supervisor-top-level-failure',owner:JSON.parse(raw).owner,status:'SUPERVISOR_NOT_ACCEPTED',name:String(error.name).slice(0,64),code:typeof error.code==='string'?error.code.slice(0,64):null,message:String(error.message).slice(0,2048)};if(typeof process.send==='function')process.send(failure,()=>{});console.error(JSON.stringify(failure));process.exitCode=1;}")
p=base/'r100-v3-package.py';s=p.read_text(encoding='utf-8');mark="if __name__=='__main__':";i=s.index(mark);cli=s[i:]
body=cli.split('\n',1)[1];lines=body.splitlines();parse=lines[0];rest='\n'.join(lines[1:])
helper="""def failure_envelope(error,stage):
    reason=str(error).removeprefix('HOST_OUTPUT_STOP_NOT_ACCEPTED:')
    if not re.fullmatch(r'[A-Z][A-Z0-9_]{0,127}',reason):reason=None
    return {'transport':'PYTHON_PACKAGE_FAILURE_V1','status':'NOT_ACCEPTED','stage':stage,'exception_class':type(error).__name__ if type(error).__name__ in ['OutputStopped','OSError','PermissionError','ValueError','AssertionError','FileNotFoundError'] else 'OTHER','reason':reason,'os_errno':error.errno if isinstance(getattr(error,'errno',None),int) else None,'winerror':error.winerror if isinstance(getattr(error,'winerror',None),int) else None,'primary':True}
"""
cli=mark+'\n'+parse+'\n    try:\n'+'\n'.join('    '+line for line in rest.splitlines())+"\n    except Exception as error:\n        stage='EXTRACT' if a.extract else 'ARCHIVE' if a.archive else 'STAGE'\n        print(json.dumps(failure_envelope(error,stage)),file=sys.stderr)\n        raise SystemExit(1)\n"
p.write_text(s[:i]+helper+cli,encoding='utf-8',newline='\n')
(base/'process-diagnostics.mjs').write_text("""/** Bounded infrastructure diagnostics only. No disk writes or command retries. */
import assert from 'node:assert/strict';
export function captureProcess(child,{onFault=()=>{}}={}){
 const state={stdout:'',stderr:'',stdout_truncated:false,stderr_truncated:false,spawn_error:null},chunks={stdout:[],stderr:[]},counts={stdout:0,stderr:0};
 for(const [name,limit] of [['stdout',16384],['stderr',8192]])child[name].on('data',value=>{const b=Buffer.from(value),left=Math.max(0,limit-counts[name]);if(left)chunks[name].push(b.subarray(0,left));counts[name]+=b.length;state[name]=Buffer.concat(chunks[name]).toString('utf8');if(counts[name]>limit){state[name+'_truncated']=true;onFault('SUPERVISOR_DIAGNOSTIC_CAPTURE_OVERFLOW');}});
 child.on('error',error=>{state.spawn_error=['ENOENT','EACCES','EPERM','ENOMEM'].includes(error.code)?error.code:'UNLISTED_SPAWN_ERROR';onFault('SUPERVISOR_SPAWN_ERROR');});return state;
}
export function snapshotDiagnostics(state){return state?{...state}:{stdout:'',stderr:'',stdout_truncated:false,stderr_truncated:false,spawn_error:'SUPERVISOR_NOT_STARTED'};}
export function packageFailure(stderr,stage){
 try{assert(Buffer.byteLength(stderr)<=4096);const x=JSON.parse(stderr.trim());assert.deepEqual(Object.keys(x).sort(),['transport','status','stage','exception_class','reason','os_errno','winerror','primary'].sort());assert.equal(x.transport,'PYTHON_PACKAGE_FAILURE_V1');assert.equal(x.status,'NOT_ACCEPTED');assert.equal(x.stage,stage);assert.equal(x.primary,true);assert(['OutputStopped','OSError','PermissionError','ValueError','AssertionError','FileNotFoundError','OTHER'].includes(x.exception_class));assert(x.reason===null||/^[A-Z][A-Z0-9_]{0,127}$/.test(x.reason));for(const n of ['os_errno','winerror'])assert(x[n]===null||Number.isSafeInteger(x[n]));return x;}catch{return{transport:'PYTHON_PACKAGE_FAILURE_UNAVAILABLE',status:'NOT_ACCEPTED',stage};}
}
""",encoding='utf-8',newline='\n')
change('r100-v3-launcher.mjs',"import {emitTerminal} from './verify-terminal.mjs';","import {emitTerminal} from './verify-terminal.mjs';\nimport {captureProcess,snapshotDiagnostics,packageFailure} from './process-diagnostics.mjs';")
change('r100-v3-launcher.mjs',"METHOD08-STDOUT-TERMINAL-CLOSURE","METHOD09-FAIL-CLOSED-SUPERVISOR-DIAGNOSTICS")
change('r100-v3-launcher.mjs',"'verify-terminal.mjs'];","'verify-terminal.mjs','process-diagnostics.mjs'];")
change('r100-v3-launcher.mjs',"let watchdog,watchdogResult,heartbeat,phase='BOOTSTRAP'", "let supervisorCapture=null;let watchdog,watchdogResult,heartbeat,phase='BOOTSTRAP'")
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
