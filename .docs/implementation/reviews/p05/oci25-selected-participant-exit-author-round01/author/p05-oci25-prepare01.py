from pathlib import Path
import shutil,json,hashlib
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer24';c=p.with_name('p05-compatible-rollback-producer25');assert not c.exists();shutil.copytree(p,c,ignore=shutil.ignore_patterns('INDEX.json'))
f=c/'api-child.mjs';s=f.read_bytes().decode();a="else{const E=restore(previous.E);const stop=await h.call(E.host,h.base(E)+";b="else{const E=restore(previous.E),exitActor=E.members.slice(1,3).find(a=>a.id===E.excludedActor);assert(exitActor&&exitActor.id!==E.host.id,'A3_SELECTED_PARTICIPANT_EXIT_REQUIRED');const stop=await h.call(exitActor,h.base(E)+";assert s.count(a)==1;f.write_bytes(s.replace(a,b).encode())
f=c/'host-runner.mjs';s=f.read_bytes().decode();nl='\r\n'if'\r\n'in s else'\n';helper="""/** Exact replay structure: three denied reads, version-bound view, nine original/fresh-ID pairs. */
export function completeReplay(rows){
 return Array.isArray(rows)&&rows.length===13&&Array.from(rows).every((row,i)=>row?.kind===(i<3?'read':i===3?'revoked_round_view':'exact_and_new_ID'));
}
""".replace('\n',nl);at=s.index('export async function executePlan(');s=s[:at]+helper+s[at:];a='OCI09:b.replay.length===12&&c.replay.length===12';b='OCI09:completeReplay(b.replay)&&completeReplay(c.replay)';assert s.count(a)==1;f.write_bytes(s.replace(a,b).encode())
for f in [c/'BINDING.json',c/'ROOT_RUN_ACK_TEMPLATE.json']:assert json.loads(f.read_bytes())['root_run_ack']is False
print(json.dumps({'producer':str(c),'changed_MJS':['api-child.mjs','host-runner.mjs'],'root_run_ack':False,'native':False}))
