from pathlib import Path
import shutil,json
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer25';c=p.with_name('p05-compatible-rollback-producer26');assert not c.exists();shutil.copytree(p,c,ignore=shutil.ignore_patterns('INDEX.json'));f=c/'host-runner.mjs';s=f.read_bytes().decode();nl='\r\n'if'\r\n'in s else'\n';reader=json.loads((r/'.artifacts/p05-oci26-reader-probe01/INPUTS.json').read_bytes())['candidate']
helper="""/** Same non-atomic exists/lstat/read contract; script and filename are separate argv. */
export const publicEvidenceScript=READER_LITERAL;
export function publicEvidenceArguments(keeper,name){
 assert(/^[A-Za-z0-9][A-Za-z0-9._-]+$/.test(name));return['exec',keeper,'/bin/sh','-c',publicEvidenceScript,'venus-public-evidence',name];
}
export function publicEvidencePurpose(name){return /^phase-(A1|B2|A3)-ready\\.json$/.test(name)?'EVIDENCE_PHASE_READY':/^phase-(A1|B2|A3)-terminal\\.json$/.test(name)?'EVIDENCE_PHASE_TERMINAL':'PUBLIC_EVIDENCE_READ';}
export function safeCommandFailureMetadata(phase,purpose,code,stdoutBytes,stderrBytes,stderrCapturedBytes,stderrHash,reason,stderrKind){
 const count=value=>Number.isSafeInteger(value)&&value>=0&&value<=2147483647?value:null;
 return{event:'unrecorded_command_failed',phase:new Set(['setup','A1','B2','A3','stop','export','cleanup']).has(phase)?phase:'UNKNOWN',purpose:new Set(['UNRECORDED_COMMAND','EVIDENCE_PHASE_READY','EVIDENCE_PHASE_TERMINAL','PUBLIC_EVIDENCE_READ']).has(purpose)?purpose:'UNKNOWN',exit_code:Number.isInteger(code)&&code>=0&&code<=255?code:null,stdout_bytes:count(stdoutBytes),stderr_bytes:count(stderrBytes),stderr_captured_bytes:count(stderrCapturedBytes),stderr_captured_sha256:typeof stderrHash==='string'&&/^[a-f0-9]{64}$/.test(stderrHash)?stderrHash:null,failure_class:new Set(['DOCKER_EXIT','CLI_TIMEOUT','CAPTURE_LIMIT','SPAWN_ERROR']).has(reason)?reason:'UNKNOWN',stderr_class:new Set(['RESOURCE_TOKEN','MEMORY_TOKEN','PERMISSION_TOKEN','NOT_FOUND_TOKEN']).has(stderrKind)?stderrKind:'UNCLASSIFIED',capture_complete:reason==='DOCKER_EXIT'};
}
export function stderrFailureClass(bytes){
 const text=bytes.toString('utf8');return text.includes('Resource temporarily unavailable')||text.includes('resource temporarily unavailable')?'RESOURCE_TOKEN':text.includes('Cannot allocate memory')||text.includes('cannot allocate memory')?'MEMORY_TOKEN':text.includes('Permission denied')||text.includes('permission denied')?'PERMISSION_TOKEN':text.includes('No such file or directory')||text.includes('no such file or directory')?'NOT_FOUND_TOKEN':'UNCLASSIFIED';
}
""".replace('READER_LITERAL',json.dumps(reader)).replace('\n',nl)
at=s.index('export async function executePlan(');s=s[:at]+helper+s[at:]
s=s.replace("let commandNumber=0,gateCounter=0,status=","let unrecordedCommandFailureSaved=false;let commandNumber=0,gateCounter=0,status=")
s=s.replace('timeout=30000,cap=65536,record=true','timeout=30000,cap=65536,record=true,failurePurpose=\'UNRECORDED_COMMAND\'')
s=s.replace('let bytes=0,settled=false;const end=async(error,value)=>','let bytes=0,stdoutBytes=0,stderrBytes=0,settled=false;const end=async(error,value,reason=\'UNKNOWN\')=>')
a="try{if(value&&record)await write('logs/'";b="try{if(!record&&(error||value?.code!==0)&&!unrecordedCommandFailureSaved){unrecordedCommandFailureSaved=true;const captured=Buffer.concat(err),metadata=safeCommandFailureMetadata(activePhase,failurePurpose,value?.code,stdoutBytes,stderrBytes,captured.length,sha(captured),reason,stderrFailureClass(captured));assert(Buffer.byteLength(JSON.stringify(metadata))<=2048);try{await write('logs/unrecorded-command-failure.json',metadata);}catch{report.unrecorded_command_failure_write_failed=true;}}if(value&&record)await write('logs/'";assert s.count(a)==1;s=s.replace(a,b)
s=s.replace("void end(Error('BOUNDED_DOCKER_CLI_TIMEOUT'));","void end(Error('BOUNDED_DOCKER_CLI_TIMEOUT'),undefined,'CLI_TIMEOUT');").replace("void end(Error('BOUNDED_DOCKER_CAPTURE'));","void end(Error('BOUNDED_DOCKER_CAPTURE'),undefined,'CAPTURE_LIMIT');")
s=s.replace("s.on('data',b=>{bytes+=b.length;","s.on('data',b=>{if(dst===out)stdoutBytes+=b.length;else stderrBytes+=b.length;bytes+=b.length;")
s=s.replace("child.on('error',e=>void end(e));child.on('close',code=>void end(null,{code,stdout:Buffer.concat(out),stderr:Buffer.concat(err)}));","child.on('error',e=>void end(e,undefined,'SPAWN_ERROR'));child.on('close',code=>void end(null,{code,stdout:Buffer.concat(out),stderr:Buffer.concat(err)},'DOCKER_EXIT'));")
start=s.index(' async function evidence(name){');end=s.index(nl,start);s=s[:start]+" async function evidence(name){return(await command(publicEvidenceArguments(names.get('keeper'),name),{cap:2*1024**2,record:false,failurePurpose:publicEvidencePurpose(name)})).stdout;}"+s[end:]
f.write_bytes(s.encode());assert json.loads((c/'BINDING.json').read_bytes())['root_run_ack']is False;print(json.dumps({'producer':str(c),'changed_MJS':['host-runner.mjs'],'root_ACK':False,'whole_native':False}))
