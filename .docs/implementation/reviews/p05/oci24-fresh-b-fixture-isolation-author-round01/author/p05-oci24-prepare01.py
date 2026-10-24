from pathlib import Path
import shutil,json,hashlib
r=Path('C:/.projects/venus');p=r/'.artifacts/p05-pilot-bundle-source14/.artifacts/p05-compatible-rollback-producer23';c=p.with_name('p05-compatible-rollback-producer24');assert not c.exists();shutil.copytree(p,c,ignore=shutil.ignore_patterns('INDEX.json'))
f=c/'api-child.mjs';s=f.read_bytes().decode();a="privateWrite('state-B2-final.json',next);report.new_E=";b="const F=await activePrivate(h);assert.notEqual(F.room,E.room,'FRESH_B_FIXTURE_MUST_BE_SEPARATE');next.F=serialize(F);privateWrite('state-B2-final.json',next);report.fresh_B_operational_fixture={label:'F',separate_from_untouched_E:true,created_by:'UNCHANGED_ACTIVE_PRIVATE_ONE_SESSION20',untouched_oracle:false};report.new_E=";assert s.count(a)==1;f.write_bytes(s.replace(a,b).encode())
f=c/'browser-child.mjs';s=f.read_bytes().decode();a="const b=read('state-B2-final'),e=b.E,eActor=";b="const b=read('state-B2-final'),e=b.F,eActor=";assert s.count(a)==1;f.write_bytes(s.replace(a,b).encode())
for f in [c/'BINDING.json',c/'ROOT_RUN_ACK_TEMPLATE.json']:assert json.loads(f.read_bytes())['root_run_ack']is False
print(json.dumps({'producer':str(c),'changed_runtime':['api-child.mjs','browser-child.mjs'],'root_run_ack':False,'native':False}))
