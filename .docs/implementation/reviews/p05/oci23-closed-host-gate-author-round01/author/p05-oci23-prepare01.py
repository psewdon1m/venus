from pathlib import Path
import shutil,json,hashlib
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer22';c=p.with_name('p05-compatible-rollback-producer23');assert not c.exists();shutil.copytree(p,c)
f=c/'browser-child.mjs';s=f.read_bytes().decode();nl='\r\n' if '\r\n'in s else '\n'
helper="""/** A real zero-inflight hold and confirmed native close precede retirement. */
export async function closeHeldHostGate(gate,close,observe,retired,proof={}){
 assert(!retired.has(gate),'BROWSER_HOST_GATE_ALREADY_RETIRED');
 const preClose=await observe('B2_HOST_PRE_CLOSE_HOLD',()=>gate.hold());
 assert.equal(preClose.held,true,'BROWSER_HOST_PRE_CLOSE_NOT_HELD');assert.equal(preClose.inflight_HTTP,0,'BROWSER_HOST_PRE_CLOSE_NOT_DRAINED');
 proof.pre_close_quiescence=preClose;proof.context_closed=false;
 gate.dispose();await observe('B2_HOST_CONTEXT_CLOSE',close);
 proof.context_closed=true;retired.add(gate);return proof;
}
""".replace('\n',nl)
assert s.count('export async function browser(config)')==1;s=s.replace('export async function browser(config)',helper+'export async function browser(config)')
assert s.count('const contexts=[],gates=[],report=')==1;s=s.replace('const contexts=[],gates=[],report=','const contexts=[],gates=[],retiredGates=new Set(),report=')
old="diagnosticStep='B2_HOST_CONTEXT_CLOSE';gates[2].dispose();await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>host.context().close());"
new="await closeHeldHostGate(gates[2],()=>host.context().close(),(step,operation)=>{diagnosticStep=step;return diagnostic.awaiting(diagnosticPhase,step,operation);},retiredGates,report.closed_host_gate={gate_index:2});"
assert s.count(old)==1;s=s.replace(old,new)
old="const beforeA3=await Promise.all(gates.map(g=>g.hold()));";new="const beforeA3=await diagnostic.awaiting(diagnosticPhase,diagnosticStep,()=>Promise.all(gates.filter(g=>!retiredGates.has(g)).map(g=>g.hold())));"
assert s.count(old)==1;s=s.replace(old,new)
old="E_untouched:true,API_quiescence:beforeA3";new="E_untouched:true,API_quiescence:beforeA3,closed_host_gate:report.closed_host_gate";assert s.count(old)==1;s=s.replace(old,new)
assert s.count('"B2_HOST_CONTEXT_CLOSE"')==1;s=s.replace('"B2_HOST_CONTEXT_CLOSE"','"B2_HOST_PRE_CLOSE_HOLD","B2_HOST_CONTEXT_CLOSE"')
f.write_bytes(s.encode())
print(json.dumps({'created':str(c),'browser_sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'native':False,'ACK':False}))
